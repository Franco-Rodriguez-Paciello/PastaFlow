import { create } from 'zustand';
import type { PrediccionDemandaDto, SerieDiariaDto, BacktestDemandaDto } from '../types/api.types';
import {
  getPrediccionDemanda,
  generarRecomendacionDemanda,
  getSerieHistorica,
  getBacktestDemanda,
} from '../services/planificacionService';
import { formatRecetaAsistenteError } from '../lib/recetaAsistenteErrors';

function fechaPorDefecto(): string {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return manana.toISOString().slice(0, 10);
}

interface PlanificacionStore {
  fecha: string;
  prediccion: PrediccionDemandaDto | null;
  loading: boolean;
  error: string | null;

  serie: SerieDiariaDto[];
  serieLoading: boolean;

  backtest: BacktestDemandaDto | null;
  backtestLoading: boolean;

  recomendacionLoading: boolean;
  recomendacionError: string | null;

  setFecha: (fecha: string) => void;
  cargarPrediccion: () => Promise<void>;
  cargarContexto: () => Promise<void>;
  generarRecomendacion: () => Promise<void>;
  dismissError: () => void;
  dismissRecomendacionError: () => void;
}

export const usePlanificacionStore = create<PlanificacionStore>((set, get) => ({
  fecha: fechaPorDefecto(),
  prediccion: null,
  loading: false,
  error: null,

  serie: [],
  serieLoading: false,

  backtest: null,
  backtestLoading: false,

  recomendacionLoading: false,
  recomendacionError: null,

  setFecha: (fecha) => set({ fecha }),

  cargarPrediccion: async () => {
    set({ loading: true, error: null });
    try {
      const prediccion = await getPrediccionDemanda(get().fecha);
      set({ prediccion });
    } catch (err) {
      set({ error: formatRecetaAsistenteError(err) });
    } finally {
      set({ loading: false });
    }
  },

  cargarContexto: async () => {
    set({ serieLoading: true, backtestLoading: true });
    const [serieRes, backtestRes] = await Promise.allSettled([
      getSerieHistorica(90),
      getBacktestDemanda(),
    ]);

    if (serieRes.status === 'fulfilled') {
      set({ serie: serieRes.value });
    }
    set({ serieLoading: false });

    if (backtestRes.status === 'fulfilled') {
      set({ backtest: backtestRes.value });
    }
    set({ backtestLoading: false });
  },

  generarRecomendacion: async () => {
    set({ recomendacionLoading: true, recomendacionError: null });
    try {
      const prediccion = await generarRecomendacionDemanda(get().fecha);
      set({ prediccion });
    } catch (err) {
      set({ recomendacionError: formatRecetaAsistenteError(err) });
    } finally {
      set({ recomendacionLoading: false });
    }
  },

  dismissError: () => set({ error: null }),
  dismissRecomendacionError: () => set({ recomendacionError: null }),
}));
