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
} from '@/types/workspace.types'

/**
 * Dados iniciais de produção (limpos por padrão).
 * Quando a agência inicia suas operações, as listas começam vazias
 * e são preenchidas conforme a equipe adiciona novos registros.
 */
export const initialLeads: Lead[] = []
export const initialClients: Client[] = []
export const initialProjects: Project[] = []
export const initialTasks: Task[] = []
export const initialBriefings: Briefing[] = []
export const initialApprovals: ApprovalItem[] = []
export const initialMeetings: Meeting[] = []
export const initialContracts: Contract[] = []
export const initialTransactions: FinancialTransaction[] = []
