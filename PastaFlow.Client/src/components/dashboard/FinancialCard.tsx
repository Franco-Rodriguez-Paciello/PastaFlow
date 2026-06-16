interface FinancialCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

export default function FinancialCard({
  title,
  value,
  icon,
  gradient,
  iconBg,
}: FinancialCardProps) {
  return (
    <div className={`${gradient} rounded-2xl p-5 flex items-center gap-4 shadow-sm border`}>
      <div className={`${iconBg} rounded-xl p-3 shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 truncate">{title}</p>
        <p className="text-2xl font-bold tracking-tight mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
