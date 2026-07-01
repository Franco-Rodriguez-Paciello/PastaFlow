import { useEffect } from 'react';
import { PackagePlus, Sparkles, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { useComprasStore } from '../stores/useComprasStore';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';
import RegistrarCompraModal from './compras/RegistrarCompraModal';
import CompraDetalleModal from './compras/CompraDetalleModal';
import { formatCurrency } from '../lib/formatters';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ComprasView() {
  const {
    compras,
    loading,
    error,
    successMessage,
    infoMessage,
    sugerenciasLoading,
    fetchCompras,
    abrirRegistroVacio,
    cargarSugerencias,
    verDetalle,
    dismissSuccess,
    dismissInfo,
  } = useComprasStore();

  useEffect(() => {
    void fetchCompras();
  }, [fetchCompras]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingreso de mercadería"
        subtitle="Registrá compras de insumos, actualizá stock y costos en un solo paso."
        icon={<PackagePlus size={22} />}
        iconClassName="bg-emerald-50 text-emerald-600"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void cargarSugerencias()}
              disabled={sugerenciasLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {sugerenciasLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {sugerenciasLoading ? 'Buscando…' : 'Cargar sugerencias'}
            </button>
            <button
              type="button"
              onClick={abrirRegistroVacio}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              <PackagePlus size={15} />
              Nuevo ingreso
            </button>
          </div>
        }
      />

      {infoMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-900">
          <div className="flex items-start gap-2">
            <Info size={18} className="shrink-0 mt-0.5 text-sky-600" />
            <p>{infoMessage}</p>
          </div>
          <button type="button" onClick={dismissInfo} className="text-sky-500 hover:text-sky-700 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
          <button type="button" onClick={dismissSuccess} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <ErrorState message={error} onRetry={() => void fetchCompras()} retrying={loading} />
      )}

      {loading && compras.length === 0 ? (
        <LoadingState label="Cargando ingresos…" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {compras.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">
              Todavía no hay ingresos registrados. Usá &quot;Nuevo ingreso&quot; o vení desde la hoja de producción.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Proveedor</th>
                    <th className="px-4 py-3 text-left">Factura</th>
                    <th className="px-4 py-3 text-right">Líneas</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {compras.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-700">{formatFecha(c.fechaIngreso)}</td>
                      <td className="px-4 py-3 text-gray-800">{c.proveedorNombre ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.numeroFactura ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{c.cantidadLineas}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(c.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void verDetalle(c.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <RegistrarCompraModal />
      <CompraDetalleModal />
    </div>
  );
}
