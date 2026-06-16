import { useRecetasStore } from '../../stores/useRecetasStore';

interface RecetaBorradorPanelProps {
  costoTotal: number;
}

export default function RecetaBorradorPanel({ costoTotal }: RecetaBorradorPanelProps) {
  const {
    ingredientesSeleccionados,
    loadingReceta,
    limpiarReceta,
    actualizarCantidad,
    removerIngrediente,
  } = useRecetasStore();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            Borrador de Receta
            {loadingReceta && (
              <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
            )}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loadingReceta
              ? 'Cargando receta existente...'
              : ingredientesSeleccionados.length === 0
              ? 'Agregá insumos desde la izquierda'
              : `${ingredientesSeleccionados.length} insumo${ingredientesSeleccionados.length !== 1 ? 's' : ''} en la receta`}
          </p>
        </div>
        {ingredientesSeleccionados.length > 0 && (
          <button
            onClick={limpiarReceta}
            className="text-xs text-red-400 hover:text-red-600 font-medium transition"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-gray-50 p-2">
        {ingredientesSeleccionados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 select-none">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">La receta está vacía</p>
          </div>
        ) : (
          ingredientesSeleccionados.map(({ ingrediente, cantidad }) => (
            <div
              key={ingrediente.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                cantidad <= 0 ? 'bg-red-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{ingrediente.nombre}</p>
                <p className="text-xs text-gray-400">
                  ${ingrediente.costoActual.toFixed(2)} / {ingrediente.unidadMedida}
                  {cantidad > 0 && (
                    <span className="ml-2 text-amber-600 font-semibold">
                      = ${(cantidad * ingrediente.costoActual).toFixed(2)}
                    </span>
                  )}
                </p>
                {cantidad <= 0 && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">Ingresá una cantidad mayor a 0</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={cantidad === 0 ? '' : cantidad}
                  onChange={(e) =>
                    actualizarCantidad(ingrediente.id, parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className={`w-20 px-2 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    cantidad <= 0
                      ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-amber-400'
                  }`}
                />
                <button
                  onClick={() => removerIngrediente(ingrediente.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar ingrediente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Costo Total Estimado
          </span>
          <span className={`text-2xl font-bold tabular-nums ${costoTotal > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
            ${costoTotal.toFixed(2)}
          </span>
        </div>
        {ingredientesSeleccionados.some((i) => i.cantidad === 0) && (
          <p className="text-xs text-amber-500 mt-1">Algunos insumos tienen cantidad 0.</p>
        )}
      </div>
    </div>
  );
}
