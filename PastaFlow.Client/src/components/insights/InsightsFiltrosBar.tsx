import { useInsightsComprasStore, hasInsightsFiltrosActivos } from '../../stores/useInsightsComprasStore';

export default function InsightsFiltrosBar() {
  const {
    filtros,
    filtering,
    setFiltroField,
    aplicarFiltros,
    limpiarFiltros,
  } = useInsightsComprasStore();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Desde</label>
          <input
            type="date"
            value={filtros.fechaDesde}
            max={filtros.fechaHasta || undefined}
            onChange={(e) => setFiltroField('fechaDesde', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 text-gray-700"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hasta</label>
          <input
            type="date"
            value={filtros.fechaHasta}
            min={filtros.fechaDesde || undefined}
            onChange={(e) => setFiltroField('fechaHasta', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 text-gray-700"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Origen</label>
          <select
            value={filtros.origen}
            onChange={(e) => setFiltroField('origen', e.target.value as typeof filtros.origen)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 text-gray-700 bg-white"
          >
            <option value="">Todos</option>
            <option value="Automatico">Automático</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          {hasInsightsFiltrosActivos(filtros) && (
            <button
              type="button"
              onClick={() => void limpiarFiltros()}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={() => void aplicarFiltros()}
            disabled={filtering}
            className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {filtering ? 'Filtrando…' : 'Filtrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
