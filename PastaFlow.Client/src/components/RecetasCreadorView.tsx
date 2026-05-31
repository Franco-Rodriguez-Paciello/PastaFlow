import { useEffect, useRef, useState } from 'react';
import type { IngredienteDto, ProductoDto } from '../types/api.types';
import { getIngredientes } from '../services/ingredienteService';
import { asignarReceta, getProductos, getRecetaByProducto, registrarProducto } from '../services/productoService';
import { useRecipeStore } from '../store/recipeStore';

export default function RecetasCreadorView() {
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<IngredienteDto[]>([]);
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [nombreReceta, setNombreReceta] = useState<string>('');
  const [productoId, setProductoId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');
  const [loadingReceta, setLoadingReceta] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [modo, setModo] = useState<'existente' | 'nuevo'>('existente');
  const [descripcion, setDescripcion] = useState<string>('');
  const [precioVenta, setPrecioVenta] = useState<string>('');
  const [stockInicial, setStockInicial] = useState<string>('');
  const [activoVentaOnline, setActivoVentaOnline] = useState<boolean>(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const {
    ingredientesSeleccionados,
    agregarIngrediente,
    removerIngrediente,
    actualizarCantidad,
    limpiarReceta,
    cargarRecetaExistente,
  } = useRecipeStore();

  function handleModoChange(nuevoModo: 'existente' | 'nuevo'): void {
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    setProductoId('');
    setNombreReceta('');
    setDescripcion('');
    setPrecioVenta('');
    setStockInicial('');
    setActivoVentaOnline(false);
    limpiarReceta();
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleProductoChange(id: string): Promise<void> {
    setProductoId(id);
    if (!id) {
      limpiarReceta();
      return;
    }
    setLoadingReceta(true);
    try {
      const receta = await getRecetaByProducto(Number(id));
      if (receta.length === 0) {
        limpiarReceta();
      } else {
        cargarRecetaExistente(
          receta.map((item) => ({
            ingrediente: {
              id: item.ingredienteId,
              nombre: item.nombre,
              costoActual: item.costoActual,
              unidadMedida: item.unidadMedida,
              ultimaActualizacionCosto: '',
            } satisfies IngredienteDto,
            cantidad: Number(item.cantidadRequerida),
          }))
        );
      }
    } catch {
      limpiarReceta();
    } finally {
      setLoadingReceta(false);
    }
  }

  async function handleGuardar(): Promise<void> {
    if (ingredientesSeleccionados.length === 0) {
      setSaveError('La receta no tiene ningún insumo.');
      return;
    }
    if (modo === 'nuevo') {
      if (!nombreReceta.trim()) { setSaveError('Ingresá el nombre del producto.'); return; }
      const precio = parseFloat(precioVenta);
      if (isNaN(precio) || precio < 0) { setSaveError('Ingresá un precio de venta válido.'); return; }
      if (!descripcion.trim()) { setSaveError('Ingresá una descripción para el producto.'); return; }
    } else {
      if (!productoId) { setSaveError('Seleccioná un producto antes de guardar.'); return; }
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      let idFinal = Number(productoId);
      if (modo === 'nuevo') {
        idFinal = await registrarProducto({
          nombre: nombreReceta.trim(),
          descripcion: descripcion.trim(),
          precioVenta: parseFloat(precioVenta),
          stockInicial: stockInicial !== '' ? parseFloat(stockInicial) : 0,
          activoParaTiendaOnline: activoVentaOnline,
          tipoProducto: 1, // Compuesto
        });
        setProductoId(String(idFinal));
        const prods = await getProductos();
        setProductos(prods);
      }
      await asignarReceta(
        idFinal,
        ingredientesSeleccionados.map((item) => ({
          ingredienteId: item.ingrediente.id,
          cantidadRequerida: item.cantidad,
        }))
      );
      setSaveSuccess(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la receta.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function cargarDatos(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const [ings, prods] = await Promise.all([
          getIngredientes(),
          getProductos(),
        ]);
        setIngredientesDisponibles(ings);
        setProductos(prods);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos.');
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };  }, []);

  const costoTotal = ingredientesSeleccionados.reduce(
    (acc, item) => acc + item.cantidad * item.ingrediente.costoActual,
    0
  );

  const tieneItemsEnCero = ingredientesSeleccionados.some((item) => item.cantidad <= 0);

  const ingredientesFiltrados = ingredientesDisponibles.filter((ing) =>
    ing.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const idsSeleccionados = new Set(ingredientesSeleccionados.map((i) => i.ingrediente.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Cabecera del formulario ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Datos de la Receta
        </h3>

        {/* Toggle de modo + Switch Venta Online */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => handleModoChange('existente')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                modo === 'existente'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Producto existente
            </button>
            <button
              onClick={() => handleModoChange('nuevo')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                modo === 'nuevo'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nuevo producto
            </button>
          </div>

          {modo === 'nuevo' && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={activoVentaOnline}
                onClick={() => setActivoVentaOnline((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
                  activoVentaOnline ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    activoVentaOnline ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-600">Activo venta online</span>
            </label>
          )}
        </div>

        {modo === 'existente' ? (
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccioná el producto a editar
            </label>
            <select
              value={productoId}
              onChange={(e) => handleProductoChange(e.target.value)}
              disabled={loadingReceta}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition disabled:opacity-60 disabled:cursor-wait"
            >
              <option value="">— Seleccioná un producto —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            {productoId && (
              <p className="mt-1.5 text-xs text-gray-400">
                La receta existente se cargó automáticamente para editar.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fila 1: Nombre (2/3) + Precio de Venta (1/3) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la nueva pasta
              </label>
              <input
                type="text"
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                placeholder="Ej: Sorrentinos Gourmet de Ricota"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
              </div>
            </div>
            {/* Fila 2: Descripción (2/3) + Stock Inicial (1/3) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describí brevemente el producto, sus ingredientes principales o su presentación..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock inicial
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockInicial}
                  onChange={(e) => setStockInicial(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                />
                <span className="text-sm text-gray-400 shrink-0">uds.</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Opcional. Por defecto 0.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Dashboard de dos columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Columna Izquierda: Insumos Disponibles ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">
              Insumos Disponibles
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {ingredientesDisponibles.length} insumos en stock
            </p>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar insumo..."
              className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
            />
          </div>
          <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-50 p-2">
            {ingredientesFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin resultados.</p>
            ) : (
              ingredientesFiltrados.map((ing) => {
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
                      onClick={() => agregarIngrediente(ing)}
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

        {/* ── Columna Derecha: Borrador de Receta ── */}
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
                <div key={ingrediente.id} className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                  cantidad <= 0 ? 'bg-red-50' : 'hover:bg-gray-50'
                }`}>
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

          {/* ── Costo Total ── */}
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
              <p className="text-xs text-amber-500 mt-1">
                Algunos insumos tienen cantidad 0.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de acción ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="flex-1">
          {saveError && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Receta guardada correctamente.
            </p>
          )}
        </div>
        <button
          onClick={handleGuardar}
          disabled={
            saving ||
            loadingReceta ||
            ingredientesSeleccionados.length === 0 ||
            tieneItemsEnCero ||
            (modo === 'existente' && !productoId) ||
            (modo === 'nuevo' && (!nombreReceta.trim() || !descripcion.trim() || !precioVenta))
          }
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar Receta
            </>
          )}
        </button>
      </div>
    </div>
  );
}
