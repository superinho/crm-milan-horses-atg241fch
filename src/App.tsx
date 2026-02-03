import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'

import Index from './pages/Index'
import Contatos from './pages/Contatos'
import ContatoDetalhes from './pages/ContatoDetalhes'
import Negocios from './pages/Negocios'
import Campanhas from './pages/Campanhas'
import Automacoes from './pages/Automacoes'
import Tarefas from './pages/Tarefas'
import Relatorios from './pages/Relatorios'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/contatos" element={<Contatos />} />
          <Route path="/contatos/:id" element={<ContatoDetalhes />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/automacoes" element={<Automacoes />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
