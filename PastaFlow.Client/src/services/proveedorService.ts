import type { ProveedorDto } from '../types/api.types';
import { throwIfError } from '../lib/apiError';
import { apiFetch } from '../lib/apiFetch';

export interface RegistrarProveedorInput {
  nombre: string;
  contactoNombre?: string;
  telefono?: string;
  email?: string;
  cuit?: string;
  notas?: string;
}

export interface ActualizarProveedorInput extends RegistrarProveedorInput {
  activo: boolean;
}

export interface VincularIngredienteInput {
  ingredienteId: number;
  precioReferencia: number;
  codigoProveedor?: string;
  esPreferido: boolean;
  tiempoEntregaDias?: number;
}

export async function getProveedores(): Promise<ProveedorDto[]> {
  const response = await apiFetch('/api/proveedores');
  if (!response.ok) {
    throw new Error(`Error al obtener proveedores: ${response.status}`);
  }
  return response.json() as Promise<ProveedorDto[]>;
}

export async function registrarProveedor(input: RegistrarProveedorInput): Promise<number> {
  const response = await apiFetch('/api/proveedores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
  const body = await response.json() as { id: number };
  return body.id;
}

export async function actualizarProveedor(id: number, input: ActualizarProveedorInput): Promise<void> {
  const response = await apiFetch(`/api/proveedores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
}

export async function vincularIngrediente(proveedorId: number, input: VincularIngredienteInput): Promise<void> {
  const response = await apiFetch(`/api/proveedores/${proveedorId}/ingredientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  await throwIfError(response);
}

export async function desvincularIngrediente(proveedorId: number, ingredienteId: number): Promise<void> {
  const response = await apiFetch(`/api/proveedores/${proveedorId}/ingredientes/${ingredienteId}`, {
    method: 'DELETE',
  });
  await throwIfError(response);
}
