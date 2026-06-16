import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../../stores/useVentasStore';
import { formatCurrency } from '../../lib/formatters';

interface CarritoItemProps {
  item: CartItem;
  maxStock: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function CarritoItem({
  item,
  maxStock,
  onIncrement,
  onDecrement,
  onRemove,
}: CarritoItemProps) {
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
