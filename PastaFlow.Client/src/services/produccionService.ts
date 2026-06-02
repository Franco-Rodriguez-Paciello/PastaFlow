import type { HistorialProduccionDto } from '../types/api.types';
import { throwIfError } from '../lib/apiError';

export interface RegistrarProduccionInput {
  productoId: number;
  cantidadProducida: number;
}

export async function registrarProduccion(input: RegistrarProduccionInput): Promise<number> {
  const response = await fetch('/api/produccion', {
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener historial: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<HistorialProduccionDto[]>;
}
