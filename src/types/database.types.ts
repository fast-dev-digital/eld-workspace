export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'comercial' | 'operacional' | 'financeiro'

export type Temperature = 'frio' | 'morno' | 'quente'

export type ClientStatus = 'ativo' | 'inativo' | 'onboarding' | 'pausado'

export type CommercialStage =
  | 'lead'
  | 'reuniao'
  | 'briefing'
  | 'proposta'
  | 'contrato'
  | 'pagamento'
  | 'cliente'

export type ProjectStatus =
  | 'planejamento'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'em_revisao'
  | 'concluido'
  | 'pausado'

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente'

export type TaskWorkflowStatus =
  | 'pendente'
  | 'em_producao'
  | 'em_aprovacao'
  | 'ajustes'
  | 'concluido'

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

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada'

export type ContractStatus =
  | 'em_elaboracao'
  | 'aguardando_assinatura'
  | 'vigente'
  | 'renovado'
  | 'encerrado'

export type FinancialType = 'receita' | 'despesa'

export type FinancialStatus = 'pendente' | 'pago' | 'recebido' | 'vencido' | 'cancelado'

export type PaymentMethod =
  | 'pix'
  | 'boleto'
  | 'cartao'
  | 'transferencia'
  | 'outro'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: UserRole
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          company_name: string
          trade_name: string
          document: string | null
          contact_name: string
          phone: string
          email: string
          segment: string | null
          status: ClientStatus
          responsible: string
          monthly_value: number
          start_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          company_name: string
          trade_name: string
          document?: string | null
          contact_name: string
          phone: string
          email: string
          segment?: string | null
          status?: ClientStatus
          responsible?: string
          monthly_value?: number
          start_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_name?: string
          trade_name?: string
          document?: string | null
          contact_name?: string
          phone?: string
          email?: string
          segment?: string | null
          status?: ClientStatus
          responsible?: string
          monthly_value?: number
          start_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_services: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          name: string
          value: number
          is_recurring: boolean
          frequency: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          client_id: string
          name: string
          value?: number
          is_recurring?: boolean
          frequency?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string
          name?: string
          value?: number
          is_recurring?: boolean
          frequency?: string
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          organization_id: string
          name: string
          company_name: string
          phone: string
          email: string
          service_interested: string
          responsible: string
          stage: CommercialStage
          temperature: Temperature
          estimated_value: number
          origin: string
          notes: string | null
          last_contact_at: string
          converted_client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          name: string
          company_name: string
          phone: string
          email: string
          service_interested: string
          responsible?: string
          stage?: CommercialStage
          temperature?: Temperature
          estimated_value?: number
          origin?: string
          notes?: string | null
          last_contact_at?: string
          converted_client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          company_name?: string
          phone?: string
          email?: string
          service_interested?: string
          responsible?: string
          stage?: CommercialStage
          temperature?: Temperature
          estimated_value?: number
          origin?: string
          notes?: string | null
          last_contact_at?: string
          converted_client_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          client_name: string
          name: string
          description: string | null
          responsible: string
          start_date: string
          due_date: string
          status: ProjectStatus
          priority: Priority
          progress: number
          value: number
          deliverables_count: number
          completed_deliverables: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          client_id: string
          client_name: string
          name: string
          description?: string | null
          responsible?: string
          start_date?: string
          due_date: string
          status?: ProjectStatus
          priority?: Priority
          progress?: number
          value?: number
          deliverables_count?: number
          completed_deliverables?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string
          client_name?: string
          name?: string
          description?: string | null
          responsible?: string
          start_date?: string
          due_date?: string
          status?: ProjectStatus
          priority?: Priority
          progress?: number
          value?: number
          deliverables_count?: number
          completed_deliverables?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          client_id: string | null
          client_name: string | null
          project_id: string | null
          project_name: string | null
          responsible: string
          due_date: string
          status: TaskWorkflowStatus
          priority: Priority
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          title: string
          description?: string | null
          client_id?: string | null
          client_name?: string | null
          project_id?: string | null
          project_name?: string | null
          responsible?: string
          due_date: string
          status?: TaskWorkflowStatus
          priority?: Priority
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          client_id?: string | null
          client_name?: string | null
          project_id?: string | null
          project_name?: string | null
          responsible?: string
          due_date?: string
          status?: TaskWorkflowStatus
          priority?: Priority
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      briefings: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          client_name: string
          project_id: string | null
          project_name: string | null
          title: string
          objective: string
          target_audience: string | null
          visual_references: string | null
          deliverables: string | null
          tone_of_voice: string | null
          deadlines: string | null
          technical_notes: string | null
          responsible: string
          status: 'rascunho' | 'aprovado' | 'em_producao'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          client_id: string
          client_name: string
          project_id?: string | null
          project_name?: string | null
          title: string
          objective: string
          target_audience?: string | null
          visual_references?: string | null
          deliverables?: string | null
          tone_of_voice?: string | null
          deadlines?: string | null
          technical_notes?: string | null
          responsible?: string
          status?: 'rascunho' | 'aprovado' | 'em_producao'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string
          client_name?: string
          project_id?: string | null
          project_name?: string | null
          title?: string
          objective?: string
          target_audience?: string | null
          visual_references?: string | null
          deliverables?: string | null
          tone_of_voice?: string | null
          deadlines?: string | null
          technical_notes?: string | null
          responsible?: string
          status?: 'rascunho' | 'aprovado' | 'em_producao'
          created_at?: string
          updated_at?: string
        }
      }
      approvals: {
        Row: {
          id: string
          organization_id: string
          title: string
          client_id: string
          client_name: string
          project_id: string | null
          project_name: string | null
          responsible: string
          stage: ProductionApprovalStage
          status: ApprovalStatus
          asset_url: string | null
          version: number
          feedback: string | null
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          title: string
          client_id: string
          client_name: string
          project_id?: string | null
          project_name?: string | null
          responsible?: string
          stage?: ProductionApprovalStage
          status?: ApprovalStatus
          asset_url?: string | null
          version?: number
          feedback?: string | null
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          client_id?: string
          client_name?: string
          project_id?: string | null
          project_name?: string | null
          responsible?: string
          stage?: ProductionApprovalStage
          status?: ApprovalStatus
          asset_url?: string | null
          version?: number
          feedback?: string | null
          due_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          organization_id: string
          title: string
          related_to_type: 'cliente' | 'lead'
          related_to_id: string
          related_to_name: string
          date_time: string
          attendees: string[]
          agenda: string | null
          notes: string | null
          next_steps: string[]
          status: MeetingStatus
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          title: string
          related_to_type: 'cliente' | 'lead'
          related_to_id: string
          related_to_name: string
          date_time: string
          attendees?: string[]
          agenda?: string | null
          notes?: string | null
          next_steps?: string[]
          status?: MeetingStatus
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          related_to_type?: 'cliente' | 'lead'
          related_to_id?: string
          related_to_name?: string
          date_time?: string
          attendees?: string[]
          agenda?: string | null
          notes?: string | null
          next_steps?: string[]
          status?: MeetingStatus
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          client_name: string
          title: string
          services: string
          value: number
          billing_type: 'recorrente' | 'pontual'
          start_date: string
          end_date: string
          status: ContractStatus
          document_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          client_id: string
          client_name: string
          title: string
          services: string
          value?: number
          billing_type?: 'recorrente' | 'pontual'
          start_date?: string
          end_date: string
          status?: ContractStatus
          document_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          client_id?: string
          client_name?: string
          title?: string
          services?: string
          value?: number
          billing_type?: 'recorrente' | 'pontual'
          start_date?: string
          end_date?: string
          status?: ContractStatus
          document_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      financial_transactions: {
        Row: {
          id: string
          organization_id: string
          type: FinancialType
          description: string
          category: string
          client_id: string | null
          client_name: string | null
          supplier: string | null
          value: number
          competence_date: string
          due_date: string
          payment_date: string | null
          status: FinancialStatus
          payment_method: PaymentMethod
          is_recurring: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          type: FinancialType
          description: string
          category: string
          client_id?: string | null
          client_name?: string | null
          supplier?: string | null
          value?: number
          competence_date?: string
          due_date: string
          payment_date?: string | null
          status?: FinancialStatus
          payment_method?: PaymentMethod
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: FinancialType
          description?: string
          category?: string
          client_id?: string | null
          client_name?: string | null
          supplier?: string | null
          value?: number
          competence_date?: string
          due_date?: string
          payment_date?: string | null
          status?: FinancialStatus
          payment_method?: PaymentMethod
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
