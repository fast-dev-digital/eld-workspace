import React, { useState, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Lead, CommercialStage, LeadTemperature } from '@/types/workspace.types'
import { formatCurrency } from '@/lib/formatters'
import {
  Plus,
  Search,
  Users,
  ChevronRight,
  ChevronLeft,
  Flame,
  LayoutGrid,
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
  DollarSign,
  Sparkles,
  Phone,
  GripVertical,
} from 'lucide-react'

interface StageConfig {
  id: CommercialStage
  label: string
  colorStripe: string
  dotColor: string
}

const STAGES: StageConfig[] = [
  { id: 'lead', label: '1. Lead', colorStripe: 'bg-zinc-400', dotColor: 'bg-zinc-400' },
  { id: 'reuniao', label: '2. Reunião', colorStripe: 'bg-blue-500', dotColor: 'bg-blue-500' },
  { id: 'briefing', label: '3. Briefing', colorStripe: 'bg-purple-500', dotColor: 'bg-purple-500' },
  { id: 'proposta', label: '4. Proposta', colorStripe: 'bg-amber-500', dotColor: 'bg-amber-500' },
  { id: 'contrato', label: '5. Contrato', colorStripe: 'bg-orange-500', dotColor: 'bg-orange-500' },
  { id: 'pagamento', label: '6. Pagamento', colorStripe: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
  { id: 'cliente', label: '7. Cliente Ganho 🎉', colorStripe: 'bg-gradient-to-r from-emerald-500 to-teal-500', dotColor: 'bg-emerald-600' },
]

export const CRMPage: React.FC = () => {
  const { leads, addLead, updateLead, updateLeadStage, deleteLead, convertLeadToClient } =
    useWorkspace()

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTemp, setFilterTemp] = useState<string>('all')

  // Drag & Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<CommercialStage | null>(null)
  const kanbanRef = useRef<HTMLDivElement>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    serviceInterested: '',
    responsible: 'Lucas (Comercial)',
    stage: 'lead' as CommercialStage,
    temperature: 'morno' as LeadTemperature,
    estimatedValue: 3500,
    origin: 'Indicação',
    notes: '',
  })

  const openNewModal = (defaultStage: CommercialStage = 'lead') => {
    setEditingLead(null)
    setFormData({
      name: '',
      companyName: '',
      phone: '',
      email: '',
      serviceInterested: '',
      responsible: 'Lucas (Comercial)',
      stage: defaultStage,
      temperature: 'morno',
      estimatedValue: 0,
      origin: 'Indicação',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      companyName: lead.companyName,
      phone: lead.phone,
      email: lead.email,
      serviceInterested: lead.serviceInterested,
      responsible: lead.responsible,
      stage: lead.stage,
      temperature: lead.temperature,
      estimatedValue: lead.estimatedValue,
      origin: lead.origin,
      notes: lead.notes,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLead) {
      updateLead(editingLead.id, formData)
    } else {
      addLead({
        ...formData,
        lastContactAt: new Date().toISOString(),
      })
    }
    setIsModalOpen(false)
  }

  const handleDeleteLead = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lead "${name}"?`)) {
      deleteLead(id)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.serviceInterested.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTemp = filterTemp === 'all' || lead.temperature === filterTemp
    return matchesSearch && matchesTemp
  })

  // KPIs
  const totalPipelineValue = leads
    .filter((l) => l.stage !== 'cliente')
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
  const totalActiveLeads = leads.filter((l) => l.stage !== 'cliente').length
  const hotLeadsCount = leads.filter((l) => l.temperature === 'quente' && l.stage !== 'cliente').length
  const wonClientsCount = leads.filter((l) => l.stage === 'cliente').length

  const getTemperatureBadge = (temp: LeadTemperature) => {
    switch (temp) {
      case 'quente':
        return (
          <Badge variant="orange" size="sm" className="gap-1 shadow-2xs">
            <Flame className="w-3 h-3 fill-brand-500 text-brand-500" /> Quente
          </Badge>
        )
      case 'morno':
        return <Badge variant="yellow" size="sm">Morno</Badge>
      case 'frio':
        return <Badge variant="gray" size="sm">Frio</Badge>
    }
  }

  const moveStage = (leadId: string, currentStage: CommercialStage, direction: 'next' | 'prev') => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStage)
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (targetIndex >= 0 && targetIndex < STAGES.length) {
      const nextStage = STAGES[targetIndex].id
      if (nextStage === 'cliente') {
        convertLeadToClient(leadId)
      } else {
        updateLeadStage(leadId, nextStage)
      }
    }
  }

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId)
    e.dataTransfer.setData('text/plain', leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, stageId: CommercialStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId)
    }
  }

  const handleDragLeave = (e: React.DragEvent, stageId: CommercialStage) => {
    e.preventDefault()
    if (dragOverStage === stageId) {
      setDragOverStage(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStage: CommercialStage) => {
    e.preventDefault()
    setDragOverStage(null)
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId
    if (!leadId) return

    const currentLead = leads.find((l) => l.id === leadId)
    if (!currentLead || currentLead.stage === targetStage) {
      setDraggedLeadId(null)
      return
    }

    if (targetStage === 'cliente') {
      convertLeadToClient(leadId)
    } else {
      updateLeadStage(leadId, targetStage)
    }
    setDraggedLeadId(null)
  }

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanRef.current) {
      kanbanRef.current.scrollBy({
        left: direction === 'left' ? -310 : 310,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Comercial / CRM
            </h1>
            <Badge variant="orange">Jornada Comercial</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Acompanhe cada oportunidade da agência: Lead ➔ Reunião ➔ Briefing ➔ Proposta ➔ Contrato ➔ Pagamento ➔ Cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Funil Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Tabela</span>
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={() => openNewModal('lead')} leftIcon={<Plus className="w-4 h-4" />}>
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Funnel KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-brand-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">Total em Pipeline</span>
            <span className="text-sm font-bold tabular-nums text-zinc-900 truncate block">{formatCurrency(totalPipelineValue)}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">Leads Ativos</span>
            <span className="text-sm font-bold tabular-nums text-zinc-900 truncate block">{totalActiveLeads} oportunidades</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">Leads Quentes</span>
            <span className="text-sm font-bold tabular-nums text-zinc-900 truncate block">{hotLeadsCount} prioritários 🔥</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block">Clientes Ganhos</span>
            <span className="text-sm font-bold tabular-nums text-zinc-900 truncate block">{wonClientsCount} convertidos 🎉</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por lead, empresa ou serviço de interesse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">Temperatura:</span>
            <select
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value)}
              className="text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Todas as Temperaturas</option>
              <option value="quente">🔥 Quente</option>
              <option value="morno">⚡ Morno</option>
              <option value="frio">❄️ Frio</option>
            </select>
          </div>

          {viewMode === 'kanban' && (
            <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
              <button
                onClick={() => scrollKanban('left')}
                className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors shadow-2xs"
                title="Rolar para esquerda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollKanban('right')}
                className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition-colors shadow-2xs"
                title="Rolar para direita"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Mode: KANBAN */}
      {viewMode === 'kanban' && (
        <div
          ref={kanbanRef}
          className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start select-none scrollbar-thin"
        >
          {STAGES.map((stage, sIdx) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id)
            const stageTotal = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0)
            const isDropTarget = dragOverStage === stage.id

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`w-[290px] min-w-[290px] shrink-0 rounded-2xl flex flex-col transition-all duration-200 border ${
                  isDropTarget
                    ? 'bg-orange-50/70 border-brand-500 shadow-md ring-2 ring-brand-500/30'
                    : 'bg-zinc-100/70 border-zinc-200/80 shadow-2xs'
                } overflow-hidden`}
              >
                {/* Stage Color Stripe */}
                <div className={`h-1.5 w-full ${stage.colorStripe}`} />

                <div className="p-3 flex flex-col flex-1">
                  {/* Stage Header */}
                  <div className="pb-2.5 mb-3 border-b border-zinc-200/80 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stage.dotColor}`} />
                        <h3 className="text-xs font-semibold text-zinc-900 truncate tracking-tight">
                          {stage.label}
                        </h3>
                      </div>
                      <span className="text-[11px] font-medium tabular-nums text-zinc-600 block mt-0.5">
                        {formatCurrency(stageTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-white text-zinc-700 font-bold text-xs flex items-center justify-center shadow-2xs border border-zinc-200">
                        {stageLeads.length}
                      </span>
                      <button
                        onClick={() => openNewModal(stage.id)}
                        title={`Adicionar Lead em ${stage.label}`}
                        className="w-5 h-5 rounded-full hover:bg-white text-zinc-400 hover:text-brand-600 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 min-h-[360px]">
                    {stageLeads.map((lead) => {
                      const isBeingDragged = draggedLeadId === lead.id

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={() => setDraggedLeadId(null)}
                          className={`p-3.5 bg-white rounded-xl border border-zinc-200/90 shadow-2xs hover:border-brand-500 hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing ${
                            isBeingDragged
                              ? 'opacity-40 scale-95 border-dashed border-brand-500'
                              : ''
                          }`}
                        >
                          {/* Card Header: Company, Contact & Temperature */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0 flex-1">
                              <GripVertical className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <h4
                                  className="text-xs font-semibold text-zinc-900 leading-tight truncate"
                                  title={lead.companyName || lead.name}
                                >
                                  {lead.companyName || lead.name}
                                </h4>
                                <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-medium truncate">
                                  <Users className="w-3 h-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">{lead.name}</span>
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">{getTemperatureBadge(lead.temperature)}</div>
                          </div>

                          {/* Service & Value Box */}
                          <div className="text-[11px] text-zinc-700 bg-zinc-50/90 p-2.5 rounded-lg border border-zinc-100 space-y-1">
                            <div
                              className="font-semibold text-brand-700 truncate"
                              title={lead.serviceInterested}
                            >
                              {lead.serviceInterested}
                            </div>
                            <div className="text-zinc-900 font-bold tabular-nums text-xs">
                              {formatCurrency(lead.estimatedValue)}
                            </div>
                          </div>

                          {/* Notes & Extra Info */}
                          {(lead.notes || lead.phone || lead.origin) && (
                            <div className="space-y-1.5 text-[10px] text-zinc-500">
                              {lead.notes && (
                                <p className="line-clamp-2 italic bg-zinc-50 p-1.5 rounded border border-zinc-100 text-zinc-600">
                                  "{lead.notes}"
                                </p>
                              )}
                              <div className="flex items-center justify-between text-zinc-400 pt-0.5">
                                {lead.phone ? (
                                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                                    <Phone className="w-2.5 h-2.5 shrink-0" />
                                    {lead.phone}
                                  </span>
                                ) : (
                                  <span />
                                )}
                                {lead.origin && (
                                  <span className="font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0">
                                    {lead.origin}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Card Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(lead)}
                                className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                                title="Editar Lead"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id, lead.companyName || lead.name)}
                                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Excluir Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Movement Buttons */}
                            <div className="flex items-center gap-1">
                              {sIdx > 0 && (
                                <button
                                  onClick={() => moveStage(lead.id, lead.stage, 'prev')}
                                  className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                                  title="Voltar Etapa"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {sIdx < STAGES.length - 1 && (
                                <button
                                  onClick={() => moveStage(lead.id, lead.stage, 'next')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-0.5 transition-all ${
                                    sIdx === STAGES.length - 2
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-2xs'
                                  }`}
                                  title="Avançar Etapa"
                                >
                                  <span>{sIdx === STAGES.length - 2 ? 'Virar Cliente' : 'Avançar'}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {stageLeads.length === 0 && (
                      <div
                        onClick={() => openNewModal(stage.id)}
                        className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-brand-300 hover:bg-white/60 rounded-xl text-zinc-400 hover:text-zinc-600 p-3 text-center transition-all cursor-pointer group"
                      >
                        <Plus className="w-4 h-4 mb-1 text-zinc-300 group-hover:text-brand-500 transition-colors" />
                        <span className="text-[11px] font-bold text-zinc-500">Nenhum lead nesta etapa</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5">Arraste ou clique para adicionar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Mode: TABLE */}
      {viewMode === 'table' && (
        <Card noPadding className="overflow-hidden border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Empresa / Contato</th>
                  <th className="p-3">Serviço Pretendido</th>
                  <th className="p-3">Valor Estimado</th>
                  <th className="p-3">Etapa do Funil</th>
                  <th className="p-3">Temperatura</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{lead.companyName || lead.name}</div>
                      <div className="text-[11px] text-zinc-500">{lead.name} • {lead.phone}</div>
                    </td>
                    <td className="p-3 font-medium text-zinc-700">{lead.serviceInterested}</td>
                    <td className="p-3 font-bold text-zinc-900">{formatCurrency(lead.estimatedValue)}</td>
                    <td className="p-3">
                      <Badge variant="orange" size="sm">
                        {STAGES.find((s) => s.id === lead.stage)?.label}
                      </Badge>
                    </td>
                    <td className="p-3">{getTemperatureBadge(lead.temperature)}</td>
                    <td className="p-3 text-zinc-600">{lead.responsible}</td>
                    <td className="p-3 text-right space-x-2">
                      {lead.stage !== 'cliente' && (
                        <button
                          onClick={() => convertLeadToClient(lead.id)}
                          className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          Tornar Cliente
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(lead)}
                        className="p-1 text-zinc-500 hover:text-zinc-900"
                        title="Editar Lead"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.companyName || lead.name)}
                        className="p-1 text-zinc-400 hover:text-rose-600"
                        title="Excluir Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Criar / Editar Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingLead ? 'Editar Lead do Funil' : 'Novo Lead Comercial'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nome do Contato"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Silva"
                />
                <Input
                  label="Nome da Empresa"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ex: ACME Indústria"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Telefone / WhatsApp"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Serviço de Interesse"
                  required
                  value={formData.serviceInterested}
                  onChange={(e) => setFormData({ ...formData, serviceInterested: e.target.value })}
                  placeholder="Ex: Tráfego Pago, Branding..."
                />
                <Input
                  label="Valor Estimado (R$)"
                  type="number"
                  required
                  value={formData.estimatedValue}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedValue: Number(e.target.value) })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Etapa Atual
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) =>
                      setFormData({ ...formData, stage: e.target.value as CommercialStage })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Temperatura
                  </label>
                  <select
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: e.target.value as LeadTemperature })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="quente">🔥 Quente</option>
                    <option value="morno">⚡ Morno</option>
                    <option value="frio">❄️ Frio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Origem
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                    placeholder="Ex: Google, Indicação"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Observações Comerciais & Próximos Passos
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes da conversa, necessidades do cliente, data da próxima reunião..."
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
