import { create } from 'zustand';
import type { AjusteStockDto, IngredienteDto } from '../types/api.types';
import {
  actualizarCosto,
  actualizarUmbral,
  ajustarStock,
  getHistorialAjustes,
  getIngredientes,
  registrarAjuste,
  type RegistrarAjusteInput,
} from '../services/ingredienteService';
import { ApiError } from '../lib/apiError';

export type AjusteFormState = {
  insumoId: string;
  tipoAjuste: 'Suma' | 'Resta';
  cantidad: string;
  motivo: RegistrarAjusteInput['motivo'];
  observaciones: string;
};

const INITIAL_AJUSTE_FORM: AjusteFormState = {
  insumoId: '',
  tipoAjuste: 'Resta',
  cantidad: '',
  motivo: 'Merma',
  observaciones: '',
};

let successTimer: ReturnType<typeof setTimeout> | null = null;
let conflictTimer: ReturnType<typeof setTimeout> | null = null;

function showSuccessToast(set: (partial: Partial<IngredientesStore>) => void, message: string) {
  set({ successMessage: message });
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(() => set({ successMessage: null }), 3000);
}

function showConflictToast(set: (partial: Partial<IngredientesStore>) => void, message: string) {
  set({ conflictError: message });
  if (conflictTimer) clearTimeout(conflictTimer);
  conflictTimer = setTimeout(() => set({ conflictError: null }), 8000);
}

function parseApiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.detail ?? err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

interface IngredientesStore {
  ingredientes: IngredienteDto[];
  loading: boolean;
  error: string | null;
  conflictError: string | null;
  successMessage: string | null;

  editingId: number | null;
  editingValue: string;
  savingId: number | null;

  editingStockId: number | null;
  editingStockValue: string;
  savingStockId: number | null;

  editingUmbralId: number | null;
  editingUmbralValue: string;
  savingUmbralId: number | null;

  ajusteModalOpen: boolean;
  ajusteForm: AjusteFormState;
  ajusteSubmitting: boolean;
  ajusteFormError: string | null;
  ajusteFieldErrors: Record<string, string[]>;
  ajusteConflictError: boolean;

  historial: AjusteStockDto[];
  loadingHistorial: boolean;
  filtroInsumoId: number | undefined;

  fetchIngredientes: () => Promise<void>;
  fetchHistorial: (insumoId?: number) => Promise<void>;
  setFiltroInsumo: (insumoId: number | undefined) => void;

  dismissError: () => void;
  dismissConflictError: () => void;
  dismissSuccessMessage: () => void;

  startEditCosto: (ingrediente: IngredienteDto) => void;
  cancelEditCosto: () => void;
  setEditingValue: (value: string) => void;
  saveCosto: (id: number, onCostoActualizado?: () => void) => Promise<void>;

  startEditStock: (ingrediente: IngredienteDto) => void;
  cancelEditStock: () => void;
  setEditingStockValue: (value: string) => void;
  saveStock: (id: number) => Promise<void>;

  startEditUmbral: (ingrediente: IngredienteDto) => void;
  cancelEditUmbral: () => void;
  setEditingUmbralValue: (value: string) => void;
  saveUmbral: (id: number) => Promise<void>;

  openAjusteModal: () => void;
  closeAjusteModal: () => void;
  setAjusteField: <K extends keyof AjusteFormState>(field: K, value: AjusteFormState[K]) => void;
  clearAjusteFieldError: (field: string) => void;
  submitAjuste: () => Promise<void>;
}

function clearInlineEdits(): Partial<IngredientesStore> {
  return {
    editingId: null,
    editingValue: '',
    editingStockId: null,
    editingStockValue: '',
    editingUmbralId: null,
    editingUmbralValue: '',
  };
}

