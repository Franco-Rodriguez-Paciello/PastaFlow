import type { ProductoDto } from '../../types/api.types';
import ProductoCard from './ProductoCard';
import ErrorState from '../common/ErrorState';

interface CatalogoPanelProps {
  search: string;
  loading: boolean;
  loadError: string | null;
  productos: ProductoDto[];
  cartProductIds: Set<number>;
  onSearchChange: (value: string) => void;
  onAddToCart: (producto: ProductoDto) => void;
  onRetry?: () => void;
}

export default function CatalogoPanel({
  search,
  loading,
  loadError,
  productos,
  cartProductIds,
  onSearchChange,
  onAddToCart,
  onRetry,
}: CatalogoPanelProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4">
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          title="No pudimos cargar el catálogo"
          message={loadError}
          onRetry={onRetry}
          retrying={loading}
        />
      ) : productos.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No se encontraron productos para "<span className="font-medium text-gray-600">{search}</span>".
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {productos.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              onAdd={onAddToCart}
              inCart={cartProductIds.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
