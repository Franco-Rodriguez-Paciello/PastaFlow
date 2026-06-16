import { Clock } from 'lucide-react';
import type { UltimaProduccionItemDto } from '../../types/api.types';
import { formatUnits, timeAgo } from '../../stores/useDashboardStore';

interface ProduccionRecientePanelProps {
  items: UltimaProduccionItemDto[];
}

export default function ProduccionRecientePanel({ items }: ProduccionRecientePanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-500" strokeWidth={1.8} />
          <h3 className="text-base font-semibold text-gray-800">Historial de Producción</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Recientes
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center flex-1 py-8 text-gray-400 text-sm">
          Sin producciones registradas hoy.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-50">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 py-3">
              <span className="text-xs text-gray-400 w-24 shrink-0 tabular-nums">
                {timeAgo(item.fechaDeRegistro)}
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                {item.nombreProducto}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full shrink-0">
                +{formatUnits(item.cantidadProducida)} uds.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
