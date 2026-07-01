import { useEffect } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { useComprasStore } from '../../stores/useComprasStore';
import { fmt } from '../../lib/formatters';

export default function RegistrarCompraModal() {
  const {
    modalOpen,
    form,
    ingredientes,
    proveedores,
    submitting,
    submitError,
    sugerenciasCargadas,
    cerrarModal,
    setFormField,
    setLineaField,
    agregarLinea,
    quitarLinea,
    submitCompra,
  } = useComprasStore();

  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) cerrarModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, submitting, cerrarModal]);

  if (!modalOpen) return null;

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitCompra();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50"
      role="dialog"
      aria-modal="true"
      onClick={submitting ? undefined : cerrarModal}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Registrar ingreso de mercadería</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {sugerenciasCargadas != null && sugerenciasCargadas > 0
                ? `Se cargaron ${sugerenciasCargadas} insumo${sugerenciasCargadas !== 1 ? 's' : ''} sugerido${sugerenciasCargadas !== 1 ? 's' : ''}. Revisá cantidades y precios antes de confirmar.`
                : 'Sumá stock de insumos y, si querés, actualizá el costo de referencia.'}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarModal}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                <select
                  value={form.proveedorId}
                  onChange={(e) => setFormField('proveedorId', e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                >
                  <option value="">— Sin proveedor —</option>
                  {proveedores.filter((p) => p.activo).map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nº factura / remito</label>
                <input
                  type="text"
                  value={form.numeroFactura}
                  onChange={(e) => setFormField('numeroFactura', e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
              <input
                type="text"
                value={form.observaciones}
                onChange={(e) => setFormField('observaciones', e.target.value)}
                className={inputClass}
                disabled={submitting}
                placeholder="Opcional"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.actualizarCosto}
                onChange={(e) => setFormField('actualizarCosto', e.target.checked)}
                disabled={submitting}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Actualizar costo del insumo con el precio de esta compra
            </label>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Líneas</p>
                <button
                  type="button"
                  onClick={agregarLinea}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus size={14} /> Agregar línea
                </button>
              </div>

              <div className="space-y-3">
                {form.lineas.map((linea, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Insumo</label>
                      <select
                        value={linea.ingredienteId}
                        onChange={(e) => setLineaField(index, 'ingredienteId', e.target.value)}
                        className={inputClass}
                        disabled={submitting}
                        required={index === 0}
                      >
                        <option value="">— Seleccionar —</option>
                        {ingredientes.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.nombre} (stock: {fmt(i.stockActual)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={linea.cantidad}
                        onChange={(e) => setLineaField(index, 'cantidad', e.target.value)}
                        className={inputClass}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Precio / ud.</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.precioUnitario}
                        onChange={(e) => setLineaField(index, 'precioUnitario', e.target.value)}
                        className={inputClass}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => quitarLinea(index)}
                        disabled={submitting || form.lineas.length === 1}
                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                        aria-label="Quitar línea"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {submitError}
              </p>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Registrando…
                </>
              ) : (
                'Confirmar ingreso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
