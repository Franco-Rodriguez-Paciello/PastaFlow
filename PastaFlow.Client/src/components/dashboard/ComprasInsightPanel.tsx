import { Sparkles, Loader2, RefreshCw, Mail } from 'lucide-react';
import { useDashboardStore } from '../../stores/useDashboardStore';
import InsightReportView from './InsightReportView';
import InsightHistorialPanel from './InsightHistorialPanel';
import InsightEmailToast from './InsightEmailToast';

export default function ComprasInsightPanel() {
  const {
    insight,
    insightHistorial,
    insightFetching,
    insightHistorialLoading,
    insightSelectingId,
    insightLoading,
    insightError,
    insightEnviarPorEmail,
    insightEmailToast,
    generateInsight,
    selectInsightById,
    setInsightEnviarPorEmail,
    dismissInsightError,
    dismissInsightEmailToast,
  } = useDashboardStore();

  return (
    <>
      {insightEmailToast && (
        <InsightEmailToast
          variant={insightEmailToast.variant}
          title={insightEmailToast.title}
          message={insightEmailToast.message}
          onDismiss={dismissInsightEmailToast}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="bg-amber-50 text-amber-500 p-2.5 rounded-lg shrink-0">
              <Sparkles size={20} strokeWidth={1.8} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-800">Insight de Compras</h3>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                  Asistido por IA
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                Se genera automáticamente antes del inicio del día operativo. También podés regenerarlo on-demand.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none sm:justify-end">
              <input
                type="checkbox"
                checked={insightEnviarPorEmail}
                onChange={(e) => setInsightEnviarPorEmail(e.target.checked)}
                disabled={insightLoading}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <Mail size={14} className="text-gray-400" />
              Enviar por correo al generar
            </label>

            <button
              type="button"
              onClick={() => void generateInsight()}
              disabled={insightLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow transition disabled:opacity-60 disabled:cursor-wait"
            >
              {insightLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generando…
                </>
              ) : insight ? (
                <>
                  <RefreshCw size={15} strokeWidth={2} />
                  Regenerar
                </>
              ) : (
                <>
                  <Sparkles size={15} strokeWidth={2} />
                  Generar insight
                </>
              )}
            </button>
          </div>
        </div>

        {insightError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <p>{insightError}</p>
            <button
              type="button"
              onClick={dismissInsightError}
              className="text-red-400 hover:text-red-600 shrink-0 text-lg leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {insightFetching && !insight && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin text-amber-500" />
            Cargando último informe…
          </div>
        )}

        {!insight && !insightLoading && !insightFetching && !insightError && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white">
            <span className="bg-white p-3 rounded-full shadow-sm border border-amber-100 mb-4">
              <Sparkles size={26} className="text-amber-400" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-semibold text-gray-700">Sin informe generado</p>
            <p className="text-xs text-gray-400 mt-1.5 max-w-sm leading-relaxed">
              El informe del día se genera solo antes de las 07:00, o podés crear uno ahora con el botón de arriba.
            </p>
          </div>
        )}

        {insightLoading && (
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-6 animate-pulse">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-amber-100 rounded-lg" />
              <div className="h-3 bg-amber-100 rounded w-28" />
              <div className="ml-auto h-5 bg-gray-100 rounded-full w-20" />
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200/80 rounded w-full" />
              <div className="h-4 bg-gray-200/60 rounded w-[95%]" />
              <div className="h-4 bg-gray-200/50 rounded w-[88%]" />
              <div className="h-4 bg-gray-200/40 rounded w-[92%]" />
            </div>
            <p className="flex items-center justify-center gap-2 mt-6 text-sm text-amber-600/80">
              <Loader2 size={16} className="animate-spin" />
              Analizando stock y demanda histórica…
            </p>
          </div>
        )}

        {insight && !insightLoading && (
          <InsightReportView
            reporte={insight.reporte}
            generadoEnUtc={insight.generadoEnUtc}
            origen={insight.origen}
            diaOperativo={insight.diaOperativo}
          />
        )}

        <InsightHistorialPanel
          items={insightHistorial}
          selectedId={insight?.id ?? null}
          loading={insightHistorialLoading}
          selectingId={insightSelectingId}
          onSelect={(id) => void selectInsightById(id)}
        />
      </div>
    </>
  );
}
