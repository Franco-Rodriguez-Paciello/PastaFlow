import type { HojaProduccionDiaDto } from '../types/api.types';
import { apiFetch } from '../lib/apiFetch';
import { throwIfError } from '../lib/apiError';

export async function getHojaProduccionDia(fecha?: string): Promise<HojaProduccionDiaDto> {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const res = await apiFetch(`/api/produccion/hoja${query}`);
  throwIfError(res);
  return res.json() as Promise<HojaProduccionDiaDto>;
}
