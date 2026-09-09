import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Project, ProjectStatus, Priority } from '@/types/workspace.types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  Building2,
  X,
  Edit2,
  Trash2,
  CheckSquare,
  FolderKanban,
  AlertCircle,
} from 'lucide-react'

export const ProjectsPage: React.FC = () => {
  const { projects, clients, tasks, addProject, updateProject, deleteProject } = useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    name: '',
    description: '',
    responsible: 'Felipe (Diretor de Criação)',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'em_andamento' as ProjectStatus,
    priority: 'alta' as Priority,
    progress: 50,
    value: 5000,
    deliverablesCount: 6,
    completedDeliverables: 3,
  })

  const openNewModal = () => {
    setEditingProject(null)
    const firstClient = clients[0]
    setFormData({
      clientId: firstClient ? firstClient.id : '',
      clientName: firstClient ? firstClient.tradeName : '',
      name: '',
      description: '',
      responsible: 'Felipe (Diretor de Criação)',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'planejamento',
      priority: 'media',
      progress: 0,
      value: 0,
      deliverablesCount: 1,
      completedDeliverables: 0,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setFormData({
      clientId: project.clientId,
      clientName: project.clientName,
      name: project.name,
      description: project.description,
      responsible: project.responsible,
      startDate: project.startDate,
      dueDate: project.dueDate,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      value: project.value,
      deliverablesCount: project.deliverablesCount,
      completedDeliverables: project.completedDeliverables,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClientObj = clients.find((c) => c.id === formData.clientId)
    const clientName = formData.clientId && selectedClientObj ? selectedClientObj.tradeName : ''

    if (editingProject) {
      updateProject(editingProject.id, { ...formData, clientName })
    } else {
      addProject({ ...formData, clientName })
    }
    setIsModalOpen(false)
  }

  const handleDeleteProject = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${name}"?`)) {
      deleteProject(id)
    }
  }

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.responsible.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || proj.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'planejamento':
        return <Badge variant="blue" size="sm">Planejamento</Badge>
      case 'em_andamento':
        return <Badge variant="orange" size="sm">Em Andamento</Badge>
      case 'aguardando_cliente':
        return <Badge variant="yellow" size="sm">Aguardando Cliente</Badge>
      case 'em_revisao':
        return <Badge variant="purple" size="sm">Em Revisão</Badge>
      case 'concluido':
        return <Badge variant="green" size="sm">Concluído</Badge>
      case 'pausado':
        return <Badge variant="gray" size="sm">Pausado</Badge>
    }
  }

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgente':
        return <Badge variant="red" size="sm">Urgente</Badge>
      case 'alta':
        return <Badge variant="orange" size="sm">Alta</Badge>
      case 'media':
        return <Badge variant="yellow" size="sm">Média</Badge>
      case 'baixa':
        return <Badge variant="gray" size="sm">Baixa</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Gestão de Projetos
            </h1>
            <Badge variant="orange">Operação Criativa</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gerencie o cronograma, entregáveis, evolução percentual e responsáveis de cada projeto da agência.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
          Novo Projeto
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar projeto por nome, cliente ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
            <option value="planejamento">Planejamento</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="aguardando_cliente">Aguardando Cliente</option>
            <option value="em_revisao">Em Revisão</option>
            <option value="concluido">Concluído</option>
            <option value="pausado">Pausado</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto cadastrado"
          description={
            searchTerm || filterStatus !== 'all'
              ? 'Nenhum projeto corresponde aos filtros selecionados.'
              : 'Crie seu primeiro projeto para gerenciar prazos, tarefas e entregáveis operacionais.'
          }
          actionLabel="Criar Novo Projeto"
          onAction={openNewModal}
          icon={<FolderKanban className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const relatedTasks = tasks.filter((t) => t.projectId === project.id)
            const completedTasksCount = relatedTasks.filter((t) => t.status === 'concluido').length

            return (
              <Card
                key={project.id}
                className="p-5 hover:border-brand-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" />
                        {project.clientName}
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(project.priority)}
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-2">
                    {project.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-600">Progresso Geral</span>
                      <span className="text-brand-600">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 text-xs">
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Prazo</span>
                      <span className="font-semibold text-zinc-800">{formatDate(project.dueDate)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Responsável</span>
                      <span className="font-semibold text-zinc-800 truncate block">{project.responsible}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Entregas</span>
                      <span className="font-semibold text-zinc-800">
                        {project.completedDeliverables}/{project.deliverablesCount} Peças
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Valor</span>
                      <span className="font-bold tabular-nums text-zinc-900">{formatCurrency(project.value)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                    {completedTasksCount} de {relatedTasks.length} tarefas concluídas
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                      title="Editar Projeto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                      title="Excluir Projeto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {clients.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Nenhum cliente cadastrado ainda. Recomendamos cadastrar um cliente na aba <strong>Clientes</strong> antes de vincular ao projeto.</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Cliente Vinculado *
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

                <Input
                  label="Nome do Projeto"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Campanha de Lançamento Q4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descrição e Escopo do Projeto
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Objetivos do projeto, entregáveis acordados..."
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Data de Início"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <Input
                  label="Data de Entrega Final"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ProjectStatus })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="planejamento">Planejamento</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_cliente">Aguardando Cliente</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="concluido">Concluído</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as Priority })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <Input
                  label="Responsável"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Progresso (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                />
                <Input
                  label="Total Entregáveis (Peças)"
                  type="number"
                  value={formData.deliverablesCount}
                  onChange={(e) =>
                    setFormData({ ...formData, deliverablesCount: Number(e.target.value) })
                  }
                />
                <Input
                  label="Valor do Projeto (R$)"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
