import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Briefing } from '@/types/workspace.types'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  Eye,
  Edit2,
  X,
  Target,
  Palette,
  Megaphone,
  FileSpreadsheet,
} from 'lucide-react'

export const BriefingsPage: React.FC = () => {
  const { briefings, clients, projects, addBriefing, updateBriefing, deleteBriefing } =
    useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    title: '',
    objective: '',
    targetAudience: '',
    visualReferences: '',
    deliverables: '',
    toneOfVoice: '',
    deadlines: '',
    technicalNotes: '',
    responsible: 'Felipe (Diretor de Criação)',
    status: 'aprovado' as 'rascunho' | 'aprovado' | 'em_producao',
  })

  const openNewModal = () => {
    setEditingBriefing(null)
    const firstClient = clients[0]
    const firstProj = projects[0]
    setFormData({
      clientId: firstClient ? firstClient.id : '',
      clientName: firstClient ? firstClient.tradeName : '',
      projectId: firstProj ? firstProj.id : '',
      projectName: firstProj ? firstProj.name : '',
      title: '',
      objective: '',
      targetAudience: '',
      visualReferences: '',
      deliverables: '',
      toneOfVoice: '',
      deadlines: '',
      technicalNotes: '',
      responsible: 'Felipe (Diretor de Criação)',
      status: 'aprovado',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (briefing: Briefing) => {
    setEditingBriefing(briefing)
    setFormData({
      clientId: briefing.clientId,
      clientName: briefing.clientName,
      projectId: briefing.projectId || '',
      projectName: briefing.projectName || '',
      title: briefing.title,
      objective: briefing.objective,
      targetAudience: briefing.targetAudience,
      visualReferences: briefing.visualReferences,
      deliverables: briefing.deliverables,
      toneOfVoice: briefing.toneOfVoice,
      deadlines: briefing.deadlines,
      technicalNotes: briefing.technicalNotes,
      responsible: briefing.responsible,
      status: briefing.status,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClientObj = clients.find((c) => c.id === formData.clientId)
    const selectedProjObj = projects.find((p) => p.id === formData.projectId)

    const payload = {
      ...formData,
      clientName: selectedClientObj ? selectedClientObj.tradeName : formData.clientName,
      projectName: selectedProjObj ? selectedProjObj.name : formData.projectName,
    }

    if (editingBriefing) {
      updateBriefing(editingBriefing.id, payload)
    } else {
      addBriefing(payload)
    }
    setIsModalOpen(false)
  }

  const filteredBriefings = briefings.filter((b) => {
    return (
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.objective.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="green" size="sm">Aprovado</Badge>
      case 'em_producao':
        return <Badge variant="orange" size="sm">Em Produção</Badge>
      case 'rascunho':
      default:
        return <Badge variant="gray" size="sm">Rascunho</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Briefings Estruturados
            </h1>
            <Badge variant="orange">Diretrizes Criativas</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro de objetivos, público-alvo, referências, tom de voz e entregáveis esperados por cliente.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
          Novo Briefing
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por briefing, cliente ou objetivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Briefings Grid */}
      {filteredBriefings.length === 0 ? (
        <EmptyState
          title="Nenhum briefing cadastrado"
          description={
            searchTerm
              ? 'Nenhum briefing corresponde ao termo de busca.'
              : 'Registre o primeiro briefing com objetivos, público-alvo e referências criativas da agência.'
          }
          actionLabel="Criar Novo Briefing"
          onAction={openNewModal}
          icon={<FileSpreadsheet className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBriefings.map((briefing) => (
            <Card
              key={briefing.id}
              className="p-5 hover:border-brand-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between cursor-pointer"
              onClick={() => setSelectedBriefing(briefing)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {briefing.clientName}
                  </span>
                  {getStatusBadge(briefing.status)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                    {briefing.title}
                  </h3>
                  {briefing.projectName && (
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                      Projeto: {briefing.projectName}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <p className="text-zinc-700 line-clamp-2">
                      <strong className="text-zinc-900 font-semibold">Objetivo:</strong> {briefing.objective}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <p className="text-zinc-700 line-clamp-1">
                      <strong className="text-zinc-900 font-semibold">Tom de Voz:</strong> {briefing.toneOfVoice}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="text-[11px]">Resp: {briefing.responsible}</span>
                <span className="text-brand-600 font-semibold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Briefing Detailed Viewer Drawer / Modal */}
      {selectedBriefing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="orange" size="sm">{selectedBriefing.clientName}</Badge>
                    {getStatusBadge(selectedBriefing.status)}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {selectedBriefing.title}
                  </h2>
                  {selectedBriefing.projectName && (
                    <p className="text-xs text-zinc-500">Projeto: {selectedBriefing.projectName}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const b = selectedBriefing
                      setSelectedBriefing(null)
                      openEditModal(b)
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                    title="Editar Briefing"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedBriefing(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Information Blocks */}
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-brand-50/60 border border-brand-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-800 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> 1. Objetivo Principal da Campanha
                  </span>
                  <p className="text-zinc-800 font-medium text-xs leading-relaxed">{selectedBriefing.objective}</p>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                    2. Público-Alvo e Persona
                  </span>
                  <p className="text-zinc-700 leading-relaxed">{selectedBriefing.targetAudience}</p>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-brand-500" /> 3. Referências Visuais & Estilo
                  </span>
                  <p className="text-zinc-700 leading-relaxed">{selectedBriefing.visualReferences}</p>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5 text-brand-500" /> 4. Tom de Voz & Linguagem
                  </span>
                  <p className="text-zinc-700 leading-relaxed">{selectedBriefing.toneOfVoice}</p>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
                    5. Entregáveis Esperados (Peças)
                  </span>
                  <p className="text-zinc-700 leading-relaxed">{selectedBriefing.deliverables}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">Prazos e Datas</span>
                    <p className="text-zinc-700">{selectedBriefing.deadlines || 'A definir'}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700">Responsável</span>
                    <p className="text-zinc-700 font-medium">{selectedBriefing.responsible}</p>
                  </div>
                </div>

                {selectedBriefing.technicalNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                      Observações Técnicas & Integrações
                    </span>
                    <p className="text-amber-800">{selectedBriefing.technicalNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteBriefing(selectedBriefing.id)
                  setSelectedBriefing(null)
                }}
              >
                Excluir Briefing
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedBriefing(null)}>
                Fechar Visualização
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Briefing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingBriefing ? 'Editar Briefing' : 'Novo Briefing de Campanha'}
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
                    Projeto Relacionado
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Nenhum / Campanha Independente</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Título do Briefing"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Campanha de Black Friday / Lançamento Edifício Horizon"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  1. Objetivo da Campanha / Projeto *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Ex: Gerar 100 leads qualificados para a equipe comercial..."
                  className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  2. Público-Alvo e Perfil
                </label>
                <textarea
                  rows={2}
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Idade, interesses, região, nível socioeconômico..."
                  className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    3. Referências Visuais
                  </label>
                  <textarea
                    rows={2}
                    value={formData.visualReferences}
                    onChange={(e) =>
                      setFormData({ ...formData, visualReferences: e.target.value })
                    }
                    placeholder="Estética, cores, iluminação, marcas de inspiração..."
                    className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    4. Tom de Voz & Mensagem
                  </label>
                  <textarea
                    rows={2}
                    value={formData.toneOfVoice}
                    onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                    placeholder="Ex: Corporativo, alegre, exclusivo, dinâmico..."
                    className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  5. Entregáveis Esperados (Peças)
                </label>
                <input
                  type="text"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  placeholder="Ex: 8 posts estáticos, 4 vídeos Reels, 1 Landing page"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Prazos / Datas-chave"
                  value={formData.deadlines}
                  onChange={(e) => setFormData({ ...formData, deadlines: e.target.value })}
                  placeholder="Ex: Aprovação até 05/09"
                />
                <Input
                  label="Responsável"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'rascunho' | 'aprovado' | 'em_producao',
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="aprovado">Aprovado</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingBriefing ? 'Salvar Alterações' : 'Criar Briefing'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
