import { useEffect } from 'react';
import { Wallet, Factory, TriangleAlert } from 'lucide-react';
import { useDashboardStore, formatUnits } from '../stores/useDashboardStore';
import { formatCurrency } from '../lib/formatters';
import { SkeletonCard, SkeletonPanel } from './dashboard/DashboardSkeletons';
import MetricCard from './dashboard/MetricCard';
import StockCriticoPanel from './dashboard/StockCriticoPanel';
import ProduccionRecientePanel from './dashboard/ProduccionRecientePanel';
import DashboardFinancialSection from './dashboard/DashboardFinancialSection';
import ComprasInsightPanel from './dashboard/ComprasInsightPanel';

export default function DashboardView() {
  const { stats, statsLoading, statsError, init } = useDashboardStore();

  useEffect(() => {
    void init();
  }, [init]);

  if (statsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-64 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
        Error al cargar el dashboard: {statsError}
      </div>
    );
  }

  if (!stats) return null;

  const hasCriticalAlerts = stats.insumosCriticosCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Valorización de Insumos"
          value={formatCurrency(stats.valorTotalInsumos)}
          icon={<Wallet size={22} strokeWidth={1.8} />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtitle="Capital en stock actual"
        />
        <MetricCard
          title="Producción de Hoy"
          value={`${formatUnits(stats.produccionHoy)} uds.`}
          icon={<Factory size={22} strokeWidth={1.8} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle="Unidades fabricadas hoy"
        />
        <MetricCard
          title="Insumos Críticos"
          value={String(stats.insumosCriticosCount)}
          icon={<TriangleAlert size={22} strokeWidth={1.8} />}
          iconBg={hasCriticalAlerts ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={hasCriticalAlerts ? 'text-red-500' : 'text-gray-400'}
          valueColor={hasCriticalAlerts ? 'text-red-500' : 'text-gray-800'}
          subtitle={hasCriticalAlerts ? 'Requieren atención inmediata' : 'Todo en orden'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockCriticoPanel items={stats.listaStockCritico} />
        <ProduccionRecientePanel items={stats.ultimasProducciones} />
      </div>

      <ComprasInsightPanel />

      <div className="flex items-center gap-3 mt-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Caja del Día</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <DashboardFinancialSection />
    </div>
  );
}
