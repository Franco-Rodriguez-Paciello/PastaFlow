import type {
  DetalleCostoIngredienteDto,
  HistorialProduccionDto,
  OrdenProduccionDto,
  ProductoDto,
} from '../types/api.types';
import { ApiError, throwIfError } from '../lib/apiError';
import { apiFetch } from '../lib/apiFetch';

export interface OrdenProduccionInput {
  productoId: number;
  cantidadProducida: number;
}

export interface RegistrarProduccionInput extends OrdenProduccionInput {}

/** Conflicto de concurrencia (xmin) al registrar producción. */
export function isProduccionConcurrencyError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.isConcurrencyConflict;
}

/** Error de dominio (stock insuficiente, etc.) – HTTP 409 distinto de concurrencia o 422. */
export function isProduccionDomainError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.isBusinessRuleViolation;
}

/** Mensaje legible desde Problem Details del backend. */
export function getProduccionErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.detail ?? err.message;
  if (err instanceof Error) return err.message;
  return 'Error desconocido al procesar la producción.';
}

/**
 * Efecto espejo: aplica en memoria el descuento de insumos y el incremento
 * del producto terminado según la orden verificada, sin refetch.
 */
export function mirrorProductionStockUpdate(
  productos: ProductoDto[],
  preview: OrdenProduccionDto,
): { productos: ProductoDto[]; detalleCostos: DetalleCostoIngredienteDto[] } {
  const updatedProductos = productos.map((p) =>
    p.id === preview.productoId
      ? { ...p, stockActual: p.stockActual + preview.cantidadProducida }
      : p,
  );

  const detalleCostos = preview.detalleCostos.map((row) => {
    const stockDisponible = row.stockDisponible - row.cantidadTotalRequerida;
    return {
      ...row,
      stockDisponible,
      stockSuficiente: stockDisponible >= row.cantidadTotalRequerida,
    };
  });

  return { productos: updatedProductos, detalleCostos };
}

export async function verificarOrdenProduccion(
  input: OrdenProduccionInput,
): Promise<OrdenProduccionDto> {
  const response = await apiFetch('/api/produccion/verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  return response.json() as Promise<OrdenProduccionDto>;
}

export async function registrarProduccion(input: RegistrarProduccionInput): Promise<number> {
  const response = await apiFetch('/api/produccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  const data = await response.json() as { id: number };
  return data.id;
}

export interface HistorialFiltros {
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
  productoId?: number;
}

export async function getHistorialProduccion(
  filtros: HistorialFiltros = {}
): Promise<HistorialProduccionDto[]> {
  const params = new URLSearchParams();
  if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
  if (filtros.productoId !== undefined) params.set('productoId', String(filtros.productoId));

  const url = `/api/produccion/historial${params.size > 0 ? `?${params.toString()}` : ''}`;
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener historial: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<HistorialProduccionDto[]>;
}
