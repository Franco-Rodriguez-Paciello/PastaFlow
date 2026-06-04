import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, CheckCircle, X } from 'lucide-react';
import type { MetodoPago, ProductoDto } from '../types/api.types';
import { getProductos } from '../services/productoService';
import { registrarVenta } from '../services/ventaService';
import { ApiError } from '../lib/apiError';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Toast Component ──────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

function SuccessToast({ message, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full bg-white border border-emerald-200 shadow-xl rounded-xl px-4 py-4 animate-slide-up">
      <span className="shrink-0 text-emerald-500 mt-0.5">
        <CheckCircle size={20} strokeWidth={2} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">Venta registrada</p>
        <p className="text-xs text-gray-500 mt-0.5">{message}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  producto: ProductoDto;
  onAdd: (producto: ProductoDto) => void;
  inCart: boolean;
}

function ProductCard({ producto, onAdd, inCart }: ProductCardProps) {
  const sinStock = producto.stockActual <= 0;
  return (
    <button
      onClick={() => !sinStock && onAdd(producto)}
      disabled={sinStock}
      className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all
        ${sinStock
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
          : inCart
            ? 'bg-blue-50 border-blue-300 shadow-sm'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
        }`}
    >
      {inCart && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
      )}
      <span className="text-xl">🍝</span>
      <p className="text-sm font-semibold text-gray-800 leading-snug">{producto.nombre}</p>
      <p className="text-base font-bold text-blue-600">{formatCurrency(producto.precioVenta)}</p>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        sinStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
      }`}>
        {sinStock ? 'Sin stock' : `Stock: ${producto.stockActual}`}
      </span>
    </button>
  );
}

// ─── Cart Row ─────────────────────────────────────────────────────────────────

interface CartRowProps {
  item: CartItem;
  maxStock: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
}

function CartRow({ item, maxStock, onIncrement, onDecrement, onRemove }: CartRowProps) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
        <p className="text-xs text-gray-500">{formatCurrency(item.precioUnitario)} / ud.</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onDecrement(item.productoId)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Minus size={13} />
        </button>
        <span className="w-8 text-center text-sm font-bold text-gray-800 tabular-nums">
          {item.cantidad}
        </span>
        <button
          onClick={() => onIncrement(item.productoId)}
          disabled={item.cantidad >= maxStock}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
        </button>
      </div>
      <p className="w-24 text-right text-sm font-semibold text-gray-800 tabular-nums shrink-0">
        {formatCurrency(item.cantidad * item.precioUnitario)}
      </p>
      <button
        onClick={() => onRemove(item.productoId)}
        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-1"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VentasView() {
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch productos ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoadingProductos(true);
    getProductos()
      .then((data) => {
        if (!cancelled) setProductos(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Error al cargar productos.');
      })
      .finally(() => { if (!cancelled) setLoadingProductos(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const total = cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

  // ── Cart operations ──────────────────────────────────────────────────────

  function addToCart(producto: ProductoDto) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id);
      if (existing) {
        const maxStock = producto.stockActual;
        if (existing.cantidad >= maxStock) return prev;
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitario: producto.precioVenta,
          cantidad: 1,
        },
      ];
    });
  }

  function incrementItem(productoId: number) {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;
    setCart((prev) =>
      prev.map((i) => {
        if (i.productoId !== productoId) return i;
        if (i.cantidad >= producto.stockActual) return i;
        return { ...i, cantidad: i.cantidad + 1 };
      }),
    );
  }

  function decrementItem(productoId: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0),
    );
  }

  function removeItem(productoId: number) {
    setCart((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function clearCart() {
    setCart([]);
    setSearch('');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleConfirmarVenta() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const venta = await registrarVenta({
        metodoPago,
        items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      });

      // Actualizar stock local sin refetch
      setProductos((prev) =>
        prev.map((p) => {
          const vendido = cart.find((c) => c.productoId === p.id);
          if (!vendido) return p;
          return { ...p, stockActual: p.stockActual - vendido.cantidad };
        }),
      );

      setSuccessMessage(
        `Ticket #${venta.id} — ${formatCurrency(venta.total)} en ${venta.metodoPago}. ¡Listo!`,
      );
      clearCart();

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.detail ?? err.message);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Error al registrar la venta.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 items-start">

      {/* ── Panel Izquierdo: Catálogo ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Buscador */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Grilla de productos */}
        {loadingProductos ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm p-4">
            {loadError}
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No se encontraron productos para "<span className="font-medium text-gray-600">{search}</span>".
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProductos.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                onAdd={addToCart}
                inCart={cart.some((c) => c.productoId === p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Panel Derecho: Ticket / Carrito ── */}
      <div className="w-80 shrink-0 flex flex-col gap-4 sticky top-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-900">
            <div className="flex items-center gap-2.5 text-white">
              <ShoppingCart size={18} strokeWidth={2} />
              <span className="font-bold text-sm tracking-wide">Ticket de Venta</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Items */}
          <div className="px-5 min-h-[160px]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <ShoppingCart size={28} strokeWidth={1.5} />
                <p className="text-xs text-center">Seleccioná productos del catálogo para agregarlos al ticket.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {cart.map((item) => {
                  const prod = productos.find((p) => p.id === item.productoId);
                  return (
                    <CartRow
                      key={item.productoId}
                      item={item}
                      maxStock={prod?.stockActual ?? item.cantidad}
                      onIncrement={incrementItem}
                      onDecrement={decrementItem}
                      onRemove={removeItem}
                    />
                  );
                })}
              </ul>
            )}
          </div>

          {/* Total */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Método de Pago</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMetodoPago('Efectivo')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  metodoPago === 'Efectivo'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                <Banknote size={16} />
                Efectivo
              </button>
              <button
                onClick={() => setMetodoPago('Transferencia')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  metodoPago === 'Transferencia'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <CreditCard size={16} />
                Transfer.
              </button>
            </div>
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="mx-5 mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
              <span className="shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              <span>{submitError}</span>
              <button onClick={() => setSubmitError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Confirm button */}
          <div className="px-5 pb-5">
            <button
              onClick={() => void handleConfirmarVenta()}
              disabled={cart.length === 0 || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 font-bold text-sm transition-all shadow-sm"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Procesando…
                </>
              ) : (
                <>
                  <CheckCircle size={16} strokeWidth={2.5} />
                  Confirmar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toast de éxito ── */}
      {successMessage && (
        <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}
