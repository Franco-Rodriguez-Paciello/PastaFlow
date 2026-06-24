import { Eye, Trash2, Loader2 } from 'lucide-react';
import { useInsightsComprasStore } from '../../stores/useInsightsComprasStore';
import { timeAgo } from '../../stores/useDashboardStore';
import type { ComprasInsightResumenDto } from '../../types/api.types';

function origenLabel(origen: 'Automatico' | 'Manual'): string {
  return origen === 'Automatico' ? 'Automático' : 'Manual';
}

export default function InsightsTabla() {
  const {
    items,
    total,
    page,
    pageSize,
    abrirDetalle,
    eliminarInforme,
    deletingId,
  } = useInsightsComprasStore();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">
        No hay informes para los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <th className="px-4 py-3">Generado</th>
              <th className="px-4 py-3">Día operativo</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Vista previa</th>
              <th className="px-4 py-3 w-36" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-amber-50/30">
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {timeAgo(item.generadoEnUtc)}
                  <span className="block text-[10px] text-gray-400">
                    {new Date(item.generadoEnUtc).toLocaleString('es-AR')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.diaOperativo}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      item.origen === 'Automatico'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-violet-50 text-violet-600'
                    }`}
                  >
                    {origenLabel(item.origen)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-md truncate">{item.vistaPrevia}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void abrirDetalle(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarFila(item, eliminarInforme)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                      aria-label="Eliminar informe"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationFooter page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function handleEliminarFila(
  item: ComprasInsightResumenDto,
  eliminarInforme: (id: number, diaOperativo: string) => Promise<void>,
) {
  const ok = window.confirm(
    `¿Eliminar el informe del día operativo ${item.diaOperativo}? Esta acción no se puede deshacer.`,
  );
  if (ok) void eliminarInforme(item.id, item.diaOperativo);
}

function PaginationFooter({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const { setPage } = useInsightsComprasStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
      <span>
        {total} informe{total !== 1 ? 's' : ''} · página {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => void setPage(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => void setPage(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
