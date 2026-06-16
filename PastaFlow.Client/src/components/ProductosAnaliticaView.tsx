import { useEffect } from 'react';
import { useAnaliticaStore } from '../stores/useAnaliticaStore';
import RentabilidadLeyenda from './analitica/RentabilidadLeyenda';
import RentabilidadTabla from './analitica/RentabilidadTabla';

interface Props {
  refreshKey?: number;
}

export default function ProductosAnaliticaView({ refreshKey = 0 }: Props) {
  const { productos, loading, error, fetchRentabilidad, dismissError } = useAnaliticaStore();

  useEffect(() => {
    void fetchRentabilidad();
  }, [fetchRentabilidad, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-gray-500">
        Cargando datos de rentabilidad...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-between gap-4 text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg">
        <span>{error}</span>
        <button
          onClick={() => { dismissError(); void fetchRentabilidad(); }}
          className="text-sm text-red-500 hover:text-red-700 underline shrink-0"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Análisis de Rentabilidad</h2>
        <p className="text-sm text-gray-500 mt-1">
          Margen calculado sobre precio de venta · Solo productos compuestos
        </p>
      </div>

      <RentabilidadLeyenda />
      <RentabilidadTabla productos={productos} />
    </div>
  );
}
