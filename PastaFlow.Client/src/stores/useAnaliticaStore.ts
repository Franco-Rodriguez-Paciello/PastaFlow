import { create } from 'zustand';
import type { ProductProfitabilityDto } from '../types/api.types';
import { getProductProfitability } from '../services/productoService';

interface AnaliticaStore {
  productos: ProductProfitabilityDto[];
  loading: boolean;
  error: string | null;

  fetchRentabilidad: () => Promise<void>;
  dismissError: () => void;
}

export const useAnaliticaStore = create<AnaliticaStore>((set) => ({
  productos: [],
  loading: false,
  error: null,

  fetchRentabilidad: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getProductProfitability();
      set({ productos: data });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      set({ loading: false });
    }
  },

  dismissError: () => set({ error: null }),
}));
