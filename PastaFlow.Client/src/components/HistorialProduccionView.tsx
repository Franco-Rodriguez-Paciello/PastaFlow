import { useEffect } from 'react';
import { useHistorialProduccionStore } from '../stores/useHistorialProduccionStore';
import HistorialFiltrosBar from './historial/HistorialFiltrosBar';
import HistorialTabla from './historial/HistorialTabla';

export default function HistorialProduccionView() {
  const { loading, error, init, dismissError } = useHistorialProduccionStore();

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="p-6 space-y-6">
      <HistorialFiltrosBar />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <span className="font-medium">Error:</span> {error}
          <button onClick={dismissError} className="ml-auto text-red-400 hover:text-red-600 text-xs">
            Cerrar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <HistorialTabla />
      )}
    </div>
  );
}
