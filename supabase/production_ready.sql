-- =============================================================================
-- ELD WORKSPACE - SCRIPT DE PRODUÇÃO & AJUSTES DE PERMISSÕES SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com)
-- Objetivo: Garantir persistência sem bloqueio de RLS e integridade de UUIDs
-- =============================================================================

-- 1. Garantir existência da Organização Padrão da ELD (sem conflito de slug)
INSERT INTO public.organizations (name, slug)
VALUES ('ELD Agência', 'eld-agencia')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2. Limpar dados mockados/sementes das tabelas (para ambiente 100% limpo de produção)
TRUNCATE TABLE 
  public.financial_transactions,
  public.contracts,
  public.meetings,
  public.approvals,
  public.briefings,
  public.tasks,
  public.projects,
  public.leads,
  public.client_services,
  public.clients
CASCADE;

-- 3. Atualizar políticas RLS para permitir leitura e escrita da chave da aplicação
-- Clientes
DROP POLICY IF EXISTS "Acesso completo a clientes" ON public.clients;
CREATE POLICY "Acesso completo a clientes" ON public.clients
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Serviços de Clientes
DROP POLICY IF EXISTS "Acesso completo a servicos de clientes" ON public.client_services;
CREATE POLICY "Acesso completo a servicos de clientes" ON public.client_services
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Leads (CRM)
DROP POLICY IF EXISTS "Acesso completo a leads" ON public.leads;
CREATE POLICY "Acesso completo a leads" ON public.leads
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Projetos
DROP POLICY IF EXISTS "Acesso completo a projetos" ON public.projects;
CREATE POLICY "Acesso completo a projetos" ON public.projects
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Tarefas
DROP POLICY IF EXISTS "Acesso completo a tarefas" ON public.tasks;
CREATE POLICY "Acesso completo a tarefas" ON public.tasks
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Briefings
DROP POLICY IF EXISTS "Acesso completo a briefings" ON public.briefings;
CREATE POLICY "Acesso completo a briefings" ON public.briefings
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Aprovações
DROP POLICY IF EXISTS "Acesso completo a aprovacoes" ON public.approvals;
DROP POLICY IF EXISTS "Acesso completo a entregas" ON public.approvals;
CREATE POLICY "Acesso completo a aprovacoes" ON public.approvals
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Reuniões
DROP POLICY IF EXISTS "Acesso completo a reunioes" ON public.meetings;
CREATE POLICY "Acesso completo a reunioes" ON public.meetings
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Contratos
DROP POLICY IF EXISTS "Acesso completo a contratos" ON public.contracts;
CREATE POLICY "Acesso completo a contratos" ON public.contracts
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Transações Financeiras
DROP POLICY IF EXISTS "Acesso completo a financeiro" ON public.financial_transactions;
CREATE POLICY "Acesso completo a financeiro" ON public.financial_transactions
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Organizações
DROP POLICY IF EXISTS "Membros autenticados acessam suas organizacoes" ON public.organizations;
DROP POLICY IF EXISTS "Acesso completo a organizacoes" ON public.organizations;
CREATE POLICY "Acesso completo a organizacoes" ON public.organizations
  FOR ALL TO public USING (true) WITH CHECK (true);
