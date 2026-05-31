import { useEffect, useState } from 'react';
import type { HistorialProduccionDto, ProductoDto } from '../types/api.types';
import { getHistorialProduccion, type HistorialFiltros } from '../services/produccionService';
import { getProductos } from '../services/productoService';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2
           M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2
           M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const HOY = toDateInput(new Date());

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function fmtCantidad(n: number): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistorialProduccionView() {
  // ── data state ──────────────────────────────────────────────────────────
  const [registros, setRegistros] = useState<HistorialProduccionDto[]>([]);
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── filter state ────────────────────────────────────────────────────────
  const [fechaDesde, setFechaDesde] = useState(HOY);
  const [fechaHasta, setFechaHasta] = useState(HOY);
  const [productoId, setProductoId] = useState('');

  // ── fetch helpers ────────────────────────────────────────────────────────

  async function cargarHistorial(filtros: HistorialFiltros, isInitial = false): Promise<void> {
    if (isInitial) setLoading(true); else setFiltering(true);
    setError(null);
    try {
      const data = await getHistorialProduccion(filtros);
      setRegistros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener el historial.');
    } finally {
      if (isInitial) setLoading(false); else setFiltering(false);
    }
  }

  // ── initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getHistorialProduccion({ fechaDesde: HOY, fechaHasta: HOY }),
      getProductos(),
    ])
      .then(([historial, prods]) => {
        if (cancelled) return;
        setRegistros(historial);
        setProductos(prods.filter((p) => p.tipoProducto === 'Compuesto'));
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Error al cargar datos.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // ── filter handler ───────────────────────────────────────────────────────

  function handleFiltrar(): void {
    const filtros: HistorialFiltros = {};
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;
    if (productoId) filtros.productoId = Number(productoId);
    void cargarHistorial(filtros);
  }

  function handleLimpiar(): void {
    setFechaDesde('');
    setFechaHasta('');
    setProductoId('');
    void cargarHistorial({});
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">

          {/* Fecha desde */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fecha desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fecha hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700"
            />
          </div>

          {/* Selector de producto */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-gray-700 bg-white"
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Acciones */}
          <div className="flex items-end gap-2 ml-auto">
            {(fechaDesde || fechaHasta || productoId) && (
              <button
                onClick={handleLimpiar}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={handleFiltrar}
              disabled={filtering}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              {filtering ? <IconSpinner /> : <IconSearch />}
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* table header with result count */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {registros.length === 0
                ? 'Sin resultados'
                : `${registros.length} registro${registros.length !== 1 ? 's' : ''}`}
            </span>
            {filtering && (
              <span className="flex items-center gap-1.5 text-xs text-blue-500">
                <IconSpinner /> Actualizando…
              </span>
            )}
          </div>

          {registros.length === 0 ? (
            /* ── Empty state ─────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
              <IconClipboard />
              <p className="text-gray-500 font-medium">No se encontraron registros</p>
              <p className="text-gray-400 text-sm max-w-xs">
                No hay producciones para los filtros seleccionados. Intentá ampliar el rango de fechas o seleccionar otro producto.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Fecha</th>
                    <th className="px-5 py-3 text-left font-medium">Hora</th>
                    <th className="px-5 py-3 text-left font-medium">Producto fabricado</th>
                    <th className="px-5 py-3 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {registros.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                    >
                      <td className="px-5 py-3 text-gray-600 tabular-nums whitespace-nowrap">
                        {formatFecha(r.fechaDeRegistro)}
                      </td>
                      <td className="px-5 py-3 text-gray-400 tabular-nums whitespace-nowrap">
                        {formatHora(r.fechaDeRegistro)}
                      </td>
                      <td className="px-5 py-3 text-gray-800 font-medium">
                        {r.nombreProducto}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-700 font-semibold">
                        {fmtCantidad(r.cantidadProducida)}
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
  );
}
