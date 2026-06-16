import { create } from 'zustand';
import type { MetodoPago, ProductoDto } from '../types/api.types';
import { getProductos } from '../services/productoService';
import { registrarVenta } from '../services/ventaService';
import { ApiError } from '../lib/apiError';
import { formatCurrency } from '../lib/formatters';

export interface CartItem {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

let successTimer: ReturnType<typeof setTimeout> | null = null;

interface VentasStore {
  productos: ProductoDto[];
  loading: boolean;
  loadError: string | null;

  search: string;
  cart: CartItem[];
  metodoPago: MetodoPago;

  submitting: boolean;
  submitError: string | null;
  successMessage: string | null;

  fetchProductos: () => Promise<void>;
  setSearch: (search: string) => void;
  setMetodoPago: (metodo: MetodoPago) => void;
  addToCart: (producto: ProductoDto) => void;
  incrementItem: (productoId: number) => void;
  decrementItem: (productoId: number) => void;
  removeItem: (productoId: number) => void;
  clearCart: () => void;
  confirmarVenta: () => Promise<void>;
  dismissSubmitError: () => void;
  dismissSuccessMessage: () => void;
}

export const useVentasStore = create<VentasStore>((set, get) => ({
  productos: [],
  loading: false,
  loadError: null,

  search: '',
  cart: [],
  metodoPago: 'Efectivo',

  submitting: false,
  submitError: null,
  successMessage: null,

  fetchProductos: async () => {
    set({ loading: true, loadError: null });
    try {
      const data = await getProductos();
      set({ productos: data });
    } catch (err: unknown) {
      set({
        loadError: err instanceof Error ? err.message : 'Error al cargar productos.',
      });
    } finally {
      set({ loading: false });
    }
  },

  setSearch: (search) => set({ search }),

  setMetodoPago: (metodo) => set({ metodoPago: metodo }),

  addToCart: (producto) => {
    set((state) => {
      const existing = state.cart.find((i) => i.productoId === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stockActual) return state;
        return {
          cart: state.cart.map((i) =>
            i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            productoId: producto.id,
            nombre: producto.nombre,
            precioUnitario: producto.precioVenta,
            cantidad: 1,
          },
        ],
      };
    });
  },

  incrementItem: (productoId) => {
    const producto = get().productos.find((p) => p.id === productoId);
    if (!producto) return;
    set((state) => ({
      cart: state.cart.map((i) => {
        if (i.productoId !== productoId) return i;
        if (i.cantidad >= producto.stockActual) return i;
        return { ...i, cantidad: i.cantidad + 1 };
      }),
    }));
  },

  decrementItem: (productoId) => {
    set((state) => ({
      cart: state.cart
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0),
    }));
  },

  removeItem: (productoId) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.productoId !== productoId),
    }));
  },

  clearCart: () => set({ cart: [], search: '' }),

  confirmarVenta: async () => {
    const { cart, metodoPago, productos } = get();
    if (cart.length === 0) return;

    set({ submitting: true, submitError: null });
    try {
      const venta = await registrarVenta({
        metodoPago,
        items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });

      set({
        productos: productos.map((p) => {
          const vendido = cart.find((c) => c.productoId === p.id);
          if (!vendido) return p;
          return { ...p, stockActual: p.stockActual - vendido.cantidad };
        }),
        successMessage: `Ticket #${venta.id} — ${formatCurrency(venta.total)} en ${venta.metodoPago}. ¡Listo!`,
        cart: [],
        search: '',
      });

      if (successTimer) clearTimeout(successTimer);
      successTimer = setTimeout(() => set({ successMessage: null }), 6000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        set({ submitError: err.detail ?? err.message });
      } else {
        set({
          submitError: err instanceof Error ? err.message : 'Error al registrar la venta.',
        });
      }
    } finally {
      set({ submitting: false });
    }
  },

  dismissSubmitError: () => set({ submitError: null }),
  dismissSuccessMessage: () => set({ successMessage: null }),
}));

export function selectFilteredProductos(
  productos: ProductoDto[],
  search: string,
): ProductoDto[] {
  const term = search.toLowerCase();
  return productos.filter((p) => p.nombre.toLowerCase().includes(term));
}

export function selectCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
}

export function selectCartProductIds(cart: CartItem[]): Set<number> {
  return new Set(cart.map((i) => i.productoId));
}
