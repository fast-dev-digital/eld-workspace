-- =============================================================================
-- ELD WORKSPACE - SCRIPT COMPLETO DE INSTALAÇÃO DO BANCO SUPABASE
-- Versão: 1.0 (Produção / Plug-and-Play)
-- Ref: Escopo-Projeto-ELD-Workspace.pdf (10 Módulos + 3 Fluxos Centrais)
-- =============================================================================
-- INSTRUÇÕES:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com)
-- 2. Vá em 'SQL Editor' no menu lateral
-- 3. Cole todo este script e clique em 'Run' (Executar)
-- =============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

--------------------------------------------------------------------------------
-- 1. FUNÇÕES AUXILIARES E TRIGGERS GLOBAIS
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- 2. ESTRUTURA DE TABELAS (10 MÓDULOS)
--------------------------------------------------------------------------------

-- Organização / Agência
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de Usuários (Integrado com auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membros da Organização & Papéis de Acesso (RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'comercial', 'operacional', 'financeiro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- MÓDULO 02: Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  document TEXT,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  segment TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'onboarding', 'pausado', 'inativo')),
  responsible TEXT NOT NULL DEFAULT 'Mariana (Atendimento)',
  monthly_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serviços Contratados do Cliente
CREATE TABLE IF NOT EXISTS public.client_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  frequency TEXT NOT NULL DEFAULT 'mensal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 01: Leads e CRM Comercial (7 Etapas da Jornada Comercial)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  service_interested TEXT NOT NULL,
  responsible TEXT NOT NULL DEFAULT 'Lucas (Comercial)',
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'reuniao', 'briefing', 'proposta', 'contrato', 'pagamento', 'cliente')),
  temperature TEXT NOT NULL DEFAULT 'morno' CHECK (temperature IN ('frio', 'morno', 'quente')),
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  origin TEXT NOT NULL DEFAULT 'Indicação',
  notes TEXT,
  last_contact_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 03: Gestão de Projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  responsible TEXT NOT NULL DEFAULT 'Felipe (Diretor de Criação)',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'aguardando_cliente', 'em_revisao', 'concluido', 'pausado')),
  priority TEXT NOT NULL DEFAULT 'alta' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  deliverables_count INT NOT NULL DEFAULT 1,
  completed_deliverables INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 04: Gestão de Tarefas (5 Etapas do Fluxo de Tarefas)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT,
  responsible TEXT NOT NULL DEFAULT 'Felipe (Designer)',
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'em_aprovacao', 'ajustes', 'concluido')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 05: Briefings Estruturados
CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  target_audience TEXT,
  visual_references TEXT,
  deliverables TEXT,
  tone_of_voice TEXT,
  deadlines TEXT,
  technical_notes TEXT,
  responsible TEXT NOT NULL DEFAULT 'Felipe (Diretor de Criação)',
  status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('rascunho', 'aprovado', 'em_producao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 06: Aprovações e Entregas (Fluxo de Produção & Aprovação)
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  responsible TEXT NOT NULL DEFAULT 'Guilherme (Designer/Dev)',
  stage TEXT NOT NULL DEFAULT 'aprovacao' CHECK (stage IN ('criacao', 'producao', 'aprovacao', 'alteracoes', 'entrega')),
  status TEXT NOT NULL DEFAULT 'aguardando_cliente' CHECK (status IN ('pendente_interno', 'aguardando_cliente', 'aprovado', 'ajustes_solicitados')),
  asset_url TEXT,
  version INT NOT NULL DEFAULT 1,
  feedback TEXT,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 07: Reuniões & Atas
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  related_to_type TEXT NOT NULL CHECK (related_to_type IN ('cliente', 'lead')),
  related_to_id UUID NOT NULL,
  related_to_name TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  attendees TEXT[] NOT NULL DEFAULT '{}',
  agenda TEXT,
  notes TEXT,
  next_steps TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 08: Contratos e Documentos
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  services TEXT NOT NULL,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  billing_type TEXT NOT NULL DEFAULT 'recorrente' CHECK (billing_type IN ('recorrente', 'pontual')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'vigente' CHECK (status IN ('em_elaboracao', 'aguardando_assinatura', 'vigente', 'renovado', 'encerrado')),
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MÓDULO 09: Gestão Financeira (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  supplier TEXT,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  competence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'recebido', 'vencido', 'cancelado')),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'boleto', 'cartao', 'transferencia', 'outro')),
  is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 3. TRIGGERS AUTOMÁTICOS DE updated_at
