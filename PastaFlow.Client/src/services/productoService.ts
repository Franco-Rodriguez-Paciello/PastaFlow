import type { ProductProfitabilityDto, ProductoDto, RecetaItemDto, RegistrarProductoInput, SugerirRecetaInput, SugerirRecetaResultDto } from '../types/api.types';
import { throwIfError } from '../lib/apiError';
import { apiFetch } from '../lib/apiFetch';

export async function registrarProducto(input: RegistrarProductoInput): Promise<number> {
  const response = await apiFetch('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Error al registrar producto: ${response.status}`);
  }
  const data = await response.json() as { id: number };
  return data.id;
}

export async function getProductos(): Promise<ProductoDto[]> {
  const response = await apiFetch('/api/productos');
  if (!response.ok) {
    throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ProductoDto[]>;
}

export async function asignarReceta(
  productId: number,
  ingredientes: { ingredienteId: number; cantidadRequerida: number }[]
): Promise<void> {
  const response = await apiFetch(`/api/productos/${productId}/receta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredientes),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Error al guardar receta: ${response.status}`);
  }
}

export async function getRecetaByProducto(productId: number): Promise<RecetaItemDto[]> {
  const response = await apiFetch(`/api/productos/${productId}/receta`);
  if (!response.ok) {
    throw new Error(`Error al obtener receta: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<RecetaItemDto[]>;
}

export async function getProductProfitability(): Promise<ProductProfitabilityDto[]> {
  const response = await apiFetch('/api/productos/rentabilidad');
  if (!response.ok) {
    throw new Error(`Error al obtener rentabilidad: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ProductProfitabilityDto[]>;
}

export async function sugerirReceta(input: SugerirRecetaInput): Promise<SugerirRecetaResultDto> {
  const response = await apiFetch('/api/productos/recetas/sugerir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  return response.json() as Promise<SugerirRecetaResultDto>;
}
