import { useState, useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import DashboardView from './components/DashboardView';
import IngredientesView from './components/IngredientesView';
import LoginView from './components/LoginView';
import ProductosAnaliticaView from './components/ProductosAnaliticaView';
import SideBar from './components/SideBar';
import RecetasCreadorView from './components/RecetasCreadorView';
import ProduccionDiariaView from './components/ProduccionDiariaView';
import HistorialProduccionView from './components/HistorialProduccionView';
import VentasView from './components/VentasView';
import ProveedoresView from './components/ProveedoresView';
import InsightsComprasView from './components/InsightsComprasView';
import { useAuth } from './context/AuthContext';

// Vistas que solo puede ver un Admin
const ADMIN_ONLY_VIEWS = new Set(['dashboard', 'insumos', 'proveedores', 'insights-compras', 'rentabilidad', 'recetas', 'historial']);

function AccessDenied({ onRedirect }: { onRedirect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 select-none">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20">
        <span className="text-4xl">🔒</span>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          No tenés permisos para ver esta sección. Comunicate con el administrador si creés que es un error.
        </p>
      </div>
      <button
        onClick={onRedirect}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md"
      >
        🏭 Ir a Producción Diaria
      </button>
    </div>
  );
}

function ForbiddenToast({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-amber-400/40 bg-gray-900 px-4 py-3.5 text-sm text-amber-50 shadow-lg"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
      <p className="leading-relaxed">
        Acceso denegado. No tienes los permisos requeridos para realizar esta acción.
      </p>
    </div>
  );
}

function App() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.rol === 'Admin';

  const [forbiddenToastVisible, setForbiddenToastVisible] = useState(false);
  const forbiddenToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Operario arranca en producción; Admin en dashboard
  const [view, setView] = useState<string>(() => (isAdmin ? 'dashboard' : 'produccion'));

  useEffect(() => {
    const showForbiddenToast = () => {
      setForbiddenToastVisible(true);
      if (forbiddenToastTimerRef.current) clearTimeout(forbiddenToastTimerRef.current);
      forbiddenToastTimerRef.current = setTimeout(() => {
        setForbiddenToastVisible(false);
        forbiddenToastTimerRef.current = null;
      }, 4000);
    };

    window.addEventListener('api:forbidden', showForbiddenToast);
    return () => {
      window.removeEventListener('api:forbidden', showForbiddenToast);
      if (forbiddenToastTimerRef.current) clearTimeout(forbiddenToastTimerRef.current);
    };
  }, []);

  // Si el rol cambia (re-login con otro usuario), resetear la vista
  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_VIEWS.has(view)) {
      setView('produccion');
    }
  }, [isAdmin, view]);

  // Route guard: show Login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <ForbiddenToast visible={forbiddenToastVisible} />
        <LoginView />
      </>
    );
  }

  // Guardián de vista: Operario intentó llegar a una vista Admin
  const viewBlocked = !isAdmin && ADMIN_ONLY_VIEWS.has(view);

  return (
    <>
      <ForbiddenToast visible={forbiddenToastVisible} />
      <div className="flex min-h-screen bg-gray-50">
      {/* Barra Lateral Fija */}
      <SideBar currentView={view} onViewChange={setView} />

      {/* Contenedor Principal Dinámico */}
      <main className="flex-1 p-8 overflow-y-auto">
        {viewBlocked ? (
          <AccessDenied onRedirect={() => setView('produccion')} />
        ) : (
          <>
            {view === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel Principal</h2>
                <DashboardView onNavigate={setView} />
              </div>
            )}

            {view === 'insumos' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Insumos</h2>
                <IngredientesView />
              </div>
            )}

            {view === 'proveedores' && <ProveedoresView />}

            {view === 'insights-compras' && <InsightsComprasView />}

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

            {view === 'ventas' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Punto de Venta</h2>
                <VentasView />
              </div>
            )}

            {view === 'historial' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Producción</h2>
                <HistorialProduccionView />
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </>
  );
}

export default App;