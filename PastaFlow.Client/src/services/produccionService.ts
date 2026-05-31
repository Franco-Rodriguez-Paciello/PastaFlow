export interface RegistrarProduccionInput {
  productoId: number;
  cantidadProducida: number;
}

export async function registrarProduccion(input: RegistrarProduccionInput): Promise<number> {
  const response = await fetch('/api/produccion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Error al registrar producción: ${response.status}`);
  }
  const data = await response.json() as { id: number };
  return data.id;
}
