-- Migration Inicial: ELD Workspace Schema, RLS, Trigger updated_at e RPC transacional convert_lead_to_client
-- Data: 2026-08-04

-- Habilitar extensão UUID caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. FUNÇÃO REUTILIZÁVEL PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
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

COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger reutilizável para atualizar a coluna updated_at com o timestamp atual.';

--------------------------------------------------------------------------------
-- 2. CRIAÇÃO DAS TABELAS BASE DO SISTEMA
--------------------------------------------------------------------------------

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (Viculado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Members (Com papéis: admin, comercial, operacional, financeiro)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'comercial', 'operacional', 'financeiro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_win BOOLEAN NOT NULL DEFAULT FALSE,
  is_loss BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services (Catálogo de serviços)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  default_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'onboarding', 'pausado', 'encerrado')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  origin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  temperature TEXT NOT NULL DEFAULT 'morno' CHECK (temperature IN ('frio', 'morno', 'quente')),
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  loss_reason TEXT,
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  responsible_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'ligacao' CHECK (type IN ('ligacao', 'whatsapp', 'email', 'reuniao', 'retorno', 'outro')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  completed_at TIMESTAMPTZ,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Services (Contratos / Serviços Contratados)
CREATE TABLE IF NOT EXISTS public.client_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  billing_type TEXT NOT NULL DEFAULT 'recorrente' CHECK (billing_type IN ('recorrente', 'pontual')),
  frequency TEXT NOT NULL DEFAULT 'mensal' CHECK (frequency IN ('mensal', 'trimestral', 'semestral', 'anual', 'unico')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'encerrado')),
  next_due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejamento' CHECK (status IN ('aguardando_inicio', 'planejamento', 'em_andamento', 'aguardando_cliente', 'em_revisao', 'concluido', 'pausado', 'cancelado')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'em_revisao', 'concluido', 'cancelado')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revenues (Receitas)
CREATE TABLE IF NOT EXISTS public.revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.client_services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  competence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebida', 'vencida', 'cancelada')),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro', 'outro')),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  frequency TEXT CHECK (frequency IN ('mensal', 'trimestral', 'semestral', 'anual', 'unico')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses (Despesas)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  supplier TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  competence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'vencida', 'cancelada')),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro', 'outro')),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities Timeline
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'project', 'finance')),
  entity_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

--------------------------------------------------------------------------------
-- 3. CRIAÇÃO DE ÍNDICES PARA CONSULTAS DE ALTA PERFORMANCE
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_responsible ON public.leads(responsible_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(next_follow_up_at);

CREATE INDEX IF NOT EXISTS idx_follow_ups_org ON public.follow_ups(organization_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_client ON public.follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);

CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_responsible ON public.clients(responsible_id);

CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON public.tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_revenues_org ON public.revenues(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenues_client ON public.revenues(client_id);
CREATE INDEX IF NOT EXISTS idx_revenues_due_date ON public.revenues(due_date);
CREATE INDEX IF NOT EXISTS idx_revenues_status ON public.revenues(status);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);

--------------------------------------------------------------------------------
-- 4. TRIGGERS AUTOMÁTICOS DE updated_at
--------------------------------------------------------------------------------
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_revenues_updated_at BEFORE UPDATE ON public.revenues FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- 5. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PROFILE NO CADASTRO DE USUÁRIO
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 6. FUNÇÕES SECURITY DEFINER PARA RLS E SEGURANÇA
--------------------------------------------------------------------------------

-- Função: is_organization_member
CREATE OR REPLACE FUNCTION public.is_organization_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_organization_member(UUID) IS 'Valida com segurança se auth.uid() é membro da organização especificada.';

-- Função: get_user_organization_role
CREATE OR REPLACE FUNCTION public.get_user_organization_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.organization_members
  WHERE organization_id = p_org_id
    AND user_id = auth.uid();

  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION public.get_user_organization_role(UUID) IS 'Retorna o papel (admin, comercial, operacional, financeiro) de auth.uid() na organização.';

-- Privilégios restritos
REVOKE ALL ON FUNCTION public.is_organization_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_organization_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_organization_role(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- 7. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS OPERACIONAIS
--------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- POLICIES DE RLS
--------------------------------------------------------------------------------

-- Profiles: usuários podem ver todos os perfis e atualizar seu próprio perfil
CREATE POLICY "Users can view all profiles in system" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: visíveis se o usuário for membro
CREATE POLICY "Members can view their organization" ON public.organizations FOR SELECT USING (public.is_organization_member(id));

-- Organization Members: membros da organização podem visualizar os outros membros
CREATE POLICY "Members can view organization members" ON public.organization_members FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Admins can manage organization members" ON public.organization_members FOR ALL USING (public.get_user_organization_role(organization_id) = 'admin');

-- Tabelas Genéricas Operacionais (Membros da Organização)
-- pipeline_stages
CREATE POLICY "Members can view pipeline_stages" ON public.pipeline_stages FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Admins/Comercial can manage pipeline_stages" ON public.pipeline_stages FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'comercial'));

-- services
CREATE POLICY "Members can view services" ON public.services FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.get_user_organization_role(organization_id) = 'admin');

-- clients
CREATE POLICY "Members can view clients" ON public.clients FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Allowed roles can manage clients" ON public.clients FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));

-- leads
CREATE POLICY "Members can view leads" ON public.leads FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));
CREATE POLICY "Allowed roles can manage leads" ON public.leads FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'comercial'));

-- follow_ups
CREATE POLICY "Members can view follow_ups" ON public.follow_ups FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));
CREATE POLICY "Allowed roles can manage follow_ups" ON public.follow_ups FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));

