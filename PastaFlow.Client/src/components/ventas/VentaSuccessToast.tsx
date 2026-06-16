import { CheckCircle, X } from 'lucide-react';

interface VentaSuccessToastProps {
  message: string;
  onDismiss: () => void;
}

export default function VentaSuccessToast({ message, onDismiss }: VentaSuccessToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full bg-white border border-emerald-200 shadow-xl rounded-xl px-4 py-4 animate-slide-up">
      <span className="shrink-0 text-emerald-500 mt-0.5">
        <CheckCircle size={20} strokeWidth={2} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">Venta registrada</p>
        <p className="text-xs text-gray-500 mt-0.5">{message}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}
