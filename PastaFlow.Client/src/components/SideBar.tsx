import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  view: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',             view: 'dashboard',   icon: '🏠', adminOnly: true  },
  { label: 'Insumos',               view: 'insumos',     icon: '🧂', adminOnly: true  },
  { label: 'Proveedores',           view: 'proveedores', icon: '🚚', adminOnly: true  },
  { label: 'Insights de Compras',   view: 'insights-compras', icon: '✨', adminOnly: true  },
  { label: 'Rentabilidad',          view: 'rentabilidad',icon: '📊', adminOnly: true  },
  { label: 'Creador de Recetas',    view: 'recetas',     icon: '📋', adminOnly: true  },
  { label: 'Producción Diaria',     view: 'produccion',  icon: '🏭'                   },
  { label: 'Punto de Venta',        view: 'ventas',      icon: '🛒'                   },
  { label: 'Historial de Producción', view: 'historial', icon: '📜', adminOnly: true  },
];

interface Props {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function SideBar({ currentView, onViewChange }: Props) {
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'Admin';
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="min-h-screen w-64 bg-gray-900 text-white p-4 flex flex-col shrink-0">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight">🍝 PastaFlow</h1>
        <p className="text-xs text-gray-400 mt-1">Panel de Control</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {visibleItems.map(({ label, view, icon }) => {
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="mt-auto pt-4 border-t border-gray-700/60">
        <div className="px-2 mb-3">
          <p className="text-xs text-gray-500">Sesión iniciada como</p>
          <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
          <span className="inline-block mt-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5">
            {user?.rol}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-600/10 hover:text-red-400 transition-colors"
        >
          <span className="text-base leading-none">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
