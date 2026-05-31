import type { IngredienteDto } from '../types/api.types';

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
