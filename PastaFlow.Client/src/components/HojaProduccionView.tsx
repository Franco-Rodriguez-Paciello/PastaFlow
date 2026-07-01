import { useEffect, Fragment } from 'react';
import {
  CalendarDays,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Package,
  CloudRain,
  Snowflake,
  Sun,
  X,
} from 'lucide-react';
import { useHojaProduccionStore } from '../stores/useHojaProduccionStore';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';
import { PackagePlus } from 'lucide-react';
import type { ClimaPronosticoDto, HojaProduccionLineaDto } from '../types/api.types';
import { fmt, formatCurrency } from '../lib/formatters';
import ConfirmarProduccionHojaModal from './hoja-produccion/ConfirmarProduccionHojaModal';

interface Props {
  onRegistrarCompras?: () => void;
}

function formatFechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function ClimaBadge({ clima }: { clima: ClimaPronosticoDto }) {
  if (!clima.disponible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
        <Sun size={12} /> Sin pronóstico
      </span>
    );
  }
  if (clima.esFrioOLluvioso) {
    const Icon = clima.precipMm != null && clima.precipMm >= 2 ? CloudRain : Snowflake;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs text-sky-700">
        <Icon size={12} /> {clima.descripcion}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-700">
      <Sun size={12} /> {clima.descripcion}
    </span>
  );
}

function EstadoLinea({ linea }: { linea: HojaProduccionLineaDto }) {
  if (linea.cantidadFaltaProducir <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 size={12} /> Stock cubierto
      </span>
    );
  }
  if (!linea.tieneReceta) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
        <AlertTriangle size={12} /> Sin receta
      </span>
    );
  }
  if (!linea.esCompuesto) {
    return (
      <span className="text-xs text-gray-500">No producible</span>
    );
  }
  if (linea.stockInsumosSuficiente) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 size={12} /> Insumos OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertTriangle size={12} /> Faltan insumos
    </span>
  );
}

