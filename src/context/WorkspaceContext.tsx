import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Lead,
  Client,
  Project,
  Task,
  Briefing,
  ApprovalItem,
  Meeting,
  Contract,
  FinancialTransaction,
  CommercialStage,
  TaskWorkflowStatus,
  ApprovalStatus,
  ClientStatus,
} from '@/types/workspace.types'
import {
  initialLeads,
  initialClients,
  initialProjects,
  initialTasks,
  initialBriefings,
  initialApprovals,
  initialMeetings,
  initialContracts,
  initialTransactions,
} from '@/lib/mockData'
import { isSupabaseConfigured } from '@/lib/supabase'
import { supabaseService } from '@/services/supabaseService'
import { toast } from 'sonner'

export type UserRole = 'admin' | 'comercial' | 'operacional' | 'financeiro'

export interface UserProfile {
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  phone?: string
  createdAt: string
}

export interface AgencySettings {
  name: string
  tradeName: string
  document: string
  email: string
  phone: string
  website: string
  city: string
  segment: string
}

interface WorkspaceContextType {
  // User & Auth Standby state
  currentUser: UserProfile
  setCurrentUser: (user: UserProfile) => void
  setUserRole: (role: UserRole) => void
  isStandbyMode: boolean
  isLoadingCloud: boolean

  // Team
  teamMembers: TeamMember[]
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => void

  // Agency Settings
  agencySettings: AgencySettings
  updateAgencySettings: (updates: Partial<AgencySettings>) => void

  // Leads (CRM)
  leads: Lead[]
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  updateLeadStage: (id: string, stage: CommercialStage) => void
  deleteLead: (id: string) => void
  convertLeadToClient: (leadId: string) => void

  // Clients
  clients: Client[]
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  updateClientStatus: (id: string, status: ClientStatus) => void
  deleteClient: (id: string) => void

  // Projects
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  updateTaskStatus: (id: string, status: TaskWorkflowStatus) => void
  deleteTask: (id: string) => void

