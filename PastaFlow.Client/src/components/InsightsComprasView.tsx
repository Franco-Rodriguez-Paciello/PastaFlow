import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useInsightsComprasStore } from '../stores/useInsightsComprasStore';
import InsightsFiltrosBar from './insights/InsightsFiltrosBar';
import InsightsTabla from './insights/InsightsTabla';
import InsightDetalleModal from './insights/InsightDetalleModal';

export default function InsightsComprasView() {
  const {
    loading,
    error,
    successMessage,
    init,
    dismissError,
    dismissSuccess,
  } = useInsightsComprasStore();

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
          <Sparkles size={22} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Insights de Compras</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Historial completo, filtros y eliminación de informes archivados.
          </p>
        </div>
      </div>

      <InsightsFiltrosBar />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <span>{error}</span>
          <button type="button" onClick={dismissError} className="ml-auto text-red-400 hover:text-red-600 text-xs">
            Cerrar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          <span>{successMessage}</span>
          <button type="button" onClick={dismissSuccess} className="ml-auto text-emerald-400 hover:text-emerald-600 text-xs">
            Cerrar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <InsightsTabla />
      )}

      <InsightDetalleModal />
    </div>
  );
}
