import { Loader2 } from 'lucide-react';

interface RecetaAsistenteLoadingBannerProps {
  mensaje?: string;
}

export default function RecetaAsistenteLoadingBanner({
  mensaje = 'Consultando al asistente de IA…',
}: RecetaAsistenteLoadingBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 flex items-start gap-3 text-sm text-violet-800"
    >
      <Loader2 size={18} className="animate-spin shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-medium">{mensaje}</p>
        <p className="text-xs text-violet-600 mt-0.5">
          Puede tardar entre 5 y 15 segundos. No cierres esta pantalla.
        </p>
      </div>
    </div>
  );
}
