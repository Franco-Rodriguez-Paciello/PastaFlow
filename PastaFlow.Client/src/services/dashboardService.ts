import type { DashboardStatsDto, FinancialDashboardDto, ComprasInsightDto } from '../types/api.types';
import { apiFetch } from '../lib/apiFetch';
import { parseApiError } from '../lib/apiError';

export async function getDashboardStats(): Promise<DashboardStatsDto> {
  const response = await apiFetch('/api/dashboard/stats');
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail ?? `Error al obtener estadísticas: ${response.status}`);
  }
  return response.json() as Promise<DashboardStatsDto>;
}

export async function getFinancialDashboard(): Promise<FinancialDashboardDto> {
  const response = await apiFetch('/api/dashboard/financiero');
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail ?? `Error al obtener datos financieros: ${response.status}`);
  }
  return response.json() as Promise<FinancialDashboardDto>;
}

export async function getUltimoComprasInsight(): Promise<ComprasInsightDto | null> {
  const response = await apiFetch('/api/dashboard/insights/compras');
  if (response.status === 404) return null;
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json() as Promise<ComprasInsightDto>;
}

export async function generateComprasInsight(): Promise<ComprasInsightDto> {
  const response = await apiFetch('/api/dashboard/insights/compras', { method: 'POST' });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return response.json() as Promise<ComprasInsightDto>;
}
