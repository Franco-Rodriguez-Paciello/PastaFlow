import type { AjusteStockDto, IngredienteDto } from '../types/api.types';

export interface RegistrarAjusteInput {
  insumoId: number;
  cantidad: number;
  tipoAjuste: 'Suma' | 'Resta';
  motivo: 'Merma' | 'Rotura' | 'ConteoFisico' | 'CompraManual';
  observaciones?: string;
}

export async function getIngredientes(): Promise<IngredienteDto[]> {
  const response = await fetch('/api/ingredientes');
  if (!response.ok) {
    throw new Error(`Error al obtener ingredientes: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<IngredienteDto[]>;
}

export async function actualizarCosto(id: number, nuevoCosto: number): Promise<void> {
  const response = await fetch(`/api/ingredientes/${id}/costo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nuevoCosto }),
  });
  if (!response.ok) {
    throw new Error(`Error al actualizar costo: ${response.status} ${response.statusText}`);
  }
}

export async function ajustarStock(id: number, nuevoStock: number): Promise<void> {
  const response = await fetch(`/api/ingredientes/${id}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nuevoStock }),
  });
  if (!response.ok) {
    throw new Error(`Error al ajustar stock: ${response.status} ${response.statusText}`);
  }
}

export async function actualizarUmbral(id: number, nuevoUmbral: number): Promise<void> {
  const response = await fetch(`/api/ingredientes/${id}/umbral`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nuevoUmbral }),
  });
  if (!response.ok) {
    throw new Error(`Error al actualizar umbral: ${response.status} ${response.statusText}`);
  }
}

export async function getHistorialAjustes(insumoId?: number, take = 100): Promise<AjusteStockDto[]> {
  const params = new URLSearchParams();
  if (insumoId !== undefined) params.set('insumoId', String(insumoId));
  params.set('take', String(take));
  const response = await fetch(`/api/ingredientes/ajustes?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Error al obtener historial de ajustes: ${response.status}`);
  }
  return response.json() as Promise<AjusteStockDto[]>;
}

export async function registrarAjuste(input: RegistrarAjusteInput): Promise<number> {
  const response = await fetch('/api/ingredientes/ajuste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Error al registrar ajuste: ${response.status}`);
  }
  const data = await response.json() as { id: number };
  return data.id;
}
