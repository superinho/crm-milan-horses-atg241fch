import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Megaphone,
  Zap,
  CheckSquare,
  BarChart3,
  Search,
  Bell,
  LogOut,
  Tag as TagIcon,
  Settings,
  Keyboard,
  Menu,
  Gavel,
  Radar,
  Wand2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import logoImg from '@/assets/editedimage_1769630541473-88067.png'
import { useAuth } from '@/hooks/use-auth'

// Modals & Search
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { ShortcutsHelp } from '@/components/help/ShortcutsHelp'
import { ContactForm } from '@/components/contacts/ContactForm'
import { DealForm } from '@/components/deals/DealForm'
import { TaskForm } from '@/components/tasks/TaskForm'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Contatos', icon: Users, path: '/contatos' },
  { label: 'Negócios', icon: Briefcase, path: '/negocios' },
  { label: 'Campanhas', icon: Megaphone, path: '/campanhas' },
  { label: 'Automações', icon: Zap, path: '/automacoes' },
  { label: 'Tarefas', icon: CheckSquare, path: '/tarefas' },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { label: 'Leilões', icon: Gavel, path: '/leiloes' },
  { label: 'Radar VIP', icon: Radar, path: '/radar-vip' },
  { label: 'Tags', icon: TagIcon, path: '/tags' },
  { label: 'Estúdio', icon: Wand2, path: '/modelos' },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
]

function AppSidebarContent({
  isMobile = false,
  closeMobileMenu,
}: {
  isMobile?: boolean
  closeMobileMenu?: () => void
}) {
  const location = useLocation()

  return (
    <>
      <SidebarHeader className="h-24 flex items-center justify-center border-b border-sidebar-border px-4 py-2">
        <div className="flex items-center gap-2 w-full overflow-hidden transition-all duration-300 justify-start group-data-[collapsible=icon]:justify-center">
          <img
            src={logoImg}
            alt="Milan Horses"
            className="h-20 w-auto object-contain transition-all duration-300 group-data-[collapsible=icon]:h-8 max-w-full"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  className={cn(
                    'w-full justify-start gap-3 px-3 py-6 transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:scale-[1.02]',
                    isActive &&
                      'bg-primary text-primary-foreground font-medium border-l-4 border-l-secondary shadow-sm hover:bg-primary/90',
                  )}
                  onClick={() => {
                    if (isMobile && closeMobileMenu) closeMobileMenu()
                  }}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        'size-5',
                        isActive
                          ? 'text-secondary'
                          : 'text-sidebar-foreground/70',
                      )}
                    />
                    <span
                      className={cn(
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-sidebar-foreground/90',
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  )
}

function AppSidebar() {
  return (
    <Sidebar
      variant="sidebar"
      side="left"
      collapsible="icon"
      className="print:hidden hidden md:flex"
    >
      <AppSidebarContent />
    </Sidebar>
  )
}

function TopHeader({
  onSearchClick,
  onHelpClick,
}: {
  onSearchClick: () => void
  onHelpClick: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Breadcrumb logic
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`
      let label =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

      // Manual overwrites for better UX
      if (segment === 'perfil') label = 'Meu Perfil'

      // Try to match segment with known routes for better labels
      const matchedNavItem = NAV_ITEMS.find((item) => item.path === path)
      const displayLabel = matchedNavItem ? matchedNavItem.label : label

      return { label: displayLabel, path }
    })

    return [{ label: 'Home', path: '/' }, ...breadcrumbs]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6 print:hidden">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Trigger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden -ml-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <AppSidebarContent
              isMobile
              closeMobileMenu={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 md:hidden">
          <img
            src={logoImg}
            alt="Milan Horses"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Desktop Sidebar Trigger */}
        <SidebarTrigger className="hidden md:flex" />

        {/* Breadcrumbs (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center text-sm text-muted-foreground">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={item.path} className="flex items-center">
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link to={item.path}>{item.label}</Link>
                        </BreadcrumbLink>
                      </>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div
          className="hidden md:flex relative w-64 lg:w-96 cursor-pointer ml-4"
          onClick={onSearchClick}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            readOnly
            placeholder="Buscar globalmente... (Ctrl+K)"
            className="w-full bg-gray-50 pl-9 focus-visible:ring-primary/20 cursor-pointer pointer-events-none h-9"
          />
          <div className="absolute right-2.5 top-2.5 pointer-events-none">
            <kbd className="inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onSearchClick}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onHelpClick}
          title="Atalhos de Teclado (Ctrl + /)"
          className="hidden md:flex"
        >
          <Keyboard className="h-5 w-5 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sair"
          className="md:hidden"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="hidden items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm md:flex">
          <div className="text-right leading-tight">
            <div className="font-medium text-primary">{user?.name}</div>
            <div className="max-w-40 truncate text-xs text-muted-foreground">
              {user?.email}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sair"
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-secondary"></span>
        </div>
      </div>
    </header>
  )
}

export default function Layout() {
  // Global States
  const [showSearch, setShowSearch] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowSearch((open) => !open)
      }
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowHelp((open) => !open)
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowContactModal((open) => !open)
      }
      if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowDealModal((open) => !open)
      }
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowTaskModal((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden w-full">
          <TopHeader
            onSearchClick={() => setShowSearch(true)}
            onHelpClick={() => setShowHelp(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in print:overflow-visible print:h-auto min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Modals */}
      <GlobalSearch open={showSearch} onOpenChange={setShowSearch} />
      <ShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />

      {/* Quick Action Modals */}
      <Sheet open={showContactModal} onOpenChange={setShowContactModal}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Contato (Global)</SheetTitle>
            <SheetDescription>
              Adicione um novo cliente ou lead.
            </SheetDescription>
          </SheetHeader>
          <ContactForm onSuccess={() => setShowContactModal(false)} />
        </SheetContent>
      </Sheet>

      <Dialog open={showDealModal} onOpenChange={setShowDealModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Negócio (Global)</DialogTitle>
          </DialogHeader>
          <DealForm
            onSuccess={() => setShowDealModal(false)}
            onCancel={() => setShowDealModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Tarefa (Global)</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSuccess={() => setShowTaskModal(false)}
            onCancel={() => setShowTaskModal(false)}
          />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
