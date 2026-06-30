import type { AjusteStockDto, IngredienteDto } from '../types/api.types';
import { throwIfError } from '../lib/apiError';
import { apiFetch } from '../lib/apiFetch';

export interface RegistrarAjusteInput {
  insumoId: number;
  cantidad: number;
  tipoAjuste: 'Suma' | 'Resta';
  motivo: 'Merma' | 'Rotura' | 'ConteoFisico' | 'CompraManual';
  observaciones?: string;
}

export async function getIngredientes(): Promise<IngredienteDto[]> {
  const response = await apiFetch('/api/ingredientes');
  if (!response.ok) {
    throw new Error(`Error al obtener ingredientes: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<IngredienteDto[]>;
}

export async function actualizarCosto(id: number, nuevoCosto: number): Promise<void> {
  const response = await apiFetch(`/api/ingredientes/${id}/costo`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevoCosto }),
  });
  await throwIfError(response);
}

export async function ajustarStock(id: number, nuevoStock: number): Promise<void> {
  const response = await apiFetch(`/api/ingredientes/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevoStock }),
  });
  await throwIfError(response);
}

export async function actualizarUmbral(id: number, nuevoUmbral: number): Promise<void> {
  const response = await apiFetch(`/api/ingredientes/${id}/umbral`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevoUmbral }),
  });
  await throwIfError(response);
}

export async function getHistorialAjustes(insumoId?: number, take = 100): Promise<AjusteStockDto[]> {
  const params = new URLSearchParams();
  if (insumoId !== undefined) params.set('insumoId', String(insumoId));
  params.set('take', String(take));
  const response = await apiFetch(`/api/ingredientes/ajustes?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Error al obtener historial de ajustes: ${response.status}`);
  }
  return response.json() as Promise<AjusteStockDto[]>;
}

export async function registrarAjuste(input: RegistrarAjusteInput): Promise<number> {
  const response = await apiFetch('/api/ingredientes/ajuste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  const data = await response.json() as { id: number };
  return data.id;
}

/** 0 = Kilogramo | 1 = Litro | 2 = Unidad | 3 = Docena */
export async function registrarIngrediente(input: {
  nombre: string;
  unidadMedida: number;
  costoInicial: number;
}): Promise<number> {
  const response = await apiFetch('/api/ingredientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  const data = await response.json() as { id: number };
  return data.id;
}
