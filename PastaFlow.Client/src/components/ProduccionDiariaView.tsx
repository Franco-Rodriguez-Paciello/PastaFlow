import { useEffect, useMemo, useRef, useState } from 'react';
import type { DetalleCostoIngredienteDto, OrdenProduccionDto, ProductoDto } from '../types/api.types';
import { getProductos } from '../services/productoService';
import {
  getProduccionErrorMessage,
  isProduccionConcurrencyError,
  isProduccionDomainError,
  mirrorProductionStockUpdate,
  registrarProduccion,
  verificarOrdenProduccion,
} from '../services/produccionService';
import { ApiError } from '../lib/apiError';
import { useAuth } from '../context/AuthContext';

type FormState = {
  productoId: string;
  cantidad: string;
};

const INITIAL_FORM: FormState = { productoId: '', cantidad: '' };

function fmt(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function stockColor(stockDespues: number, stockActual: number) {
  if (stockDespues < 0) return 'text-red-600 font-semibold';
  if (stockDespues < stockActual * 0.2) return 'text-amber-600 font-semibold';
  return 'text-green-600';
}

export default function ProduccionDiariaView() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Admin';

  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [preview, setPreview] = useState<OrdenProduccionDto | null>(null);
  const [insumosTrasProduccion, setInsumosTrasProduccion] = useState<DetalleCostoIngredienteDto[] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [concurrencyError, setConcurrencyError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getProductos()
      .then((prods) => {
        if (cancelled) return;
        setProductos(prods.filter((p) => p.tipoProducto === 'Compuesto'));
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Error al cargar datos');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, []);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === Number(form.productoId)) ?? null,
    [productos, form.productoId],
  );

  const cantidad = Number(form.cantidad) || 0;
  const productoId = Number(form.productoId) || 0;

  const previewVigente = useMemo(() => {
    if (!preview) return false;
    return preview.productoId === productoId && preview.cantidadProducida === cantidad;
  }, [preview, productoId, cantidad]);

  const stockProyectadoProducto = productoSeleccionado
    ? productoSeleccionado.stockActual + cantidad
    : null;

  function invalidatePreview() {
    setPreview(null);
    setInsumosTrasProduccion(null);
    setVerifyError(null);
    setDomainError(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    invalidatePreview();
    setSubmitError(null);
    setDomainError(null);
    setConcurrencyError(false);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  }

  function validateForm(): string | null {
    if (!productoId) return 'Seleccioná un producto para continuar.';
    if (!cantidad || cantidad <= 0) return 'La cantidad producida debe ser mayor a cero.';
    return null;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    setFieldErrors({});

    const validationError = validateForm();
    if (validationError) {
      setVerifyError(validationError);
      return;
    }

    setVerifying(true);
    try {
      const orden = await verificarOrdenProduccion({
        productoId,
        cantidadProducida: cantidad,
      });
      setInsumosTrasProduccion(null);
      setPreview(orden);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isValidation) {
          setFieldErrors(err.fieldErrors);
        } else if (isProduccionDomainError(err)) {
          setDomainError(getProduccionErrorMessage(err));
        } else {
          setVerifyError(getProduccionErrorMessage(err));
        }
      } else {
        setVerifyError(getProduccionErrorMessage(err));
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setDomainError(null);
    setFieldErrors({});
    setConcurrencyError(false);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    if (!previewVigente) {
      setSubmitError('Verificá la producción antes de registrar.');
      return;
    }

    if (!preview!.stockSuficiente) {
      setDomainError('No hay stock suficiente de insumos para registrar esta producción.');
      return;
    }

    const ordenConfirmada = preview!;
    setSubmitting(true);
    try {
      await registrarProduccion({ productoId, cantidadProducida: cantidad });

      const nombre = productoSeleccionado?.nombre ?? 'Producto';
      setSuccessMessage(
        `✓ ${nombre} — ${fmt(cantidad)} unidad${cantidad !== 1 ? 'es' : ''} registrada${cantidad !== 1 ? 's' : ''} con éxito. El stock de insumos fue descontado.`,
      );

      const mirrored = mirrorProductionStockUpdate(productos, ordenConfirmada);
      setProductos(mirrored.productos);
      setInsumosTrasProduccion(mirrored.detalleCostos);
      setPreview(null);

      setForm((prev) => ({ ...prev, cantidad: '' }));
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: unknown) {
      if (isProduccionConcurrencyError(err)) {
        setConcurrencyError(true);
        setForm((prev) => ({ ...prev, cantidad: '' }));
        setPreview(null);
        getProductos()
          .then((prods) => setProductos(prods.filter((p) => p.tipoProducto === 'Compuesto')))
          .catch(() => { /* silent */ });
      } else if (err instanceof ApiError && err.isValidation) {
        setFieldErrors(err.fieldErrors);
      } else if (isProduccionDomainError(err)) {
        setDomainError(getProduccionErrorMessage(err));
        setPreview(null);
        getProductos()
          .then((prods) => setProductos(prods.filter((p) => p.tipoProducto === 'Compuesto')))
          .catch(() => { /* silent */ });
      } else {
        setSubmitError(getProduccionErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400';
  const inputNumber = inputBase + ' pr-[5.5rem]';

  const detalleCostos = previewVigente ? preview!.detalleCostos : [];
  const insumosActualizados = insumosTrasProduccion;
  const formBusy = submitting || verifying;

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

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span className="mt-0.5 shrink-0 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {concurrencyError && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0 text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold">Los datos fueron modificados por otro usuario.</p>
              <p className="mt-0.5">La pantalla se actualizó automáticamente. Verificá de nuevo antes de registrar.</p>
            </div>
            <button
              type="button"
              onClick={() => setConcurrencyError(false)}
              className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {domainError && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            <span className="mt-0.5 shrink-0 text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-semibold">No se pudo completar la operación</p>
              <p className="mt-0.5">{domainError}</p>
            </div>
            <button
              type="button"
              onClick={() => setDomainError(null)}
              className="shrink-0 text-orange-500 hover:text-orange-700 transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {(verifyError || submitError) && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
            <span>{verifyError ?? submitError}</span>
          </div>
        )}

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

          {!previewVigente && productoId > 0 && cantidad > 0 && (
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
                previewVigente && cantidad > 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Stock proyectado</p>
                <p className={`text-lg font-bold ${previewVigente && cantidad > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                  {previewVigente && cantidad > 0
                    ? fmt(stockProyectadoProducto!)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {previewVigente && isAdmin && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Costos estimados
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Costo total</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(preview!.costoTotal)}</p>
                </div>
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Precio venta / ud.</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(preview!.precioVentaUnitario)}</p>
                </div>
                <div className={`rounded-lg border px-4 py-3 text-center ${
                  preview!.margenEstimado >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-xs text-gray-500 mb-1">Margen estimado</p>
                  <p className={`text-base font-bold ${
                    preview!.margenEstimado >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {formatCurrency(preview!.margenEstimado)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {productoSeleccionado.receta.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Insumos de la receta
                </p>
                {previewVigente && !preview!.stockSuficiente && (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600">
                    Stock insuficiente
                  </span>
                )}
                {previewVigente && preview!.stockSuficiente && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-600">
                    Stock OK
                  </span>
                )}
              </div>

              {!previewVigente && !insumosActualizados ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Verificá la producción para ver el impacto en insumos
                  {isAdmin ? ' y los costos' : ''}.
                </p>
              ) : previewVigente ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="pb-2 text-left font-medium">Insumo</th>
                        <th className="pb-2 text-right font-medium">Por unidad</th>
                        <th className="pb-2 text-right font-medium">A descontar</th>
                        <th className="pb-2 text-right font-medium">Stock actual</th>
                        <th className="pb-2 text-right font-medium">Stock tras prod.</th>
                        {isAdmin && (
                          <th className="pb-2 text-right font-medium">Costo parcial</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detalleCostos.map((row) => {
                        const stockDespues = row.stockDisponible - row.cantidadTotalRequerida;
                        return (
                          <tr key={row.ingredienteId} className="hover:bg-gray-50">
                            <td className="py-2.5 pr-4 font-medium text-gray-700">
                              {row.nombreIngrediente}
                            </td>
                            <td className="py-2.5 px-2 text-right text-gray-500">
                              {fmt(row.cantidadRequeridaPorUnidad)}
                            </td>
                            <td className="py-2.5 px-2 text-right text-gray-700 font-medium">
                              {fmt(row.cantidadTotalRequerida)}
                            </td>
                            <td className="py-2.5 px-2 text-right text-gray-600">
                              {fmt(row.stockDisponible)}
                            </td>
                            <td className={`py-2.5 px-2 text-right ${stockColor(stockDespues, row.stockDisponible)}`}>
                              {fmt(stockDespues)}
                              {!row.stockSuficiente && (
                                <span className="ml-1 text-red-400" title="Stock insuficiente">⚠</span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="py-2.5 pl-2 text-right text-gray-600">
                                {formatCurrency(row.costoParcial)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <p className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    Stock de insumos actualizado tras el último registro.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="pb-2 text-left font-medium">Insumo</th>
                        <th className="pb-2 text-right font-medium">Stock actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {insumosActualizados!.map((row) => (
                        <tr key={row.ingredienteId} className="hover:bg-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-700">
                            {row.nombreIngrediente}
                          </td>
                          <td className={`py-2.5 px-2 text-right ${stockColor(row.stockDisponible, row.stockDisponible)}`}>
                            {fmt(row.stockDisponible)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
