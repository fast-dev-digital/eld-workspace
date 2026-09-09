import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Meeting, MeetingStatus } from '@/types/workspace.types'
import { formatDateTime } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  Users,
  CheckCircle2,
  ListTodo,
  X,
  Edit2,
  Trash2,
  Calendar,
  CalendarCheck,
} from 'lucide-react'

export const MeetingsPage: React.FC = () => {
  const { meetings, clients, leads, addMeeting, updateMeeting, deleteMeeting } = useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    relatedToType: 'cliente' as 'cliente' | 'lead',
    relatedToId: '',
    relatedToName: '',
    dateTime: new Date().toISOString().slice(0, 16),
    attendees: ['Lucas (Comercial ELD)'],
    agenda: '',
    notes: '',
    nextSteps: [] as string[],
    nextStepInput: '',
    status: 'agendada' as MeetingStatus,
  })

  const openNewModal = () => {
    setEditingMeeting(null)
    const firstClient = clients[0]
    setFormData({
      title: '',
      relatedToType: 'cliente',
      relatedToId: firstClient ? firstClient.id : '',
      relatedToName: firstClient ? firstClient.tradeName : '',
      dateTime: new Date().toISOString().slice(0, 16),
      attendees: ['Lucas (Comercial ELD)'],
      agenda: '',
      notes: '',
      nextSteps: [],
      nextStepInput: '',
      status: 'agendada',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setFormData({
      title: meeting.title,
      relatedToType: meeting.relatedToType,
      relatedToId: meeting.relatedToId,
      relatedToName: meeting.relatedToName,
      dateTime: meeting.dateTime.slice(0, 16),
      attendees: meeting.attendees || [],
      agenda: meeting.agenda,
      notes: meeting.notes,
      nextSteps: meeting.nextSteps || [],
      nextStepInput: '',
      status: meeting.status,
    })
    setIsModalOpen(true)
  }

  const handleAddNextStep = () => {
    if (!formData.nextStepInput) return
    setFormData({
      ...formData,
      nextSteps: [...formData.nextSteps, formData.nextStepInput],
      nextStepInput: '',
    })
  }

  const handleRemoveNextStep = (index: number) => {
    setFormData({
      ...formData,
      nextSteps: formData.nextSteps.filter((_, i) => i !== index),
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    let relatedName = formData.relatedToName
    if (formData.relatedToType === 'cliente') {
      const c = clients.find((item) => item.id === formData.relatedToId)
      if (c) relatedName = c.tradeName
    } else {
      const l = leads.find((item) => item.id === formData.relatedToId)
      if (l) relatedName = l.companyName || l.name
    }

    const payload = {
      title: formData.title,
      relatedToType: formData.relatedToType,
      relatedToId: formData.relatedToId,
      relatedToName: relatedName,
      dateTime: formData.dateTime,
      attendees: formData.attendees,
      agenda: formData.agenda,
      notes: formData.notes,
      nextSteps: formData.nextSteps,
      status: formData.status,
    }

    if (editingMeeting) {
      updateMeeting(editingMeeting.id, payload)
    } else {
      addMeeting(payload)
    }
    setIsModalOpen(false)
  }

  const toggleStatus = (meeting: Meeting) => {
    const nextStatus: MeetingStatus =
      meeting.status === 'agendada' ? 'realizada' : 'agendada'
    updateMeeting(meeting.id, { status: nextStatus })
  }

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.relatedToName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.agenda.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || m.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Reuniões & Atas
            </h1>
            <Badge variant="orange">Comunicação e Alinhamento</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro completo de reuniões comerciais e operacionais, pautas, atas e próximos passos definidos.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
          Agendar Reunião
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por reunião, cliente/lead ou assunto..."
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
            <option value="all">Todas as Reuniões</option>
            <option value="agendada">Agendadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <EmptyState
          title="Nenhuma reunião agendada"
          description={
            searchTerm || filterStatus !== 'all'
              ? 'Nenhuma reunião corresponde aos filtros aplicados.'
              : 'Agende reuniões com leads ou clientes e registre atas com próximos passos para a equipe.'
          }
          actionLabel="Agendar Reunião"
          onAction={openNewModal}
          icon={<CalendarCheck className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="p-5 hover:border-brand-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {meeting.relatedToType === 'cliente' ? 'Cliente' : 'Lead'} • {meeting.relatedToName}
                    </span>
                  </div>
                  <Badge variant={meeting.status === 'realizada' ? 'green' : 'orange'} size="sm">
                    {meeting.status}
                  </Badge>
                </div>

                {/* Title & DateTime */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                    {meeting.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(meeting.dateTime)}</span>
                  </div>
                </div>

                {/* Pauta / Agenda */}
                {meeting.agenda && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-zinc-700 block">
                      Pauta / Assunto
                    </span>
                    <p className="text-zinc-700 leading-relaxed">{meeting.agenda}</p>
                  </div>
                )}

                {/* Notes / Ata */}
                {meeting.notes && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-zinc-700 block">
                      Ata / Observações da Reunião
                    </span>
                    <p className="text-zinc-700 leading-relaxed italic">{meeting.notes}</p>
                  </div>
                )}

                {/* Next Steps Checklist */}
                {meeting.nextSteps && meeting.nextSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-brand-500" /> Próximos Passos
                    </span>
                    <div className="space-y-1">
                      {meeting.nextSteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-800"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendees */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 flex-wrap">
                  <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Participantes:</span>
                  {meeting.attendees?.map((att, idx) => (
                    <span key={idx} className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-medium">
                      {att}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(meeting)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeeting(meeting.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant={meeting.status === 'realizada' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => toggleStatus(meeting)}
                >
                  {meeting.status === 'realizada' ? 'Marcar como Agendada' : 'Marcar como Realizada ✓'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Reunião */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingMeeting ? 'Editar Reunião' : 'Agendar / Registrar Reunião'}
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
                label="Título / Assunto da Reunião"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Apresentação de Proposta / Alinhamento Mensal"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Vínculo com:
                  </label>
                  <select
                    value={formData.relatedToType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relatedToType: e.target.value as 'cliente' | 'lead',
                        relatedToId: '',
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="cliente">Cliente Ativo</option>
                    <option value="lead">Lead Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Selecione a Conta / Oportunidade
                  </label>
                  <select
                    required
                    value={formData.relatedToId}
                    onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Selecione...</option>
                    {formData.relatedToType === 'cliente'
                      ? clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.tradeName}
                          </option>
                        ))
                      : leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.companyName || l.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Data e Horário"
                  type="datetime-local"
                  required
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as MeetingStatus })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="agendada">Agendada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Pauta */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Pauta da Reunião
                </label>
                <textarea
                  rows={2}
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  placeholder="Tópicos que serão discutidos..."
                  className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Ata / Observações */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Ata / Resumo dos Acordos
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="O que foi decidido na reunião..."
                  className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Próximos Passos */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Próximos Passos (Action Items)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar próximo passo..."
                    value={formData.nextStepInput}
                    onChange={(e) => setFormData({ ...formData, nextStepInput: e.target.value })}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddNextStep}>
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-1 pt-1">
                  {formData.nextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-white border border-zinc-200 text-xs"
                    >
                      <span className="text-zinc-800">{step}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNextStep(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingMeeting ? 'Salvar Alterações' : 'Salvar Reunião'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
