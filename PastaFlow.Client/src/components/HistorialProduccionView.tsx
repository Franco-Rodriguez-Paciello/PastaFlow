import { useEffect } from 'react';
import { useHistorialProduccionStore } from '../stores/useHistorialProduccionStore';
import HistorialFiltrosBar from './historial/HistorialFiltrosBar';
import HistorialTabla from './historial/HistorialTabla';
import ErrorState from './common/ErrorState';
import LoadingState from './common/LoadingState';
import PageHeader from './common/PageHeader';

export default function HistorialProduccionView() {
  const { loading, error, init } = useHistorialProduccionStore();

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de producción"
        subtitle="Consultá las producciones registradas con sus costos."
      />

      <HistorialFiltrosBar />

      {error ? (
        <ErrorState
          title="No pudimos cargar el historial"
          message={error}
          onRetry={() => void init()}
          retrying={loading}
        />
      ) : loading ? (
        <LoadingState label="Cargando historial…" />
      ) : (
        <HistorialTabla />
      )}
    </div>
  );
}
