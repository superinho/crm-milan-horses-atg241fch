import { useState, useEffect, useRef } from 'react'
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
  SidebarFooter,
  useSidebar,
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
  User,
  LogOut,
  Tag as TagIcon,
  FileText,
  Settings,
  Keyboard,
  Menu,
  Camera,
  Loader2,
  Gavel,
  Radar,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import supabase from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

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
  { label: 'Modelos', icon: FileText, path: '/modelos' },
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
  const { user } = useAuth()

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

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Link
          to="/perfil"
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent rounded-md p-2 transition-colors overflow-hidden"
          onClick={() => {
            if (isMobile && closeMobileMenu) closeMobileMenu()
          }}
        >
          <Avatar className="h-9 w-9 border border-secondary shrink-0">
            {user?.avatar && <AvatarImage src={user.avatar} />}
            <AvatarFallback>
              {user?.email?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span
              className="text-sm font-medium text-sidebar-foreground truncate"
              title={user?.name || user?.email}
            >
              {user?.name || user?.email?.split('@')[0]}
            </span>
            <span
              className="text-xs text-sidebar-foreground/60 truncate"
              title={user?.email}
            >
              {user?.email}
            </span>
          </div>
        </Link>
      </SidebarFooter>
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
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return
      if (!user) return

      setUploading(true)
      const extension = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl },
      })

      if (updateError) throw updateError

      toast({
        title: 'Foto atualizada',
        variant: 'success',
      })
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Erro no upload',
        description:
          'Falha ao atualizar foto. Verifique as permissões ou tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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

        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-secondary"></span>
        </div>

        {/* Hidden File Input for Avatar Upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleFileChange}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              {user?.avatar && <AvatarImage src={user.avatar} />}
              <AvatarFallback>
                {user?.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil">
                <User className="mr-2 h-4 w-4" /> Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAvatarClick} disabled={uploading}>
              <Camera className="mr-2 h-4 w-4" /> Alterar Foto
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