-- client_services
CREATE POLICY "Members can view client_services" ON public.client_services FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Allowed roles can manage client_services" ON public.client_services FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'financeiro', 'comercial'));

-- projects & project_members
CREATE POLICY "Members can view projects" ON public.projects FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));
CREATE POLICY "Allowed roles can manage projects" ON public.projects FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'operacional'));

CREATE POLICY "Members can view project_members" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Allowed roles can manage project_members" ON public.project_members FOR ALL USING (true);

-- tasks
CREATE POLICY "Members can view tasks" ON public.tasks FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'comercial', 'operacional'));
CREATE POLICY "Allowed roles can manage tasks" ON public.tasks FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'operacional'));

-- financial_categories
CREATE POLICY "Members can view financial_categories" ON public.financial_categories FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Allowed roles can manage financial_categories" ON public.financial_categories FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'financeiro'));

-- revenues
CREATE POLICY "Finance/Admin can view revenues" ON public.revenues FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'financeiro'));
CREATE POLICY "Finance/Admin can manage revenues" ON public.revenues FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'financeiro'));

-- expenses
CREATE POLICY "Finance/Admin can view expenses" ON public.expenses FOR SELECT USING (public.is_organization_member(organization_id) AND public.get_user_organization_role(organization_id) IN ('admin', 'financeiro'));
CREATE POLICY "Finance/Admin can manage expenses" ON public.expenses FOR ALL USING (public.get_user_organization_role(organization_id) IN ('admin', 'financeiro'));

-- activities
CREATE POLICY "Members can view activities" ON public.activities FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Members can insert activities" ON public.activities FOR INSERT WITH CHECK (public.is_organization_member(organization_id));

-- app_settings
CREATE POLICY "Members can view app_settings" ON public.app_settings FOR SELECT USING (public.is_organization_member(organization_id));
CREATE POLICY "Admins can manage app_settings" ON public.app_settings FOR ALL USING (public.get_user_organization_role(organization_id) = 'admin');

--------------------------------------------------------------------------------
-- 8. RPC TRANSACIONAL: CONVERSÃO DE LEAD EM CLIENTE
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(
  p_lead_id UUID,
  p_company_name TEXT,
  p_trade_name TEXT DEFAULT NULL,
  p_document TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
  v_client_id UUID;
  v_win_stage_id UUID;
  v_user_role TEXT;
  v_created_client JSONB;
BEGIN
  -- 1. Verificar autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  -- 2. Buscar e travar o lead para alteração
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado (ID: %).', p_lead_id;
  END IF;

  -- 3. Validar pertencimento à organização e permissão do usuário
  IF NOT public.is_organization_member(v_lead.organization_id) THEN
    RAISE EXCEPTION 'Usuário não pertence à organização deste lead.';
  END IF;

  v_user_role := public.get_user_organization_role(v_lead.organization_id);
  IF v_user_role NOT IN ('admin', 'comercial') THEN
    RAISE EXCEPTION 'Permissão insuficiente para converter lead em cliente.';
  END IF;

  -- 4. Confirmar que o lead ainda não foi convertido
  IF v_lead.converted_client_id IS NOT NULL THEN
    RAISE EXCEPTION 'Este lead já foi convertido anteriormente no cliente ID %.', v_lead.converted_client_id;
  END IF;

  -- 5. Criar o Cliente reaproveitando dados
  INSERT INTO public.clients (
    organization_id,
    company_name,
    trade_name,
    document,
    contact_name,
    phone,
    email,
    address,
    responsible_id,
    status,
    start_date,
    origin,
    notes
  ) VALUES (
    v_lead.organization_id,
    COALESCE(p_company_name, v_lead.company_name, v_lead.name),
    p_trade_name,
    p_document,
    COALESCE(p_contact_name, v_lead.name),
    COALESCE(p_phone, v_lead.phone),
    COALESCE(p_email, v_lead.email),
    p_address,
    v_lead.responsible_id,
    'ativo',
    CURRENT_DATE,
    v_lead.source,
    COALESCE(p_notes, v_lead.notes)
  )
  RETURNING id INTO v_client_id;

  -- 6. Localizar a etapa de "Ganho" do pipeline
  SELECT id INTO v_win_stage_id
  FROM public.pipeline_stages
  WHERE organization_id = v_lead.organization_id
    AND is_win = TRUE
  ORDER BY order_index ASC
  LIMIT 1;

  -- 7. Atualizar o Lead
  UPDATE public.leads
  SET converted_client_id = v_client_id,
      stage_id = COALESCE(v_win_stage_id, stage_id),
      updated_at = NOW()
  WHERE id = p_lead_id;

  -- 8. Registrar a Atividade no Histórico
  INSERT INTO public.activities (
    organization_id,
    entity_type,
    entity_id,
    lead_id,
    client_id,
    type,
    description,
    actor_id,
    metadata
  ) VALUES (
    v_lead.organization_id,
    'lead',
    p_lead_id,
    p_lead_id,
    v_client_id,
    'lead_converted',
    FORMAT('Lead "%s" foi convertido com sucesso no cliente "%s".', v_lead.name, COALESCE(p_company_name, v_lead.name)),
    auth.uid(),
    jsonb_build_object('client_id', v_client_id, 'lead_id', p_lead_id)
  );

  -- 9. Retornar os dados do Cliente criado em formato JSONB
  SELECT to_jsonb(c) INTO v_created_client
  FROM public.clients c
  WHERE c.id = v_client_id;

  RETURN v_created_client;
END;
$$;

COMMENT ON FUNCTION public.convert_lead_to_client IS 'RPC Transacional segura para converter Lead em Cliente no Supabase, validando org/roles, vinculando registros e adicionando histórico de atividade.';

REVOKE ALL ON FUNCTION public.convert_lead_to_client FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_client TO authenticated;
