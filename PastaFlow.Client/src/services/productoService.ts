import type { ProductProfitabilityDto } from '../types/api.types';

export async function getProductProfitability(): Promise<ProductProfitabilityDto[]> {
  const response = await fetch('/api/productos/rentabilidad');
  if (!response.ok) {
    throw new Error(`Error al obtener rentabilidad: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ProductProfitabilityDto[]>;
}
