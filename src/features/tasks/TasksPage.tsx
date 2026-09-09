import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Task, TaskWorkflowStatus, Priority } from '@/types/workspace.types'
import { formatDate } from '@/lib/formatters'
import {
  Plus,
  Search,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Table as TableIcon,
  X,
  Edit2,
  Trash2,
} from 'lucide-react'

const TASK_STAGES: { id: TaskWorkflowStatus; label: string; color: string }[] = [
  { id: 'pendente', label: '1. Pendente', color: 'border-zinc-300' },
  { id: 'em_producao', label: '2. Em Produção', color: 'border-blue-400' },
  { id: 'em_aprovacao', label: '3. Em Aprovação', color: 'border-amber-400' },
  { id: 'ajustes', label: '4. Ajustes', color: 'border-rose-400' },
  { id: 'concluido', label: '5. Concluído ✓', color: 'border-emerald-500' },
]

export const TasksPage: React.FC = () => {
  const { tasks, clients, projects, addTask, updateTask, updateTaskStatus, deleteTask } =
    useWorkspace()

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    responsible: 'Felipe (Designer)',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pendente' as TaskWorkflowStatus,
    priority: 'alta' as Priority,
  })

  const openNewModal = () => {
    setEditingTask(null)
    const firstClient = clients[0]
    const firstProject = projects[0]
    setFormData({
      title: '',
      description: '',
      clientId: firstClient ? firstClient.id : '',
      clientName: firstClient ? firstClient.tradeName : '',
      projectId: firstProject ? firstProject.id : '',
      projectName: firstProject ? firstProject.name : '',
      responsible: 'Felipe (Designer)',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendente',
      priority: 'media',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      clientId: task.clientId || '',
      clientName: task.clientName || '',
      projectId: task.projectId || '',
      projectName: task.projectName || '',
      responsible: task.responsible,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClientObj = clients.find((c) => c.id === formData.clientId)
    const selectedProjObj = projects.find((p) => p.id === formData.projectId)

    const payload = {
      ...formData,
      clientName: formData.clientId && selectedClientObj ? selectedClientObj.tradeName : '',
      projectName: formData.projectId && selectedProjObj ? selectedProjObj.name : '',
    }

    if (editingTask) {
      updateTask(editingTask.id, payload)
    } else {
      addTask(payload)
    }
    setIsModalOpen(false)
  }

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(id)
    }
  }

  const moveTaskStage = (taskId: string, currentStatus: TaskWorkflowStatus, direction: 'next' | 'prev') => {
    const currentIndex = TASK_STAGES.findIndex((s) => s.id === currentStatus)
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (targetIndex >= 0 && targetIndex < TASK_STAGES.length) {
      updateTaskStatus(taskId, TASK_STAGES[targetIndex].id)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.clientName && task.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.responsible.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesPriority
  })

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
              Gestão de Tarefas
            </h1>
            <Badge variant="orange">Fluxo Operacional</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fluxo de tarefas do escopo: Pendente ➔ Em produção ➔ Em aprovação ➔ Ajustes ➔ Concluído.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Tabela</span>
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por título da tarefa, cliente ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* View Mode: KANBAN 5 ETAPAS */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start select-none scrollbar-thin">
          {TASK_STAGES.map((stage, sIdx) => {
            const stageTasks = filteredTasks.filter((t) => t.status === stage.id)

            return (
              <div
                key={stage.id}
                className="w-[280px] min-w-[280px] shrink-0 bg-zinc-100/70 rounded-xl p-2.5 flex flex-col border border-zinc-200/80"
              >
                {/* Header */}
                <div className="pb-2 mb-2 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-900">{stage.label}</h3>
                  <span className="w-5 h-5 rounded-full bg-white text-zinc-700 font-medium text-xs flex items-center justify-center shadow-xs border border-zinc-200">
                    {stageTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 min-h-[350px]">
                  {stageTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="p-3 bg-white border border-zinc-200/90 hover:border-brand-500 hover:shadow-sm transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                          {task.clientName || 'Geral'}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      <h4 className="text-xs font-semibold text-zinc-900 leading-snug">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold pt-1 border-t border-zinc-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" />
                          {task.responsible}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-700">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Movement & Edit Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                            title="Editar Tarefa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                            title="Excluir Tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {sIdx > 0 && (
                            <button
                              onClick={() => moveTaskStage(task.id, task.status, 'prev')}
                              className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                              title="Voltar Etapa"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {sIdx < TASK_STAGES.length - 1 && (
                            <button
                              onClick={() => moveTaskStage(task.id, task.status, 'next')}
                              className="px-2 py-1 rounded text-[11px] font-bold bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-0.5"
                              title="Avançar Etapa"
                            >
                              <span>Avançar</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {stageTasks.length === 0 && (
                    <div className="h-28 flex items-center justify-center border border-dashed border-zinc-300 rounded-lg text-[11px] text-zinc-400 font-medium text-center p-2">
                      Nenhuma tarefa nesta etapa
                    </div>
                  )}
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
                  <th className="p-3">Tarefa</th>
                  <th className="p-3">Cliente / Projeto</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Prazo</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500 font-medium">
                      Nenhuma tarefa encontrada. Clique em &quot;Nova Tarefa&quot; para registrar uma entrega.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-zinc-900">{task.title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1">{task.description}</div>
                    </td>
                    <td className="p-3 font-semibold text-brand-700">
                      {task.clientName || 'Geral'}
                    </td>
                    <td className="p-3 text-zinc-700">{task.responsible}</td>
                    <td className="p-3 font-semibold text-zinc-800">{formatDate(task.dueDate)}</td>
                    <td className="p-3">{getPriorityBadge(task.priority)}</td>
                    <td className="p-3">
                      <Badge variant="orange" size="sm">
                        {TASK_STAGES.find((s) => s.id === task.status)?.label}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1 text-zinc-500 hover:text-zinc-900"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600"
                        title="Excluir Tarefa"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Criar / Editar Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa Operacional'}
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
                label="Título da Tarefa"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Criar carrossel de tráfego"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Descrição & Instruções Técnicas
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhamento do que precisa ser feito..."
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Cliente Vinculado
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Nenhum / Geral</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Projeto Vinculado
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Nenhum / Independente</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Responsável"
                  required
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
                <Input
                  label="Data de Entrega"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
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
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Etapa Inicial no Fluxo
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as TaskWorkflowStatus })
                  }
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  {TASK_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
