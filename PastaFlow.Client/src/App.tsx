import { useState } from 'react';
import DashboardView from './components/DashboardView';
import IngredientesView from './components/IngredientesView';
import ProductosAnaliticaView from './components/ProductosAnaliticaView';
import SideBar from './components/SideBar';
import RecetasCreadorView from './components/RecetasCreadorView';
import ProduccionDiariaView from './components/ProduccionDiariaView';

function App() {
  // Estado que maneja qué pantalla se muestra en pantalla
  const [view, setView] = useState<string>('dashboard');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra Lateral Fija */}
      <SideBar currentView={view} onViewChange={setView} />

      {/* Contenedor Principal Dinámico */}
      <main className="flex-1 p-8 overflow-y-auto">
        {view === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel Principal</h2>
            <DashboardView />
          </div>
        )}

        {view === 'insumos' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Insumos</h2>
            <IngredientesView />
          </div>
        )}

        {view === 'rentabilidad' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel Analítico</h2>
            <ProductosAnaliticaView />
          </div>
        )}

        {view === 'recetas' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Creador de Recetas Dinámico</h2>
            <RecetasCreadorView />
          </div>
        )}

        {view === 'produccion' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Producción Diaria</h2>
            <ProduccionDiariaView />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;