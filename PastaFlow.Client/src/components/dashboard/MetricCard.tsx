interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  valueColor = 'text-gray-800',
  subtitle,
}: MetricCardProps) {
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
