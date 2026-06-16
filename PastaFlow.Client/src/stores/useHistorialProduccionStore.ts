import { create } from 'zustand';
import type { HistorialProduccionDto, ProductoDto } from '../types/api.types';
import { getHistorialProduccion, type HistorialFiltros } from '../services/produccionService';
import { getProductos } from '../services/productoService';

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const HOY = toDateInput(new Date());

export type HistorialFiltrosForm = {
  fechaDesde: string;
  fechaHasta: string;
  productoId: string;
};

function buildFiltrosFromForm(form: HistorialFiltrosForm): HistorialFiltros {
  const filtros: HistorialFiltros = {};
  if (form.fechaDesde) filtros.fechaDesde = form.fechaDesde;
  if (form.fechaHasta) filtros.fechaHasta = form.fechaHasta;
  if (form.productoId) filtros.productoId = Number(form.productoId);
  return filtros;
}

interface HistorialProduccionStore {
  registros: HistorialProduccionDto[];
  productos: ProductoDto[];
  loading: boolean;
  filtering: boolean;
  error: string | null;
  filtros: HistorialFiltrosForm;

  init: () => Promise<void>;
  fetchHistorial: (filtros?: HistorialFiltros, isInitial?: boolean) => Promise<void>;
  setFiltroField: <K extends keyof HistorialFiltrosForm>(field: K, value: HistorialFiltrosForm[K]) => void;
  aplicarFiltros: () => Promise<void>;
  limpiarFiltros: () => Promise<void>;
  dismissError: () => void;
}

export const useHistorialProduccionStore = create<HistorialProduccionStore>((set, get) => ({
  registros: [],
  productos: [],
  loading: false,
  filtering: false,
  error: null,
  filtros: { fechaDesde: HOY, fechaHasta: HOY, productoId: '' },

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [historial, prods] = await Promise.all([
        getHistorialProduccion({ fechaDesde: HOY, fechaHasta: HOY }),
        getProductos(),
      ]);
      set({
        registros: historial,
        productos: prods.filter((p) => p.tipoProducto === 'Compuesto'),
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar datos.',
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchHistorial: async (filtros = {}, isInitial = false) => {
    if (isInitial) set({ loading: true });
    else set({ filtering: true });
    set({ error: null });
    try {
      const data = await getHistorialProduccion(filtros);
      set({ registros: data });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al obtener el historial.',
      });
    } finally {
      if (isInitial) set({ loading: false });
      else set({ filtering: false });
    }
  },

  setFiltroField: (field, value) => {
    set((state) => ({
      filtros: { ...state.filtros, [field]: value },
    }));
  },

  aplicarFiltros: async () => {
    const { filtros } = get();
    await get().fetchHistorial(buildFiltrosFromForm(filtros));
  },

  limpiarFiltros: async () => {
    set({ filtros: { fechaDesde: '', fechaHasta: '', productoId: '' } });
    await get().fetchHistorial({});
  },

  dismissError: () => set({ error: null }),
}));

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtCantidad(n: number): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export function hasFiltrosActivos(filtros: HistorialFiltrosForm): boolean {
  return !!(filtros.fechaDesde || filtros.fechaHasta || filtros.productoId);
}
