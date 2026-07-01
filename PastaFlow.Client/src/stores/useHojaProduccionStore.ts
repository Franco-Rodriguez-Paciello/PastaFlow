import { create } from 'zustand';
import type { HojaProduccionDiaDto, HojaProduccionLineaDto } from '../types/api.types';
import { getHojaProduccionDia } from '../services/hojaProduccionService';
import {
  getProduccionErrorMessage,
  isProduccionConcurrencyError,
  isProduccionDomainError,
  registrarProduccion,
} from '../services/produccionService';
import { ApiError } from '../lib/apiError';
import { fmt } from '../lib/formatters';

function fechaPorDefecto(): string {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return manana.toISOString().slice(0, 10);
}

let successTimer: ReturnType<typeof setTimeout> | null = null;

interface HojaProduccionStore {
  fecha: string;
  hoja: HojaProduccionDiaDto | null;
  loading: boolean;
  error: string | null;
  lineaExpandida: number | null;

  lineaEnConfirmacion: HojaProduccionLineaDto | null;
  confirmando: boolean;
  confirmError: string | null;
  successMessage: string | null;

  setFecha: (fecha: string) => void;
  cargarHoja: () => Promise<void>;
  dismissError: () => void;
  dismissSuccess: () => void;
  toggleLinea: (productoId: number) => void;
  abrirConfirmacion: (linea: HojaProduccionLineaDto) => void;
  cerrarConfirmacion: () => void;
  confirmarLinea: () => Promise<void>;
}

export const useHojaProduccionStore = create<HojaProduccionStore>((set, get) => ({
  fecha: fechaPorDefecto(),
  hoja: null,
  loading: false,
  error: null,
  lineaExpandida: null,

  lineaEnConfirmacion: null,
  confirmando: false,
  confirmError: null,
  successMessage: null,

  setFecha: (fecha) => set({ fecha }),

  cargarHoja: async () => {
    const { fecha } = get();
    set({ loading: true, error: null });
    try {
      const hoja = await getHojaProduccionDia(fecha);
      set({ hoja, lineaExpandida: null });
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'No se pudo cargar la hoja de producción',
        hoja: null,
      });
    } finally {
      set({ loading: false });
    }
  },

  dismissError: () => set({ error: null }),
  dismissSuccess: () => set({ successMessage: null }),

  toggleLinea: (productoId) => {
    set((state) => ({
      lineaExpandida: state.lineaExpandida === productoId ? null : productoId,
    }));
  },

  abrirConfirmacion: (linea) => {
    set({
      lineaEnConfirmacion: linea,
      confirmError: null,
    });
  },

  cerrarConfirmacion: () => {
    if (get().confirmando) return;
    set({ lineaEnConfirmacion: null, confirmError: null });
  },

  confirmarLinea: async () => {
    const { lineaEnConfirmacion } = get();
    if (!lineaEnConfirmacion) return;

    if (!lineaEnConfirmacion.stockInsumosSuficiente) {
      set({
        confirmError: 'No hay stock suficiente de insumos para registrar esta producción.',
      });
      return;
    }

    set({ confirmando: true, confirmError: null });
    try {
      await registrarProduccion({
        productoId: lineaEnConfirmacion.productoId,
        cantidadProducida: lineaEnConfirmacion.cantidadFaltaProducir,
      });

      const cantidad = lineaEnConfirmacion.cantidadFaltaProducir;
      const nombre = lineaEnConfirmacion.nombre;
      set({
        lineaEnConfirmacion: null,
        successMessage: `✓ ${nombre} — ${fmt(cantidad)} unidad${cantidad !== 1 ? 'es' : ''} registrada${cantidad !== 1 ? 's' : ''}. La hoja se actualizó.`,
      });

      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => set({ successMessage: null }), 5000);

      await get().cargarHoja();
    } catch (err: unknown) {
      if (isProduccionConcurrencyError(err)) {
        set({
          confirmError: 'Otro usuario modificó el stock. Cerrá y volvé a generar la hoja.',
        });
        await get().cargarHoja();
      } else if (err instanceof ApiError && err.isValidation) {
        const first = Object.values(err.fieldErrors)[0]?.[0];
        set({ confirmError: first ?? 'Datos inválidos para registrar la producción.' });
      } else if (isProduccionDomainError(err)) {
        set({ confirmError: getProduccionErrorMessage(err) });
        await get().cargarHoja();
      } else {
        set({ confirmError: getProduccionErrorMessage(err) });
      }
    } finally {
      set({ confirmando: false });
    }
  },
}));
