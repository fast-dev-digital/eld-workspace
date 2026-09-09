import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { useWorkspace } from '@/context/WorkspaceContext'
import { Contract, ContractStatus } from '@/types/workspace.types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  X,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react'

export const ContractsPage: React.FC = () => {
  const { contracts, clients, addContract, updateContract, deleteContract } = useWorkspace()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    title: '',
    services: '',
    value: 5000,
    billingType: 'recorrente' as 'recorrente' | 'pontual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'vigente' as ContractStatus,
    documentUrl: '',
    notes: '',
  })

  const openNewModal = () => {
    setEditingContract(null)
    const firstClient = clients[0]
    setFormData({
      clientId: firstClient ? firstClient.id : '',
      clientName: firstClient ? firstClient.tradeName : '',
      title: '',
      services: '',
      value: 0,
      billingType: 'recorrente',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'vigente',
      documentUrl: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      clientId: contract.clientId,
      clientName: contract.clientName,
      title: contract.title,
      services: contract.services,
      value: contract.value,
      billingType: contract.billingType,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      documentUrl: contract.documentUrl || '',
      notes: contract.notes,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedClientObj = clients.find((c) => c.id === formData.clientId)
    const clientName = formData.clientId && selectedClientObj ? selectedClientObj.tradeName : ''

    if (editingContract) {
      updateContract(editingContract.id, { ...formData, clientName })
    } else {
      addContract({ ...formData, clientName })
    }
    setIsModalOpen(false)
  }

  const handleDeleteContract = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o contrato "${title}"?`)) {
      deleteContract(id)
    }
  }

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.services.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'vigente':
        return <Badge variant="green" size="sm">Vigente ✓</Badge>
      case 'aguardando_assinatura':
        return <Badge variant="orange" size="sm">Aguardando Assinatura</Badge>
      case 'em_elaboracao':
        return <Badge variant="yellow" size="sm">Em Elaboração</Badge>
      case 'renovado':
        return <Badge variant="blue" size="sm">Renovado</Badge>
      case 'encerrado':
      default:
        return <Badge variant="gray" size="sm">Encerrado</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Contratos & Documentos
            </h1>
            <Badge variant="orange">Jurídico e Vigências</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Cadastro e organização das informações contratuais, vigências, valores e links de documentos.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openNewModal} leftIcon={<Plus className="w-4 h-4" />}>
          Novo Contrato
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por contrato, cliente ou escopo..."
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
            <option value="vigente">Vigente</option>
            <option value="aguardando_assinatura">Aguardando Assinatura</option>
            <option value="em_elaboracao">Em Elaboração</option>
            <option value="renovado">Renovado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <EmptyState
          title="Nenhum contrato cadastrado"
          description={
            searchTerm || filterStatus !== 'all'
              ? 'Nenhum contrato corresponde aos filtros selecionados.'
              : 'Cadastre contratos de prestação de serviços, termos de adesão e vigências jurídicas da agência.'
          }
          actionLabel="Cadastrar Contrato"
          onAction={openNewModal}
          icon={<FileText className="w-8 h-8 text-brand-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContracts.map((contract) => (
            <Card
              key={contract.id}
              className="p-5 hover:border-brand-500 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
                    {contract.clientName}
                  </span>
                  {getStatusBadge(contract.status)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                    {contract.title}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 font-medium">{contract.services}</p>
                </div>

                {/* Value & Dates */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Valor do Contrato</span>
                    <span className="text-sm font-bold tabular-nums text-zinc-900">{formatCurrency(contract.value)}</span>
                    <span className="text-[10px] text-zinc-500 block capitalize">({contract.billingType})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Data de Início</span>
                    <span className="font-semibold text-zinc-800">{formatDate(contract.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Vigência Até</span>
                    <span className="font-semibold text-zinc-800">{formatDate(contract.endDate)}</span>
                  </div>
                </div>

                {/* Document Link */}
                {contract.documentUrl && (
                  <a
                    href={contract.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5" />
                      Arquivo Digital do Contrato (.PDF)
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                {/* Notes */}
                {contract.notes && (
                  <p className="text-[11px] text-zinc-500 italic">
                    Obs: {contract.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Cadastrado em {formatDate(contract.createdAt)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(contract)}
                    className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                    title="Editar Contrato"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContract(contract.id, contract.title)}
                    className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                    title="Excluir Contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Contrato */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingContract ? 'Editar Contrato' : 'Novo Contrato de Prestação de Serviços'}
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
                <span>Nenhum cliente cadastrado ainda. Recomendamos cadastrar um cliente na aba <strong>Clientes</strong> antes de criar um contrato.</span>
              </div>
            )}

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

                <Input
                  label="Título do Contrato"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Contrato Anual de Marketing"
                />
              </div>

              <Input
                label="Escopo dos Serviços Inclusos"
                required
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="Ex: Gestão de Tráfego Pago + Social Media + Criação"
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
                    Formato de Cobrança
                  </label>
                  <select
                    value={formData.billingType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingType: e.target.value as 'recorrente' | 'pontual',
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="recorrente">Recorrente (Mensal)</option>
                    <option value="pontual">Pontual (Taxa Única)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Data de Início"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <Input
                  label="Término / Renovação"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ContractStatus })
                    }
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="vigente">Vigente</option>
                    <option value="aguardando_assinatura">Aguardando Assinatura</option>
                    <option value="em_elaboracao">Em Elaboração</option>
                    <option value="renovado">Renovado</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
              </div>

              <FileUpload
                label="Documento do Contrato (PDF / Assinado)"
                value={formData.documentUrl}
                onChange={(url) => setFormData({ ...formData, documentUrl: url })}
                folder="contracts"
                accept=".pdf,.doc,.docx"
                helpText="Envie o arquivo PDF do contrato assinado ou cole o link do Google Drive/DocuSign"
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Observações e Cláusulas Especiais
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações de rescisão, vencimento de boletos..."
                  className="w-full rounded-lg border border-zinc-200 p-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingContract ? 'Salvar Alterações' : 'Salvar Contrato'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
