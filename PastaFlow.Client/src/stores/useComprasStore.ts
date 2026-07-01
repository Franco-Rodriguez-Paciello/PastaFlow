import { create } from 'zustand';
import type {
  CompraDetalleDto,
  CompraResumenDto,
  InsumoAgregadoHojaDto,
  IngredienteDto,
  ProveedorDto,
  SugerenciaCompraDto,
} from '../types/api.types';
import {
  getCompraById,
  getCompras,
  getSugerenciasCompra,
  registrarCompra,
} from '../services/compraService';
import { getIngredientes } from '../services/ingredienteService';
import { getProveedores } from '../services/proveedorService';
import { ApiError } from '../lib/apiError';

export interface CompraLineaForm {
  ingredienteId: string;
  cantidad: string;
  precioUnitario: string;
}

interface CompraFormState {
  proveedorId: string;
  numeroFactura: string;
  observaciones: string;
  actualizarCosto: boolean;
  lineas: CompraLineaForm[];
}

const LINEA_VACIA: CompraLineaForm = { ingredienteId: '', cantidad: '', precioUnitario: '' };

const FORM_INICIAL: CompraFormState = {
  proveedorId: '',
  numeroFactura: '',
  observaciones: '',
  actualizarCosto: true,
  lineas: [{ ...LINEA_VACIA }],
};

interface ComprasStore {
  compras: CompraResumenDto[];
  compraDetalle: CompraDetalleDto | null;
  ingredientes: IngredienteDto[];
  proveedores: ProveedorDto[];

  loading: boolean;
  error: string | null;

  modalOpen: boolean;
  form: CompraFormState;
  submitting: boolean;
  submitError: string | null;
  successMessage: string | null;
  infoMessage: string | null;
  sugerenciasLoading: boolean;
  sugerenciasCargadas: number | null;

  detalleOpen: boolean;
  detalleLoading: boolean;

  fetchCompras: () => Promise<void>;
  abrirRegistroVacio: () => void;
  abrirRegistroDesdeHoja: (insumos: InsumoAgregadoHojaDto[], fechaHoja?: string) => Promise<void>;
  cargarSugerencias: (fecha?: string) => Promise<void>;
  cerrarModal: () => void;
  setFormField: (field: keyof Omit<CompraFormState, 'lineas'>, value: string | boolean) => void;
  setLineaField: (index: number, field: keyof CompraLineaForm, value: string) => void;
  agregarLinea: () => void;
  quitarLinea: (index: number) => void;
  submitCompra: () => Promise<boolean>;
  verDetalle: (id: number) => Promise<void>;
  cerrarDetalle: () => void;
  dismissSuccess: () => void;
  dismissInfo: () => void;
}

function lineasDesdeInsumosHoja(insumos: InsumoAgregadoHojaDto[]): CompraLineaForm[] {
  const faltantes = insumos.filter((i) => !i.suficiente && i.faltante > 0);
  if (faltantes.length === 0) return [{ ...LINEA_VACIA }];
  return faltantes.map((i) => ({
    ingredienteId: String(i.ingredienteId),
    cantidad: String(i.faltante),
    precioUnitario: '',
  }));
}

function lineasDesdeSugerencias(sugerencias: SugerenciaCompraDto[]): CompraLineaForm[] {
  if (sugerencias.length === 0) return [{ ...LINEA_VACIA }];
  return sugerencias.map((s) => ({
    ingredienteId: String(s.ingredienteId),
    cantidad: String(s.cantidadSugerida),
    precioUnitario: s.precioReferencia != null ? String(s.precioReferencia) : '',
  }));
}

