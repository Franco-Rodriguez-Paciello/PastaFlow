import { ShoppingCart, CreditCard, Banknote, CheckCircle, X } from 'lucide-react';
import type { MetodoPago, ProductoDto } from '../../types/api.types';
import type { CartItem } from '../../stores/useVentasStore';
import { formatCurrency } from '../../lib/formatters';
import CarritoItem from './CarritoItem';

interface TicketPanelProps {
  cart: CartItem[];
  productos: ProductoDto[];
  total: number;
  metodoPago: MetodoPago;
  submitting: boolean;
  submitError: string | null;
  onClearCart: () => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  onDismissError: () => void;
  onConfirmar: () => void;
}

export default function TicketPanel({
  cart,
  productos,
  total,
  metodoPago,
  submitting,
  submitError,
  onClearCart,
  onIncrement,
  onDecrement,
  onRemove,
  onMetodoPagoChange,
  onDismissError,
  onConfirmar,
}: TicketPanelProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col gap-4 sticky top-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900">
          <div className="flex items-center gap-2.5 text-white">
            <ShoppingCart size={18} strokeWidth={2} />
            <span className="font-bold text-sm tracking-wide">Ticket de Venta</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
            >
              Limpiar
            </button>
          )}
        </div>

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
                  <CarritoItem
                    key={item.productoId}
                    item={item}
                    maxStock={prod?.stockActual ?? item.cantidad}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    onRemove={onRemove}
                  />
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Método de Pago</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onMetodoPagoChange('Efectivo')}
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
              onClick={() => onMetodoPagoChange('Transferencia')}
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

        {submitError && (
          <div className="mx-5 mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
            <span className="shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <span>{submitError}</span>
            <button onClick={onDismissError} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
              <X size={12} />
            </button>
          </div>
        )}

        <div className="px-5 pb-5">
          <button
            onClick={() => void onConfirmar()}
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
  );
}
