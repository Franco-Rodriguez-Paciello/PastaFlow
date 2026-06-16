import { create } from 'zustand';
import type { DashboardStatsDto, FinancialDashboardDto } from '../types/api.types';
import { getDashboardStats, getFinancialDashboard } from '../services/dashboardService';

interface DashboardStore {
  stats: DashboardStatsDto | null;
  statsLoading: boolean;
  statsError: string | null;

  financial: FinancialDashboardDto | null;
  financialLoading: boolean;
  financialError: string | null;

  init: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchFinancial: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  statsLoading: false,
  statsError: null,

  financial: null,
  financialLoading: false,
  financialError: null,

  init: async () => {
    await Promise.all([
      useDashboardStore.getState().fetchStats(),
      useDashboardStore.getState().fetchFinancial(),
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
