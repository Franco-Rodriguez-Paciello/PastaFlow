import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/**
 * Estado de error para cargas bloqueantes: mensaje claro para el usuario final
 * y opción de reintentar sin recargar toda la aplicación.
 */
export default function ErrorState({
  title = 'No pudimos cargar la información',
  message,
  onRetry,
  retrying = false,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-6 py-10 ${className}`}
    >
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500">
        <AlertTriangle size={24} strokeWidth={1.8} />
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {message && <p className="text-xs text-gray-500 mt-1 max-w-sm">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition disabled:opacity-60"
        >
          <RefreshCw size={15} className={retrying ? 'animate-spin' : ''} />
          Reintentar
        </button>
      )}
    </div>
  );
}
