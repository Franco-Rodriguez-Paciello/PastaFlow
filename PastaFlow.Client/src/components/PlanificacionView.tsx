import { useEffect } from 'react';
import {
  CalendarDays, Sparkles, Loader2, X, TrendingUp, Package,
  CloudRain, Sun, Snowflake, Target,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { usePlanificacionStore } from '../stores/usePlanificacionStore';
import PageHeader from './common/PageHeader';
import type { ClimaPronosticoDto } from '../types/api.types';

function formatFechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatFechaCorta(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

function ClimaIcono({ clima }: { clima: ClimaPronosticoDto }) {
  if (!clima.disponible) return <Sun size={28} className="text-gray-300" />;
  if (clima.precipMm != null && clima.precipMm >= 2) return <CloudRain size={28} className="text-blue-500" />;
  if (clima.tempMaxC != null && clima.tempMaxC < 14) return <Snowflake size={28} className="text-sky-500" />;
  return <Sun size={28} className="text-amber-400" />;
}

export default function PlanificacionView() {
  const {
    fecha, prediccion, loading, error,
    serie, backtest,
    recomendacionLoading, recomendacionError,
    setFecha, cargarPrediccion, cargarContexto, generarRecomendacion,
    dismissError, dismissRecomendacionError,
  } = usePlanificacionStore();

  useEffect(() => {
    void cargarPrediccion();
    void cargarContexto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serieChart = serie.map((s) => ({ label: formatFechaCorta(s.fecha), unidades: s.unidades }));
  const backtestChart = backtest?.serie.map((p) => ({
    label: formatFechaCorta(p.fecha), real: p.real, predicho: p.predicho,
  })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planificación de producción"
        subtitle="Estimación de demanda para decidir cuánto producir, según el histórico de ventas, el día de la semana y el pronóstico del clima."
      />

      {/* Controles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha a planificar</label>
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
            onClick={() => void cargarPrediccion()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
            Calcular demanda
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={dismissError} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !prediccion && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {prediccion && (
        <>
          {/* Resumen + Clima + Precisión */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-800 capitalize">
                {formatFechaLarga(prediccion.fechaObjetivo)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {prediccion.esFinDeSemana && (
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    Fin de semana
                  </span>
                )}
                {prediccion.esDia29 && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                    Día 29 · ñoquis
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4">Total estimado a producir</p>
              <p className="text-3xl font-bold text-gray-800 tabular-nums">
                {prediccion.totalUnidadesPredichas} <span className="text-base font-medium text-gray-400">kg</span>
              </p>
            </div>

            {/* Clima */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <ClimaIcono clima={prediccion.clima} />
                <div>
                  <p className="text-xs text-gray-500">Pronóstico (Open-Meteo)</p>
                  <p className="text-sm font-semibold text-gray-800">{prediccion.clima.descripcion}</p>
                </div>
              </div>
              {prediccion.clima.disponible ? (
                <div className="flex gap-4 mt-4 text-sm">
                  {prediccion.clima.tempMaxC != null && (
                    <div>
                      <p className="text-xs text-gray-400">Máx</p>
                      <p className="font-semibold text-gray-700 tabular-nums">{Math.round(prediccion.clima.tempMaxC)}°C</p>
                    </div>
                  )}
                  {prediccion.clima.precipMm != null && (
                    <div>
                      <p className="text-xs text-gray-400">Lluvia</p>
                      <p className="font-semibold text-gray-700 tabular-nums">{prediccion.clima.precipMm.toFixed(1)} mm</p>
                    </div>
                  )}
                  {prediccion.clima.esFrioOLluvioso && (
                    <div className="ml-auto self-center">
                      <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
                        Impulsa demanda
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-4 italic">
                  El pronóstico solo está disponible para los próximos ~16 días.
                </p>
              )}
            </div>

            {/* Precisión */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                <p className="text-xs text-gray-500">Precisión del modelo (validado)</p>
              </div>
              {backtest ? (
                <>
                  <p className="text-3xl font-bold text-emerald-600 tabular-nums mt-2">
                    {backtest.precision}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    En las últimas {backtest.diasEvaluados} jornadas, la estimación se acercó en promedio a lo realmente vendido con este nivel de acierto.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-2">Calculando…</p>
              )}
            </div>
          </div>

          {/* Gráfico de tendencia histórica */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Tendencia de ventas · últimos 90 días</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUnidades" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={6} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(value) => [`${value} kg`, 'Vendido']}
                  />
                  <Area type="monotone" dataKey="unidades" stroke="#3b82f6" strokeWidth={2} fill="url(#colorUnidades)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Backtest: real vs predicho */}
          {backtest && backtestChart.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-800">Validación del modelo · predicción vs. real</h3>
                <span className="text-xs text-gray-400">
                  {formatFechaCorta(backtest.testDesde)} – {formatFechaCorta(backtest.testHasta)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                El modelo se entrena con datos previos y se contrasta contra ventas reales no vistas (holdout).
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="real" name="Real" stroke="#0f172a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="predicho" name="Predicho" stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recomendación IA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-violet-50 text-violet-500 p-2 rounded-lg">
                <Sparkles size={18} />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">Recomendación con IA</h3>
                <p className="text-xs text-gray-400">Un resumen accionable de cuánto conviene producir y por qué.</p>
              </div>
              <button
                type="button"
                onClick={() => void generarRecomendacion()}
                disabled={recomendacionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition disabled:opacity-60"
              >
                {recomendacionLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {prediccion.recomendacionIa ? 'Regenerar' : 'Generar recomendación'}
              </button>
            </div>

            {recomendacionLoading && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 flex items-start gap-3 text-sm text-violet-800">
                <Loader2 size={18} className="animate-spin shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Generando recomendación…</p>
                  <p className="text-xs text-violet-600 mt-0.5">Puede tardar entre 5 y 15 segundos.</p>
                </div>
              </div>
            )}

            {recomendacionError && (
              <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <p>{recomendacionError}</p>
                <button type="button" onClick={dismissRecomendacionError} className="text-red-400 hover:text-red-600 shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}

            {!recomendacionLoading && prediccion.recomendacionIa && (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                {prediccion.recomendacionIa}
              </div>
            )}

            {!recomendacionLoading && !prediccion.recomendacionIa && !recomendacionError && (
              <p className="text-sm text-gray-400 italic">
                Generá una recomendación para obtener una sugerencia redactada de cuánto producir.
              </p>
            )}
          </div>

          {/* Tabla por producto */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800">Demanda estimada por producto</h3>
              <span className="ml-auto text-xs text-gray-400">
                {prediccion.rango.totalVentas} ventas · {prediccion.rango.diasAnalizados} días
              </span>
            </div>

            {prediccion.productos.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No hay ventas históricas suficientes para estimar la demanda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-5 py-3 font-medium">Producto</th>
                      <th className="px-5 py-3 font-medium text-right">Prom. diario</th>
                      <th className="px-5 py-3 font-medium text-right">Base día</th>
                      <th className="px-5 py-3 font-medium">Factores</th>
                      <th className="px-5 py-3 font-medium text-right">Predicción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {prediccion.productos.map((p) => (
                      <tr key={p.productoId} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{p.nombre}</td>
                        <td className="px-5 py-3 text-right text-gray-500 tabular-nums">{p.promedioDiario}</td>
                        <td className="px-5 py-3 text-right text-gray-500 tabular-nums">{p.promedioDiaTipo}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.factores.map((f, i) => (
                              <span key={i} className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-800 tabular-nums">
                          {p.prediccionUnidades} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
