import { MOTIVO_LABELS, useIngredientesStore } from '../../stores/useIngredientesStore';

export default function HistorialAjustesPanel() {
  const {
    ingredientes,
    historial,
    loadingHistorial,
    filtroInsumoId,
    setFiltroInsumo,
  } = useIngredientesStore();

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Historial de Ajustes de Stock</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filtrar por insumo</label>
          <select
            value={filtroInsumoId ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : Number(e.target.value);
              setFiltroInsumo(val);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
          >
            <option value="">Todos los insumos</option>
            {ingredientes.map((i) => (
              <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Fecha</th>
              <th className="px-5 py-3 text-left font-medium">Insumo</th>
              <th className="px-5 py-3 text-left font-medium">Tipo</th>
              <th className="px-5 py-3 text-left font-medium">Motivo</th>
              <th className="px-5 py-3 text-right font-medium">Cantidad</th>
              <th className="px-5 py-3 text-left font-medium">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loadingHistorial ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Cargando historial…
                  </div>
                </td>
              </tr>
            ) : historial.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No hay ajustes registrados.
                </td>
              </tr>
            ) : (
              historial.map((a, idx) => {
                const fecha = new Date(a.fechaRegistro);
                const esSuma = a.tipoAjuste === 'Suma';
                return (
                  <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                      <span>{fecha.toLocaleDateString('es-AR')}</span>
                      <span className="ml-2 text-gray-400 text-xs">
                        {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{a.nombreInsumo}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        esSuma ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {esSuma ? '▲ Suma' : '▼ Resta'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{MOTIVO_LABELS[a.motivo] ?? a.motivo}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-800">
                      {a.cantidad % 1 === 0 ? a.cantidad.toFixed(0) : a.cantidad.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 italic">{a.observaciones ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
