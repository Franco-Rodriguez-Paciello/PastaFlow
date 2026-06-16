import type { ProductoDto } from '../../types/api.types';
import { formatCurrency } from '../../lib/formatters';

interface ProductoCardProps {
  producto: ProductoDto;
  onAdd: (producto: ProductoDto) => void;
  inCart: boolean;
}

export default function ProductoCard({ producto, onAdd, inCart }: ProductoCardProps) {
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