export default function HojaProduccionView({ onRegistrarCompras }: Props) {
  const {
    fecha,
    hoja,
    loading,
    error,
    lineaExpandida,
    lineaEnConfirmacion,
    confirmando,
    confirmError,
    successMessage,
    setFecha,
    cargarHoja,
    dismissSuccess,
    toggleLinea,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarLinea,
  } = useHojaProduccionStore();

  useEffect(() => {
    void cargarHoja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hoja de producción del día"
        subtitle="Qué producir para cubrir la demanda estimada, con stock terminado e insumos en un solo lugar."
        icon={<ClipboardList size={22} />}
        iconClassName="bg-blue-50 text-blue-600"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Fecha de venta objetivo
            </label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void cargarHoja()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
          >
            <Factory size={15} />
            Generar hoja
          </button>
        </div>
      </div>

      {error && (
        <ErrorState message={error} onRetry={() => void cargarHoja()} retrying={loading} />
      )}

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
          <button type="button" onClick={dismissSuccess} className="text-emerald-500 hover:text-emerald-700 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !hoja && <LoadingState label="Calculando demanda y verificando insumos…" />}

      {hoja && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800 capitalize">
              {formatFechaLarga(hoja.fechaObjetivo)}
            </span>
            {hoja.esFinDeSemana && (
              <span className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs text-violet-700">
                Fin de semana
              </span>
            )}
            {hoja.esDia29 && (
              <span className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs text-orange-700">
                Día 29
              </span>
            )}
            <ClimaBadge clima={hoja.clima} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Demanda estimada</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(hoja.totalPredicho)}</p>
              <p className="text-xs text-gray-400 mt-0.5">unidades en total</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Falta producir</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(hoja.totalFaltaProducir)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{hoja.lineasConFalta} productos</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Líneas listas</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {hoja.lineasStockOk}/{hoja.lineas.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">stock o insumos OK</p>
            </div>
            <div className={`rounded-xl border p-4 shadow-sm ${
              hoja.puedeProducirTodo
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs uppercase tracking-wide text-gray-600">Insumos globales</p>
              <p className={`text-lg font-bold mt-1 ${hoja.puedeProducirTodo ? 'text-emerald-800' : 'text-red-800'}`}>
                {hoja.puedeProducirTodo ? 'Alcanzan para todo' : 'Hay faltantes'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">si producís todas las líneas</p>
            </div>
          </div>

          {!hoja.puedeProducirTodo && hoja.insumosAgregados.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>
                  Faltan insumos para producir todo el día. Registrá un ingreso de mercadería
                  o producí línea por línea según el stock disponible.
                </p>
              </div>
              {onRegistrarCompras && (
                <button
                  type="button"
                  onClick={onRegistrarCompras}
                  className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  <PackagePlus size={16} />
                  Registrar compra
                </button>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Productos a fabricar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left w-8" />
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-right">Predicho</th>
                    <th className="px-4 py-3 text-right">Stock terminado</th>
                    <th className="px-4 py-3 text-right">Hecho hoy</th>
                    <th className="px-4 py-3 text-right font-semibold text-blue-700">A producir</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hoja.lineas.map((linea) => {
                    const expandida = lineaExpandida === linea.productoId;
                    const puedeProducir =
                      linea.cantidadFaltaProducir > 0 &&
                      linea.tieneReceta &&
                      linea.esCompuesto;

                    return (
                      <Fragment key={linea.productoId}>
                        <tr className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">
                            {linea.detalleInsumos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleLinea(linea.productoId)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label={expandida ? 'Ocultar insumos' : 'Ver insumos'}
                              >
                                {expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{linea.nombre}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{fmt(linea.cantidadPredicha)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{fmt(linea.stockTerminadoActual)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{fmt(linea.cantidadProducidaHoy)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-700">
                            {fmt(linea.cantidadFaltaProducir)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <EstadoLinea linea={linea} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {puedeProducir ? (
                              <button
                                type="button"
                                onClick={() => abrirConfirmacion(linea)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                              >
                                <Factory size={12} />
                                Registrar
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                        {expandida && linea.detalleInsumos.length > 0 && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={8} className="px-8 py-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500">
                                    <th className="text-left pb-2 font-medium">Insumo</th>
                                    <th className="text-right pb-2 font-medium">Necesario</th>
                                    <th className="text-right pb-2 font-medium">Stock</th>
                                    <th className="text-right pb-2 font-medium">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {linea.detalleInsumos.map((d) => (
                                    <tr key={d.ingredienteId}>
                                      <td className="py-1 text-gray-700">{d.nombreIngrediente}</td>
                                      <td className="py-1 text-right">{fmt(d.cantidadTotalRequerida)}</td>
                                      <td className="py-1 text-right">{fmt(d.stockDisponible)}</td>
                                      <td className="py-1 text-right">
                                        {d.stockSuficiente ? (
                                          <span className="text-emerald-600">OK</span>
                                        ) : (
                                          <span className="text-red-600 font-medium">Falta</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {linea.costoEstimado != null && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Costo estimado: {formatCurrency(linea.costoEstimado)}
                                  {linea.margenEstimado != null && (
                                    <> · Margen: {formatCurrency(linea.margenEstimado)}</>
                                  )}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hoja.insumosAgregados.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Insumos necesarios (total del día)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Suma de todos los productos pendientes de producir
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Insumo</th>
                      <th className="px-4 py-3 text-right">Requerido</th>
                      <th className="px-4 py-3 text-right">Stock actual</th>
                      <th className="px-4 py-3 text-right">Faltante</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      {onRegistrarCompras && (
                        <th className="px-4 py-3 text-right">Acción</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hoja.insumosAgregados.map((insumo) => (
                      <tr key={insumo.ingredienteId} className={!insumo.suficiente ? 'bg-red-50/40' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900">{insumo.nombre}</td>
                        <td className="px-4 py-3 text-right">{fmt(insumo.cantidadRequeridaTotal)}</td>
                        <td className="px-4 py-3 text-right">{fmt(insumo.stockDisponible)}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">
                          {insumo.faltante > 0 ? fmt(insumo.faltante) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {insumo.suficiente ? (
                            <span className="text-emerald-600 text-xs font-medium">OK</span>
                          ) : (
                            <span className="text-red-600 text-xs font-medium">Falta</span>
                          )}
                        </td>
                        {onRegistrarCompras && (
                          <td className="px-4 py-3 text-right">
                            {!insumo.suficiente ? (
                              <button
                                type="button"
                                onClick={onRegistrarCompras}
                                className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                              >
                                Comprar
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {lineaEnConfirmacion && (
        <ConfirmarProduccionHojaModal
          linea={lineaEnConfirmacion}
          confirmando={confirmando}
          error={confirmError}
          onConfirmar={() => void confirmarLinea()}
          onCerrar={cerrarConfirmacion}
        />
      )}
    </div>
  );
}
