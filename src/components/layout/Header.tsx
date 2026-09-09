import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Shield, Zap } from 'lucide-react'
import { ELDLogo } from '@/components/ui/ELDLogo'
import { useWorkspace, UserRole } from '@/context/WorkspaceContext'

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const navigate = useNavigate()
  const { currentUser, isStandbyMode } = useWorkspace()

  const handleLogout = () => {
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
        {/* Supabase vs Standby Indicator */}
        {isStandbyMode ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-800">
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Modo Standby (Local)</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Conectado</span>
          </div>
        )}

        {/* Notifications */}
        <button
          onClick={() => navigate('/dashboard')}
          className="relative p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-colors focus:outline-none"
          title="Notificações e Alertas"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-5 w-px bg-zinc-200 hidden sm:block" />

        {/* User Card */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-brand-500 font-bold text-xs flex items-center justify-center border border-zinc-800 shadow-xs">
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
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sair da sessão"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
