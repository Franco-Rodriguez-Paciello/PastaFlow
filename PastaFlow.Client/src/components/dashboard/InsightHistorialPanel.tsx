import { History } from 'lucide-react';
import type { ComprasInsightResumenDto } from '../../types/api.types';
import { timeAgo } from '../../stores/useDashboardStore';

interface InsightHistorialPanelProps {
  items: ComprasInsightResumenDto[];
  selectedId: number | null;
  loading: boolean;
  selectingId: number | null;
  onSelect: (id: number) => void;
}

function origenLabel(origen: ComprasInsightResumenDto['origen']): string {
  return origen === 'Automatico' ? 'Automático' : 'Manual';
}

export default function InsightHistorialPanel({
  items,
  selectedId,
  loading,
  selectingId,
  onSelect,
}: InsightHistorialPanelProps) {
  if (loading) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400 animate-pulse">Cargando historial…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <History size={16} className="text-gray-400" strokeWidth={1.8} />
        <h4 className="text-sm font-semibold text-gray-700">Historial reciente</h4>
      </div>

      <ul className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isSelecting = item.id === selectingId;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                disabled={isSelecting}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                  isSelected
                    ? 'border-amber-300 bg-amber-50/80 ring-1 ring-amber-200'
                    : 'border-gray-100 bg-gray-50/50 hover:border-amber-200 hover:bg-amber-50/40'
                } disabled:opacity-60`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {timeAgo(item.generadoEnUtc)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      item.origen === 'Automatico'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-violet-50 text-violet-600'
                    }`}
                  >
                    {origenLabel(item.origen)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Día {item.diaOperativo}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {isSelecting ? 'Cargando informe…' : item.vistaPrevia}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
