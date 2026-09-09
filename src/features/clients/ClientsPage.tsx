import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Client, ClientStatus, ClientServiceItem } from '@/types/workspace.types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { exportClientsCSV } from '@/lib/exportUtils'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plus,
  Search,
  Phone,
  Mail,
  FolderKanban,
  CheckSquare,
  ChevronRight,
  X,
  Edit2,
  Layers,
  Building2,
  Download,
} from 'lucide-react'

export const ClientsPage: React.FC = () => {
  const { clients, projects, tasks, addClient, updateClient, deleteClient } =
    useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Selected Client for 360 View Drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Modal State for New/Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    document: '',
    contactName: '',
    phone: '',
    email: '',
    segment: '',
    status: 'ativo' as ClientStatus,
    responsible: 'Mariana (Atendimento)',
    monthlyValue: 4500,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    services: [] as ClientServiceItem[],
  })

  const [serviceName, setServiceName] = useState('')
  const [serviceValue, setServiceValue] = useState<number>(0)

  const openNewModal = () => {
    setEditingClient(null)
    setFormData({
      companyName: '',
      tradeName: '',
      document: '',
      contactName: '',
      phone: '',
      email: '',
      segment: '',
      status: 'ativo',
      responsible: 'Mariana (Atendimento)',
      monthlyValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      services: [],
    })
    setIsModalOpen(true)
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    setFormData({
      companyName: client.companyName,
      tradeName: client.tradeName,
      document: client.document,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      segment: client.segment,
      status: client.status,
      responsible: client.responsible,
      monthlyValue: client.monthlyValue,
      startDate: client.startDate,
      notes: client.notes,
      services: client.services || [],
    })
    setIsModalOpen(true)
  }

  const handleAddService = () => {
    if (!serviceName) return
    const newService: ClientServiceItem = {
      id: 'srv-' + Date.now(),
      name: serviceName,
      value: serviceValue || 0,
      isRecurring: true,
      frequency: 'mensal',
    }
    const updatedServices = [...formData.services, newService]
    const newMonthlyTotal = updatedServices.reduce((acc, s) => acc + s.value, 0)
    setFormData({
      ...formData,
      services: updatedServices,
      monthlyValue: newMonthlyTotal,
    })
    setServiceName('')
    setServiceValue(0)
  }

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = formData.services.filter((s) => s.id !== serviceId)
    const newMonthlyTotal = updatedServices.reduce((acc, s) => acc + s.value, 0)
    setFormData({
      ...formData,
      services: updatedServices,
      monthlyValue: newMonthlyTotal,
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      updateClient(editingClient.id, formData)
    } else {
      addClient(formData)
    }
    setIsModalOpen(false)
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.segment.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || client.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="green" size="sm">Ativo</Badge>
      case 'onboarding':
        return <Badge variant="orange" size="sm">Onboarding</Badge>
      case 'pausado':
        return <Badge variant="yellow" size="sm">Pausado</Badge>
      case 'inativo':
        return <Badge variant="gray" size="sm">Inativo</Badge>
    }
  }

  // Related items for 360 view
  const clientProjects = selectedClient
    ? projects.filter((p) => p.clientId === selectedClient.id)
    : []
  const clientTasks = selectedClient
    ? tasks.filter((t) => t.clientId === selectedClient.id)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Gestão de Clientes
            </h1>
            <Badge variant="orange">Base de Contas</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Visão 360º de todas as contas da agência, contratos, serviços ativos e operação vinculada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportClientsCSV(filteredClients)}
            leftIcon={<Download className="w-4 h-4" />}
            title="Exportar base de clientes em formato CSV"
          >
            Exportar Clientes (CSV)
          </Button>
          <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar cliente por razão social, nome fantasia ou contato..."
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
            <option value="ativo">Ativo</option>
            <option value="onboarding">Onboarding</option>
            <option value="pausado">Pausado</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description={
            searchTerm || filterStatus !== 'all'
              ? 'Nenhum cliente corresponde aos filtros aplicados.'
              : 'Cadastre o primeiro cliente da agência para gerenciar projetos, contratos e serviços.'
          }
          actionLabel="Cadastrar Novo Cliente"
          onAction={openNewModal}
          icon={<Building2 className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientProjs = projects.filter((p) => p.clientId === client.id)
            const clientPendingTasks = tasks.filter(
              (t) => t.clientId === client.id && t.status !== 'concluido'
            )

            return (
              <Card
                key={client.id}
                className="p-4 hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
                onClick={() => setSelectedClient(client)}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-brand-500 font-bold text-sm flex items-center justify-center border border-zinc-800 shadow-xs">
                        {client.tradeName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                          {client.tradeName}
                        </h3>
                        <p className="text-[11px] text-zinc-500">{client.segment || 'Geral'}</p>
                      </div>
                    </div>
                    {getStatusBadge(client.status)}
                  </div>

                  {/* Monthly Value & Services */}
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                        Fee Mensal (MRR)
                      </span>
                      <span className="text-sm font-bold tabular-nums text-zinc-900">
                        {formatCurrency(client.monthlyValue)}
                      </span>
                    </div>
                    <Badge variant="orange" size="sm">
                      {client.services?.length || 0} Serviços
                    </Badge>
                  </div>

                  {/* Contact & Responsible */}
                  <div className="text-xs space-y-1 text-zinc-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-zinc-800">{client.contactName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Phone className="w-3 h-3 text-zinc-400" /> {client.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                      <Mail className="w-3 h-3 text-zinc-400" /> {client.email}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>{clientProjs.length} Projetos</span>
                    <span>•</span>
                    <span>{clientPendingTasks.length} Tarefas abertas</span>
                  </div>
                  <span className="text-brand-600 font-bold flex items-center gap-0.5">
                    Ver 360º <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 360º Client Details Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 text-brand-500 font-bold text-lg flex items-center justify-center border border-zinc-800">
                    {selectedClient.tradeName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-zinc-900">
                        {selectedClient.tradeName}
                      </h2>
                      {getStatusBadge(selectedClient.status)}
                    </div>
                    <p className="text-xs text-zinc-500">{selectedClient.companyName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const c = selectedClient
                      setSelectedClient(null)
                      openEditModal(c)
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 360 Key Info Box */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Fee Recorrente</span>
                  <span className="text-base font-bold tabular-nums text-brand-600">
                    {formatCurrency(selectedClient.monthlyValue)}/mês
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Responsável Interno</span>
                  <span className="font-semibold text-zinc-900">{selectedClient.responsible}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Contato Principal</span>
                  <span className="font-medium text-zinc-800">{selectedClient.contactName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Início do Contrato</span>
                  <span className="font-medium text-zinc-800">{formatDate(selectedClient.startDate)}</span>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-500" /> Serviços Contratados
                </h3>
                <div className="space-y-1.5">
                  {selectedClient.services?.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-zinc-200 text-xs"
                    >
                      <span className="font-semibold text-zinc-800">{srv.name}</span>
                      <span className="font-bold tabular-nums text-zinc-900">{formatCurrency(srv.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Projects */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-brand-500" /> Projetos da Conta ({clientProjects.length})
                </h3>
                <div className="space-y-1.5">
                  {clientProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-white border border-zinc-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">{p.name}</span>
                        <Badge variant="orange" size="sm">{p.progress}%</Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500">{p.description}</p>
                    </div>
                  ))}
                  {clientProjects.length === 0 && (
                    <p className="text-xs text-zinc-400 italic">Nenhum projeto ativo.</p>
                  )}
                </div>
              </div>

              {/* Open Tasks */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-500" /> Tarefas em Andamento ({clientTasks.length})
                </h3>
                <div className="space-y-1.5">
                  {clientTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-200 text-xs"
                    >
                      <span className="font-medium text-zinc-800">{t.title}</span>
                      <Badge variant="gray" size="sm">{t.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Notes */}
              {selectedClient.notes && (
                <div className="p-3 bg-brand-50/50 border border-brand-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-brand-700">Observações Operacionais</span>
                  <p className="text-xs text-zinc-700">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja remover o cliente "${selectedClient.tradeName}"? Essa ação não pode ser desfeita.`)) {
                    deleteClient(selectedClient.id)
                    setSelectedClient(null)
                  }
                }}
              >
                Remover Cliente
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
                Fechar Visão 360º
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente ELD'}
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
                  label="Nome Fantasia / Marca"
                  required
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="Ex: Grupo Vértice"
                />
                <Input
                  label="Razão Social"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Ex: Vértice Engenharia LTDA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="CNPJ / CPF"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
                <Input
                  label="Contato Principal"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Nome do Diretor/Gestor"
                />
                <Input
                  label="Segmento"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  placeholder="Ex: Imobiliário, Saúde"
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
                  placeholder="contato@cliente.com.br"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status da Conta
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ClientStatus })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="pausado">Pausado</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Responsável ELD
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <Input
                  label="Fee Total Mensal (R$)"
                  type="number"
                  value={formData.monthlyValue}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyValue: Number(e.target.value) })
                  }
                />
              </div>

              {/* Services Sub-management */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Adicionar Serviços do Pacote
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do serviço (Ex: Social Media, Tráfego)"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Valor (R$)"
                    value={serviceValue}
                    onChange={(e) => setServiceValue(Number(e.target.value))}
                    className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddService}>
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-1 pt-1">
                  {formData.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between p-2 rounded bg-white border border-zinc-200 text-xs"
                    >
                      <span className="font-semibold text-zinc-800">{srv.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">{formatCurrency(srv.value)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(srv.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
