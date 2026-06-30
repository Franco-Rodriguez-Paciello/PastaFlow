import { useEffect } from 'react';
import { useAnaliticaStore } from '../stores/useAnaliticaStore';
import RentabilidadLeyenda from './analitica/RentabilidadLeyenda';
import RentabilidadTabla from './analitica/RentabilidadTabla';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';

interface Props {
  refreshKey?: number;
}

export default function ProductosAnaliticaView({ refreshKey = 0 }: Props) {
  const { productos, loading, error, fetchRentabilidad } = useAnaliticaStore();

  useEffect(() => {
    void fetchRentabilidad();
  }, [fetchRentabilidad, refreshKey]);

  const header = (
    <PageHeader
      title="Análisis de rentabilidad"
      subtitle="Margen calculado sobre precio de venta · Solo productos compuestos"
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState label="Cargando datos de rentabilidad…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title="No pudimos cargar la rentabilidad"
          message={error}
          onRetry={() => void fetchRentabilidad()}
          retrying={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <RentabilidadLeyenda />
      <RentabilidadTabla productos={productos} />
    </div>
  );
}
