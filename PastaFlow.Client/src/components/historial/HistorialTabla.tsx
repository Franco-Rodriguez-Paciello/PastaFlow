import {
  fmtCantidad,
  formatFecha,
  formatHora,
  useHistorialProduccionStore,
} from '../../stores/useHistorialProduccionStore';

function IconClipboard() {
  return (
    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2
           M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2
           M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

export default function HistorialTabla() {
  const { registros, filtering } = useHistorialProduccionStore();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">
          {registros.length === 0
            ? 'Sin resultados'
            : `${registros.length} registro${registros.length !== 1 ? 's' : ''}`}
        </span>
        {filtering && (
          <span className="flex items-center gap-1.5 text-xs text-blue-500">
            <IconSpinner /> Actualizando…
          </span>
        )}
      </div>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <IconClipboard />
          <p className="text-gray-500 font-medium">No se encontraron registros</p>
          <p className="text-gray-400 text-sm max-w-xs">
            No hay producciones para los filtros seleccionados. Intentá ampliar el rango de fechas o seleccionar otro producto.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Fecha</th>
                <th className="px-5 py-3 text-left font-medium">Hora</th>
                <th className="px-5 py-3 text-left font-medium">Producto fabricado</th>
                <th className="px-5 py-3 text-right font-medium">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registros.map((r, idx) => (
                <tr
                  key={r.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                >
                  <td className="px-5 py-3 text-gray-600 tabular-nums whitespace-nowrap">
                    {formatFecha(r.fechaDeRegistro)}
                  </td>
                  <td className="px-5 py-3 text-gray-400 tabular-nums whitespace-nowrap">
                    {formatHora(r.fechaDeRegistro)}
                  </td>
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    {r.nombreProducto}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-700 font-semibold">
                    {fmtCantidad(r.cantidadProducida)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
