import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import {
  ApprovalItem,
  ProductionApprovalStage,
  ApprovalStatus,
} from '@/types/workspace.types'
import { formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  Clock,
  User,
  X,
  Check,
  RotateCcw,
  Trash2,
  CheckCircle2,
} from 'lucide-react'

const PRODUCTION_STAGES: { id: ProductionApprovalStage; label: string }[] = [
  { id: 'criacao', label: '1. Criação' },
  { id: 'producao', label: '2. Produção' },
  { id: 'aprovacao', label: '3. Aprovação' },
  { id: 'alteracoes', label: '4. Alterações' },
  { id: 'entrega', label: '5. Entrega Final ✓' },
]

export const ApprovalsPage: React.FC = () => {
  const { approvals, clients, projects, addApproval, updateApprovalStatus, deleteApproval } =
    useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Feedback Modal State
  const [feedbackModalItem, setFeedbackModalItem] = useState<ApprovalItem | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  // New Material Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    responsible: 'Guilherme (Designer/Dev)',
    stage: 'aprovacao' as ProductionApprovalStage,
    status: 'aguardando_cliente' as ApprovalStatus,
    assetUrl: '',
    version: 1,
    feedback: '',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const openNewModal = () => {
    const firstClient = clients[0]
    const firstProj = projects[0]
    setFormData({
      title: '',
      clientId: firstClient ? firstClient.id : '',
      clientName: firstClient ? firstClient.tradeName : '',
      projectId: firstProj ? firstProj.id : '',
      projectName: firstProj ? firstProj.name : '',
      responsible: 'Guilherme (Designer/Dev)',
      stage: 'aprovacao',
      status: 'aguardando_cliente',
      assetUrl: '',
      version: 1,
      feedback: '',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClientObj = clients.find((c) => c.id === formData.clientId)
    const selectedProjObj = projects.find((p) => p.id === formData.projectId)

    addApproval({
      ...formData,
      clientName: selectedClientObj ? selectedClientObj.tradeName : formData.clientName,
      projectName: selectedProjObj ? selectedProjObj.name : formData.projectName,
    })
    setIsModalOpen(false)
  }

  const handleApprove = (item: ApprovalItem) => {
    updateApprovalStatus(item.id, 'aprovado', 'Material aprovado com sucesso.')
  }

  const handleOpenFeedback = (item: ApprovalItem) => {
    setFeedbackModalItem(item)
    setFeedbackText(item.feedback || '')
  }

  const handleSaveFeedback = () => {
    if (feedbackModalItem) {
      updateApprovalStatus(feedbackModalItem.id, 'ajustes_solicitados', feedbackText)
      setFeedbackModalItem(null)
    }
  }

  const filteredApprovals = approvals.filter((appr) => {
    const matchesSearch =
      appr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appr.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appr.responsible.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || appr.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="green" size="sm">Aprovado ✓</Badge>
      case 'aguardando_cliente':
        return <Badge variant="orange" size="sm">Aguardando Cliente</Badge>
      case 'ajustes_solicitados':
        return <Badge variant="red" size="sm">Ajustes Solicitados</Badge>
      case 'pendente_interno':
      default:
        return <Badge variant="yellow" size="sm">Pendente Interno</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Aprovações e Entregas
            </h1>
            <Badge variant="orange">Controle de Qualidade</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fluxo de Produção: Criação ➔ Produção ➔ Aprovação ➔ Alterações ➔ Entrega.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
          Enviar Material
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por peça, material, cliente ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos os Status</option>
            <option value="aguardando_cliente">Aguardando Cliente</option>
            <option value="ajustes_solicitados">Ajustes Solicitados</option>
            <option value="aprovado">Aprovado</option>
            <option value="pendente_interno">Pendente Interno</option>
          </select>
        </div>
      </div>

      {/* Approvals Grid */}
      {filteredApprovals.length === 0 ? (
        <EmptyState
          title="Nenhum material em aprovação"
          description={
            searchTerm || filterStatus !== 'all'
              ? 'Nenhum item corresponde aos filtros selecionados.'
              : 'Envie peças criativas, vídeos ou criativos para aprovação interna ou com o cliente.'
          }
          actionLabel="Enviar Novo Material"
          onAction={openNewModal}
          icon={<CheckCircle2 className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApprovals.map((item) => (
            <Card
              key={item.id}
              className="p-5 hover:border-brand-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {item.clientName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                      v{item.version}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Title & Stage */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                    <span>Etapa: <strong>{PRODUCTION_STAGES.find((s) => s.id === item.stage)?.label}</strong></span>
                    {item.projectName && <span>• {item.projectName}</span>}
                  </div>
                </div>

                {/* Asset Link */}
                {item.assetUrl && (
                  <a
                    href={item.assetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-brand-50 hover:border-brand-300 rounded-lg border border-zinc-200 text-xs font-bold text-brand-700 transition-colors"
                  >
                    <span className="truncate">Visualizar Peça / Layout</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                {/* Feedback Box */}
                {item.feedback && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Observações & Feedback
                    </span>
                    <p className="text-zinc-700 text-[11px] leading-relaxed italic">
                      &quot;{item.feedback}&quot;
                    </p>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-400" /> {item.responsible}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" /> Prazo: {formatDate(item.dueDate)}
                  </span>
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => deleteApproval(item.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFeedback(item)}
                    leftIcon={<RotateCcw className="w-3 h-3 text-amber-600" />}
                  >
                    Solicitar Ajuste
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(item)}
                    leftIcon={<Check className="w-3 h-3" />}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Solicitar Ajuste / Feedback */}
      {feedbackModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                Solicitar Ajustes na Peça
              </h2>
              <button
                onClick={() => setFeedbackModalItem(null)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-zinc-600">
                Peça: <strong>{feedbackModalItem.title}</strong> ({feedbackModalItem.clientName})
              </p>

              <div>
                <label className="block font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descreva o feedback / alterações solicitadas:
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Ex: Trocar a imagem principal, aumentar o logo da marca, corrigir o texto do CTA..."
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button variant="outline" size="sm" onClick={() => setFeedbackModalItem(null)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveFeedback}>
                  Registrar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar Novo Material */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                Enviar Material para Aprovação
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <Input
                label="Título do Material / Peça"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Carrossel V2 - Edifício Horizon"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Cliente *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Projeto
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Nenhum / Geral</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Link do Material (Figma / Drive / Canva / Loom)"
                value={formData.assetUrl}
                onChange={(e) => setFormData({ ...formData, assetUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Versão"
                  type="number"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: Number(e.target.value) })}
                />
                <Input
                  label="Responsável"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
                <Input
                  label="Prazo"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Enviar para Aprovação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
