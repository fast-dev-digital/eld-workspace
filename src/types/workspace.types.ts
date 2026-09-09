// ==========================================
// ELD WORKSPACE - TYPES DEFINITIONS
// Ref: Escopo-Projeto-ELD-Workspace.pdf
// ==========================================

export type CommercialStage =
  | 'lead'
  | 'reuniao'
  | 'briefing'
  | 'proposta'
  | 'contrato'
  | 'pagamento'
  | 'cliente'

export type LeadTemperature = 'frio' | 'morno' | 'quente'

export interface Lead {
  id: string
  name: string
  companyName: string
  phone: string
  email: string
  serviceInterested: string
  responsible: string
  stage: CommercialStage
  temperature: LeadTemperature
  estimatedValue: number
  origin: string
  notes: string
  lastContactAt: string
  createdAt: string
  updatedAt: string
}

export type ClientStatus = 'ativo' | 'onboarding' | 'pausado' | 'inativo'

export interface ClientServiceItem {
  id: string
  name: string
  value: number
  isRecurring: boolean
  frequency?: 'mensal' | 'trimestral' | 'pontual'
}

export interface Client {
  id: string
  companyName: string
  tradeName: string
  document: string
  contactName: string
  phone: string
  email: string
  segment: string
  status: ClientStatus
  responsible: string
  monthlyValue: number
  startDate: string
  services: ClientServiceItem[]
  notes: string
  createdAt: string
}

export type ProjectStatus =
  | 'planejamento'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'em_revisao'
  | 'concluido'
  | 'pausado'

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente'

export interface Project {
  id: string
  clientId: string
  clientName: string
  name: string
  description: string
  responsible: string
  startDate: string
  dueDate: string
  status: ProjectStatus
  priority: Priority
  progress: number
  value: number
  deliverablesCount: number
  completedDeliverables: number
  createdAt: string
}

// 5 ETAPAS DO FLUXO DE TAREFAS DO ESCOPO:
// Pendente -> Em produção -> Em aprovação -> Ajustes -> Concluído
export type TaskWorkflowStatus =
  | 'pendente'
  | 'em_producao'
  | 'em_aprovacao'
  | 'ajustes'
  | 'concluido'

export interface Task {
  id: string
  title: string
  description: string
  clientId?: string
  clientName?: string
  projectId?: string
  projectName?: string
  responsible: string
  dueDate: string
  status: TaskWorkflowStatus
  priority: Priority
  createdAt: string
  completedAt?: string
}

export interface Briefing {
  id: string
  clientId: string
  clientName: string
  projectId?: string
  projectName?: string
  title: string
  objective: string
  targetAudience: string
  visualReferences: string
  deliverables: string
  toneOfVoice: string
  deadlines: string
  technicalNotes: string
  responsible: string
  status: 'rascunho' | 'aprovado' | 'em_producao'
  createdAt: string
  updatedAt: string
}

// PRODUÇÃO E APROVAÇÃO DO ESCOPO:
// Criação -> Produção -> Aprovação -> Alterações -> Entrega
export type ProductionApprovalStage =
  | 'criacao'
  | 'producao'
  | 'aprovacao'
  | 'alteracoes'
  | 'entrega'

export type ApprovalStatus =
  | 'pendente_interno'
  | 'aguardando_cliente'
  | 'aprovado'
  | 'ajustes_solicitados'

export interface ApprovalItem {
  id: string
  title: string
  clientId: string
  clientName: string
  projectId?: string
  projectName?: string
  responsible: string
  stage: ProductionApprovalStage
  status: ApprovalStatus
  assetUrl?: string
  version: number
  feedback?: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada'

export interface Meeting {
  id: string
  title: string
  relatedToType: 'cliente' | 'lead'
  relatedToId: string
  relatedToName: string
  dateTime: string
  attendees: string[]
  agenda: string
  notes: string
  nextSteps: string[]
  status: MeetingStatus
  createdAt: string
}

export type ContractStatus =
  | 'em_elaboracao'
  | 'aguardando_assinatura'
  | 'vigente'
  | 'renovado'
  | 'encerrado'

export interface Contract {
  id: string
  clientId: string
  clientName: string
  title: string
  services: string
  value: number
  billingType: 'recorrente' | 'pontual'
  startDate: string
  endDate: string
  status: ContractStatus
  documentUrl?: string
  notes: string
  createdAt: string
}

export type FinancialType = 'receita' | 'despesa'

export type FinancialStatus = 'pendente' | 'pago' | 'recebido' | 'vencido' | 'cancelado'

export interface FinancialTransaction {
  id: string
  type: FinancialType
  description: string
  category: string
  clientId?: string
  clientName?: string
  supplier?: string
  value: number
  competenceDate: string
  dueDate: string
  paymentDate?: string
  status: FinancialStatus
  paymentMethod: 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'outro'
  isRecurring: boolean
  notes?: string
  createdAt: string
}

export interface OperationalAlert {
  id: string
  title: string
  message: string
  type: 'danger' | 'warning' | 'info'
  linkTo: string
  timestamp: string
}
