import type { IngredienteDto } from '../../types/api.types';

interface InsumosDisponiblesPanelProps {
  total: number;
  busqueda: string;
  ingredientes: IngredienteDto[];
  idsSeleccionados: Set<number>;
  onBusquedaChange: (value: string) => void;
  onAgregar: (ing: IngredienteDto) => void;
}

export default function InsumosDisponiblesPanel({
  total,
  busqueda,
  ingredientes,
  idsSeleccionados,
  onBusquedaChange,
  onAgregar,
}: InsumosDisponiblesPanelProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800">Insumos Disponibles</h3>
        <p className="text-xs text-gray-400 mt-0.5">{total} insumos en stock</p>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar insumo..."
          className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
        />
      </div>
      <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-50 p-2">
        {ingredientes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin resultados.</p>
        ) : (
          ingredientes.map((ing) => {
            const yaAgregado = idsSeleccionados.has(ing.id);
            return (
              <div
                key={ing.id}
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ing.nombre}</p>
                  <p className="text-xs text-gray-400">
                    ${ing.costoActual.toFixed(2)} / {ing.unidadMedida}
                  </p>
                </div>
                <button
                  onClick={() => onAgregar(ing)}
                  disabled={yaAgregado}
                  className={`ml-3 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    yaAgregado
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  {yaAgregado ? (
                    <span>Agregado</span>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