export const useComprasStore = create<ComprasStore>((set, get) => ({
  compras: [],
  compraDetalle: null,
  ingredientes: [],
  proveedores: [],

  loading: false,
  error: null,

  modalOpen: false,
  form: FORM_INICIAL,
  submitting: false,
  submitError: null,
  successMessage: null,
  infoMessage: null,
  sugerenciasLoading: false,
  sugerenciasCargadas: null,

  detalleOpen: false,
  detalleLoading: false,

  fetchCompras: async () => {
    set({ loading: true, error: null });
    try {
      const [compras, ingredientes, proveedores] = await Promise.all([
        getCompras(),
        getIngredientes(),
        getProveedores(),
      ]);
      set({ compras, ingredientes, proveedores });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'No se pudieron cargar las compras',
      });
    } finally {
      set({ loading: false });
    }
  },

  abrirRegistroVacio: () => {
    set({
      modalOpen: true,
      form: FORM_INICIAL,
      submitError: null,
      sugerenciasCargadas: null,
    });
  },

  abrirRegistroDesdeHoja: async (insumos, fechaHoja) => {
    set({ submitError: null, infoMessage: null });
    try {
      let lineas = lineasDesdeInsumosHoja(insumos);
      let sugerenciasCount: number | null = null;

      if (lineas.length === 1 && !lineas[0].ingredienteId) {
        const sugerencias = await getSugerenciasCompra(fechaHoja);
        if (sugerencias.length === 0) {
          set({
            infoMessage:
              'No hay insumos pendientes de compra para esa fecha: el stock alcanza para la producción prevista y no hay insumos en nivel crítico.',
          });
          return;
        }
        lineas = lineasDesdeSugerencias(sugerencias);
        sugerenciasCount = sugerencias.length;
      }

      const { ingredientes, proveedores } = get();
      if (ingredientes.length === 0 || proveedores.length === 0) {
        const [ing, prov] = await Promise.all([getIngredientes(), getProveedores()]);
        set({ ingredientes: ing, proveedores: prov });
      }
      set({
        modalOpen: true,
        form: { ...FORM_INICIAL, lineas },
        sugerenciasCargadas: sugerenciasCount,
      });
    } catch (err: unknown) {
      set({
        infoMessage: null,
        submitError: null,
        error: err instanceof Error ? err.message : 'No se pudieron cargar las sugerencias',
      });
    }
  },

  cargarSugerencias: async (fecha) => {
    set({ sugerenciasLoading: true, infoMessage: null, error: null });
    try {
      const { ingredientes, proveedores } = get();
      if (ingredientes.length === 0 || proveedores.length === 0) {
        const [ing, prov] = await Promise.all([getIngredientes(), getProveedores()]);
        set({ ingredientes: ing, proveedores: prov });
      }

      const sugerencias = await getSugerenciasCompra(fecha);

      if (sugerencias.length === 0) {
        set({
          modalOpen: false,
          form: FORM_INICIAL,
          sugerenciasCargadas: null,
          infoMessage:
            'No hay sugerencias de compra por ahora. Los insumos alcanzan para la producción de mañana y ninguno está bajo el umbral crítico. Podés usar «Nuevo ingreso» para cargar una compra manual.',
        });
        return;
      }

      set({
        modalOpen: true,
        form: {
          ...FORM_INICIAL,
          lineas: lineasDesdeSugerencias(sugerencias),
        },
        submitError: null,
        sugerenciasCargadas: sugerencias.length,
      });
    } catch (err: unknown) {
      set({
        modalOpen: false,
        infoMessage: null,
        error: err instanceof Error ? err.message : 'No se pudieron cargar las sugerencias',
      });
    } finally {
      set({ sugerenciasLoading: false });
    }
  },

  cerrarModal: () => {
    if (get().submitting) return;
    set({ modalOpen: false, submitError: null, form: FORM_INICIAL, sugerenciasCargadas: null });
  },

  setFormField: (field, value) => {
    set((state) => ({ form: { ...state.form, [field]: value }, submitError: null }));
  },

  setLineaField: (index, field, value) => {
    set((state) => {
      const lineas = state.form.lineas.map((l, i) =>
        i === index ? { ...l, [field]: value } : l,
      );
      return { form: { ...state.form, lineas }, submitError: null };
    });
  },

  agregarLinea: () => {
    set((state) => ({
      form: { ...state.form, lineas: [...state.form.lineas, { ...LINEA_VACIA }] },
    }));
  },

  quitarLinea: (index) => {
    set((state) => {
      const lineas = state.form.lineas.filter((_, i) => i !== index);
      return {
        form: {
          ...state.form,
          lineas: lineas.length > 0 ? lineas : [{ ...LINEA_VACIA }],
        },
      };
    });
  },

  submitCompra: async () => {
    const { form } = get();
    set({ submitting: true, submitError: null });

    const lineasValidas = form.lineas
      .filter((l) => l.ingredienteId && Number(l.cantidad) > 0)
      .map((l) => ({
        ingredienteId: Number(l.ingredienteId),
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario) || 0,
      }));

    if (lineasValidas.length === 0) {
      set({ submitting: false, submitError: 'Agregá al menos un insumo con cantidad.' });
      return false;
    }

    const ids = lineasValidas.map((l) => l.ingredienteId);
    if (new Set(ids).size !== ids.length) {
      set({ submitting: false, submitError: 'No podés repetir el mismo insumo en una compra.' });
      return false;
    }

    try {
      await registrarCompra({
        proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
        numeroFactura: form.numeroFactura.trim() || null,
        observaciones: form.observaciones.trim() || null,
        actualizarCosto: form.actualizarCosto,
        lineas: lineasValidas,
      });

      set({
        modalOpen: false,
        form: FORM_INICIAL,
        successMessage: 'Ingreso de mercadería registrado. El stock de insumos fue actualizado.',
      });
      await get().fetchCompras();
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const first = Object.values(err.fieldErrors)[0]?.[0];
        set({ submitError: first ?? err.detail ?? err.message });
      } else {
        set({
          submitError: err instanceof Error
            ? err.message
            : 'Error al registrar la compra',
        });
      }
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  verDetalle: async (id) => {
    set({ detalleOpen: true, detalleLoading: true, compraDetalle: null });
    try {
      const detalle = await getCompraById(id);
      set({ compraDetalle: detalle });
    } catch (err: unknown) {
      set({
        detalleOpen: false,
        error: err instanceof Error ? err.message : 'No se pudo cargar el detalle',
      });
    } finally {
      set({ detalleLoading: false });
    }
  },

  cerrarDetalle: () => set({ detalleOpen: false, compraDetalle: null }),

  dismissSuccess: () => set({ successMessage: null }),

  dismissInfo: () => set({ infoMessage: null }),
}));
