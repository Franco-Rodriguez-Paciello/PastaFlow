import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type InsightEmailToastVariant = 'success' | 'warning' | 'info';

interface InsightEmailToastProps {
  variant: InsightEmailToastVariant;
  title: string;
  message: string;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<InsightEmailToastVariant, { border: string; icon: string }> = {
  success: { border: 'border-emerald-200', icon: 'text-emerald-500' },
  warning: { border: 'border-amber-200', icon: 'text-amber-500' },
  info: { border: 'border-blue-200', icon: 'text-blue-500' },
};

function ToastIcon({ variant }: { variant: InsightEmailToastVariant }) {
  const className = `${VARIANT_STYLES[variant].icon} mt-0.5 shrink-0`;
  if (variant === 'success') return <CheckCircle size={20} strokeWidth={2} className={className} />;
  if (variant === 'warning') return <AlertTriangle size={20} strokeWidth={2} className={className} />;
  return <Info size={20} strokeWidth={2} className={className} />;
}

export default function InsightEmailToast({ variant, title, message, onDismiss }: InsightEmailToastProps) {
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full bg-white border ${VARIANT_STYLES[variant].border} shadow-xl rounded-xl px-4 py-4 animate-slide-up`}
    >
      <ToastIcon variant={variant} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function emailEstadoToToast(
  estado: string,
  detalle: string | null,
): { variant: InsightEmailToastVariant; title: string; message: string } | null {
  switch (estado) {
    case 'Enviado':
      return {
        variant: 'success',
        title: 'Correo enviado',
        message: detalle ?? 'El insight se envió por correo correctamente.',
      };
    case 'Error':
      return {
        variant: 'warning',
        title: 'No se pudo enviar el correo',
        message: detalle ?? 'Revisá la configuración SMTP del servidor.',
      };
    case 'Deshabilitado':
      return {
        variant: 'info',
        title: 'Correo no habilitado',
        message: detalle ?? 'Activá Email:Habilitado en la configuración del servidor.',
      };
    case 'SinDestinatarios':
      return {
        variant: 'warning',
        title: 'Sin destinatarios',
        message: detalle ?? 'Configurá Email:DestinatariosInsight en el servidor.',
      };
    default:
      return null;
  }
}
