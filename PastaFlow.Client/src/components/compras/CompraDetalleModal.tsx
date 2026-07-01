import { Loader2, X } from 'lucide-react';
import { useComprasStore } from '../../stores/useComprasStore';
import { fmt, formatCurrency } from '../../lib/formatters';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CompraDetalleModal() {
  const { detalleOpen, detalleLoading, compraDetalle, cerrarDetalle } = useComprasStore();

  if (!detalleOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50"
      role="dialog"
      aria-modal="true"
      onClick={cerrarDetalle}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Detalle del ingreso</h3>
          <button type="button" onClick={cerrarDetalle} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          {detalleLoading || !compraDetalle ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="text-gray-500">Fecha:</span> {formatFecha(compraDetalle.fechaIngreso)}</p>
                <p><span className="text-gray-500">Proveedor:</span> {compraDetalle.proveedorNombre ?? '—'}</p>
                <p><span className="text-gray-500">Factura:</span> {compraDetalle.numeroFactura ?? '—'}</p>
                {compraDetalle.observaciones && (
                  <p><span className="text-gray-500">Notas:</span> {compraDetalle.observaciones}</p>
                )}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 font-medium">Insumo</th>
                    <th className="text-right py-2 font-medium">Cant.</th>
                    <th className="text-right py-2 font-medium">P. unit.</th>
                    <th className="text-right py-2 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {compraDetalle.lineas.map((l) => (
                    <tr key={l.ingredienteId}>
                      <td className="py-2 text-gray-800">{l.nombreIngrediente}</td>
                      <td className="py-2 text-right">{fmt(l.cantidad)}</td>
                      <td className="py-2 text-right">{formatCurrency(l.precioUnitario)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(l.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-right text-base font-bold text-gray-900">
                Total: {formatCurrency(compraDetalle.total)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
