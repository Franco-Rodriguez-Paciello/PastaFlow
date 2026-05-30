import { useState } from 'react';
import IngredientesView from './components/IngredientesView';
import ProductosAnaliticaView from './components/ProductosAnaliticaView';
import  SideBar  from './components/SideBar';

function App() {
  // Estado que maneja qué pantalla se muestra en pantalla
  const [view, setView] = useState<string>('insumos');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra Lateral Fija */}
      <SideBar currentView={view} onViewChange={setView} />

      {/* Contenedor Principal Dinámico */}
      <main className="flex-1 p-8">
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
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <p className="text-gray-600">Próximamente: Acá tu viejo va a poder combinar ingredientes y armar nuevas pastas.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;