--------------------------------------------------------------------------------
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_briefings_updated_at BEFORE UPDATE ON public.briefings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_approvals_updated_at BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- 4. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL NO LOGIN/CADASTRO
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_org_id UUID;
BEGIN
  -- Cria perfil do usuário
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Associa à organização padrão da ELD
  SELECT id INTO v_default_org_id FROM public.organizations WHERE slug = 'eld-agencia' LIMIT 1;
  IF v_default_org_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_default_org_id, NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) - SEGURANÇA E ACESSO
--------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas gerais para membros autenticados acessarem os dados da sua organização
CREATE POLICY "Membros autenticados acessam suas organizacoes" ON public.organizations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Perfis visiveis para autenticados" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Membros gerenciam associacoes" ON public.organization_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a clientes" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a servicos de clientes" ON public.client_services
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a leads" ON public.leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a projetos" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a tarefas" ON public.tasks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a briefings" ON public.briefings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a aprovacoes" ON public.approvals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a reunioes" ON public.meetings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a contratos" ON public.contracts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Acesso completo a financas" ON public.financial_transactions
  FOR ALL USING (auth.role() = 'authenticated');

--------------------------------------------------------------------------------
-- 6. POPULAÇÃO DE DADOS INICIAIS DA ELD (SEED)
--------------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id UUID;
  v_cli_1 UUID;
  v_cli_2 UUID;
  v_cli_3 UUID;
  v_cli_4 UUID;
  v_lead_3 UUID;
  v_proj_1 UUID;
  v_proj_2 UUID;
  v_proj_3 UUID;
