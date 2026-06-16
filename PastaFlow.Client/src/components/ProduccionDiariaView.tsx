import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildProduccionDto,
  selectPreviewVigente,
  selectProducto,
  useProduccionStore,
} from '../stores/useProduccionStore';
import ProduccionAlerts from './produccion/ProduccionAlerts';
import InsumosTabla from './produccion/InsumosTabla';
import { fmt, formatCurrency } from '../lib/formatters';

const inputBase =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400';
const inputNumber = inputBase + ' pr-[5.5rem]';

export default function ProduccionDiariaView() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Admin';

  const {
    productos,
    loading,
    loadError,
    form,
    preview,
    insumosTrasProduccion,
    verifying,
    submitting,
    fieldErrors,
    fetchProductos,
    verificarProduccion,
    confirmarProduccion,
    setFormField,
  } = useProduccionStore();

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const dto = useMemo(() => buildProduccionDto(form), [form]);
  const productoSeleccionado = useMemo(
    () => selectProducto(productos, form.productoId),
    [productos, form.productoId],
  );
  const previewVigente = useMemo(
    () => selectPreviewVigente(preview, dto),
    [preview, dto],
  );

  const stockProyectadoProducto = productoSeleccionado
    ? productoSeleccionado.stockActual + dto.cantidadProducida
    : null;

  const formBusy = submitting || verifying;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = e.target;
    setFormField(name as 'productoId' | 'cantidad', value);
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    verificarProduccion(dto);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    confirmarProduccion(dto);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Registrar Producción Diaria
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Verificá el impacto en stock y costos antes de confirmar. Los insumos se
            descontarán solo al registrar la producción.
          </p>
        </div>

        <ProduccionAlerts />

        <form noValidate className="space-y-5">
          <div>
            <label htmlFor="productoId" className="mb-1.5 block text-sm font-medium text-gray-700">
              Producto fabricado
            </label>
            {loading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Cargando datos…
              </div>
            ) : loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {loadError}
              </p>
            ) : (
              <select
                id="productoId"
                name="productoId"
                value={form.productoId}
                onChange={handleChange}
                disabled={formBusy}
                className={`${inputBase}${fieldErrors.productoId ? ' border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}`}
              >
                <option value="">— Seleccioná un producto —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}
            {fieldErrors.productoId && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.productoId[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="cantidad" className="mb-1.5 block text-sm font-medium text-gray-700">
              Cantidad producida
            </label>
            <div className="relative">
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ej: 10"
                value={form.cantidad}
                onChange={handleChange}
                disabled={formBusy}
                className={`${inputNumber}${fieldErrors.cantidadProducida ? ' border-red-400 focus:border-red-500 focus:ring-red-500/30' : ''}`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-lg border-l border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-500 select-none">
                unidades
              </span>
            </div>
            {fieldErrors.cantidadProducida && (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.cantidadProducida[0]}</p>
            )}
          </div>

          <hr className="border-gray-100" />

          <button
            type="button"
            onClick={handleVerify}
            disabled={formBusy || loading || !!loadError}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verificando…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verificar producción
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={formBusy || loading || !!loadError || !previewVigente || !preview?.stockSuficiente}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Registrando…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Registrar y descontar stock
              </>
            )}
          </button>

          {!previewVigente && dto.productoId > 0 && dto.cantidadProducida > 0 && (
            <p className="text-xs text-center text-gray-400">
              Verificá la producción para habilitar el registro.
            </p>
          )}
        </form>
      </div>

      {productoSeleccionado && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Stock del producto terminado
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Stock actual</p>
                <p className="text-lg font-bold text-gray-800">
                  {fmt(productoSeleccionado.stockActual)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>

              <div className={`rounded-lg border px-4 py-3 text-center ${
                previewVigente && dto.cantidadProducida > 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Stock proyectado</p>
                <p className={`text-lg font-bold ${previewVigente && dto.cantidadProducida > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                  {previewVigente && dto.cantidadProducida > 0
                    ? fmt(stockProyectadoProducto!)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {previewVigente && isAdmin && preview && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Costos estimados
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Costo total</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(preview.costoTotal)}</p>
                </div>
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Precio venta / ud.</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(preview.precioVentaUnitario)}</p>
                </div>
                <div className={`rounded-lg border px-4 py-3 text-center ${
                  preview.margenEstimado >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Margen estimado</p>
                  <p className={`text-base font-bold ${
                    preview.margenEstimado >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {formatCurrency(preview.margenEstimado)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <InsumosTabla
            producto={productoSeleccionado}
            previewVigente={previewVigente}
            preview={preview}
            insumosTrasProduccion={insumosTrasProduccion}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  );
}
