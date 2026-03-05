import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { AuthProvider } from '@/hooks/use-auth'

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
import Tags from './pages/Tags'
import Modelos from './pages/Modelos'
import Configuracoes from './pages/Configuracoes'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

const App = () => (
  <AuthProvider>
    <BrowserRouter
      future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Redirect /login directly to the admin dashboard */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          <Route element={<Layout />}>
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
            <Route path="/tags" element={<Tags />} />
            <Route path="/modelos" element={<Modelos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