export const useIngredientesStore = create<IngredientesStore>((set, get) => ({
  ingredientes: [],
  loading: false,
  error: null,
  conflictError: null,
  successMessage: null,

  editingId: null,
  editingValue: '',
  savingId: null,

  editingStockId: null,
  editingStockValue: '',
  savingStockId: null,

  editingUmbralId: null,
  editingUmbralValue: '',
  savingUmbralId: null,

  ajusteModalOpen: false,
  ajusteForm: INITIAL_AJUSTE_FORM,
  ajusteSubmitting: false,
  ajusteFormError: null,
  ajusteFieldErrors: {},
  ajusteConflictError: false,

  historial: [],
  loadingHistorial: false,
  filtroInsumoId: undefined,

  fetchIngredientes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getIngredientes();
      set({ ingredientes: data });
    } catch (err) {
      set({ error: parseApiMessage(err, 'Error desconocido') });
    } finally {
      set({ loading: false });
    }
  },

  fetchHistorial: async (insumoId) => {
    set({ loadingHistorial: true });
    try {
      const data = await getHistorialAjustes(insumoId);
      set({ historial: data });
    } catch {
      /* no bloquear la UI principal */
    } finally {
      set({ loadingHistorial: false });
    }
  },

  setFiltroInsumo: (insumoId) => {
    set({ filtroInsumoId: insumoId });
    get().fetchHistorial(insumoId);
  },

  dismissError: () => set({ error: null }),
  dismissConflictError: () => set({ conflictError: null }),
  dismissSuccessMessage: () => set({ successMessage: null }),

  startEditCosto: (ingrediente) => {
    set({
      ...clearInlineEdits(),
      editingId: ingrediente.id,
      editingValue: ingrediente.costoActual.toFixed(2),
    });
  },

  cancelEditCosto: () => set({ editingId: null, editingValue: '' }),

  setEditingValue: (value) => set({ editingValue: value }),

  saveCosto: async (id, onCostoActualizado) => {
    const { editingValue } = get();
    const nuevoCosto = parseFloat(editingValue);
    if (isNaN(nuevoCosto) || nuevoCosto < 0) return;

    set({ savingId: id });
    try {
      await actualizarCosto(id, nuevoCosto);
      set({ editingId: null, editingValue: '' });
      await get().fetchIngredientes();
      showSuccessToast(set, 'Costo actualizado correctamente.');
      onCostoActualizado?.();
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        set({ editingId: null, editingValue: '' });
        showConflictToast(set, 'Los datos fueron modificados por otro usuario. La tabla se actualizó automáticamente.');
        await get().fetchIngredientes();
      } else {
        set({ error: parseApiMessage(err, 'Error al actualizar el costo.') });
      }
    } finally {
      set({ savingId: null });
    }
  },

  startEditStock: (ingrediente) => {
    set({
      ...clearInlineEdits(),
      editingStockId: ingrediente.id,
      editingStockValue: String(ingrediente.stockActual),
    });
  },

  cancelEditStock: () => set({ editingStockId: null, editingStockValue: '' }),

  setEditingStockValue: (value) => set({ editingStockValue: value }),

  saveStock: async (id) => {
    const { editingStockValue } = get();
    const nuevoStock = parseFloat(editingStockValue);
    if (isNaN(nuevoStock) || nuevoStock < 0) return;

    set({ savingStockId: id });
    try {
      await ajustarStock(id, nuevoStock);
      set({ editingStockId: null, editingStockValue: '' });
      await get().fetchIngredientes();
      showSuccessToast(set, 'Stock ajustado correctamente.');
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        set({ editingStockId: null, editingStockValue: '' });
        showConflictToast(set, 'Los datos fueron modificados por otro usuario. La tabla se actualizó automáticamente.');
        await get().fetchIngredientes();
      } else {
        set({ error: parseApiMessage(err, 'Error al ajustar el stock.') });
      }
    } finally {
      set({ savingStockId: null });
    }
  },

  startEditUmbral: (ingrediente) => {
    set({
      ...clearInlineEdits(),
      editingUmbralId: ingrediente.id,
      editingUmbralValue: String(ingrediente.umbralCritico),
    });
  },

  cancelEditUmbral: () => set({ editingUmbralId: null, editingUmbralValue: '' }),

  setEditingUmbralValue: (value) => set({ editingUmbralValue: value }),

  saveUmbral: async (id) => {
    const { editingUmbralValue } = get();
    const nuevoUmbral = parseFloat(editingUmbralValue);
    if (isNaN(nuevoUmbral) || nuevoUmbral < 0) return;

    set({ savingUmbralId: id });
    try {
      await actualizarUmbral(id, nuevoUmbral);
      set((state) => ({
        editingUmbralId: null,
        editingUmbralValue: '',
        ingredientes: state.ingredientes.map((i) =>
          i.id === id ? { ...i, umbralCritico: nuevoUmbral } : i,
        ),
      }));
      showSuccessToast(set, 'Alerta mínima actualizada correctamente.');
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        set({ editingUmbralId: null, editingUmbralValue: '' });
        showConflictToast(set, 'Los datos fueron modificados por otro usuario. La tabla se actualizó automáticamente.');
        await get().fetchIngredientes();
      } else {
        set({ error: parseApiMessage(err, 'Error al actualizar el umbral.') });
      }
    } finally {
      set({ savingUmbralId: null });
    }
  },

  openAjusteModal: () => {
    const firstId = get().ingredientes[0]?.id.toString() ?? '';
    set({
      ajusteModalOpen: true,
      ajusteForm: { ...INITIAL_AJUSTE_FORM, insumoId: firstId },
      ajusteFormError: null,
      ajusteFieldErrors: {},
      ajusteConflictError: false,
    });
  },

  closeAjusteModal: () => set({ ajusteModalOpen: false }),

  setAjusteField: (field, value) => {
    set((state) => ({
      ajusteForm: { ...state.ajusteForm, [field]: value },
    }));
  },

  clearAjusteFieldError: (field) => {
    set((state) => {
      if (!(field in state.ajusteFieldErrors)) return state;
      return {
        ajusteFieldErrors: Object.fromEntries(
          Object.entries(state.ajusteFieldErrors).filter(([key]) => key !== field),
        ),
      };
    });
  },

  submitAjuste: async () => {
    const { ajusteForm, filtroInsumoId } = get();
    const cant = parseFloat(ajusteForm.cantidad);

    if (!ajusteForm.insumoId || isNaN(cant) || cant <= 0) {
      set({ ajusteFormError: 'Completá todos los campos obligatorios con valores válidos.' });
      return;
    }

    set({
      ajusteFormError: null,
      ajusteFieldErrors: {},
      ajusteConflictError: false,
      ajusteSubmitting: true,
    });

    try {
      await registrarAjuste({
        insumoId: Number(ajusteForm.insumoId),
        cantidad: cant,
        tipoAjuste: ajusteForm.tipoAjuste,
        motivo: ajusteForm.motivo,
        observaciones: ajusteForm.observaciones.trim() || undefined,
      });

      set({ ajusteModalOpen: false });
      await get().fetchIngredientes();
      await get().fetchHistorial(filtroInsumoId);
      showSuccessToast(set, 'Ajuste registrado correctamente.');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isConflict) {
          set({ ajusteConflictError: true });
        } else if (err.isValidation) {
          set({
            ajusteFieldErrors: err.fieldErrors,
            ajusteFormError: 'Por favor, corregí los errores indicados.',
          });
        } else {
          set({ ajusteFormError: err.detail ?? err.message });
        }
      } else {
        set({ ajusteFormError: parseApiMessage(err, 'Error al registrar el ajuste.') });
      }
    } finally {
      set({ ajusteSubmitting: false });
    }
  },
}));

export const MOTIVOS_AJUSTE: { value: RegistrarAjusteInput['motivo']; label: string }[] = [
  { value: 'Merma', label: 'Merma por vencimiento' },
  { value: 'Rotura', label: 'Rotura de empaque' },
  { value: 'ConteoFisico', label: 'Diferencia de conteo físico' },
  { value: 'CompraManual', label: 'Compra / ingreso manual' },
];

export const MOTIVO_LABELS: Record<string, string> = {
  Merma: 'Merma por vencimiento',
  Rotura: 'Rotura de empaque',
  ConteoFisico: 'Conteo físico',
  CompraManual: 'Compra manual',
};
