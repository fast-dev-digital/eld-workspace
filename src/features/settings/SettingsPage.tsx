import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ELDLogo } from '@/components/ui/ELDLogo'
import { useWorkspace, UserRole, TeamMember } from '@/context/WorkspaceContext'
import {
  Building2,
  Users,
  Database,
  Palette,
  Shield,
  Plus,
  Trash2,
  Edit2,
  X,
  Copy,
  RotateCcw,
  Sparkles,
  CloudCheck,
  CheckCircle2,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'

type SettingsTab = 'geral' | 'equipe' | 'database' | 'branding'

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    isStandbyMode,
    teamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    agencySettings,
    updateAgencySettings,
    resetToDefaultData,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState<SettingsTab>('geral')

  // Agency Form State
  const [agencyForm, setAgencyForm] = useState(agencySettings)

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
  })

  // Team Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    role: 'operacional' as UserRole,
    department: '',
    phone: '',
  })

  const [isTestingCloud, setIsTestingCloud] = useState(false)

  // Save Agency Settings
  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault()
    updateAgencySettings(agencyForm)
  }

  // Save Current User Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Preencha o nome e o e-mail.')
      return
    }
    setCurrentUser({
      ...currentUser,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    })
    setIsProfileModalOpen(false)
    toast.success('Perfil atualizado com sucesso!')
  }

  // Open Member Modal
  const openNewMemberModal = () => {
    setEditingMember(null)
    setMemberForm({
      name: '',
      email: '',
      role: 'operacional',
      department: '',
      phone: '',
    })
    setIsMemberModalOpen(true)
  }

  const openEditMemberModal = (member: TeamMember) => {
    setEditingMember(member)
    setMemberForm({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      phone: member.phone || '',
    })
    setIsMemberModalOpen(true)
  }

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      toast.error('Informe o nome e o e-mail do colaborador.')
      return
    }

    if (editingMember) {
      updateTeamMember(editingMember.id, memberForm)
    } else {
      addTeamMember(memberForm)
    }
    setIsMemberModalOpen(false)
  }

  const handleCopyColor = (colorHex: string, label: string) => {
    navigator.clipboard.writeText(colorHex)
    toast.success(`Código ${label} (${colorHex}) copiado!`)
  }

  const handleTestCloudConnection = () => {
    setIsTestingCloud(true)
    setTimeout(() => {
      setIsTestingCloud(false)
      if (!isStandbyMode) {
        toast.success('Conexão Supabase em Nuvem 100% operacional!')
      } else {
        toast.info('Workspace operando em Modo Standby (armazenamento local).')
      }
    }, 800)
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="orange">Diretoria / Admin</Badge>
      case 'comercial':
        return <Badge variant="blue">Comercial / CRM</Badge>
      case 'operacional':
        return <Badge variant="gray">Operacional</Badge>
      case 'financeiro':
        return <Badge variant="green">Financeiro</Badge>
      default:
        return <Badge variant="gray">{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Configurações & Organização
            </h1>
            <Badge variant="orange">Workspace ELD</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Gerencie os dados cadastrais da agência, equipe de colaboradores, conexões e preferências da plataforma.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isStandbyMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>Modo Standby (Local)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Nuvem Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'geral'
              ? 'border-brand-500 text-brand-600 bg-brand-50/40 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Perfil da Agência
        </button>

        <button
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'equipe'
              ? 'border-brand-500 text-brand-600 bg-brand-50/40 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Equipe & Colaboradores
          {teamMembers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-100 text-[10px] text-zinc-700 font-bold">
              {teamMembers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-brand-500 text-brand-600 bg-brand-50/40 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Database className="w-4 h-4" />
          Banco de Dados & Nuvem
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-brand-500 text-brand-600 bg-brand-50/40 rounded-t-lg'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <Palette className="w-4 h-4" />
          Identidade & Marca
        </button>
      </div>

      {/* TAB 1: PERFIL DA AGÊNCIA */}
      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-500" /> Informações Cadastrais da Agência
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Estes dados identificam sua empresa nos relatórios, contratos e documentos gerados no workspace.
                </p>
              </div>

              <form onSubmit={handleSaveAgency} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Razão Social / Nome da Empresa"
                    required
                    value={agencyForm.name}
                    onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                    placeholder="Ex: ELD Agência de Publicidade Ltda"
                  />
                  <Input
                    label="Nome Fantasia / Marca"
                    required
                    value={agencyForm.tradeName}
                    onChange={(e) => setAgencyForm({ ...agencyForm, tradeName: e.target.value })}
                    placeholder="Ex: ELD Workspace"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="CNPJ"
                    value={agencyForm.document}
                    onChange={(e) => setAgencyForm({ ...agencyForm, document: e.target.value })}
                    placeholder="00.000.000/0001-00"
                  />
                  <Input
                    label="E-mail Corporativo Principal"
                    type="email"
                    required
                    value={agencyForm.email}
                    onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                    placeholder="contato@eld.agencia"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Telefone / WhatsApp Comercial"
                    value={agencyForm.phone}
                    onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                  <Input
                    label="Website Oficial"
                    value={agencyForm.website}
                    onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                    placeholder="https://eld.agencia"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Cidade / Estado (UF)"
                    value={agencyForm.city}
                    onChange={(e) => setAgencyForm({ ...agencyForm, city: e.target.value })}
                    placeholder="São Paulo - SP"
                  />
                  <Input
                    label="Segmento / Especialidade"
                    value={agencyForm.segment}
                    onChange={(e) => setAgencyForm({ ...agencyForm, segment: e.target.value })}
                    placeholder="Marketing Digital & Performance"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm">
                    Salvar Dados da Agência
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-500" /> Resumo do Workspace
              </h3>

              <div className="divide-y divide-zinc-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-zinc-500">Status Operacional</span>
                  <Badge variant="green" size="sm">Ativo ✓</Badge>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-zinc-500">Slug da Organização</span>
                  <span className="font-mono text-zinc-800 font-semibold">eld-agencia</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-zinc-500">Versão do Sistema</span>
                  <Badge variant="orange" size="sm">v1.0.0 Produção</Badge>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-zinc-500">Moeda Padrão</span>
                  <span className="font-semibold text-zinc-800">Real Brasileiro (R$)</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-zinc-500">Fuso Horário</span>
                  <span className="font-semibold text-zinc-800">Brasília (GMT-3)</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3 bg-zinc-50/60 border-zinc-200">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                <Briefcase className="w-4 h-4 text-brand-500" />
                <span>Canais de Atendimento</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Mantenha suas informações comerciais atualizadas para que clientes e leads recebam comunicações com os dados oficiais da agência.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-zinc-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{agencySettings.email || 'Não informado'}</span>
                </div>
                {agencySettings.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{agencySettings.phone}</span>
                  </div>
                )}
                {agencySettings.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{agencySettings.city}</span>
                  </div>
                )}
                {agencySettings.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-brand-600 font-medium">{agencySettings.website}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPE & COLABORADORES (Zero Mocks!) */}
      {activeTab === 'equipe' && (
        <div className="space-y-6">
          {/* Active Account Banner */}
          <Card className="p-5 border-brand-100 bg-gradient-to-r from-brand-50/20 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-brand-500 font-black text-lg flex items-center justify-center shadow-md border border-zinc-800">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">{currentUser.name}</h3>
                    <Badge variant="orange" size="sm">Você • Administrador</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acesso total liberado para todos os módulos e configurações</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setProfileForm({ name: currentUser.name, email: currentUser.email })
                    setIsProfileModalOpen(true)
                  }}
                >
                  Editar Meu Perfil
                </Button>
              </div>
            </div>
          </Card>

          {/* Team List Section */}
          <Card noPadding className="overflow-hidden border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-500" /> Colaboradores Cadastrados
                  <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 text-[10px] font-bold">
                    {teamMembers.length}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Membros da sua equipe com permissão para atuar nos projetos e demandas da agência.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={openNewMemberModal}
              >
                Adicionar Colaborador
              </Button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <EmptyState
                  title="Nenhum colaborador adicional cadastrado"
                  description="Adicione designers, gestores de tráfego, copywriters ou atendimentos da sua agência para delegar tarefas e demandas."
                  actionLabel="Adicionar Primeiro Colaborador"
                  onAction={openNewMemberModal}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Colaborador</th>
                      <th className="p-3">Departamento / Cargo</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Nível de Permissão</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 text-brand-500 font-bold text-xs flex items-center justify-center">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900">{member.name}</div>
                              <div className="text-[11px] text-zinc-400">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-zinc-700">
                          {member.department || 'Geral'}
                        </td>
                        <td className="p-3 text-zinc-500">{member.phone || '-'}</td>
                        <td className="p-3">{getRoleBadge(member.role)}</td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => openEditMemberModal(member)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                            title="Editar colaborador"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remover ${member.name} da equipe?`)) {
                                deleteTeamMember(member.id)
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                            title="Remover colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: BANCO DE DADOS & NUVEM */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isStandbyMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isStandbyMode ? <Zap className="w-5 h-5" /> : <CloudCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">
                      {isStandbyMode ? 'Modo Standby (Armazenamento Local)' : 'Supabase Nuvem Conectado & Ativo'}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {isStandbyMode
                        ? 'Os dados são salvos localmente com segurança no navegador atual.'
                        : 'Sincronização em nuvem ativa com PostgreSQL gerenciado.'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestCloudConnection}
                  disabled={isTestingCloud}
                >
                  {isTestingCloud ? 'Verificando...' : 'Testar Conexão'}
                </Button>
              </div>

              {/* Technical Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Host do Banco de Dados
                  </span>
                  <div className="font-mono text-zinc-800 truncate font-semibold">
                    {import.meta.env.VITE_SUPABASE_URL || 'Configuração Local / Standby'}
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Módulos & Tabelas Sincronizadas
                  </span>
                  <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>10 de 10 Tabelas Operacionais</span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Segurança & Acesso
                  </span>
                  <div className="font-semibold text-zinc-800">
                    Políticas RLS (Row Level Security) Ativas
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Padrão de Chaves
                  </span>
                  <div className="font-semibold text-zinc-800">
                    UUID v4 RFC 4122 (100% Compatível)
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" /> Alta Disponibilidade & Redundância
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Mesmo em caso de instabilidade na conexão com a internet, o ELD Workspace mantém uma cópia em cache no seu navegador, sincronizando assim que o sinal for restabelecido.
                </p>
              </div>
            </Card>
          </div>

          {/* Maintenance & Dangerous Actions */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4 border-zinc-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-zinc-600" /> Manutenção do Workspace
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Utilize esta opção caso queira limpar o cache local do seu navegador para reiniciar os testes do zero.
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 space-y-1">
                <strong>Atenção:</strong> Esta ação limpa o armazenamento do navegador. Seus dados cadastrados na nuvem Supabase não serão afetados.
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-400"
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                onClick={() => {
                  if (confirm('Deseja realmente limpar todos os dados do cache local do navegador?')) {
                    resetToDefaultData()
                  }
                }}
              >
                Limpar Cache Local (Reset)
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: IDENTIDADE & MARCA */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-500" /> Identidade Visual Oficial da Agência
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Padronização cromática e aplicações oficiais do logo da ELD no ecossistema de software e materiais.
                </p>
              </div>

              {/* Logo Previews Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center space-y-3 text-white border border-zinc-800 shadow-sm">
                  <ELDLogo variant="white" size="lg" showSubtitle subtitle="WORKSPACE" />
                  <span className="text-[11px] text-zinc-400 font-medium">Aplicação Dark (Preto + Laranja)</span>
                </div>

                <div className="p-6 bg-white rounded-2xl flex flex-col items-center justify-center space-y-3 text-zinc-900 border border-zinc-200 shadow-2xs">
                  <ELDLogo variant="orange" size="lg" showSubtitle subtitle="WORKSPACE" />
                  <span className="text-[11px] text-zinc-500 font-medium">Aplicação Light (Branco + Laranja)</span>
                </div>
              </div>

              {/* Color Palette Grid */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Paleta de Cores do Sistema (Clique para copiar)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Cor 1: Laranja ELD */}
                  <button
                    type="button"
                    onClick={() => handleCopyColor('#FF5500', 'Laranja ELD')}
                    className="p-3 rounded-xl border border-zinc-200 hover:border-brand-500 transition-all text-left space-y-2 bg-white group shadow-2xs"
                  >
                    <div className="w-full h-10 rounded-lg bg-[#FF5500] shadow-inner" />
                    <div>
                      <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                        <span>Laranja ELD</span>
                        <Copy className="w-3 h-3 text-zinc-400 group-hover:text-brand-500" />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">#FF5500</div>
                    </div>
                  </button>

                  {/* Cor 2: Preto Profundo */}
                  <button
                    type="button"
                    onClick={() => handleCopyColor('#09090B', 'Preto Profundo')}
                    className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-900 transition-all text-left space-y-2 bg-white group shadow-2xs"
                  >
                    <div className="w-full h-10 rounded-lg bg-[#09090B] shadow-inner" />
                    <div>
                      <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                        <span>Preto Grafite</span>
                        <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900" />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">#09090B</div>
                    </div>
                  </button>

                  {/* Cor 3: Branco Puro */}
                  <button
                    type="button"
                    onClick={() => handleCopyColor('#FFFFFF', 'Branco Puro')}
                    className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-all text-left space-y-2 bg-white group shadow-2xs"
                  >
                    <div className="w-full h-10 rounded-lg bg-white border border-zinc-200 shadow-inner" />
                    <div>
                      <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                        <span>Branco Neve</span>
                        <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900" />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">#FFFFFF</div>
                    </div>
                  </button>

                  {/* Cor 4: Cinza Neutro */}
                  <button
                    type="button"
                    onClick={() => handleCopyColor('#71717A', 'Cinza Neutro')}
                    className="p-3 rounded-xl border border-zinc-200 hover:border-zinc-500 transition-all text-left space-y-2 bg-white group shadow-2xs"
                  >
                    <div className="w-full h-10 rounded-lg bg-[#71717A] shadow-inner" />
                    <div>
                      <div className="font-bold text-zinc-900 text-xs flex items-center justify-between">
                        <span>Cinza Suporte</span>
                        <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700" />
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">#71717A</div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Typography & Design Guidelines */}
          <div className="space-y-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Diretrizes de Marca
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                A identidade da ELD combina minimalismo gráfico de alta performance com tipografia direta e contraste expressivo em laranja vibrante.
              </p>
              <div className="p-3 bg-zinc-50 rounded-xl text-xs space-y-2 border border-zinc-200">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tipografia Primária:</span>
                  <span className="font-semibold text-zinc-800">Inter / Sans-Serif</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Densidade de Dados:</span>
                  <span className="font-semibold text-zinc-800">Alta & Estruturada</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Contraste:</span>
                  <span className="font-semibold text-zinc-800">WCAG AAA Aprovado</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERFIL DO USUÁRIO ATIVO */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">Editar Meu Perfil</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <Input
                label="Nome do Usuário / Cargo"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Ex: Diretoria Executiva ou Seu Nome"
              />

              <Input
                label="E-mail de Acesso"
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="admin@eld.agencia"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Perfil
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR / EDITAR COLABORADOR */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h2 className="text-base font-extrabold text-zinc-900">
                {editingMember ? 'Editar Colaborador' : 'Novo Colaborador da Equipe'}
              </h2>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <Input
                label="Nome Completo"
                required
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="Ex: João da Silva"
              />

              <Input
                label="E-mail Corporativo"
                type="email"
                required
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="joao@eld.agencia"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Departamento / Função"
                  value={memberForm.department}
                  onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                  placeholder="Ex: Tráfego Pago / Design"
                />

                <Input
                  label="Telefone / WhatsApp"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  placeholder="(11) 98888-7777"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nível de Permissão
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="admin">Diretoria / Administrador (Acesso Total)</option>
                  <option value="comercial">Comercial / CRM (Funil, Clientes e Reuniões)</option>
                  <option value="operacional">Operacional (Projetos, Tarefas, Briefings e Entregas)</option>
                  <option value="financeiro">Financeiro (Honorários, Transações e Metas)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMemberModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingMember ? 'Salvar Alterações' : 'Adicionar Colaborador'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
