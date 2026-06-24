import { useEffect } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useProveedoresStore } from '../stores/useProveedoresStore';
import ProveedoresTabla from './proveedores/ProveedoresTabla';
import ProveedorModal from './proveedores/ProveedorModal';
import VincularIngredienteModal from './proveedores/VincularIngredienteModal';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
            <Truck size={22} strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Proveedores</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Gestioná contactos y vínculos de insumos por proveedor.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

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
