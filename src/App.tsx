import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from './components/Layout'

import Index from './pages/Index'
import Contatos from './pages/Contatos'
import ContatoDetalhes from './pages/ContatoDetalhes'
import Negocios from './pages/Negocios'
import DealDetails from './pages/DealDetails'
import Campanhas from './pages/Campanhas'
import CampaignDetails from './pages/CampaignDetails'
import Automacoes from './pages/Automacoes'
import Tarefas from './pages/Tarefas'
import Relatorios from './pages/Relatorios'
import SmartLeiloes from './pages/SmartLeiloes'
import RadarVip from './pages/RadarVip'
import Tags from './pages/Tags'
import Modelos from './pages/Modelos'
import Configuracoes from './pages/Configuracoes'
import Perfil from './pages/Perfil'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-muted-foreground">
        Carregando sessão...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Layout />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/contatos/:id" element={<ContatoDetalhes />} />
            <Route path="/negocios" element={<Negocios />} />
            <Route path="/negocios/:id" element={<DealDetails />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/campanhas/:id" element={<CampaignDetails />} />
            <Route path="/automacoes" element={<Automacoes />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/leiloes" element={<SmartLeiloes />} />
            <Route path="/radar-vip" element={<RadarVip />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/modelos" element={<Modelos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
