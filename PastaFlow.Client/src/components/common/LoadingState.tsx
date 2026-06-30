import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

/**
 * Estado de carga unificado: spinner centrado con etiqueta opcional.
 * Usar para cargas de sección/pantalla completa (no para botones).
 */
export default function LoadingState({ label, className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-gray-400 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
