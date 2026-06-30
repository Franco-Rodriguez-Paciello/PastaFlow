import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useInsightsComprasStore } from '../stores/useInsightsComprasStore';
import InsightsFiltrosBar from './insights/InsightsFiltrosBar';
import InsightsTabla from './insights/InsightsTabla';
import InsightDetalleModal from './insights/InsightDetalleModal';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';

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
    <div className="space-y-6">
      <PageHeader
        title="Insights de compras"
        subtitle="Historial completo, filtros y eliminación de informes archivados."
        icon={<Sparkles size={22} strokeWidth={1.8} />}
        iconClassName="bg-amber-50 text-amber-600"
      />

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
        <LoadingState label="Cargando informes…" />
      ) : (
        <InsightsTabla />
      )}

      <InsightDetalleModal />
    </div>
  );
}
