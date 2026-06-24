import { FileText } from 'lucide-react';
import { timeAgo } from '../../stores/useDashboardStore';

interface InsightReportViewProps {
  reporte: string;
  generadoEnUtc: string;
  origen: 'Automatico' | 'Manual';
  diaOperativo: string;
}

function origenLabel(origen: InsightReportViewProps['origen']): string {
  return origen === 'Automatico' ? 'Generado automáticamente' : 'Generado manualmente';
}

function parseParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

export default function InsightReportView({ reporte, generadoEnUtc, origen, diaOperativo }: InsightReportViewProps) {
  const paragraphs = parseParagraphs(reporte);

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-100/90 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300" aria-hidden="true" />

      <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/50 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-amber-100/80">
          <div className="inline-flex items-center gap-2 text-amber-800">
            <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
              <FileText size={15} strokeWidth={2} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Informe operativo
            </span>
          </div>
          <span className="text-xs font-medium text-amber-700/70 bg-amber-100/60 px-2.5 py-1 rounded-full">
            {origenLabel(origen)}
          </span>
          <span className="text-xs font-medium text-gray-500 bg-white/60 px-2.5 py-1 rounded-full border border-gray-100">
            Día operativo {diaOperativo}
          </span>
          <span className="sm:ml-auto text-xs text-gray-500 bg-white/70 px-2.5 py-1 rounded-full border border-amber-100">
            {timeAgo(generadoEnUtc)}
          </span>
        </div>

        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`leading-7 ${
                index === 0
                  ? 'text-[15px] font-medium text-gray-800'
                  : 'text-sm text-gray-600'
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
