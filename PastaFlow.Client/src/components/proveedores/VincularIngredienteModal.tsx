import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useProveedoresStore } from '../../stores/useProveedoresStore';

export default function VincularIngredienteModal() {
  const { ingredientes, vincularProveedorId, proveedores, saving, closeVincularModal, vincularInsumo } =
    useProveedoresStore();

  const proveedor = proveedores.find((p) => p.id === vincularProveedorId);
  const vinculados = new Set(proveedor?.ingredientes.map((i) => i.ingredienteId) ?? []);
  const disponibles = ingredientes.filter((i) => !vinculados.has(i.id));

  const [ingredienteId, setIngredienteId] = useState(disponibles[0]?.id ?? 0);
  const [precioReferencia, setPrecioReferencia] = useState('');
  const [codigoProveedor, setCodigoProveedor] = useState('');
  const [esPreferido, setEsPreferido] = useState(false);
  const [tiempoEntregaDias, setTiempoEntregaDias] = useState('');

  const selectedIngrediente = ingredientes.find((i) => i.id === ingredienteId);

  const handleIngredienteChange = (id: number) => {
    setIngredienteId(id);
    const ing = ingredientes.find((i) => i.id === id);
    if (ing) setPrecioReferencia(String(ing.costoActual));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precio = parseFloat(precioReferencia);
    if (!ingredienteId || Number.isNaN(precio)) return;

    void vincularInsumo({
      ingredienteId,
      precioReferencia: precio,
      codigoProveedor: codigoProveedor.trim() || undefined,
      esPreferido,
      tiempoEntregaDias: tiempoEntregaDias ? parseInt(tiempoEntregaDias, 10) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Vincular insumo</h3>
            {proveedor && <p className="text-xs text-gray-400 mt-0.5">{proveedor.nombre}</p>}
          </div>
          <button type="button" onClick={closeVincularModal} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {disponibles.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            Todos los insumos ya están vinculados a este proveedor.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Insumo *</label>
              <select
                value={ingredienteId}
                onChange={(e) => handleIngredienteChange(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {disponibles.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} ({i.unidadMedida})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio referencia *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioReferencia || (selectedIngrediente?.costoActual ?? '')}
                onChange={(e) => setPrecioReferencia(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código proveedor</label>
              <input
                type="text"
                value={codigoProveedor}
                onChange={(e) => setCodigoProveedor(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo entrega (días)</label>
              <input
                type="number"
                min="0"
                value={tiempoEntregaDias}
                onChange={(e) => setTiempoEntregaDias(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={esPreferido}
                onChange={(e) => setEsPreferido(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Proveedor preferido para este insumo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeVincularModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Vincular
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
