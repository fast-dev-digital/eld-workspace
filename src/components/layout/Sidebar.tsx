import React from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  Building2,
  FolderKanban,
  CheckSquare,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  DollarSign,
  Settings,
  X,
  Sparkles,
} from 'lucide-react'
import { useWorkspace, UserRole } from '@/context/WorkspaceContext'

interface SidebarProps {
  isMobileOpen: boolean
  onCloseMobile: () => void
}

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: number
  roles?: UserRole[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { leads, tasks, approvals, meetings } = useWorkspace()

  // Dynamic counts for quick visual feedback
  const leadsHotCount = leads.filter((l) => l.temperature === 'quente').length
  const pendingTasksCount = tasks.filter((t) => t.status !== 'concluido').length
  const pendingApprovalsCount = approvals.filter(
    (a) => a.status === 'pendente_interno' || a.status === 'aguardando_cliente'
  ).length
  const upcomingMeetingsCount = meetings.filter((m) => m.status === 'agendada').length

  const navGroups: NavGroup[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        {
          label: 'Dashboard & Métricas',
          to: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'COMERCIAL / CRM',
      items: [
        {
          label: 'Funil de Vendas (CRM)',
          to: '/crm',
          icon: <Target className="w-4 h-4" />,
          badge: leadsHotCount > 0 ? leadsHotCount : undefined,
          roles: ['admin', 'comercial'],
        },
        {
          label: 'Reuniões & Atas',
          to: '/reunioes',
          icon: <CalendarCheck className="w-4 h-4" />,
          badge: upcomingMeetingsCount > 0 ? upcomingMeetingsCount : undefined,
          roles: ['admin', 'comercial', 'operacional'],
        },
      ],
    },
    {
      title: 'OPERAÇÃO & ENTREGAS',
      items: [
        {
          label: 'Gestão de Clientes',
          to: '/clientes',
          icon: <Building2 className="w-4 h-4" />,
          roles: ['admin', 'comercial', 'operacional', 'financeiro'],
        },
        {
          label: 'Gestão de Projetos',
          to: '/projetos',
          icon: <FolderKanban className="w-4 h-4" />,
          roles: ['admin', 'operacional', 'comercial'],
        },
        {
          label: 'Gestão de Tarefas',
          to: '/tarefas',
          icon: <CheckSquare className="w-4 h-4" />,
          badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
          roles: ['admin', 'operacional', 'comercial'],
        },
        {
          label: 'Briefings',
          to: '/briefings',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          roles: ['admin', 'operacional', 'comercial'],
        },
        {
          label: 'Aprovações & Entregas',
          to: '/aprovacoes',
          icon: <CheckCircle2 className="w-4 h-4" />,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          roles: ['admin', 'operacional', 'comercial'],
        },
      ],
    },
    {
      title: 'GESTÃO & CONTRATOS',
      items: [
        {
          label: 'Contratos & Documentos',
          to: '/contratos',
          icon: <FileText className="w-4 h-4" />,
          roles: ['admin', 'financeiro', 'comercial'],
        },
        {
          label: 'Gestão Financeira',
          to: '/financeiro',
          icon: <DollarSign className="w-4 h-4" />,
          roles: ['admin', 'financeiro'],
        },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        {
          label: 'Configurações & Dados',
          to: '/configuracoes',
          icon: <Settings className="w-4 h-4" />,
          roles: ['admin'],
        },
      ],
    },
  ]

  const isRoleAllowed = (_allowedRoles?: UserRole[]) => {
    // Acesso centralizado unificado: todos os módulos disponíveis
    return true
  }

  const content = (
    <aside className="w-64 h-full bg-white border-r border-zinc-200 flex flex-col justify-between select-none">
      <div className="p-3.5 overflow-y-auto space-y-5 scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => isRoleAllowed(item.roles))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title} className="space-y-1">
              <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {group.title}
              </h2>
              <div className="space-y-0.5 mt-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all',
                        isActive
                          ? 'bg-brand-50/80 text-brand-700 font-semibold border border-brand-200/70 shadow-xs'
                          : 'text-zinc-600 font-medium hover:bg-zinc-100/70 hover:text-zinc-900'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0 text-current">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Branding Box */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-zinc-700">Operação ELD Ativa</span>
          </div>
          <span className="text-[10px] font-semibold text-brand-600 flex items-center gap-0.5">
            <Sparkles className="w-3 h-3" /> v1.0
          </span>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 flex-1 max-w-xs w-full bg-white h-full flex flex-col">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-900">Menu de Navegação</span>
              <button onClick={onCloseMobile} className="p-1 text-zinc-500 hover:bg-zinc-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
