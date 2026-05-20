import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useAuthInit } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/Login'
import { VentasPage } from './pages/Ventas'
import { CatalogoPage } from './pages/Catalogo'
import { CombosPage } from './pages/Combos'
import { ComisionesPage } from './pages/Comisiones'
import { ReportesPage } from './pages/Reportes'
import { ClientesPage } from './pages/Clientes'
import { AjustesPage } from './pages/Ajustes'
import { HistorialPage } from './pages/Historial'

function OwnerOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'owner') return <Navigate to="/ventas" replace />
  return <>{children}</>
}

export function App() {
  useAuthInit()
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/ventas" replace />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/comisiones" element={<ComisionesPage />} />
          <Route path="/catalogo" element={<OwnerOnly><CatalogoPage /></OwnerOnly>} />
          <Route path="/combos" element={<OwnerOnly><CombosPage /></OwnerOnly>} />
          <Route path="/reportes" element={<OwnerOnly><ReportesPage /></OwnerOnly>} />
          <Route path="/clientes" element={<OwnerOnly><ClientesPage /></OwnerOnly>} />
          <Route path="/ajustes" element={<OwnerOnly><AjustesPage /></OwnerOnly>} />
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="*" element={<Navigate to="/ventas" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