  // Briefings
  briefings: Briefing[]
  addBriefing: (briefing: Omit<Briefing, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBriefing: (id: string, updates: Partial<Briefing>) => void
  deleteBriefing: (id: string) => void

  // Approvals & Deliveries
  approvals: ApprovalItem[]
  addApproval: (approval: Omit<ApprovalItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApprovalStatus: (id: string, status: ApprovalStatus, feedback?: string) => void
  deleteApproval: (id: string) => void

  // Meetings
  meetings: Meeting[]
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void
  updateMeeting: (id: string, updates: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void

  // Contracts
  contracts: Contract[]
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void
  updateContract: (id: string, updates: Partial<Contract>) => void
  deleteContract: (id: string) => void

  // Financial
  transactions: FinancialTransaction[]
  addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => void
  deleteTransaction: (id: string) => void

  // Utils
  resetToDefaultData: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const STORAGE_KEY_PREFIX = 'eld_workspace_'
const STORAGE_VERSION_KEY = 'eld_workspace_v'
const CURRENT_VERSION = 'production_v1.0'

// Limpa dados legados de demonstração na primeira inicialização de produção
function cleanLegacyStorageIfNeeded() {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      const keys = [
        'leads',
        'clients',
        'projects',
        'tasks',
        'briefings',
        'approvals',
        'meetings',
        'contracts',
        'transactions',
      ]
      keys.forEach((k) => {
        localStorage.removeItem(STORAGE_KEY_PREFIX + k)
        localStorage.removeItem('eld_' + k)
      })
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
    }
  } catch {
    // Ignorar erros em modo anônimo ou storage indisponível
  }
}
cleanLegacyStorageIfNeeded()

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error(`Erro ao salvar ${key} no localStorage:`, err)
  }
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    const stored = getStored<UserProfile>('user', {
      name: 'Diretoria Executiva',
      email: 'admin@eld.agencia',
      role: 'admin',
    })
    return { ...stored, role: 'admin' }
  })

  const isStandbyMode = !isSupabaseConfigured
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(isSupabaseConfigured)

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user)
    setStored('user', user)
  }

  const setUserRole = (role: UserRole) => {
    const updated = { ...currentUser, role }
    setCurrentUser(updated)
    toast.info(`Perfil alterado para: ${role.toUpperCase()}`)
  }

  // 10 Modules State
  const [leads, setLeads] = useState<Lead[]>(() => getStored('leads', initialLeads))
  const [clients, setClients] = useState<Client[]>(() => getStored('clients', initialClients))
  const [projects, setProjects] = useState<Project[]>(() => getStored('projects', initialProjects))
  const [tasks, setTasks] = useState<Task[]>(() => getStored('tasks', initialTasks))
  const [briefings, setBriefings] = useState<Briefing[]>(() => getStored('briefings', initialBriefings))
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => getStored('approvals', initialApprovals))
  const [meetings, setMeetings] = useState<Meeting[]>(() => getStored('meetings', initialMeetings))
  const [contracts, setContracts] = useState<Contract[]>(() => getStored('contracts', initialContracts))
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() =>
    getStored('transactions', initialTransactions)
  )
  const defaultAgencySettings: AgencySettings = {
    name: 'ELD Agência de Marketing & Publicidade',
    tradeName: 'ELD Workspace',
    document: '',
    email: 'admin@eld.agencia',
    phone: '',
    website: 'https://eld.agencia',
    city: 'São Paulo - SP',
    segment: 'Marketing Digital, Performance & Conteúdo',
  }
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => getStored('team', []))
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(() =>
    getStored('agency_settings', defaultAgencySettings)
  )

  // Sync to localStorage
  useEffect(() => setStored('leads', leads), [leads])
  useEffect(() => setStored('clients', clients), [clients])
  useEffect(() => setStored('projects', projects), [projects])
  useEffect(() => setStored('tasks', tasks), [tasks])
  useEffect(() => setStored('briefings', briefings), [briefings])
  useEffect(() => setStored('approvals', approvals), [approvals])
  useEffect(() => setStored('meetings', meetings), [meetings])
  useEffect(() => setStored('contracts', contracts), [contracts])
  useEffect(() => setStored('transactions', transactions), [transactions])
  useEffect(() => setStored('team', teamMembers), [teamMembers])
  useEffect(() => setStored('agency_settings', agencySettings), [agencySettings])

  // Real Supabase Sync on Mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      setIsLoadingCloud(true)
      supabaseService
        .fetchAllData()
        .then((data) => {
          if (data) {
            const hasRemoteData =
              data.clients.length > 0 ||
              data.leads.length > 0 ||
              data.projects.length > 0 ||
              data.tasks.length > 0 ||
              data.briefings.length > 0 ||
              data.approvals.length > 0 ||
              data.meetings.length > 0 ||
              data.contracts.length > 0 ||
              data.transactions.length > 0

            if (hasRemoteData) {
              setClients(data.clients)
              setLeads(data.leads)
              setProjects(data.projects)
              setTasks(data.tasks)
              setBriefings(data.briefings)
              setApprovals(data.approvals)
              setMeetings(data.meetings)
              setContracts(data.contracts)
              setTransactions(data.transactions)
            }
            toast.success('🟢 Conectado com sucesso ao banco Supabase!')
          }
        })
        .finally(() => setIsLoadingCloud(false))
    }
  }, [])

  // ============================
  // LEADS (CRM)
  // ============================
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newLead: Lead = {
      ...leadData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    setLeads((prev) => [newLead, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveLead(newLead)
    }
    toast.success('Lead adicionado com sucesso ao Funil!')
  }

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates, updatedAt: new Date().toISOString() } : lead))
    )
    if (isSupabaseConfigured) {
      supabaseService.saveLead({ id, ...updates })
    }
    toast.success('Lead atualizado!')
  }

  const updateLeadStage = (id: string, stage: CommercialStage) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, stage, updatedAt: new Date().toISOString() } : lead))
    )
    if (isSupabaseConfigured) {
      supabaseService.saveLead({ id, stage })
    }
  }

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteLead(id)
    }
    toast.success('Lead removido do pipeline.')
  }

  const convertLeadToClient = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) return

    const newClientId = crypto.randomUUID()
    const newClient: Client = {
      id: newClientId,
      companyName: lead.companyName || lead.name,
      tradeName: lead.companyName || lead.name,
      document: '',
      contactName: lead.name,
      phone: lead.phone,
      email: lead.email,
      segment: 'Geral',
      status: 'onboarding',
      responsible: lead.responsible || 'Mariana (Atendimento)',
      monthlyValue: lead.estimatedValue || 0,
      startDate: new Date().toISOString().split('T')[0],
      services: lead.serviceInterested
        ? [
            {
              id: crypto.randomUUID(),
              name: lead.serviceInterested,
              value: lead.estimatedValue || 0,
              isRecurring: true,
              frequency: 'mensal',
            },
          ]
        : [],
      notes: `Convertido do Lead Comercial. Origem: ${lead.origin || 'Direta'}. Observações: ${lead.notes || ''}`,
      createdAt: new Date().toISOString(),
    }

    setClients((prev) => [newClient, ...prev])
    updateLeadStage(leadId, 'cliente')
    if (isSupabaseConfigured) {
      supabaseService.saveClient(newClient)
    }
    toast.success(`Parabéns! ${newClient.tradeName} agora é oficialmente um Cliente da ELD!`)
  }

  // ============================
  // CLIENTS
  // ============================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setClients((prev) => [newClient, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveClient(newClient)
    }
    toast.success('Cliente cadastrado com sucesso!')
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    if (isSupabaseConfigured) {
      supabaseService.saveClient({ id, ...updates })
    }
    toast.success('Cadastro do cliente atualizado.')
  }

  const updateClientStatus = (id: string, status: ClientStatus) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    if (isSupabaseConfigured) {
      supabaseService.saveClient({ id, status })
    }
  }

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteClient(id)
    }
    toast.success('Cliente removido.')
  }

  // ============================
  // PROJECTS
  // ============================
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setProjects((prev) => [newProject, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveProject(newProject)
    }
    toast.success('Projeto criado com sucesso!')
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    if (isSupabaseConfigured) {
      supabaseService.saveProject({ id, ...updates })
    }
    toast.success('Projeto atualizado.')
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteProject(id)
    }
    toast.success('Projeto excluído.')
  }

  // ============================
  // TASKS
  // ============================
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveTask(newTask)
    }
    toast.success('Tarefa criada com sucesso!')
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    if (isSupabaseConfigured) {
      supabaseService.saveTask({ id, ...updates })
    }
    toast.success('Tarefa atualizada.')
  }

  const updateTaskStatus = (id: string, status: TaskWorkflowStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'concluido' ? new Date().toISOString() : undefined,
            }
          : t
      )
    )
    if (isSupabaseConfigured) {
      supabaseService.saveTask({ id, status })
    }
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteTask(id)
    }
    toast.success('Tarefa removida.')
  }

  // ============================
  // BRIEFINGS
  // ============================
  const addBriefing = (briefingData: Omit<Briefing, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newBriefing: Briefing = {
      ...briefingData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    setBriefings((prev) => [newBriefing, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveBriefing(newBriefing)
    }
    toast.success('Briefing estruturado registrado com sucesso!')
  }

  const updateBriefing = (id: string, updates: Partial<Briefing>) => {
    setBriefings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    )
    if (isSupabaseConfigured) {
      supabaseService.saveBriefing({ id, ...updates })
    }
    toast.success('Briefing atualizado.')
  }

  const deleteBriefing = (id: string) => {
    setBriefings((prev) => prev.filter((b) => b.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteBriefing(id)
    }
    toast.success('Briefing removido.')
  }

  // ============================
  // APPROVALS & DELIVERIES
  // ============================
  const addApproval = (approvalData: Omit<ApprovalItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newApproval: ApprovalItem = {
      ...approvalData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    setApprovals((prev) => [newApproval, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveApproval(newApproval)
    }
    toast.success('Material enviado para aprovação!')
  }

  const updateApprovalStatus = (id: string, status: ApprovalStatus, feedback?: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              feedback: feedback !== undefined ? feedback : a.feedback,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    )
    if (isSupabaseConfigured) {
      supabaseService.saveApproval({ id, status, feedback })
    }
    if (status === 'aprovado') {
      toast.success('Material aprovado!')
    } else if (status === 'ajustes_solicitados') {
      toast.warning('Ajustes solicitados e registrados no histórico.')
    }
  }

  const deleteApproval = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteApproval(id)
    }
    toast.success('Material removido do fluxo.')
  }

  // ============================
  // MEETINGS & MINUTES
  // ============================
  const addMeeting = (meetingData: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setMeetings((prev) => [newMeeting, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveMeeting(newMeeting)
    }
    toast.success('Reunião agendada com sucesso!')
  }

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
    if (isSupabaseConfigured) {
      supabaseService.saveMeeting({ id, ...updates })
    }
    toast.success('Reunião / Ata atualizada.')
  }

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteMeeting(id)
    }
    toast.success('Reunião excluída.')
  }

  // ============================
  // CONTRACTS & DOCUMENTS
  // ============================
  const addContract = (contractData: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract: Contract = {
      ...contractData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setContracts((prev) => [newContract, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveContract(newContract)
    }
    toast.success('Contrato cadastrado com sucesso!')
  }

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    if (isSupabaseConfigured) {
      supabaseService.saveContract({ id, ...updates })
    }
    toast.success('Contrato atualizado.')
  }

  const deleteContract = (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteContract(id)
    }
    toast.success('Contrato removido.')
  }

  // ============================
  // FINANCIAL
  // ============================
  const addTransaction = (transactionData: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
    const newTx: FinancialTransaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setTransactions((prev) => [newTx, ...prev])
    if (isSupabaseConfigured) {
      supabaseService.saveTransaction(newTx)
    }
    toast.success('Lançamento financeiro registrado com sucesso!')
  }

  const updateTransaction = (id: string, updates: Partial<FinancialTransaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    if (isSupabaseConfigured) {
      supabaseService.saveTransaction({ id, ...updates })
    }
    toast.success('Lançamento financeiro atualizado.')
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    if (isSupabaseConfigured) {
      supabaseService.deleteTransaction(id)
    }
    toast.success('Lançamento financeiro removido.')
  }

  // Team Management
  const addTeamMember = (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const newMember: TeamMember = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setTeamMembers((prev) => [newMember, ...prev])
    toast.success(`Colaborador ${member.name} adicionado à equipe!`)
  }

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
    toast.success('Membro atualizado!')
  }

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id))
    toast.success('Membro removido da equipe!')
  }

  // Agency Settings
  const updateAgencySettings = (updates: Partial<AgencySettings>) => {
    setAgencySettings((prev) => ({ ...prev, ...updates }))
    toast.success('Configurações da agência salvas com sucesso!')
  }

  // Reset para limpar todos os dados locais
  const resetToDefaultData = () => {
    setLeads([])
    setClients([])
    setProjects([])
    setTasks([])
    setBriefings([])
    setApprovals([])
    setMeetings([])
    setContracts([])
    setTransactions([])
    setTeamMembers([])
    const keys = [
      'leads',
      'clients',
      'projects',
      'tasks',
      'briefings',
      'approvals',
      'meetings',
      'contracts',
      'transactions',
      'team',
    ]
    keys.forEach((k) => {
      localStorage.removeItem(STORAGE_KEY_PREFIX + k)
      localStorage.removeItem('eld_' + k)
    })
    toast.success('Workspace limpo com sucesso! Dados locais zerados.')
  }

  return (
    <WorkspaceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        setUserRole,
        isStandbyMode,
        isLoadingCloud,
        teamMembers,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        agencySettings,
        updateAgencySettings,
        leads,
        addLead,
        updateLead,
        updateLeadStage,
        deleteLead,
        convertLeadToClient,
        clients,
        addClient,
        updateClient,
        updateClientStatus,
        deleteClient,
        projects,
        addProject,
        updateProject,
        deleteProject,
        tasks,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        briefings,
        addBriefing,
        updateBriefing,
        deleteBriefing,
        approvals,
        addApproval,
        updateApprovalStatus,
        deleteApproval,
        meetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        contracts,
        addContract,
        updateContract,
        deleteContract,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        resetToDefaultData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook de acesso ao WorkspaceContext
// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace deve ser usado dentro de um WorkspaceProvider')
  }
  return context
}
