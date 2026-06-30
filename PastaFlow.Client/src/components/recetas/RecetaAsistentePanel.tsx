import { useState } from 'react';
import { Sparkles, Loader2, X, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import type { IngredientePropuestoSugeridoDto } from '../../types/api.types';
import { useRecetasStore } from '../../stores/useRecetasStore';

const UNIDADES = ['Kilogramo', 'Litro', 'Unidad', 'Docena'] as const;

function formatMoney(value: number): string {
  return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RecetaAsistentePanel() {
  const {
    asistenteBrief,
    asistenteCostoMaximo,
    asistentePrecioObjetivo,
    sugerencia,
    sugerenciaLoading,
    sugerenciaError,
    creandoInsumoClave,
    setAsistenteBrief,
    setAsistenteCostoMaximo,
    setAsistentePrecioObjetivo,
    solicitarSugerenciaReceta,
    descartarSugerencia,
    aplicarSugerenciaReceta,
    crearInsumoDesdePropuesta,
    dismissSugerenciaError,
  } = useRecetasStore();

  const [propuestaEnEdicion, setPropuestaEnEdicion] = useState<IngredientePropuestoSugeridoDto | null>(null);
  const [nombreInsumo, setNombreInsumo] = useState('');
  const [unidadInsumo, setUnidadInsumo] = useState<string>('Kilogramo');
  const [costoInsumo, setCostoInsumo] = useState('');

  const abrirCrearInsumo = (propuesta: IngredientePropuestoSugeridoDto) => {
    setPropuestaEnEdicion(propuesta);
    setNombreInsumo(propuesta.nombreSugerido);
    setUnidadInsumo(propuesta.unidadMedida);
    setCostoInsumo(String(propuesta.costoUnitarioEstimado));
  };

  const cerrarCrearInsumo = () => {
    setPropuestaEnEdicion(null);
  };

  const confirmarCrearInsumo = async () => {
    if (!propuestaEnEdicion) return;
    const costo = parseFloat(costoInsumo);
    if (!nombreInsumo.trim() || isNaN(costo) || costo < 0) return;

    await crearInsumoDesdePropuesta(propuestaEnEdicion.clavePropuesta, {
      nombre: nombreInsumo.trim(),
      unidadMedida: unidadInsumo,
      costoInicial: costo,
    });
    cerrarCrearInsumo();
  };

  const puedeAplicar = sugerencia && !sugerencia.costos.tieneIngredientesPendientes;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="bg-violet-50 text-violet-500 p-2.5 rounded-lg shrink-0">
            <Sparkles size={20} strokeWidth={1.8} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-800">Asistente de Recetas</h3>
              <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                I+D con IA
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-lg">
              Describí la pasta que querés desarrollar. La IA sugiere ingredientes por kg;
              los insumos nuevos deben darse de alta antes de aplicar al formulario.
            </p>
          </div>
        </div>

        {sugerencia && (
          <button
            type="button"
            onClick={descartarSugerencia}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 shrink-0"
          >
            <X size={14} />
            Descartar sugerencia
          </button>
        )}
      </div>

      {!sugerencia ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ¿Qué querés desarrollar?
            </label>
            <textarea
              rows={3}
              value={asistenteBrief}
              onChange={(e) => setAsistenteBrief(e.target.value)}
              disabled={sugerenciaLoading}
              placeholder="Ej: Sorrentinos premium de cordero con masa de huevo, costo de materia prima no mayor a $1200 por kg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Costo máx. por kg (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={asistenteCostoMaximo}
                  onChange={(e) => setAsistenteCostoMaximo(e.target.value)}
                  disabled={sugerenciaLoading}
                  placeholder="1200"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Precio venta objetivo / kg (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={asistentePrecioObjetivo}
                  onChange={(e) => setAsistentePrecioObjetivo(e.target.value)}
                  disabled={sugerenciaLoading}
                  placeholder="3500"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>

          {sugerenciaError && (
            <div className="flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <p>{sugerenciaError}</p>
              <button type="button" onClick={dismissSugerenciaError} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => void solicitarSugerenciaReceta()}
            disabled={sugerenciaLoading || !asistenteBrief.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sugerenciaLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando sugerencia…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Sugerir receta
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-4 py-3">
            <h4 className="font-semibold text-gray-800">{sugerencia.nombreProductoSugerido}</h4>
            {sugerencia.descripcion && (
              <p className="text-sm text-gray-600 mt-1">{sugerencia.descripcion}</p>
            )}
            {sugerencia.notasElaboracion && (
              <p className="text-xs text-gray-500 mt-2 italic">{sugerencia.notasElaboracion}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="text-xs text-emerald-700 font-medium">Costo confirmado / kg</p>
              <p className="text-lg font-bold text-emerald-800 tabular-nums">
                {formatMoney(sugerencia.costos.costoConfirmadoPorKg)}
              </p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
              <p className="text-xs text-amber-700 font-medium">Estimado pendiente / kg</p>
              <p className="text-lg font-bold text-amber-800 tabular-nums">
                {formatMoney(sugerencia.costos.costoEstimadoAdicionalPorKg)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500 font-medium">Total proyectado / kg</p>
              <p className={`text-lg font-bold tabular-nums ${
                sugerencia.costos.superaCostoMaximo ? 'text-red-600' : 'text-gray-800'
              }`}>
                {formatMoney(sugerencia.costos.costoTotalProyectadoPorKg)}
              </p>
              {sugerencia.costos.margenProyectadoPorKg !== null && (
                <p className={`text-xs mt-0.5 ${
                  sugerencia.costos.margenProyectadoPorKg < 0 ? 'text-red-500' : 'text-emerald-600'
                }`}>
                  Margen proyectado: {formatMoney(sugerencia.costos.margenProyectadoPorKg)}
                </p>
              )}
            </div>
          </div>

          {sugerencia.advertencias.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
              {sugerencia.advertencias.map((adv, i) => (
                <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  {adv}
                </p>
              ))}
            </div>
          )}

          {sugerencia.ingredientesExistentes.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Insumos en catálogo
              </h5>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {sugerencia.ingredientesExistentes.map((item) => (
                  <li key={item.ingredienteId} className="flex items-center justify-between px-4 py-2.5 bg-white text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span className="font-medium text-gray-800 truncate">{item.nombre}</span>
                      <span className="text-gray-400 text-xs shrink-0">
                        {item.cantidadPorKg} {item.unidadMedida}
                      </span>
                    </div>
                    <span className="text-emerald-700 font-semibold tabular-nums shrink-0 ml-2">
                      {formatMoney(item.costoParcial)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sugerencia.ingredientesPropuestos.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Insumos nuevos sugeridos
              </h5>
              <ul className="divide-y divide-amber-100 border border-amber-200 rounded-lg overflow-hidden">
                {sugerencia.ingredientesPropuestos.map((item) => (
                  <li key={item.clavePropuesta} className="px-4 py-3 bg-amber-50/40 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800">{item.nombreSugerido}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.cantidadPorKg} {item.unidadMedida} · ~{formatMoney(item.costoParcialEstimado)} / kg
                        </p>
                        {item.motivo && (
                          <p className="text-xs text-amber-700 mt-1">{item.motivo}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirCrearInsumo(item)}
                        disabled={creandoInsumoClave === item.clavePropuesta}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition disabled:opacity-60 shrink-0"
                      >
                        {creandoInsumoClave === item.clavePropuesta ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        Crear insumo
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={aplicarSugerenciaReceta}
              disabled={!puedeAplicar}
              title={
                !puedeAplicar
                  ? 'Creá primero todos los insumos nuevos sugeridos'
                  : undefined
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar al formulario
            </button>
            <button
              type="button"
              onClick={() => void solicitarSugerenciaReceta()}
              disabled={sugerenciaLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {sugerenciaLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Regenerar
            </button>
          </div>
        </div>
      )}

      {propuestaEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h4 className="text-base font-semibold text-gray-800">Dar de alta insumo</h4>
            <p className="text-xs text-gray-500">
              Revisá el nombre y costo antes de crear. Luego podés ajustarlo en Insumos.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombreInsumo}
                  onChange={(e) => setNombreInsumo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                  <select
                    value={unidadInsumo}
                    onChange={(e) => setUnidadInsumo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo inicial</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costoInsumo}
                    onChange={(e) => setCostoInsumo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarCrearInsumo}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarCrearInsumo()}
                disabled={creandoInsumoClave !== null}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
              >
                Crear y vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
