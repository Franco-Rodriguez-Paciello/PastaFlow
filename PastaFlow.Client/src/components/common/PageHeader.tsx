import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconClassName?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Encabezado de página unificado: título, subtítulo opcional, ícono opcional
 * y zona de acciones a la derecha. Mantiene una jerarquía visual consistente
 * en todas las vistas.
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  iconClassName = 'bg-gray-100 text-gray-600',
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className={`p-2.5 rounded-lg shrink-0 ${iconClassName}`}>{icon}</span>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
