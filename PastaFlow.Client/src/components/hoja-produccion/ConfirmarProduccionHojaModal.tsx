import { X, Factory, Loader2, AlertTriangle } from 'lucide-react';
import type { DetalleCostoIngredienteDto, HojaProduccionLineaDto } from '../../types/api.types';
import { fmt, formatCurrency } from '../../lib/formatters';

interface Props {
  linea: HojaProduccionLineaDto;
  confirmando: boolean;
  error: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export default function ConfirmarProduccionHojaModal({
  linea,
  confirmando,
  error,
  onConfirmar,
  onCerrar,
}: Props) {
  const puedeConfirmar = linea.stockInsumosSuficiente && !confirmando;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmar-produccion-titulo"
      onClick={confirmando ? undefined : onCerrar}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h3 id="confirmar-produccion-titulo" className="text-lg font-semibold text-gray-900">
              Registrar producción
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Confirmá para descontar insumos y sumar stock terminado.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={confirmando}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Producto</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">{linea.nombre}</p>
            <p className="text-sm text-gray-600 mt-1">
              Cantidad a registrar:{' '}
              <span className="font-semibold text-blue-700">
                {fmt(linea.cantidadFaltaProducir)} unidades
              </span>
            </p>
          </div>

          {!linea.stockInsumosSuficiente && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>Faltan insumos para esta cantidad. Revisá la tabla de la hoja o registrá otra línea primero.</p>
            </div>
          )}

          {linea.detalleInsumos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Insumos a descontar
              </p>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500">
                      <th className="px-3 py-2 text-left font-medium">Insumo</th>
                      <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                      <th className="px-3 py-2 text-right font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linea.detalleInsumos.map((d: DetalleCostoIngredienteDto) => (
                      <tr key={d.ingredienteId}>
                        <td className="px-3 py-2 text-gray-800">{d.nombreIngrediente}</td>
                        <td className="px-3 py-2 text-right">{fmt(d.cantidadTotalRequerida)}</td>
                        <td className="px-3 py-2 text-right">
                          {d.stockSuficiente ? (
                            <span className="text-emerald-600">{fmt(d.stockDisponible)}</span>
                          ) : (
                            <span className="text-red-600 font-medium">{fmt(d.stockDisponible)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {linea.costoEstimado != null && (
            <p className="text-xs text-gray-500">
              Costo estimado: {formatCurrency(linea.costoEstimado)}
              {linea.margenEstimado != null && (
                <> · Margen: {formatCurrency(linea.margenEstimado)}</>
              )}
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={confirmando}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={!puedeConfirmar}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Registrando…
              </>
            ) : (
              <>
                <Factory size={16} />
                Confirmar y registrar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
