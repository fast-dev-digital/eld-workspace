import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'

/** Resultado padrão de uma mutação: erro nulo = sucesso. */
export type MutationResult = { error: string | null }

const OK: MutationResult = { error: null }

/**
 * Traduz erros do Postgres/Supabase em mensagens em português para o usuário.
 * Cobre os casos que as constraints do schema podem disparar.
 */
export function friendlyDbError(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: string } | null
  const code = e?.code
  const msg = e?.message || ''

  switch (code) {
    case '23505': // unique_violation
      return 'Já existe um registro com esses dados.'
    case '23503': // foreign_key_violation
      return 'Registro vinculado a outro item que ainda não foi sincronizado. Recarregue a página e tente novamente.'
    case '23502': // not_null_violation
      return 'Preencha todos os campos obrigatórios antes de salvar.'
    case '23514': // check_violation
      return 'Um dos valores informados não é aceito pelo sistema (status, estágio ou prioridade inválidos).'
    case '22P02': // invalid_text_representation (ex: uuid malformado)
      return 'Formato de dado inválido.'
    case '42501': // insufficient_privilege (RLS)
      return 'Você não tem permissão para esta ação.'
    case 'PGRST301':
      return 'Sessão expirada. Faça login novamente.'
    default:
      return msg
        ? `Não foi possível salvar: ${msg}`
        : 'Não foi possível salvar as alterações no servidor.'
  }
}

/** Executa uma promise do supabase e normaliza para MutationResult. */
async function run(
  op: () => PromiseLike<{ error: { message?: string; code?: string } | null }>,
  context: string
): Promise<MutationResult> {
  try {
    const { error } = await op()
    if (error) {
      console.warn(`[SupabaseService] ${context}:`, error)
      return { error: friendlyDbError(error) }
    }
    return OK
  } catch (err) {
    console.error(`[SupabaseService] Exceção em ${context}:`, err)
    return { error: friendlyDbError(err) }
  }
}

