import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useWorkspace } from '@/context/WorkspaceContext'
import { formatCurrency } from '@/lib/formatters'
import {
  Users,
  Target,
  FolderKanban,
  CheckSquare,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    currentUser,
    leads,
    clients,
    projects,
    tasks,
    approvals,
    meetings,
    transactions,
  } = useWorkspace()

  // Calculated KPIs
  const activeClients = clients.filter((c) => c.status === 'ativo' || c.status === 'onboarding')
  const totalMRR = activeClients.reduce((acc, c) => acc + (c.monthlyValue || 0), 0)

  const activeLeads = leads.filter((l) => l.stage !== 'cliente')
  const totalPipelineValue = activeLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
  const hotLeads = leads.filter((l) => l.temperature === 'quente')

  const activeProjects = projects.filter((p) => p.status === 'em_andamento' || p.status === 'planejamento' || p.status === 'em_revisao')
  const avgProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
    : 0

  const pendingTasks = tasks.filter((t) => t.status !== 'concluido')
  const urgentTasks = tasks.filter((t) => t.priority === 'urgente' && t.status !== 'concluido')

  const pendingApprovals = approvals.filter(
    (a) => a.status === 'pendente_interno' || a.status === 'aguardando_cliente'
  )

  const upcomingMeetings = meetings.filter((m) => m.status === 'agendada')

  // Financial calculations
  const totalReceitas = transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.value, 0)

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.value, 0)

  const saldoLiquido = totalReceitas - totalDespesas

  // Dynamic chart data derived from actual transactions
  const monthMap: Record<string, { mes: string; Receitas: number; Despesas: number }> = {}

  transactions.forEach((tx) => {
    const rawDate = tx.competenceDate || tx.dueDate
    let monthKey = 'Atual'
    if (rawDate) {
      try {
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) {
          monthKey = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        }
      } catch {
        monthKey = 'Atual'
      }
    }
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { mes: monthKey, Receitas: 0, Despesas: 0 }
    }
    if (tx.type === 'receita') {
      monthMap[monthKey].Receitas += tx.value
    } else {
      monthMap[monthKey].Despesas += tx.value
    }
  })

  const rawChartData = Object.values(monthMap)
  const financialChartData = rawChartData.length > 0
    ? rawChartData
    : [{ mes: 'Sem lançamentos', Receitas: 0, Despesas: 0 }]

  return (
    <div className="space-y-6">
      {/* Top Banner with Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Dashboard Executivo
            </h1>
            <Badge variant="orange">Visão Geral</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Olá, <strong className="text-zinc-800 font-semibold">{currentUser.name}</strong>. Visão consolidada da
            operação comercial, projetos, entregas e finanças da agência.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Novo Lead
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tarefas')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Nova Tarefa
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/financeiro')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Lançamento Financeiro
          </Button>
        </div>
      </div>

      {/* Daily Smart Highlights Banner */}
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-brand-500 text-white rounded-xl shadow-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-brand-400">
                  Resumo Operacional do Dia
                </span>
                <Badge variant="dark" size="sm" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  Tempo Real
                </Badge>
              </div>
              <p className="text-sm font-medium text-zinc-200">
                A agência possui <strong className="text-brand-400">{activeClients.length} clientes ativos</strong> gerando{' '}
                <strong className="text-emerald-400">{formatCurrency(totalMRR)}/mês</strong> em recorrência,{' '}
                <strong className="text-brand-400">{activeLeads.length} leads em negociação</strong> ({formatCurrency(totalPipelineValue)}) e{' '}
                <strong className="text-amber-400">{pendingApprovals.length} materiais em aprovação</strong>.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="self-start lg:self-auto bg-brand-500 hover:bg-brand-600 font-bold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/crm')}
          >
            Ver Funil Comercial
          </Button>
        </div>
      </Card>

      {/* 4 Main Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Clientes Ativos & MRR */}
        <Card className="space-y-2 hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Clientes & MRR</span>
            <div className="p-1.5 rounded-lg bg-zinc-100 text-brand-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{activeClients.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +100% Retenção
            </span>
          </div>
          <div className="text-xs text-zinc-600 font-medium flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>MRR Recorrente:</span>
            <span className="text-zinc-900 font-semibold tabular-nums">{formatCurrency(totalMRR)}</span>
          </div>
        </Card>

        {/* KPI 2: Pipeline Comercial */}
        <Card className="space-y-2 hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Leads no Funil</span>
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{activeLeads.length}</span>
            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
              {hotLeads.length} Quentes 🔥
            </span>
          </div>
          <div className="text-xs text-zinc-600 font-medium flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>Pipeline Total:</span>
            <span className="text-brand-600 font-semibold tabular-nums">{formatCurrency(totalPipelineValue)}</span>
          </div>
        </Card>

        {/* KPI 3: Projetos e Tarefas */}
        <Card className="space-y-2 hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Projetos & Produção</span>
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{activeProjects.length} Ativos</span>
            <span className="text-xs font-semibold text-zinc-600">{avgProgress}% progresso</span>
          </div>
          <div className="text-xs text-zinc-600 font-medium flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>Tarefas Abertas:</span>
            <span className="text-zinc-900 font-semibold tabular-nums">{pendingTasks.length} tarefas</span>
          </div>
        </Card>

        {/* KPI 4: Saldo e Resultado Financeiro */}
        <Card className="space-y-2 hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Resultado Operacional</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-emerald-600 tracking-tight">{formatCurrency(saldoLiquido)}</span>
            <Badge variant="green" size="sm">
              Positivo
            </Badge>
          </div>
          <div className="text-xs text-zinc-600 font-medium flex items-center justify-between pt-1 border-t border-zinc-100">
            <span>Receitas vs Despesas:</span>
            <span className="text-zinc-900 font-semibold tabular-nums">
              {formatCurrency(totalReceitas)} / {formatCurrency(totalDespesas)}
            </span>
          </div>
        </Card>
      </div>

      {/* Middle Grid: Financial Performance Chart + Priorities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900">Evolução Financeira (Receitas x Despesas)</h2>
              <p className="text-xs text-zinc-500">Histórico dos últimos meses e projeção atual da agência</p>
            </div>
            <Badge variant="orange">Fluxo Financeiro</Badge>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(val) => `R$${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Receitas" fill="#ff5500" radius={[4, 4, 0, 0]} name="Receitas (Entradas)" />
                <Bar dataKey="Despesas" fill="#18181b" radius={[4, 4, 0, 0]} name="Despesas (Saídas)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priorities & Action Required */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-brand-500" />
                <h2 className="text-sm font-extrabold text-zinc-900">Atenções Prioritárias</h2>
              </div>
              <Badge variant="red" size="sm">
                Ação
              </Badge>
            </div>

            <div className="space-y-2.5">
              {urgentTasks.length > 0 && (
                <div
                  onClick={() => navigate('/tarefas')}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 cursor-pointer hover:bg-rose-100/70 hover:shadow-xs transition-all"
                  title="Ir para Tarefas"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span>{urgentTasks.length} Tarefa(s) Urgente(s)</span>
                    <Badge variant="red" size="sm">Urgente</Badge>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    {urgentTasks[0].title} ({urgentTasks[0].clientName})
                  </p>
                </div>
              )}

              {pendingApprovals.length > 0 && (
                <div
                  onClick={() => navigate('/aprovacoes')}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 cursor-pointer hover:bg-amber-100/70 hover:shadow-xs transition-all"
                  title="Ir para Aprovações"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>{pendingApprovals.length} Material(is) em Aprovação</span>
                    <Badge variant="yellow" size="sm">Aprovação</Badge>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {pendingApprovals[0].title} • {pendingApprovals[0].clientName}
                  </p>
                </div>
              )}

              {upcomingMeetings.length > 0 && (
                <div
                  onClick={() => navigate('/reunioes')}
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 cursor-pointer hover:bg-zinc-100 hover:shadow-xs transition-all"
                  title="Ir para Reuniões"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" /> Próxima Reunião
                    </span>
                    <Badge variant="gray" size="sm">Agendada</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    {upcomingMeetings[0].title} ({upcomingMeetings[0].relatedToName})
                  </p>
                </div>
              )}

              {urgentTasks.length === 0 && pendingApprovals.length === 0 && upcomingMeetings.length === 0 && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-center space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                  <div className="text-xs font-semibold text-emerald-900">Tudo em dia!</div>
                  <p className="text-[11px] text-emerald-700">
                    Nenhuma tarefa urgente, aprovação pendente ou reunião agendada no momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate('/aprovacoes')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ver Central de Entregas
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Modules Quick Navigator */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Navegação Rápida</h2>
            <p className="text-xs text-zinc-500">Acesse diretamente as áreas e fluxos de gestão da agência</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { title: 'Comercial / CRM', to: '/crm', icon: <Target className="w-4 h-4" /> },
            { title: 'Gestão de Clientes', to: '/clientes', icon: <Users className="w-4 h-4" /> },
            { title: 'Gestão de Projetos', to: '/projetos', icon: <FolderKanban className="w-4 h-4" /> },
            { title: 'Gestão de Tarefas', to: '/tarefas', icon: <CheckSquare className="w-4 h-4" /> },
            { title: 'Briefings', to: '/briefings', icon: <Clock className="w-4 h-4" /> },
            { title: 'Aprovações & Entregas', to: '/aprovacoes', icon: <CheckCircle2 className="w-4 h-4" /> },
            { title: 'Reuniões & Atas', to: '/reunioes', icon: <Calendar className="w-4 h-4" /> },
            { title: 'Contratos & Docs', to: '/contratos', icon: <FileText className="w-4 h-4" /> },
            { title: 'Financeiro', to: '/financeiro', icon: <DollarSign className="w-4 h-4" /> },
            { title: 'Configurações', to: '/configuracoes', icon: <Sparkles className="w-4 h-4" /> },
          ].map((mod) => (
            <button
              key={mod.to}
              onClick={() => navigate(mod.to)}
              className="p-3 text-left rounded-xl border border-zinc-200/80 bg-white hover:border-brand-500/50 hover:bg-brand-50/20 hover:shadow-xs transition-all group flex items-center gap-2.5"
            >
              <div className="p-2 rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shrink-0">
                {mod.icon}
              </div>
              <div className="text-xs font-semibold text-zinc-800 group-hover:text-brand-600 transition-colors truncate">
                {mod.title}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
