import { X, Loader2, Trash2 } from 'lucide-react';
import { useInsightsComprasStore } from '../../stores/useInsightsComprasStore';
import InsightReportView from '../dashboard/InsightReportView';

export default function InsightDetalleModal() {
  const {
    detalleOpen,
    detalleLoading,
    detalle,
    deleting,
    cerrarDetalle,
    eliminarSeleccionado,
  } = useInsightsComprasStore();

  if (!detalleOpen) return null;

  const handleEliminar = () => {
    if (!detalle) return;
    const ok = window.confirm(
      `¿Eliminar el informe del día operativo ${detalle.diaOperativo}? Esta acción no se puede deshacer.`,
    );
    if (ok) void eliminarSeleccionado();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Detalle del informe</h3>
          <button type="button" onClick={cerrarDetalle} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          {detalleLoading && (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-400">
              <Loader2 size={18} className="animate-spin text-amber-500" />
              Cargando informe…
            </div>
          )}

          {detalle && !detalleLoading && (
            <InsightReportView
              reporte={detalle.reporte}
              generadoEnUtc={detalle.generadoEnUtc}
              origen={detalle.origen}
              diaOperativo={detalle.diaOperativo}
            />
          )}
        </div>

        {detalle && !detalleLoading && (
          <div className="flex justify-between gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={handleEliminar}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Eliminar informe
            </button>
            <button
              type="button"
              onClick={cerrarDetalle}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
