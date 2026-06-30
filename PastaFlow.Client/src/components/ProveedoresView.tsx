import { useEffect } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useProveedoresStore } from '../stores/useProveedoresStore';
import ProveedoresTabla from './proveedores/ProveedoresTabla';
import ProveedorModal from './proveedores/ProveedorModal';
import VincularIngredienteModal from './proveedores/VincularIngredienteModal';
import PageHeader from './common/PageHeader';
import LoadingState from './common/LoadingState';

export default function ProveedoresView() {
  const {
    loading,
    error,
    successMessage,
    modalOpen,
    vincularModalOpen,
    init,
    openCreateModal,
    dismissMessages,
  } = useProveedoresStore();

  useEffect(() => {
    void init();
  }, [init]);

  const header = (
    <PageHeader
      title="Proveedores"
      subtitle="Gestioná contactos y vínculos de insumos por proveedor."
      icon={<Truck size={22} strokeWidth={1.8} />}
      iconClassName="bg-emerald-50 text-emerald-600"
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingState label="Cargando proveedores…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={dismissMessages} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          <p>{successMessage}</p>
          <button type="button" onClick={dismissMessages} className="text-emerald-400 hover:text-emerald-600">×</button>
        </div>
      )}

      {modalOpen && <ProveedorModal />}
      {vincularModalOpen && <VincularIngredienteModal />}

      <ProveedoresTabla />
    </div>
  );
}
