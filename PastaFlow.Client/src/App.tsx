import { useState } from 'react';
import IngredientesView from './components/IngredientesView';
import ProductosAnaliticaView from './components/ProductosAnaliticaView';

function App() {
  const [rentabilidadKey, setRentabilidadKey] = useState<number>(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PastaFlow - Panel de Control</h1>
          <p className="text-gray-600">Gestión de insumos, recetas y costos de fabricación.</p>
        </header>

        <main>
          <IngredientesView onCostoActualizado={() => setRentabilidadKey((k) => k + 1)} />
          <ProductosAnaliticaView refreshKey={rentabilidadKey} />
        </main>
      </div>
    </div>
  );
}

export default App;