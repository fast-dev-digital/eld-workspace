import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import {
  FinancialTransaction,
  FinancialType,
  FinancialStatus,
} from '@/types/workspace.types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { exportTransactionsCSV, exportDRECSV } from '@/lib/exportUtils'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Edit2,
  Trash2,
  Calendar,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

export const FinancialPage: React.FC = () => {
  const { transactions, clients, addTransaction, updateTransaction, deleteTransaction } =
    useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    type: 'receita' as FinancialType,
    description: '',
    category: 'Honorários Recorrentes (MRR)',
    clientId: '',
    clientName: '',
    supplier: '',
    value: 0,
    competenceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pendente' as FinancialStatus,
    paymentMethod: 'pix' as 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'outro',
    isRecurring: false,
    notes: '',
  })

  const openNewModal = (defaultType: FinancialType = 'receita') => {
    setEditingTransaction(null)
    const firstClient = clients[0]
    setFormData({
      type: defaultType,
      description: '',
      category: defaultType === 'receita' ? 'Honorários Recorrentes (MRR)' : 'Ferramentas & Softwares',
      clientId: defaultType === 'receita' && firstClient ? firstClient.id : '',
      clientName: defaultType === 'receita' && firstClient ? firstClient.tradeName : '',
      supplier: '',
      value: 0,
      competenceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pendente',
      paymentMethod: 'pix',
      isRecurring: false,
      notes: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      clientId: transaction.clientId || '',
      clientName: transaction.clientName || '',
      supplier: transaction.supplier || '',
      value: transaction.value,
      competenceDate: transaction.competenceDate,
      dueDate: transaction.dueDate,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      isRecurring: transaction.isRecurring,
      notes: transaction.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    let clientName: string | undefined = undefined
    if (formData.type === 'receita' && formData.clientId) {
      const c = clients.find((item) => item.id === formData.clientId)
      clientName = c ? c.tradeName : ''
    }

    const payload = {
      ...formData,
      clientName,
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload)
    } else {
      addTransaction(payload)
    }
    setIsModalOpen(false)
  }

  const handleDeleteTransaction = (id: string, desc: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lançamento "${desc}"?`)) {
      deleteTransaction(id)
    }
  }

  const markAsPaid = (transaction: FinancialTransaction) => {
    const nextStatus: FinancialStatus =
      transaction.type === 'receita' ? 'recebido' : 'pago'
    updateTransaction(transaction.id, {
      status: nextStatus,
      paymentDate: new Date().toISOString().split('T')[0],
    })
  }

  // Lista de meses identificados dinamicamente nos lançamentos
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    transactions.forEach((tx) => {
      const d = tx.competenceDate || tx.dueDate
      if (d && d.length >= 7) {
        monthsSet.add(d.slice(0, 7))
      }
    })
    return Array.from(monthsSet).sort().reverse()
  }, [transactions])

  const formatMonthKey = (ym: string) => {
    try {
      const [year, month] = ym.split('-')
      const d = new Date(Number(year), Number(month) - 1, 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      return label.charAt(0).toUpperCase() + label.slice(1)
    } catch {
      return ym
    }
  }

  const getPeriodLabel = () => {
    if (filterPeriod === 'all') return 'Todo o Histórico'
    if (filterPeriod === 'this_month') return 'Mês Atual'
    if (filterPeriod === 'last_month') return 'Mês Anterior'
    if (filterPeriod === 'last_30_days') return 'Últimos 30 Dias'
    if (filterPeriod === 'last_90_days') return 'Últimos 90 Dias'
    if (filterPeriod === 'this_year') return `Ano Atual (${new Date().getFullYear()})`
    if (filterPeriod === 'custom') {
      return `Personalizado: ${formatDate(customStartDate)} até ${formatDate(customEndDate)}`
    }
    if (filterPeriod.startsWith('month:')) {
      return formatMonthKey(filterPeriod.replace('month:', ''))
    }
    return filterPeriod
  }

  // Filtragem inicial das transações pelo período selecionado
  const periodTransactions = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return transactions.filter((tx) => {
      if (filterPeriod === 'all') return true
      const dateStr = tx.competenceDate || tx.dueDate
      if (!dateStr) return true
      const txDate = new Date(dateStr + 'T00:00:00')

      if (filterPeriod === 'this_month') {
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth
      }
      if (filterPeriod === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
        return (
          txDate.getFullYear() === lastMonthDate.getFullYear() &&
          txDate.getMonth() === lastMonthDate.getMonth()
        )
      }
      if (filterPeriod === 'last_30_days') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return txDate >= past30 && txDate <= now
      }
      if (filterPeriod === 'last_90_days') {
        const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        return txDate >= past90 && txDate <= now
      }
      if (filterPeriod === 'this_year') {
        return txDate.getFullYear() === currentYear
      }
      if (filterPeriod.startsWith('month:')) {
        const targetYM = filterPeriod.replace('month:', '')
        return dateStr.startsWith(targetYM)
      }
      if (filterPeriod === 'custom') {
        if (customStartDate && dateStr < customStartDate) return false
        if (customEndDate && dateStr > customEndDate) return false
        return true
      }
      return true
    })
  }, [transactions, filterPeriod, customStartDate, customEndDate])

  // Summary Metrics calculadas com base nas transações do período
  const totalReceitas = periodTransactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.value, 0)

  const totalRecebido = periodTransactions
    .filter((t) => t.type === 'receita' && t.status === 'recebido')
    .reduce((acc, t) => acc + t.value, 0)

  const totalReceitasPendentes = periodTransactions
    .filter((t) => t.type === 'receita' && t.status === 'pendente')
    .reduce((acc, t) => acc + t.value, 0)

  const totalDespesas = periodTransactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.value, 0)

  const saldoLiquido = totalReceitas - totalDespesas
  const margemLucro = totalReceitas > 0 ? Math.round((saldoLiquido / totalReceitas) * 100) : 0
  const metaFaturamento = 35000
  const progressoMeta = Math.min(100, Math.round((totalReceitas / metaFaturamento) * 100))

  const filteredTransactions = periodTransactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' || t.type === filterType
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: FinancialStatus) => {
    switch (status) {
      case 'recebido':
      case 'pago':
        return <Badge variant="green" size="sm">Efetivado ✓</Badge>
      case 'pendente':
        return <Badge variant="yellow" size="sm">Pendente</Badge>
      case 'vencido':
        return <Badge variant="red" size="sm">Vencido</Badge>
      case 'cancelado':
      default:
        return <Badge variant="gray" size="sm">Cancelado</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Gestão Financeira
            </h1>
            <Badge variant="orange">Fluxo de Caixa & Metas</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Controle de entradas, saídas, honorários mensais recorrentes (MRR), DRE e metas da agência.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTransactionsCSV(filteredTransactions, getPeriodLabel())}
            leftIcon={<Download className="w-4 h-4" />}
            title="Exportar lançamentos filtrados em formato CSV compatível com Excel"
          >
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDRECSV(periodTransactions, getPeriodLabel())}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            title="Exportar Demonstração do Resultado do Exercício consolidada"
          >
            DRE Gerencial
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openNewModal('despesa')}
            leftIcon={<ArrowDownRight className="w-4 h-4 text-rose-600" />}
          >
            Nova Despesa
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openNewModal('receita')}
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Active Period Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-600">Período de Análise:</span>
          <Badge variant="orange" size="sm" className="gap-1 font-semibold">
            <Calendar className="w-3 h-3" /> {getPeriodLabel()}
          </Badge>
          <span className="text-[11px] text-zinc-400">
            ({periodTransactions.length} lançamentos no período)
          </span>
        </div>
        {filterPeriod !== 'all' && (
          <button
            onClick={() => {
              setFilterPeriod('all')
              setCustomStartDate('')
              setCustomEndDate('')
            }}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 self-start sm:self-auto"
          >
            Redefinir para todo o histórico
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Total Receitas</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{formatCurrency(totalReceitas)}</span>
            <Badge variant="green" size="sm">+{totalReceitasPendentes > 0 ? formatCurrency(totalReceitasPendentes) : '0'} prev.</Badge>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">
            Recebido efetivo: <strong className="font-semibold text-zinc-800">{formatCurrency(totalRecebido)}</strong>
          </p>
        </Card>

        {/* Saídas */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Total Despesas</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{formatCurrency(totalDespesas)}</span>
            <Badge variant="red" size="sm">Saídas</Badge>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">
            Ferramentas, equipe e impostos
          </p>
        </Card>

        {/* Saldo Líquido */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Saldo Operacional</span>
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-brand-600 tracking-tight">{formatCurrency(saldoLiquido)}</span>
            <Badge variant="orange" size="sm">{margemLucro}% Margem</Badge>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">
            Resultado líquido do período
          </p>
        </Card>

        {/* Meta de Faturamento */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Meta do Mês</span>
            <span className="text-xs font-bold tabular-nums text-zinc-900">{progressoMeta}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-zinc-900 tracking-tight">{formatCurrency(metaFaturamento)}</span>
            <span className="text-[11px] font-semibold text-brand-600">Alvo Q3</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 mt-1">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressoMeta}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar lançamento por descrição, categoria ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-zinc-800 font-medium cursor-pointer"
            >
              <option value="all">Todo o Histórico</option>
              <option value="this_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="last_30_days">Últimos 30 Dias</option>
              <option value="last_90_days">Últimos 90 Dias</option>
              <option value="this_year">Ano Vigente ({new Date().getFullYear()})</option>
              {availableMonths.length > 0 && (
                <optgroup label="Meses Específicos">
                  {availableMonths.map((ym) => (
                    <option key={ym} value={`month:${ym}`}>
                      {formatMonthKey(ym)}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="custom">Personalizado...</option>
            </select>
          </div>

          {filterPeriod === 'custom' && (
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-1.5 py-0.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                title="Data Inicial"
              />
              <span className="text-zinc-400 text-[10px]">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-1.5 py-0.5 border border-zinc-200 rounded text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                title="Data Final"
              />
            </div>
          )}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas (Receitas e Despesas)</option>
            <option value="receita">Apenas Receitas (+)</option>
            <option value="despesa">Apenas Despesas (-)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos os Status</option>
            <option value="recebido">Recebido / Pago</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <Card noPadding className="overflow-hidden border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Descrição / Lançamento</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Vínculo</th>
                <th className="p-3">Vencimento</th>
                <th className="p-3">Forma Pagto</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="Nenhum lançamento encontrado"
                      description={
                        searchTerm || filterType !== 'all' || filterStatus !== 'all'
                          ? 'Nenhum lançamento corresponde aos filtros selecionados.'
                          : 'Seu fluxo de caixa está limpo. Comece cadastrando sua primeira receita ou despesa.'
                      }
                      actionLabel="Nova Receita"
                      onAction={() => openNewModal('receita')}
                    />
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isIncome = t.type === 'receita'

                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="font-bold text-zinc-900">{t.description}</div>
                            {t.notes && <div className="text-[11px] text-zinc-400">{t.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-zinc-700">{t.category}</td>
                      <td className="p-3 text-brand-700 font-semibold">
                        {t.clientName || t.supplier || '-'}
                      </td>
                      <td className="p-3 font-medium text-zinc-800">{formatDate(t.dueDate)}</td>
                      <td className="p-3 uppercase text-[10px] font-bold text-zinc-500">
                        {t.paymentMethod}
                      </td>
                      <td className="p-3">{getStatusBadge(t.status)}</td>
                      <td
                        className={`p-3 text-right font-bold tabular-nums ${
                          isIncome ? 'text-emerald-600' : 'text-zinc-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(t.value)}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {t.status === 'pendente' && (
                          <button
                            onClick={() => markAsPaid(t)}
                            className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            title="Marcar como Pago / Recebido"
                          >
                            Baixar ✓
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(t.id, t.description)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Criar / Editar Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingTransaction ? 'Editar Lançamento' : `Nova ${formData.type === 'receita' ? 'Receita' : 'Despesa'}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'receita', category: 'Honorários Recorrentes (MRR)' })}
                  className={`py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                    formData.type === 'receita'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-zinc-200 text-zinc-600'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'despesa', category: 'Ferramentas & Softwares' })}
                  className={`py-2 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                    formData.type === 'despesa'
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'border-zinc-200 text-zinc-600'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Despesa (Saída)
                </button>
              </div>

              <Input
                label="Descrição do Lançamento"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={
                  formData.type === 'receita'
                    ? 'Ex: Honorários Mensais Setembro'
                    : 'Ex: Assinatura Figma & Adobe CC'
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Valor (R$)"
                  type="number"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Categoria Financeira
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {formData.type === 'receita' ? (
                      <>
                        <option value="Honorários Recorrentes (MRR)">Honorários Recorrentes (MRR)</option>
                        <option value="Projetos Pontuais">Projetos Pontuais</option>
                        <option value="Consultoria Estratégica">Consultoria Estratégica</option>
                        <option value="Taxa de Setup">Taxa de Setup</option>
                      </>
                    ) : (
                      <>
                        <option value="Ferramentas & Softwares">Ferramentas & Softwares</option>
                        <option value="Equipe & Prestadores">Equipe & Prestadores</option>
                        <option value="Infraestrutura & Hospedagem">Infraestrutura & Hospedagem</option>
                        <option value="Impostos & Taxas">Impostos & Taxas</option>
                        <option value="Marketing & Anúncios Próprios">Marketing Próprio</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {formData.type === 'receita' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Cliente Vinculado
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Nenhum / Outro</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  label="Fornecedor / Favorecido"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Adobe Systems / AWS"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Vencimento"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Forma Pagamento
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="pix">Pix</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as FinancialStatus,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value={formData.type === 'receita' ? 'recebido' : 'pago'}>
                      {formData.type === 'receita' ? 'Recebido' : 'Pago'}
                    </option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingTransaction ? 'Salvar Alterações' : 'Lançar no Financeiro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
