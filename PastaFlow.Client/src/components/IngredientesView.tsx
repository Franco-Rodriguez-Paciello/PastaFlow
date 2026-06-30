import { useEffect } from 'react';
import { useIngredientesStore } from '../stores/useIngredientesStore';
import { IconWrench } from './ingredientes/IngredientesIcons';
import IngredientesAlerts from './ingredientes/IngredientesAlerts';
import AjusteModal from './ingredientes/AjusteModal';
import IngredientesTabla from './ingredientes/IngredientesTabla';
import HistorialAjustesPanel from './ingredientes/HistorialAjustesPanel';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';
import ErrorState from './common/ErrorState';

interface Props {
  onCostoActualizado?: () => void;
}

export default function IngredientesView({ onCostoActualizado }: Props) {
  const {
    loading,
    error,
    ingredientes,
    ajusteModalOpen,
    fetchIngredientes,
    fetchHistorial,
    openAjusteModal,
  } = useIngredientesStore();

  useEffect(() => {
    void fetchIngredientes();
    void fetchHistorial();
  }, [fetchIngredientes, fetchHistorial]);

  const header = (
    <PageHeader
      title="Insumos"
      subtitle="Gestioná stock, costos y umbrales de los insumos."
      actions={
        <button
          onClick={openAjusteModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <IconWrench />
          Registrar merma / ajuste
        </button>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState label="Cargando insumos…" />
      </div>
    );
  }

  if (error && ingredientes.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title="No pudimos cargar los insumos"
          message={error}
          onRetry={() => void fetchIngredientes()}
          retrying={loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {ajusteModalOpen && <AjusteModal />}

      <IngredientesAlerts />
      <IngredientesTabla onCostoActualizado={onCostoActualizado} />
      <HistorialAjustesPanel />
    </div>
  );
}
