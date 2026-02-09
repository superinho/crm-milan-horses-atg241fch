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
import logoImg from '@/assets/editedimage_1769630541473-88067.png'
import { useAuth } from '@/hooks/use-auth'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Contatos', icon: Users, path: '/contatos' },
  { label: 'Negócios', icon: Briefcase, path: '/negocios' },
  { label: 'Campanhas', icon: Megaphone, path: '/campanhas' },
  { label: 'Automações', icon: Zap, path: '/automacoes' },
  { label: 'Tarefas', icon: CheckSquare, path: '/tarefas' },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { label: 'Tags', icon: TagIcon, path: '/tags' },
  { label: 'Modelos', icon: FileText, path: '/modelos' },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
]

function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <Sidebar
      variant="sidebar"
      side="left"
      collapsible="icon"
      className="print:hidden"
    >
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
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9 border border-secondary">
            <AvatarImage
              src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user?.id}`}
            />
            <AvatarFallback>
              {user?.email?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span
              className="text-sm font-medium text-sidebar-foreground truncate"
              title={user?.email}
            >
              {user?.email?.split('@')[0]}
            </span>
            <span
              className="text-xs text-sidebar-foreground/60 truncate"
              title={user?.email}
            >
              {user?.email}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function TopHeader() {
  const { isMobile, toggleSidebar } = useSidebar()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6 print:hidden">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 md:hidden" />

        <div className="flex items-center gap-2 md:hidden">
          <img
            src={logoImg}
            alt="Milan Horses"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="hidden md:flex relative w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar contatos, negócios ou tarefas..."
            className="w-full bg-gray-50 pl-9 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-secondary"></span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user?.id}`}
              />
              <AvatarFallback>
                {user?.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> Perfil
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
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in print:overflow-visible print:h-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
