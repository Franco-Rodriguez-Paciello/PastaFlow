import type {
  CompraDetalleDto,
  CompraResumenDto,
  RegistrarCompraInput,
  SugerenciaCompraDto,
} from '../types/api.types';
import { throwIfError } from '../lib/apiError';
import { apiFetch } from '../lib/apiFetch';

export async function getCompras(): Promise<CompraResumenDto[]> {
  const response = await apiFetch('/api/compras');
  await throwIfError(response);
  return response.json() as Promise<CompraResumenDto[]>;
}

export async function getCompraById(id: number): Promise<CompraDetalleDto> {
  const response = await apiFetch(`/api/compras/${id}`);
  await throwIfError(response);
  return response.json() as Promise<CompraDetalleDto>;
}

export async function getSugerenciasCompra(fecha?: string): Promise<SugerenciaCompraDto[]> {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const response = await apiFetch(`/api/compras/sugerencias${query}`);
  await throwIfError(response);
  return response.json() as Promise<SugerenciaCompraDto[]>;
}

export async function registrarCompra(input: RegistrarCompraInput): Promise<number> {
  const response = await apiFetch('/api/compras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  const data = await response.json() as { id: number };
  return data.id;
}
