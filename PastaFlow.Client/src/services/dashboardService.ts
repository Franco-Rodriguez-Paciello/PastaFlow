import type { DashboardStatsDto } from '../types/api.types';

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail ?? `Error al obtener estadísticas: ${response.status}`);
  }
  return response.json() as Promise<DashboardStatsDto>;
}
