import { create } from 'zustand';
import type { ComprasInsightDto, ComprasInsightResumenDto } from '../types/api.types';
import {
  getHistorialComprasInsights,
  getComprasInsightById,
  eliminarComprasInsight,
} from '../services/dashboardService';
import { ApiError } from '../lib/apiError';

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const HOY = toDateInput(new Date());
const HACE_30_DIAS = toDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

export type InsightsFiltrosForm = {
  fechaDesde: string;
  fechaHasta: string;
  origen: '' | 'Automatico' | 'Manual';
};

export function hasInsightsFiltrosActivos(f: InsightsFiltrosForm): boolean {
  return f.fechaDesde !== HACE_30_DIAS || f.fechaHasta !== HOY || f.origen !== '';
}

interface InsightsComprasStore {
  items: ComprasInsightResumenDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  filtering: boolean;
  deleting: boolean;
  deletingId: number | null;
  error: string | null;
  successMessage: string | null;
  filtros: InsightsFiltrosForm;
  detalle: ComprasInsightDto | null;
  detalleLoading: boolean;
  detalleOpen: boolean;

  init: () => Promise<void>;
  fetchInsights: (opts?: { isInitial?: boolean }) => Promise<void>;
  setFiltroField: <K extends keyof InsightsFiltrosForm>(field: K, value: InsightsFiltrosForm[K]) => void;
  aplicarFiltros: () => Promise<void>;
  limpiarFiltros: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  abrirDetalle: (id: number) => Promise<void>;
  cerrarDetalle: () => void;
  eliminarInforme: (id: number, diaOperativo: string) => Promise<void>;
  eliminarSeleccionado: () => Promise<void>;
  dismissError: () => void;
  dismissSuccess: () => void;
}

function buildFiltrosApi(filtros: InsightsFiltrosForm, page: number, pageSize: number) {
  return {
    fechaDesde: filtros.fechaDesde || undefined,
    fechaHasta: filtros.fechaHasta || undefined,
    origen: filtros.origen || undefined,
    page,
    pageSize,
  };
}

export const useInsightsComprasStore = create<InsightsComprasStore>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 15,
  loading: false,
  filtering: false,
  deleting: false,
  deletingId: null,
  error: null,
  successMessage: null,
  filtros: { fechaDesde: HACE_30_DIAS, fechaHasta: HOY, origen: '' },
  detalle: null,
  detalleLoading: false,
  detalleOpen: false,

  init: async () => {
    await get().fetchInsights({ isInitial: true });
  },

  fetchInsights: async ({ isInitial = false } = {}) => {
    const { filtros, page, pageSize } = get();
    if (isInitial) set({ loading: true });
    else set({ filtering: true });
    set({ error: null });

    try {
      const data = await getHistorialComprasInsights(buildFiltrosApi(filtros, page, pageSize));
      set({
        items: data.items,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar los informes.',
      });
    } finally {
      set({ loading: false, filtering: false });
    }
  },

  setFiltroField: (field, value) =>
    set((state) => ({ filtros: { ...state.filtros, [field]: value } })),

  aplicarFiltros: async () => {
    set({ page: 1 });
    await get().fetchInsights();
  },

  limpiarFiltros: async () => {
    set({
      filtros: { fechaDesde: HACE_30_DIAS, fechaHasta: HOY, origen: '' },
      page: 1,
    });
    await get().fetchInsights();
  },

  setPage: async (page) => {
    set({ page });
    await get().fetchInsights();
  },

  abrirDetalle: async (id) => {
    set({ detalleOpen: true, detalleLoading: true, detalle: null, error: null });
    try {
      const data = await getComprasInsightById(id);
      set({ detalle: data });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al cargar el informe.';
      set({ error: message, detalleOpen: false });
    } finally {
      set({ detalleLoading: false });
    }
  },

  cerrarDetalle: () => set({ detalleOpen: false, detalle: null }),

  eliminarInforme: async (id, diaOperativo) => {
    set({ deletingId: id, deleting: true, error: null });
    try {
      await eliminarComprasInsight(id);
      if (get().detalle?.id === id) {
        set({ detalleOpen: false, detalle: null });
      }
      set({ successMessage: `Informe del día ${diaOperativo} eliminado correctamente.` });
      await get().fetchInsights();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al eliminar el informe.';
      set({ error: message });
    } finally {
      set({ deleting: false, deletingId: null });
    }
  },

  eliminarSeleccionado: async () => {
    const detalle = get().detalle;
    if (!detalle) return;
    await get().eliminarInforme(detalle.id, detalle.diaOperativo);
  },

  dismissError: () => set({ error: null }),
  dismissSuccess: () => set({ successMessage: null }),
}));
