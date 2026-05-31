import { useEffect, useState } from 'react';
import { Wallet, Factory, TriangleAlert, CircleCheck, ShoppingCart, Clock } from 'lucide-react';
import type { DashboardStatsDto, StockCriticoItemDto, UltimaProduccionItemDto } from '../types/api.types';
import { getDashboardStats } from '../services/dashboardService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatUnits(value: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD} ${diffD === 1 ? 'día' : 'días'}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, iconBg, iconColor, valueColor = 'text-gray-800', subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 tracking-wide uppercase">{title}</span>
        <span className={`${iconBg} ${iconColor} p-2.5 rounded-lg`}>{icon}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

// ─── Stock Crítico Panel ───────────────────────────────────────────────────────

interface StockCriticoPanelProps {
  items: StockCriticoItemDto[];
}

function StockCriticoPanel({ items }: StockCriticoPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-gray-500" strokeWidth={1.8} />
          <h3 className="text-base font-semibold text-gray-800">Lista de Compras</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Stock crítico
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8 text-emerald-600 bg-emerald-50 rounded-lg">
          <CircleCheck size={28} strokeWidth={1.8} />
          <p className="text-sm font-medium">Stock optimizado</p>
          <p className="text-xs text-emerald-500 text-center">Todos los insumos están dentro de los niveles seguros.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-50">
          {items.map((item) => {
            const isLow = item.stockActual <= 2;
            return (
              <li key={item.nombre} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-700">{item.nombre}</span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isLow
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  Quedan: {formatUnits(item.stockActual)} {item.unidadMedida}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Producción Reciente Panel ────────────────────────────────────────────────

interface ProduccionPanelProps {
  items: UltimaProduccionItemDto[];
}

function ProduccionRecientePanel({ items }: ProduccionPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-500" strokeWidth={1.8} />
          <h3 className="text-base font-semibold text-gray-800">Historial de Producción</h3>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          Recientes
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center flex-1 py-8 text-gray-400 text-sm">
          Sin producciones registradas hoy.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-50">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 py-3">
              {/* Timestamp */}
              <span className="text-xs text-gray-400 w-24 shrink-0 tabular-nums">
                {timeAgo(item.fechaDeRegistro)}
              </span>

              {/* Dot indicator */}
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />

              {/* Product name */}
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                {item.nombreProducto}
              </span>

              {/* Quantity badge */}
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full shrink-0">
                +{formatUnits(item.cantidadProducida)} uds.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Loading state ──
  if (loading) {
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

  // ── Error state ──
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
        Error al cargar el dashboard: {error}
      </div>
    );
  }

  if (!stats) return null;

  const hasCriticalAlerts = stats.insumosCriticosCount > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Fila Superior: Métricas ── */}
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

      {/* ── Fila Inferior: Paneles ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockCriticoPanel items={stats.listaStockCritico} />
        <ProduccionRecientePanel items={stats.ultimasProducciones} />
      </div>
    </div>
  );
}
