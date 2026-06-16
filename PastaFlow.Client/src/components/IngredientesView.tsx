import { useEffect } from 'react';
import { useIngredientesStore } from '../stores/useIngredientesStore';
import { IconWrench } from './ingredientes/IngredientesIcons';
import IngredientesAlerts from './ingredientes/IngredientesAlerts';
import AjusteModal from './ingredientes/AjusteModal';
import IngredientesTabla from './ingredientes/IngredientesTabla';
import HistorialAjustesPanel from './ingredientes/HistorialAjustesPanel';

interface Props {
  onCostoActualizado?: () => void;
}

export default function IngredientesView({ onCostoActualizado }: Props) {
  const {
    loading,
    ajusteModalOpen,
    fetchIngredientes,
    fetchHistorial,
    openAjusteModal,
  } = useIngredientesStore();

  useEffect(() => {
    void fetchIngredientes();
    void fetchHistorial();
  }, [fetchIngredientes, fetchHistorial]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Insumos</h2>
        <button
          onClick={openAjusteModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <IconWrench />
          Registrar Merma / Ajuste
        </button>
      </div>

      {ajusteModalOpen && <AjusteModal />}

      <IngredientesAlerts />
      <IngredientesTabla onCostoActualizado={onCostoActualizado} />
      <HistorialAjustesPanel />
    </div>
  );
}
