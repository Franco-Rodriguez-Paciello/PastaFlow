import { useRecetasStore } from '../../stores/useRecetasStore';

export default function RecetaFormCabecera() {
  const {
    modo,
    productoId,
    productos,
    nuevoForm,
    loadingReceta,
    setModo,
    setNuevoFormField,
    toggleActivoVentaOnline,
    selectProducto,
  } = useRecetasStore();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Datos de la Receta
      </h3>

      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setModo('existente')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              modo === 'existente'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Producto existente
          </button>
          <button
            onClick={() => setModo('nuevo')}
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
              aria-checked={nuevoForm.activoVentaOnline}
              onClick={toggleActivoVentaOnline}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${
                nuevoForm.activoVentaOnline ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  nuevoForm.activoVentaOnline ? 'translate-x-[18px]' : 'translate-x-[3px]'
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
            onChange={(e) => void selectProducto(e.target.value)}
            disabled={loadingReceta}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition disabled:opacity-60 disabled:cursor-wait"
          >
            <option value="">— Seleccioná un producto —</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la nueva pasta
            </label>
            <input
              type="text"
              value={nuevoForm.nombre}
              onChange={(e) => setNuevoFormField('nombre', e.target.value)}
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
                value={nuevoForm.precioVenta}
                onChange={(e) => setNuevoFormField('precioVenta', e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={nuevoForm.descripcion}
              onChange={(e) => setNuevoFormField('descripcion', e.target.value)}
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
                value={nuevoForm.stockInicial}
                onChange={(e) => setNuevoFormField('stockInicial', e.target.value)}
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
  );
}
