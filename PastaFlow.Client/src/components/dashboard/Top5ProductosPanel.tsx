import { TrendingUp } from 'lucide-react';
import type { ProductoMasVendidoDto } from '../../types/api.types';
import { formatCurrency } from '../../lib/formatters';

interface Top5ProductosPanelProps {
  items: ProductoMasVendidoDto[];
}

export default function Top5ProductosPanel({ items }: Top5ProductosPanelProps) {
  const maxUnidades = items.length > 0 ? Math.max(...items.map((i) => i.totalUnidadesVendidas)) : 1;
  const colors = ['bg-yellow-400', 'bg-gray-400', 'bg-orange-400', 'bg-blue-400', 'bg-emerald-400'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-gray-500" strokeWidth={1.8} />
          <h3 className="text-base font-semibold text-gray-800">Ranking de Pastas</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Más vendidas hoy
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8 text-gray-400 bg-gray-50 rounded-lg">
          <TrendingUp size={28} strokeWidth={1.5} />
          <p className="text-sm font-medium">Sin ventas registradas hoy</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, idx) => {
            const pct = maxUnidades > 0 ? (item.totalUnidadesVendidas / maxUnidades) * 100 : 0;
            return (
              <li key={item.productoId}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate">{item.nombreProducto}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-semibold text-gray-500 tabular-nums">
                      {item.totalUnidadesVendidas} uds.
                    </span>
                    <span className="text-xs font-bold text-gray-800 tabular-nums">
                      {formatCurrency(item.totalFacturado)}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors[idx] ?? 'bg-blue-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
