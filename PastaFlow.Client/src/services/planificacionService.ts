import type { PrediccionDemandaDto, SerieDiariaDto, BacktestDemandaDto } from '../types/api.types';
import { apiFetch } from '../lib/apiFetch';
import { throwIfError } from '../lib/apiError';

export async function getPrediccionDemanda(fecha?: string): Promise<PrediccionDemandaDto> {
  const qs = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const response = await apiFetch(`/api/planificacion/demanda${qs}`);
  await throwIfError(response);
  return response.json() as Promise<PrediccionDemandaDto>;
}

export async function getSerieHistorica(dias = 90): Promise<SerieDiariaDto[]> {
  const response = await apiFetch(`/api/planificacion/historico?dias=${dias}`);
  await throwIfError(response);
  return response.json() as Promise<SerieDiariaDto[]>;
}

export async function getBacktestDemanda(): Promise<BacktestDemandaDto> {
  const response = await apiFetch('/api/planificacion/precision');
  await throwIfError(response);
  return response.json() as Promise<BacktestDemandaDto>;
}

export async function generarRecomendacionDemanda(fecha?: string): Promise<PrediccionDemandaDto> {
  const response = await apiFetch('/api/planificacion/demanda/recomendacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha: fecha ?? null }),
  });
  await throwIfError(response);
  return response.json() as Promise<PrediccionDemandaDto>;
}
