import { create } from 'zustand';
import type { DetalleCostoIngredienteDto, OrdenProduccionDto, ProductoDto } from '../types/api.types';
import { getProductos } from '../services/productoService';
import {
  getProduccionErrorMessage,
  isProduccionConcurrencyError,
  isProduccionDomainError,
  mirrorProductionStockUpdate,
  registrarProduccion,
  verificarOrdenProduccion,
  type OrdenProduccionInput,
} from '../services/produccionService';
import { ApiError } from '../lib/apiError';
import { fmt } from '../lib/formatters';

export type ProduccionFormState = {
  productoId: string;
  cantidad: string;
};

const INITIAL_FORM: ProduccionFormState = { productoId: '', cantidad: '' };

let successTimer: ReturnType<typeof setTimeout> | null = null;

function validateProduccionInput(dto: OrdenProduccionInput): string | null {
  if (!dto.productoId) return 'Seleccioná un producto para continuar.';
  if (!dto.cantidadProducida || dto.cantidadProducida <= 0) {
    return 'La cantidad producida debe ser mayor a cero.';
  }
  return null;
}

function isPreviewVigente(
  preview: OrdenProduccionDto | null,
  dto: OrdenProduccionInput,
): boolean {
  if (!preview) return false;
  return (
    preview.productoId === dto.productoId &&
    preview.cantidadProducida === dto.cantidadProducida
  );
}

interface ProduccionStore {
  productos: ProductoDto[];
  loading: boolean;
  loadError: string | null;

  form: ProduccionFormState;
  preview: OrdenProduccionDto | null;
  insumosTrasProduccion: DetalleCostoIngredienteDto[] | null;

  verifying: boolean;
  submitting: boolean;

  verifyError: string | null;
  submitError: string | null;
  errorFeedback: string | null;
  domainError: string | null;
  fieldErrors: Record<string, string[]>;
  concurrencyError: boolean;
  successMessage: string | null;

  fetchProductos: () => Promise<void>;
  verificarProduccion: (dto: OrdenProduccionInput) => Promise<void>;
  confirmarProduccion: (dto: OrdenProduccionInput) => Promise<void>;

  setFormField: (name: keyof ProduccionFormState, value: string) => void;
  invalidatePreview: () => void;
  dismissConcurrencyError: () => void;
  dismissDomainError: () => void;
  dismissErrorFeedback: () => void;
  resetFormCantidad: () => void;
}