export const supabaseService = {
  isConfigured: isSupabaseConfigured,
  defaultOrgId: null as string | null,

  async getDefaultOrganizationId(): Promise<string | null> {
    if (this.defaultOrgId) return this.defaultOrgId
    if (!isSupabaseConfigured) return null
    try {
      const { data } = await supabase.from('organizations').select('id').limit(1).maybeSingle()
      const org = data as { id?: string } | null
      if (org?.id) {
        this.defaultOrgId = org.id
        return org.id
      }
    } catch {
      // Usar fallback padrão
    }
    return DEFAULT_ORG_ID
  },

  // 1. Carregar todos os dados do banco em paralelo
  async fetchAllData() {
    if (!isSupabaseConfigured) return null

    try {
      const [
        { data: clientsData, error: errClients },
        { data: leadsData, error: errLeads },
        { data: projectsData, error: errProjects },
        { data: tasksData, error: errTasks },
        { data: briefingsData, error: errBriefings },
        { data: approvalsData, error: errApprovals },
        { data: meetingsData, error: errMeetings },
        { data: contractsData, error: errContracts },
        { data: transactionsData, error: errTx },
      ] = await Promise.all([
        supabase.from('clients').select('*, services:client_services(*)').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('due_date', { ascending: true }),
        supabase.from('briefings').select('*').order('created_at', { ascending: false }),
        supabase.from('approvals').select('*').order('created_at', { ascending: false }),
        supabase.from('meetings').select('*').order('date_time', { ascending: true }),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_transactions').select('*').order('due_date', { ascending: false }),
      ])

      if (errClients || errLeads || errProjects || errTasks) {
        console.warn('[SupabaseService] Erro ao buscar dados remotos:', {
          errClients,
          errLeads,
          errProjects,
          errTasks,
          errBriefings,
          errApprovals,
          errMeetings,
          errContracts,
          errTx,
        })
        return null
      }

      // Format Clients
      const clients: Client[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        companyName: c.company_name,
        tradeName: c.trade_name,
        document: c.document || '',
        contactName: c.contact_name,
        phone: c.phone,
        email: c.email,
        segment: c.segment || '',
        status: c.status,
        responsible: c.responsible,
        monthlyValue: Number(c.monthly_value || 0),
        startDate: c.start_date,
        notes: c.notes || '',
        services: (c.services || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          value: Number(s.value || 0),
          isRecurring: s.is_recurring,
          frequency: s.frequency,
        })),
        createdAt: c.created_at || new Date().toISOString(),
      }))

      // Format Leads
      const leads: Lead[] = (leadsData || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        companyName: l.company_name,
        phone: l.phone,
        email: l.email,
        serviceInterested: l.service_interested,
        responsible: l.responsible,
        stage: l.stage,
        temperature: l.temperature,
        estimatedValue: Number(l.estimated_value || 0),
        origin: l.origin,
        notes: l.notes || '',
        lastContactAt: l.last_contact_at,
        convertedClientId: l.converted_client_id,
        createdAt: l.created_at || new Date().toISOString(),
        updatedAt: l.updated_at || new Date().toISOString(),
      }))

      // Format Projects
      const projects: Project[] = (projectsData || []).map((p: any) => ({
        id: p.id,
        clientId: p.client_id,
        clientName: p.client_name,
        name: p.name,
        description: p.description || '',
        responsible: p.responsible,
        startDate: p.start_date,
        dueDate: p.due_date,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        value: Number(p.value || 0),
        deliverablesCount: p.deliverables_count,
        completedDeliverables: p.completed_deliverables,
        createdAt: p.created_at || new Date().toISOString(),
      }))

      // Format Tasks
      const tasks: Task[] = (tasksData || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        clientId: t.client_id,
        clientName: t.client_name,
        projectId: t.project_id,
        projectName: t.project_name,
        responsible: t.responsible,
        dueDate: t.due_date,
        status: t.status,
        priority: t.priority,
        completedAt: t.completed_at,
        createdAt: t.created_at || new Date().toISOString(),
      }))

      // Format Briefings
      const briefings: Briefing[] = (briefingsData || []).map((b: any) => ({
        id: b.id,
        clientId: b.client_id,
        clientName: b.client_name,
        projectId: b.project_id,
        projectName: b.project_name,
        title: b.title,
        objective: b.objective,
        targetAudience: b.target_audience || '',
        visualReferences: b.visual_references || '',
        deliverables: b.deliverables || '',
        toneOfVoice: b.tone_of_voice || '',
        deadlines: b.deadlines || '',
        technicalNotes: b.technical_notes || '',
        responsible: b.responsible,
        status: b.status,
        createdAt: b.created_at || new Date().toISOString(),
        updatedAt: b.updated_at || new Date().toISOString(),
      }))

      // Format Approvals
      const approvals: ApprovalItem[] = (approvalsData || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        clientId: a.client_id,
        clientName: a.client_name,
        projectId: a.project_id,
        projectName: a.project_name,
        responsible: a.responsible,
        stage: a.stage,
        status: a.status,
        assetUrl: a.asset_url || '',
        version: a.version,
        feedback: a.feedback || '',
        dueDate: a.due_date,
        createdAt: a.created_at || new Date().toISOString(),
        updatedAt: a.updated_at || new Date().toISOString(),
      }))

      // Format Meetings
      const meetings: Meeting[] = (meetingsData || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        relatedToType: m.related_to_type,
        relatedToId: m.related_to_id,
        relatedToName: m.related_to_name,
        dateTime: m.date_time,
        attendees: m.attendees || [],
        agenda: m.agenda || '',
        notes: m.notes || '',
        nextSteps: m.next_steps || [],
        status: m.status,
        createdAt: m.created_at || new Date().toISOString(),
      }))

      // Format Contracts
      const contracts: Contract[] = (contractsData || []).map((c: any) => ({
        id: c.id,
        clientId: c.client_id,
        clientName: c.client_name,
        title: c.title,
        services: c.services,
        value: Number(c.value || 0),
        billingType: c.billing_type,
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status,
        documentUrl: c.document_url || '',
        notes: c.notes || '',
        createdAt: c.created_at || new Date().toISOString(),
      }))

      // Format Transactions
      const transactions: FinancialTransaction[] = (transactionsData || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        description: tx.description,
        category: tx.category,
        clientId: tx.client_id,
        clientName: tx.client_name,
        supplier: tx.supplier,
        value: Number(tx.value || 0),
        competenceDate: tx.competence_date,
        dueDate: tx.due_date,
        paymentDate: tx.payment_date,
        status: tx.status,
        paymentMethod: tx.payment_method,
        isRecurring: tx.is_recurring,
        notes: tx.notes || '',
        createdAt: tx.created_at || new Date().toISOString(),
      }))

      return {
        clients,
        leads,
        projects,
        tasks,
        briefings,
        approvals,
        meetings,
        contracts,
        transactions,
      }
    } catch (err) {
      console.error('[SupabaseService] Falha ao sincronizar com Supabase:', err)
      return null
    }
  },

  // 2. Mutações de Leads
  async saveLead(lead: Partial<Lead>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      name: lead.name,
      company_name: lead.companyName,
      phone: lead.phone,
      email: lead.email,
      service_interested: lead.serviceInterested,
      responsible: lead.responsible,
      stage: lead.stage,
      temperature: lead.temperature,
      estimated_value: lead.estimatedValue,
      origin: lead.origin,
      notes: lead.notes,
      last_contact_at: lead.lastContactAt || new Date().toISOString(),
      organization_id: orgId,
    }
    if (lead.id) payload.id = lead.id
    return run(() => (supabase.from('leads') as any).upsert(payload, { onConflict: 'id' }), 'salvar lead')
  },

  async deleteLead(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('leads') as any).delete().eq('id', id), 'deletar lead')
  },

  // 3. Mutações de Clientes
  async saveClient(client: Partial<Client>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      company_name: client.companyName,
      trade_name: client.tradeName,
      document: client.document,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      segment: client.segment,
      status: client.status,
      responsible: client.responsible,
      monthly_value: client.monthlyValue,
      start_date: client.startDate,
      notes: client.notes,
      organization_id: orgId,
    }
    if (client.id) payload.id = client.id

    const res = await run(
      () => (supabase.from('clients') as any).upsert(payload, { onConflict: 'id' }),
      'salvar cliente'
    )
    if (res.error) return res

    // Salvar serviços atrelados se existirem
    if (client.id && client.services && client.services.length > 0) {
      const servicesPayload = client.services.map((s) => ({
        id: s.id,
        client_id: client.id,
        organization_id: orgId,
        name: s.name,
        value: s.value,
        is_recurring: s.isRecurring,
        frequency: s.frequency || 'mensal',
      }))
      return run(
        () => (supabase.from('client_services') as any).upsert(servicesPayload, { onConflict: 'id' }),
        'salvar serviços do cliente'
      )
    }
    return OK
  },

  async deleteClient(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('clients') as any).delete().eq('id', id), 'deletar cliente')
  },

  // 4. Mutações de Projetos
  async saveProject(project: Partial<Project>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      client_id: project.clientId,
      client_name: project.clientName,
      name: project.name,
      description: project.description,
      responsible: project.responsible,
      start_date: project.startDate,
      due_date: project.dueDate,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      value: project.value,
      deliverables_count: project.deliverablesCount,
      completed_deliverables: project.completedDeliverables,
      organization_id: orgId,
    }
    if (project.id) payload.id = project.id
    return run(
      () => (supabase.from('projects') as any).upsert(payload, { onConflict: 'id' }),
      'salvar projeto'
    )
  },

  async deleteProject(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('projects') as any).delete().eq('id', id), 'deletar projeto')
  },

  // 5. Mutações de Tarefas
  async saveTask(task: Partial<Task>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      title: task.title,
      description: task.description,
      client_id: task.clientId || null,
      client_name: task.clientName,
      project_id: task.projectId || null,
      project_name: task.projectName,
      responsible: task.responsible,
      due_date: task.dueDate,
      status: task.status,
      priority: task.priority,
      completed_at: task.status === 'concluido' ? new Date().toISOString() : null,
      organization_id: orgId,
    }
    if (task.id) payload.id = task.id
    return run(() => (supabase.from('tasks') as any).upsert(payload, { onConflict: 'id' }), 'salvar tarefa')
  },

  async deleteTask(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('tasks') as any).delete().eq('id', id), 'deletar tarefa')
  },

  // 6. Mutações de Briefings
  async saveBriefing(briefing: Partial<Briefing>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      client_id: briefing.clientId,
      client_name: briefing.clientName,
      project_id: briefing.projectId || null,
      project_name: briefing.projectName,
      title: briefing.title,
      objective: briefing.objective,
      target_audience: briefing.targetAudience,
      visual_references: briefing.visualReferences,
      deliverables: briefing.deliverables,
      tone_of_voice: briefing.toneOfVoice,
      deadlines: briefing.deadlines,
      technical_notes: briefing.technicalNotes,
      responsible: briefing.responsible,
      status: briefing.status,
      organization_id: orgId,
    }
    if (briefing.id) payload.id = briefing.id
    return run(
      () => (supabase.from('briefings') as any).upsert(payload, { onConflict: 'id' }),
      'salvar briefing'
    )
  },

  async deleteBriefing(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('briefings') as any).delete().eq('id', id), 'deletar briefing')
  },

  // 7. Mutações de Aprovações
  async saveApproval(approval: Partial<ApprovalItem>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      title: approval.title,
      client_id: approval.clientId,
      client_name: approval.clientName,
      project_id: approval.projectId || null,
      project_name: approval.projectName,
      responsible: approval.responsible,
      stage: approval.stage,
      status: approval.status,
      asset_url: approval.assetUrl,
      version: approval.version,
      feedback: approval.feedback,
      due_date: approval.dueDate,
      organization_id: orgId,
    }
    if (approval.id) payload.id = approval.id
    return run(
      () => (supabase.from('approvals') as any).upsert(payload, { onConflict: 'id' }),
      'salvar aprovação'
    )
  },

  async deleteApproval(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('approvals') as any).delete().eq('id', id), 'deletar aprovação')
  },

  // 8. Mutações de Reuniões
  async saveMeeting(meeting: Partial<Meeting>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      title: meeting.title,
      related_to_type: meeting.relatedToType,
      related_to_id: meeting.relatedToId,
      related_to_name: meeting.relatedToName,
      date_time: meeting.dateTime,
      attendees: meeting.attendees,
      agenda: meeting.agenda,
      notes: meeting.notes,
      next_steps: meeting.nextSteps,
      status: meeting.status,
      organization_id: orgId,
    }
    if (meeting.id) payload.id = meeting.id
    return run(
      () => (supabase.from('meetings') as any).upsert(payload, { onConflict: 'id' }),
      'salvar reunião'
    )
  },

  async deleteMeeting(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('meetings') as any).delete().eq('id', id), 'deletar reunião')
  },

  // 9. Mutações de Contratos
  async saveContract(contract: Partial<Contract>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      client_id: contract.clientId,
      client_name: contract.clientName,
      title: contract.title,
      services: contract.services,
      value: contract.value,
      billing_type: contract.billingType,
      start_date: contract.startDate,
      end_date: contract.endDate,
      status: contract.status,
      document_url: contract.documentUrl,
      notes: contract.notes,
      organization_id: orgId,
    }
    if (contract.id) payload.id = contract.id
    return run(
      () => (supabase.from('contracts') as any).upsert(payload, { onConflict: 'id' }),
      'salvar contrato'
    )
  },

  async deleteContract(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(() => (supabase.from('contracts') as any).delete().eq('id', id), 'deletar contrato')
  },

  // 10. Mutações Financeiras
  async saveTransaction(tx: Partial<FinancialTransaction>, organizationId?: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    const orgId = organizationId || (await this.getDefaultOrganizationId()) || DEFAULT_ORG_ID
    const payload: any = {
      type: tx.type,
      description: tx.description,
      category: tx.category,
      client_id: tx.clientId || null,
      client_name: tx.clientName,
      supplier: tx.supplier,
      value: tx.value,
      competence_date: tx.competenceDate,
      due_date: tx.dueDate,
      payment_date: tx.paymentDate || null,
      status: tx.status,
      payment_method: tx.paymentMethod,
      is_recurring: tx.isRecurring,
      notes: tx.notes,
      organization_id: orgId,
    }
    if (tx.id) payload.id = tx.id
    return run(
      () => (supabase.from('financial_transactions') as any).upsert(payload, { onConflict: 'id' }),
      'salvar transação'
    )
  },

  async deleteTransaction(id: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(
      () => (supabase.from('financial_transactions') as any).delete().eq('id', id),
      'deletar transação'
    )
  },

  // ============================
  // TEAM MEMBERS (organization_members + profiles)
  // ============================
  async fetchTeamMembers(organizationId: string) {
    const { data, error } = await (supabase.rpc as any)('get_organization_members_with_email', {
      p_organization_id: organizationId,
    })

    if (error || !data) {
      console.warn('[SupabaseService] buscar equipe:', error)
      return []
    }

    return data.map((m: any) => ({
      id: m.id,
      name: m.full_name || 'Sem nome',
      email: m.email || '',
      role: m.role,
      department: m.department || '',
      phone: m.phone || undefined,
      createdAt: m.created_at,
    }))
  },

  async inviteTeamMember(input: {
    name: string
    email: string
    role: string
    department?: string
    phone?: string
    organizationId: string
  }): Promise<{ error: string | null }> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return { error: 'Sessão expirada. Faça login novamente.' }

    const { data, error } = await supabase.functions.invoke('invite-team-member', {
      body: input,
    })

    if (error) {
      // FunctionsHttpError não popula `data`; o corpo JSON de erro vem em error.context (Response bruta)
      const context = (error as { context?: Response }).context
      let message = error.message
      if (context && typeof context.json === 'function') {
        try {
          const body = await context.json()
          if (body?.error) message = body.error
        } catch {
          // Mantém a mensagem genérica se o corpo não for JSON
        }
      }
      return { error: message }
    }

    if (data?.error) {
      return { error: data.error }
    }

    return { error: null }
  },

  async updateTeamMemberProfile(
    userId: string,
    updates: { name?: string; department?: string; phone?: string }
  ): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(
      () =>
        (supabase.from('profiles') as any)
          .update({
            ...(updates.name !== undefined ? { full_name: updates.name } : {}),
            ...(updates.department !== undefined ? { department: updates.department } : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
          })
          .eq('id', userId),
      'atualizar colaborador'
    )
  },

  async removeTeamMember(userId: string, organizationId: string): Promise<MutationResult> {
    if (!isSupabaseConfigured) return OK
    return run(
      () =>
        (supabase.from('organization_members') as any)
          .delete()
          .eq('user_id', userId)
          .eq('organization_id', organizationId),
      'remover colaborador'
    )
  },
}
