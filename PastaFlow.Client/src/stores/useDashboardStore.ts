import { create } from 'zustand';
import type {
  DashboardStatsDto,
  FinancialDashboardDto,
  ComprasInsightDto,
  ComprasInsightResumenDto,
} from '../types/api.types';
import {
  getDashboardStats,
  getFinancialDashboard,
  getUltimoComprasInsight,
  getHistorialComprasInsights,
  getComprasInsightById,
  generateComprasInsight,
} from '../services/dashboardService';
import { ApiError } from '../lib/apiError';
import type { InsightEmailToastVariant } from '../components/dashboard/InsightEmailToast';
import { emailEstadoToToast } from '../components/dashboard/InsightEmailToast';

export interface InsightEmailToastState {
  variant: InsightEmailToastVariant;
  title: string;
  message: string;
}

interface DashboardStore {
  stats: DashboardStatsDto | null;
  statsLoading: boolean;
  statsError: string | null;

  financial: FinancialDashboardDto | null;
  financialLoading: boolean;
  financialError: string | null;

  insight: ComprasInsightDto | null;
  insightHistorial: ComprasInsightResumenDto[];
  insightFetching: boolean;
  insightHistorialLoading: boolean;
  insightSelectingId: number | null;
  insightLoading: boolean;
  insightError: string | null;
  insightEnviarPorEmail: boolean;
  insightEmailToast: InsightEmailToastState | null;

  init: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchFinancial: () => Promise<void>;
  fetchUltimoInsight: () => Promise<void>;
  fetchInsightHistorial: () => Promise<void>;
  selectInsightById: (id: number) => Promise<void>;
  setInsightEnviarPorEmail: (value: boolean) => void;
  generateInsight: () => Promise<void>;
  dismissInsightError: () => void;
  dismissInsightEmailToast: () => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  stats: null,
  statsLoading: false,
  statsError: null,

  financial: null,
  financialLoading: false,
  financialError: null,

  insight: null,
  insightHistorial: [],
  insightFetching: false,
  insightHistorialLoading: false,
  insightSelectingId: null,
  insightLoading: false,
  insightError: null,
  insightEnviarPorEmail: false,
  insightEmailToast: null,

  init: async () => {
    await Promise.all([
      get().fetchStats(),
      get().fetchFinancial(),
      get().fetchUltimoInsight(),
      get().fetchInsightHistorial(),
    ]);
  },

  fetchStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const data = await getDashboardStats();
      set({ stats: data });
    } catch (err) {
      set({
        statsError: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchFinancial: async () => {
    set({ financialLoading: true, financialError: null });
    try {
      const data = await getFinancialDashboard();
      set({ financial: data });
    } catch (err) {
      set({
        financialError: err instanceof Error ? err.message : 'Error al cargar datos financieros',
      });
    } finally {
      set({ financialLoading: false });
    }
  },

  fetchUltimoInsight: async () => {
    set({ insightFetching: true, insightError: null });
    try {
      const data = await getUltimoComprasInsight();
      set({ insight: data });
    } catch (err) {
      set({
        insightError: err instanceof Error ? err.message : 'Error al cargar el último insight.',
      });
    } finally {
      set({ insightFetching: false });
    }
  },

  fetchInsightHistorial: async () => {
    set({ insightHistorialLoading: true });
    try {
      const data = await getHistorialComprasInsights({ page: 1, pageSize: 5 });
      set({ insightHistorial: data.items });
    } catch {
      set({ insightHistorial: [] });
    } finally {
      set({ insightHistorialLoading: false });
    }
  },

  selectInsightById: async (id) => {
    if (get().insight?.id === id) return;

    set({ insightSelectingId: id, insightError: null });
    try {
      const data = await getComprasInsightById(id);
      set({ insight: data });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al cargar el informe.';
      set({ insightError: message });
    } finally {
      set({ insightSelectingId: null });
    }
  },

  generateInsight: async () => {
    const enviarPorEmail = get().insightEnviarPorEmail;
    set({ insightLoading: true, insightError: null, insightEmailToast: null });
    try {
      const resultado = await generateComprasInsight(enviarPorEmail);
      set({ insight: resultado.insight });

      const toast = emailEstadoToToast(resultado.emailEstado, resultado.emailDetalle);
      if (toast) {
        set({ insightEmailToast: toast });
        setTimeout(() => set({ insightEmailToast: null }), 6000);
      }

      await get().fetchInsightHistorial();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.detail ?? err.message
        : err instanceof Error
          ? err.message
          : 'Error al generar el insight de compras.';
      set({ insightError: message });
    } finally {
      set({ insightLoading: false });
    }
  },

  setInsightEnviarPorEmail: (value) => set({ insightEnviarPorEmail: value }),
  dismissInsightError: () => set({ insightError: null }),
  dismissInsightEmailToast: () => set({ insightEmailToast: null }),
}));

export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD} ${diffD === 1 ? 'día' : 'días'}`;
}

export function formatUnits(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
