import { useHistorialProduccionStore, hasFiltrosActivos } from '../../stores/useHistorialProduccionStore';

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

export default function HistorialFiltrosBar() {
  const {
    filtros,
    productos,
    filtering,
    setFiltroField,
    aplicarFiltros,
    limpiarFiltros,
  } = useHistorialProduccionStore();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Fecha desde
          </label>
          <input
            type="date"
            value={filtros.fechaDesde}
            max={filtros.fechaHasta || undefined}
            onChange={(e) => setFiltroField('fechaDesde', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Fecha hasta
          </label>
          <input
            type="date"
            value={filtros.fechaHasta}
            min={filtros.fechaDesde || undefined}
            onChange={(e) => setFiltroField('fechaHasta', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Producto
          </label>
          <select
            value={filtros.productoId}
            onChange={(e) => setFiltroField('productoId', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700 bg-white"
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 ml-auto">
          {hasFiltrosActivos(filtros) && (
            <button
              onClick={() => void limpiarFiltros()}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={() => void aplicarFiltros()}
            disabled={filtering}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {filtering ? <IconSpinner /> : <IconSearch />}
            Filtrar
          </button>
        </div>
      </div>
    </div>
  );
}
