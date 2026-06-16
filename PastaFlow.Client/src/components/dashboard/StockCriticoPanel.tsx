import { ShoppingCart, CircleCheck } from 'lucide-react';
import type { StockCriticoItemDto } from '../../types/api.types';
import { formatUnits } from '../../stores/useDashboardStore';

interface StockCriticoPanelProps {
  items: StockCriticoItemDto[];
}

export default function StockCriticoPanel({ items }: StockCriticoPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-gray-500" strokeWidth={1.8} />
          <h3 className="text-base font-semibold text-gray-800">Lista de Compras</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Stock crítico
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8 text-emerald-600 bg-emerald-50 rounded-lg">
          <CircleCheck size={28} strokeWidth={1.8} />
          <p className="text-sm font-medium">Stock optimizado</p>
          <p className="text-xs text-emerald-500 text-center">Todos los insumos están dentro de los niveles seguros.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-50">
          {items.map((item) => {
            const isLow = item.stockActual <= 2;
            return (
              <li key={item.nombre} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700">{item.nombre}</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isLow ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  Quedan: {formatUnits(item.stockActual)} {item.unidadMedida}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