export const useProduccionStore = create<ProduccionStore>((set, get) => ({
  productos: [],
  loading: false,
  loadError: null,

  form: INITIAL_FORM,
  preview: null,
  insumosTrasProduccion: null,

  verifying: false,
  submitting: false,

  verifyError: null,
  submitError: null,
  errorFeedback: null,
  domainError: null,
  fieldErrors: {},
  concurrencyError: false,
  successMessage: null,

  fetchProductos: async () => {
    set({ loading: true, loadError: null });
    try {
      const prods = await getProductos();
      set({ productos: prods.filter((p) => p.tipoProducto === 'Compuesto') });
    } catch (err: unknown) {
      set({
        loadError: err instanceof Error ? err.message : 'Error al cargar datos',
      });
    } finally {
      set({ loading: false });
    }
  },

  verificarProduccion: async (dto) => {
    set({ verifyError: null, fieldErrors: {} });

    const validationError = validateProduccionInput(dto);
    if (validationError) {
      set({ verifyError: validationError });
      return;
    }

    set({ verifying: true });
    try {
      const orden = await verificarOrdenProduccion(dto);
      set({ insumosTrasProduccion: null, preview: orden });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isValidation) {
          set({ fieldErrors: err.fieldErrors });
        } else if (isProduccionDomainError(err)) {
          set({ domainError: getProduccionErrorMessage(err) });
        } else {
          set({ verifyError: getProduccionErrorMessage(err) });
        }
      } else {
        set({ verifyError: getProduccionErrorMessage(err) });
      }
    } finally {
      set({ verifying: false });
    }
  },

  confirmarProduccion: async (dto) => {
    const { preview, productos } = get();

    set({
      submitError: null,
      errorFeedback: null,
      domainError: null,
      fieldErrors: {},
      concurrencyError: false,
      successMessage: null,
    });

    const validationError = validateProduccionInput(dto);
    if (validationError) {
      set({ submitError: validationError });
      return;
    }

    if (!isPreviewVigente(preview, dto)) {
      set({ submitError: 'Verificá la producción antes de registrar.' });
      return;
    }

    if (!preview!.stockSuficiente) {
      set({
        domainError: 'No hay stock suficiente de insumos para registrar esta producción.',
      });
      return;
    }

    const ordenConfirmada = preview!;
    const productoSeleccionado = productos.find((p) => p.id === dto.productoId) ?? null;

    set({ submitting: true });
    try {
      await registrarProduccion(dto);

      const nombre = productoSeleccionado?.nombre ?? 'Producto';
      const cantidad = dto.cantidadProducida;
      set({
        successMessage: `✓ ${nombre} — ${fmt(cantidad)} unidad${cantidad !== 1 ? 'es' : ''} registrada${cantidad !== 1 ? 's' : ''} con éxito. El stock de insumos fue descontado.`,
      });

      const mirrored = mirrorProductionStockUpdate(productos, ordenConfirmada);
      set({
        productos: mirrored.productos,
        insumosTrasProduccion: mirrored.detalleCostos,
        preview: null,
        form: { ...get().form, cantidad: '' },
      });

      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => set({ successMessage: null }), 6000);
    } catch (err: unknown) {
      if (isProduccionConcurrencyError(err)) {
        set({
          concurrencyError: true,
          form: { ...get().form, cantidad: '' },
          preview: null,
        });
        get().fetchProductos().catch(() => { /* silent */ });
      } else if (err instanceof ApiError && err.isValidation) {
        set({ fieldErrors: err.fieldErrors });
      } else if (isProduccionDomainError(err)) {
        set({ errorFeedback: getProduccionErrorMessage(err), preview: null });
        get().fetchProductos().catch(() => { /* silent */ });
      } else {
        set({ submitError: getProduccionErrorMessage(err) });
      }
    } finally {
      set({ submitting: false });
    }
  },

  setFormField: (name, value) => {
    const fieldErrorKey = name === 'cantidad' ? 'cantidadProducida' : name;
    set((state) => ({
      form: { ...state.form, [name]: value },
      preview: null,
      insumosTrasProduccion: null,
      verifyError: null,
      domainError: null,
      submitError: null,
      errorFeedback: null,
      concurrencyError: false,
      fieldErrors: fieldErrorKey in state.fieldErrors
        ? Object.fromEntries(
            Object.entries(state.fieldErrors).filter(([key]) => key !== fieldErrorKey),
          )
        : state.fieldErrors,
    }));
  },

  invalidatePreview: () => {
    set({
      preview: null,
      insumosTrasProduccion: null,
      verifyError: null,
      domainError: null,
    });
  },

  dismissConcurrencyError: () => set({ concurrencyError: false }),
  dismissDomainError: () => set({ domainError: null }),
  dismissErrorFeedback: () => set({ errorFeedback: null }),
  resetFormCantidad: () => set((state) => ({ form: { ...state.form, cantidad: '' } })),
}));

/** Selectores derivados reutilizables fuera del store. */
export function buildProduccionDto(form: ProduccionFormState): OrdenProduccionInput {
  return {
    productoId: Number(form.productoId) || 0,
    cantidadProducida: Number(form.cantidad) || 0,
  };
}

export function selectProducto(
  productos: ProductoDto[],
  productoId: string,
): ProductoDto | null {
  return productos.find((p) => p.id === Number(productoId)) ?? null;
}

export function selectPreviewVigente(
  preview: OrdenProduccionDto | null,
  dto: OrdenProduccionInput,
): boolean {
  return isPreviewVigente(preview, dto);
}
