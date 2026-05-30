interface NavItem {
  label: string;
  view: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Insumos', view: 'insumos', icon: '🧂' },
  { label: 'Rentabilidad', view: 'rentabilidad', icon: '📊' },
  { label: 'Creador de Recetas', view: 'recetas', icon: '📋' },
];

interface Props {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function SideBar({ currentView, onViewChange }: Props) {
  return (
    <aside className="min-h-screen w-64 bg-gray-900 text-white p-4 flex flex-col shrink-0">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight">🍝 PastaFlow</h1>
        <p className="text-xs text-gray-400 mt-1">Panel de Control</p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, view, icon }) => {
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
    </aside>
  );
}
