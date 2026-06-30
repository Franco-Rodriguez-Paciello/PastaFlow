import { Wallet, Banknote, CreditCard } from 'lucide-react';
import { useDashboardStore } from '../../stores/useDashboardStore';
import { formatCurrency } from '../../lib/formatters';
import FinancialCard from './FinancialCard';
import Top5ProductosPanel from './Top5ProductosPanel';
import ErrorState from '../common/ErrorState';

export default function DashboardFinancialSection() {
  const { financial, financialLoading, financialError, fetchFinancial } = useDashboardStore();

  if (financialLoading) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
      </>
    );
  }

  if (financialError || !financial) {
    return (
      <ErrorState
        title="No pudimos cargar la caja del día"
        message={financialError}
        onRetry={() => void fetchFinancial()}
        retrying={financialLoading}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinancialCard
          title="Caja Total Hoy"
          value={formatCurrency(financial.ventasTotalesHoy)}
          icon={<Wallet size={22} strokeWidth={1.8} className="text-emerald-600" />}
          gradient="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 text-emerald-900"
          iconBg="bg-white/70"
        />
        <FinancialCard
          title="Ingresos en Efectivo"
          value={formatCurrency(financial.totalEfectivoHoy)}
          icon={<Banknote size={22} strokeWidth={1.8} className="text-blue-600" />}
          gradient="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 text-blue-900"
          iconBg="bg-white/70"
        />
        <FinancialCard
          title="Por Transferencia"
          value={formatCurrency(financial.totalTransferenciaHoy)}
          icon={<CreditCard size={22} strokeWidth={1.8} className="text-violet-600" />}
          gradient="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 text-violet-900"
          iconBg="bg-white/70"
        />
      </div>
      <Top5ProductosPanel items={financial.top5ProductosMasVendidos} />
    </>
  );
}
