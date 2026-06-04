import type { RegistrarVentaDto, VentaRegistradaDto } from '../types/api.types';
import { apiFetch } from '../lib/apiFetch';
import { throwIfError } from '../lib/apiError';

export async function registrarVenta(dto: RegistrarVentaDto): Promise<VentaRegistradaDto> {
  const response = await apiFetch('/api/ventas', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  await throwIfError(response);
  return response.json() as Promise<VentaRegistradaDto>;
}
