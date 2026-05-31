import type { ProductProfitabilityDto, ProductoDto, RecetaItemDto, RegistrarProductoInput } from '../types/api.types';

export async function registrarProducto(input: RegistrarProductoInput): Promise<number> {
  const response = await fetch('/api/productos', {
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
  const response = await fetch('/api/productos');
  if (!response.ok) {
    throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ProductoDto[]>;
}

export async function asignarReceta(
  productId: number,
  ingredientes: { ingredienteId: number; cantidadRequerida: number }[]
): Promise<void> {
  const response = await fetch(`/api/productos/${productId}/receta`, {
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
  const response = await fetch(`/api/productos/${productId}/receta`);
  if (!response.ok) {
    throw new Error(`Error al obtener receta: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<RecetaItemDto[]>;
}

export async function getProductProfitability(): Promise<ProductProfitabilityDto[]> {
  const response = await fetch('/api/productos/rentabilidad');
  if (!response.ok) {
    throw new Error(`Error al obtener rentabilidad: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ProductProfitabilityDto[]>;
}
