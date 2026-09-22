import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  LogOut,
  Menu,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { ELDLogo } from '@/components/ui/ELDLogo'
import { useWorkspace, UserRole } from '@/context/WorkspaceContext'

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate()
  const { currentUser, isStandbyMode, tasks, approvals, meetings, logout } = useWorkspace()

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Dynamic alerts
  const urgentTasks = tasks.filter((t) => t.priority === 'urgente' && t.status !== 'concluido')
  const pendingApprovals = approvals.filter(
    (a) => a.status === 'pendente_interno' || a.status === 'aguardando_cliente'
  )
  const upcomingMeetings = meetings.filter((m) => m.status === 'agendada')
  const totalAlerts = urgentTasks.length + pendingApprovals.length + upcomingMeetings.length

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false)
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Diretoria'
      case 'comercial':
        return 'Comercial'
      case 'operacional':
        return 'Operação'
      case 'financeiro':
        return 'Financeiro'
      default:
        return role
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-4 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg focus:outline-none transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <ELDLogo variant="orange" size="md" showSubtitle subtitle="WORKSPACE" />
        </div>
      </div>

      {/* Center/Right Status & Profile Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Only show standby indicator if actually operating in local standby */}
        {isStandbyMode && (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-800"
            title="Operando com armazenamento local temporário"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Modo Offline (Local)</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className={`relative p-2 rounded-lg transition-colors focus:outline-none ${
              isNotificationsOpen
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
            title="Notificações e Alertas"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-brand-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-white">
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-zinc-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-3.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-zinc-900">
                    Notificações & Pendências
                  </span>
                </div>
                {totalAlerts > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">
                    {totalAlerts} ativa(s)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Em dia
                  </span>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 scrollbar-thin">
                {totalAlerts === 0 ? (
                  <div className="p-6 text-center space-y-1.5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-800">Tudo em dia!</p>
                    <p className="text-[11px] text-zinc-500">
                      Não há tarefas urgentes ou materiais pendentes de aprovação no momento.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Urgent tasks */}
                    {urgentTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          navigate('/tarefas')
                        }}
                        className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-start gap-3 group"
                      >
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                              Tarefa Urgente
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {task.clientName || 'Geral'} • {task.responsible}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Pending Approvals */}
                    {pendingApprovals.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          navigate('/aprovacoes')
                        }}
                        className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-start gap-3 group"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Aprovação Pendente
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {item.clientName} • v{item.version}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Upcoming Meetings */}
                    {upcomingMeetings.slice(0, 2).map((meeting) => (
                      <div
                        key={meeting.id}
                        onClick={() => {
                          setIsNotificationsOpen(false)
                          navigate('/reunioes')
                        }}
                        className="p-3 hover:bg-zinc-50 transition-colors cursor-pointer flex items-start gap-3 group"
                      >
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                              Reunião Agendada
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 truncate">
                            {meeting.title}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {meeting.relatedToName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer action */}
              <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false)
                    navigate('/dashboard')
                  }}
                  className="text-zinc-600 hover:text-brand-600 font-medium transition-colors"
                >
                  Ver no Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false)
                    navigate('/tarefas')
                  }}
                  className="text-brand-600 hover:text-brand-700 font-semibold transition-colors flex items-center gap-1"
                >
                  Ver Todas as Tarefas <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

        {/* User Card (clickable to settings) */}
        <button
          onClick={() => navigate('/configuracoes')}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-100/80 transition-colors text-left focus:outline-none"
          title="Ver configurações e perfil"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-brand-500 font-bold text-xs flex items-center justify-center border border-zinc-800 shadow-xs shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-200/60">
                <Shield className="w-2.5 h-2.5 mr-0.5" />
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 font-normal truncate max-w-[140px]">
              {currentUser.email}
            </div>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sair da sessão"
          aria-label="Sair da sessão"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
