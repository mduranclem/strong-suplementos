import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const ownerTabs = [
  { to: '/ventas', icon: '🛒', label: 'Venta' },
  { to: '/historial', icon: '📋', label: 'Historial' },
  { to: '/catalogo', icon: '📦', label: 'Catálogo' },
  { to: '/combos', icon: '🎁', label: 'Combos' },
  { to: '/comisiones', icon: '💰', label: 'Comisiones' },
  { to: '/reportes', icon: '📊', label: 'Reportes' },
  { to: '/clientes', icon: '👤', label: 'Clientes' },
  { to: '/ajustes', icon: '⚙️', label: 'Ajustes' },
]

const sellerTabs = [
  { to: '/ventas', icon: '🛒', label: 'Venta' },
  { to: '/historial', icon: '📋', label: 'Historial' },
  { to: '/comisiones', icon: '💰', label: 'Comisiones' },
]

export function BottomNav() {
  const user = useAuthStore((s) => s.user)
  const tabs = user?.role === 'owner' ? ownerTabs : sellerTabs

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal"
    >
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center py-2 gap-0.5 min-h-touch text-xs font-medium transition-colors',
                isActive ? 'text-brand' : 'text-gray-500',
              ].join(' ')
            }
          >
            <span className="text-xl leading-none" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