BEGIN
  -- 1. Organização Principal
  INSERT INTO public.organizations (name, slug, logo_url)
  VALUES ('ELD Agência', 'eld-agencia', 'https://eld.agencia/logo.png')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  -- 2. Clientes Iniciais
  INSERT INTO public.clients (organization_id, company_name, trade_name, document, contact_name, phone, email, segment, status, responsible, monthly_value, start_date, notes)
  VALUES
    (v_org_id, 'Grupo Vértice Engenharia', 'Vértice Engenharia', '12.345.678/0001-90', 'Eduardo Guimarães', '(11) 99887-1122', 'eduardo@verticeengenharia.com.br', 'Construção Civil', 'ativo', 'Mariana (Atendimento)', 7500.00, '2026-01-10', 'Cliente chave da agência.')
  RETURNING id INTO v_cli_1;

  INSERT INTO public.clients (organization_id, company_name, trade_name, document, contact_name, phone, email, segment, status, responsible, monthly_value, start_date, notes)
  VALUES
    (v_org_id, 'NutriLife Alimentos Saudáveis', 'NutriLife', '98.765.432/0001-10', 'Beatriz Vasconcelos', '(19) 98777-6655', 'beatriz@nutrilife.com.br', 'Alimentação & Saúde', 'ativo', 'Mariana (Atendimento)', 5200.00, '2026-03-01', 'Foco no aumento de vendas no e-commerce D2C.')
  RETURNING id INTO v_cli_2;

  INSERT INTO public.clients (organization_id, company_name, trade_name, document, contact_name, phone, email, segment, status, responsible, monthly_value, start_date, notes)
  VALUES
    (v_org_id, 'Advocacia Pinheiro & Associados', 'Pinheiro Advogados', '45.678.901/0001-23', 'Dr. Fernando Pinheiro', '(11) 98333-4455', 'contato@pinheiroadv.com.br', 'Jurídico', 'ativo', 'Mariana (Atendimento)', 4000.00, '2026-05-15', 'Posicionamento institucional e autoridade no LinkedIn.')
  RETURNING id INTO v_cli_3;

  INSERT INTO public.clients (organization_id, company_name, trade_name, document, contact_name, phone, email, segment, status, responsible, monthly_value, start_date, notes)
  VALUES
    (v_org_id, 'Lumina Solar Energia Sustentável', 'Lumina Solar', '33.222.111/0001-88', 'Gabriel Siqueira', '(19) 99444-5566', 'gabriel@luminasolar.com.br', 'Energia Solar', 'onboarding', 'Mariana (Atendimento)', 6000.00, '2026-08-25', 'Fase de configuração de tags e landing pages.')
  RETURNING id INTO v_cli_4;

  -- 3. Serviços dos Clientes
  INSERT INTO public.client_services (organization_id, client_id, name, value, is_recurring, frequency)
  VALUES
    (v_org_id, v_cli_1, 'Gestão de Tráfego de Alta Performance', 4500.00, TRUE, 'mensal'),
    (v_org_id, v_cli_1, 'Social Media & Conteúdo Estratégico', 3000.00, TRUE, 'mensal'),
    (v_org_id, v_cli_2, 'Gestão de Mídias Sociais & Criativos', 3200.00, TRUE, 'mensal'),
    (v_org_id, v_cli_2, 'Tráfego Pago Meta Ads', 2000.00, TRUE, 'mensal'),
    (v_org_id, v_cli_3, 'Inbound Marketing & Artigos Especializados', 4000.00, TRUE, 'mensal'),
    (v_org_id, v_cli_4, 'Geração de Leads B2C e B2B', 4000.00, TRUE, 'mensal'),
    (v_org_id, v_cli_4, 'Landing Pages de Conversão', 2000.00, FALSE, 'unico');

  -- 4. Leads do CRM (Funil Comercial)
  INSERT INTO public.leads (organization_id, name, company_name, phone, email, service_interested, responsible, stage, temperature, estimated_value, origin, notes)
  VALUES
    (v_org_id, 'Carlos Alberto Ferreira', 'InovaTech Soluções', '(11) 98765-4321', 'carlos@inovatech.com.br', 'Gestão de Tráfego Pago + Social Media', 'Lucas (Comercial)', 'proposta', 'quente', 4500.00, 'Indicação', 'Cliente quer acelerar geração de leads B2B.'),
    (v_org_id, 'Dra. Camila Ramos', 'Clínica OdontoPrime', '(19) 99123-8877', 'camila@odontoprime.com', 'Branding Completo & Identidade Visual', 'Lucas (Comercial)', 'briefing', 'quente', 8000.00, 'Instagram Ads', 'Reunião inicial muito positiva.'),
    (v_org_id, 'Juliana Mendes', 'Bella Donna Cosméticos', '(19) 98111-2233', 'contato@belladonna.com.br', 'Assessoria de E-commerce & Tráfego', 'Lucas (Comercial)', 'contrato', 'quente', 6200.00, 'Indicação', 'Contrato em fase de assinatura digital.'),
    (v_org_id, 'Marcelo Pires', 'Pires Logística Integrada', '(11) 96543-2109', 'marcelo@pireslog.com.br', 'Reformulação de Site Institucional', 'Lucas (Comercial)', 'lead', 'frio', 5500.00, 'Formulário Site', 'Enviada mensagem no WhatsApp.');

  INSERT INTO public.leads (organization_id, name, company_name, phone, email, service_interested, responsible, stage, temperature, estimated_value, origin, notes)
  VALUES
    (v_org_id, 'Roberto Silveira', 'Silveira Construtora', '(11) 97766-5544', 'roberto@silveiraconstrutora.com.br', 'Lançamento Imobiliário Residencial', 'Lucas (Comercial)', 'reuniao', 'morno', 15000.00, 'Google Search', 'Reunião de apresentação marcada.')
  RETURNING id INTO v_lead_3;

  -- 5. Projetos
  INSERT INTO public.projects (organization_id, client_id, client_name, name, description, responsible, start_date, due_date, status, priority, progress, value, deliverables_count, completed_deliverables)
  VALUES
    (v_org_id, v_cli_1, 'Grupo Vértice Engenharia', 'Campanha Lançamento Edifício Horizon', 'Campanha de tráfego, peças de mídia e landing page.', 'Felipe (Diretor de Criação)', '2026-08-01', '2026-09-15', 'em_andamento', 'alta', 65, 12000.00, 8, 5)
  RETURNING id INTO v_proj_1;

  INSERT INTO public.projects (organization_id, client_id, client_name, name, description, responsible, start_date, due_date, status, priority, progress, value, deliverables_count, completed_deliverables)
  VALUES
    (v_org_id, v_cli_2, 'NutriLife Alimentos Saudáveis', 'Calendário de Conteúdo & Reels - Setembro', 'Produção de 16 posts no feed e 8 vídeos Reels.', 'Sofia (Social Media)', '2026-08-20', '2026-09-05', 'em_revisao', 'media', 80, 3200.00, 12, 10)
  RETURNING id INTO v_proj_2;

  INSERT INTO public.projects (organization_id, client_id, client_name, name, description, responsible, start_date, due_date, status, priority, progress, value, deliverables_count, completed_deliverables)
  VALUES
    (v_org_id, v_cli_4, 'Lumina Solar', 'Setup de Onboarding & Landing Pages', 'Criação de páginas de captura de alta conversão.', 'Guilherme (Dev & UX)', '2026-08-26', '2026-09-10', 'em_andamento', 'urgente', 40, 4000.00, 4, 2)
  RETURNING id INTO v_proj_3;

  -- 6. Tarefas Operacionais (5 Etapas)
  INSERT INTO public.tasks (organization_id, project_id, project_name, client_id, client_name, title, description, responsible, due_date, status, priority)
  VALUES
    (v_org_id, v_proj_1, 'Campanha Lançamento Edifício Horizon', v_cli_1, 'Grupo Vértice Engenharia', 'Criar carrossel explicativo sobre o Edifício Horizon', 'Foco na vista panorâmica e acabamento premium com CTA.', 'Felipe (Designer)', '2026-09-03', 'em_producao', 'alta'),
    (v_org_id, v_proj_3, 'Setup de Onboarding & Landing Pages', v_cli_4, 'Lumina Solar', 'Ajustar layout da Landing Page Lumina Solar', 'Corrigir formulário de simulação para versão mobile.', 'Guilherme (UX/Dev)', '2026-09-02', 'ajustes', 'urgente'),
    (v_org_id, v_proj_2, 'Calendário de Conteúdo & Reels', v_cli_2, 'NutriLife', 'Aprovação interna dos roteiros de Reels NutriLife', 'Revisar os 4 roteiros de vídeo para gravação.', 'Sofia (Social Media)', '2026-09-04', 'em_aprovacao', 'media'),
    (v_org_id, v_proj_1, 'Campanha Lançamento Edifício Horizon', v_cli_1, 'Grupo Vértice Engenharia', 'Subir anúncios de tráfego no Google Ads', 'Configurar grupos de anúncios com foco em investidores.', 'Renato (Tráfego)', '2026-09-06', 'pendente', 'alta');

  -- 7. Briefings
  INSERT INTO public.briefings (organization_id, client_id, client_name, project_id, project_name, title, objective, target_audience, visual_references, deliverables, tone_of_voice, deadlines, technical_notes, responsible, status)
  VALUES
    (v_org_id, v_cli_1, 'Grupo Vértice Engenharia', v_proj_1, 'Campanha Lançamento Edifício Horizon', 'Briefing Criativo: Lançamento Imobiliário Horizon', 'Gerar 150 leads qualificados de alta renda para pré-venda das unidades.', 'Famílias classe A/B+, empresários e investidores (35-60 anos).', 'Linhas retas, iluminação dourada e paleta navy/champanhe.', '1 Landing page, 12 criativos e 4 vídeos.', 'Exclusivo, elegante e inspirador.', 'Aprovação de layout até 05/09.', 'Integração de leads via Webhook.', 'Felipe (Diretor de Criação)', 'aprovado'),
    (v_org_id, v_cli_2, 'NutriLife Alimentos Saudáveis', v_proj_2, 'Calendário de Conteúdo & Reels - Setembro', 'Briefing de Conteúdo: Campanha Primavera Saudável', 'Fortalecer comunidade online e impulsionar combo de snacks.', 'Pessoas ativas e praticantes de exercícios (20-45 anos).', 'Visual solar, vibrante com foco em momentos reais.', '16 cards estáticos e 8 roteiros para Reels.', 'Amigável, energético e informativo.', 'Entrega final até 08/09.', 'Utilizar nova paleta de embalagens.', 'Sofia (Social Media)', 'em_producao');

  -- 8. Aprovações & Entregas
  INSERT INTO public.approvals (organization_id, client_id, client_name, project_id, project_name, title, responsible, stage, status, asset_url, version, feedback, due_date)
  VALUES
    (v_org_id, v_cli_1, 'Grupo Vértice Engenharia', v_proj_1, 'Campanha Lançamento Edifício Horizon', 'Layout da Home da Landing Page Horizon (V2)', 'Guilherme (UX Designer)', 'aprovacao', 'aguardando_cliente', 'https://figma.com/design/exemplo-horizon-v2', 2, 'Ajustada a tipografia dos títulos e adicionada planta baixa.', '2026-09-02'),
    (v_org_id, v_cli_2, 'NutriLife Alimentos Saudáveis', v_proj_2, 'Calendário de Conteúdo', 'Pack de 4 Criativos de Tráfego - Snacks NutriLife', 'Felipe (Designer)', 'alteracoes', 'ajustes_solicitados', 'https://drive.google.com/exemplo-nutrilife', 1, 'Aumentar o contraste no botão de Compre Agora.', '2026-09-03'),
    (v_org_id, v_cli_4, 'Lumina Solar', v_proj_3, 'Setup de Onboarding', 'Identidade Visual & Paleta Lumina Solar', 'Felipe (Designer)', 'entrega', 'aprovado', 'https://drive.google.com/manual-marca', 3, 'Aprovado sem ressalvas pela diretoria.', '2026-08-28');

  -- 9. Reuniões & Atas
  INSERT INTO public.meetings (organization_id, related_to_type, related_to_id, related_to_name, title, date_time, attendees, agenda, notes, next_steps, status)
  VALUES
    (v_org_id, 'cliente', v_cli_1, 'Grupo Vértice Engenharia', 'Alinhamento Mensal de Resultados & Metas Q4', NOW() + INTERVAL '2 days', ARRAY['Eduardo Guimarães (Cliente)', 'Lucas (Comercial ELD)', 'Renato (Tráfego ELD)'], 'Apresentação dos resultados de agosto e planejamento do budget de setembro.', 'Preparar dashboard comparativo.', ARRAY['Subir novas campanhas com budget de R$ 20.000', 'Enviar ata por e-mail'], 'agendada'),
    (v_org_id, 'lead', v_lead_3, 'Silveira Construtora (Roberto)', 'Diagnóstico Comercial e Apresentação de Solução', NOW() + INTERVAL '1 day', ARRAY['Roberto Silveira (Lead)', 'Lucas (Comercial ELD)'], 'Entender a demanda de captação digital do condomínio.', 'Levar cases do setor imobiliário.', ARRAY['Montar proposta comercial personalizada'], 'agendada');

  -- 10. Contratos
  INSERT INTO public.contracts (organization_id, client_id, client_name, title, services, value, billing_type, start_date, end_date, status, document_url, notes)
  VALUES
    (v_org_id, v_cli_1, 'Grupo Vértice Engenharia', 'Contrato de Prestação de Serviços de Marketing & Tráfego', 'Gestão de Tráfego Pago + Social Media + Criação Publicitária', 7500.00, 'recorrente', '2026-01-10', '2027-01-10', 'vigente', 'https://documentos.eld.agencia/contratos/vertice.pdf', 'Renovação anual com reajuste IPCA.'),
    (v_org_id, v_cli_2, 'NutriLife Alimentos Saudáveis', 'Contrato Anual de Gestão de Mídias e Criativos', 'Social Media Estratégica, Gestão de Meta Ads e Design', 5200.00, 'recorrente', '2026-03-01', '2027-03-01', 'vigente', 'https://documentos.eld.agencia/contratos/nutrilife.pdf', 'Vencimento todo dia 05.');

  -- 11. Financeiro (Receitas e Despesas)
  INSERT INTO public.financial_transactions (organization_id, type, description, category, client_id, client_name, supplier, value, competence_date, due_date, status, payment_method, is_recurring)
  VALUES
    (v_org_id, 'receita', 'Honorários Mensais - Grupo Vértice (Setembro)', 'Honorários Recorrentes (MRR)', v_cli_1, 'Grupo Vértice Engenharia', NULL, 7500.00, '2026-09-01', '2026-09-10', 'pendente', 'pix', TRUE),
    (v_org_id, 'receita', 'Honorários Mensais - NutriLife (Setembro)', 'Honorários Recorrentes (MRR)', v_cli_2, 'NutriLife', NULL, 5200.00, '2026-09-01', '2026-09-05', 'pendente', 'boleto', TRUE),
    (v_org_id, 'receita', 'Honorários Mensais - Pinheiro Advogados (Setembro)', 'Honorários Recorrentes (MRR)', v_cli_3, 'Pinheiro Advogados', NULL, 4000.00, '2026-09-01', '2026-09-15', 'pendente', 'pix', TRUE),
    (v_org_id, 'receita', 'Setup e Landing Page - Lumina Solar (Entrada)', 'Projetos Pontuais', v_cli_4, 'Lumina Solar', NULL, 3000.00, '2026-08-25', '2026-08-28', 'recebido', 'pix', FALSE),
    (v_org_id, 'despesa', 'Assinaturas de Software (Adobe CC, Figma, RD Station, OpenAI)', 'Ferramentas & Softwares', NULL, NULL, 'Fornecedores Diversos', 1850.00, '2026-09-01', '2026-09-05', 'pendente', 'cartao', TRUE),
    (v_org_id, 'despesa', 'Servidores & Infraestrutura Cloud (Vercel, Supabase, Domínios)', 'Infraestrutura & Hospedagem', NULL, NULL, 'Cloud Providers', 620.00, '2026-09-01', '2026-09-10', 'pendente', 'cartao', TRUE),
    (v_org_id, 'despesa', 'Equipe de Criação e Redação Freelancer', 'Equipe & Prestadores', NULL, NULL, 'Profissionais Parceiros', 3800.00, '2026-09-01', '2026-09-12', 'pendente', 'pix', TRUE);

END $$;
