-- Seed inicial para o ELD Workspace
-- Execute este arquivo após aplicar a migration initial_schema.sql no Supabase.

--------------------------------------------------------------------------------
-- 1. SCRIPT DE BOOTSTRAP INICIAL DE ORGANIZAÇÃO E SEED
--------------------------------------------------------------------------------

-- Função auxiliar para inicializar uma organização com seus dados padrões
CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  p_org_name TEXT,
  p_org_slug TEXT,
  p_admin_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- 1. Criar ou buscar Organização
  INSERT INTO public.organizations (name, slug)
  VALUES (p_org_name, p_org_slug)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  -- 2. Associar Usuário Admin se fornecido
  IF p_admin_user_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, p_admin_user_id, 'admin')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'admin';
  END IF;

  -- 3. Inserir Etapas do Pipeline Padrão
  INSERT INTO public.pipeline_stages (organization_id, name, order_index, color, is_win, is_loss)
  VALUES
    (v_org_id, 'Novo lead', 1, '#3b82f6', FALSE, FALSE),
    (v_org_id, 'Primeiro contato', 2, '#06b6d4', FALSE, FALSE),
    (v_org_id, 'Diagnóstico', 3, '#8b5cf6', FALSE, FALSE),
    (v_org_id, 'Reunião agendada', 4, '#f59e0b', FALSE, FALSE),
    (v_org_id, 'Proposta enviada', 5, '#ec4899', FALSE, FALSE),
    (v_org_id, 'Negociação', 6, '#eab308', FALSE, FALSE),
    (v_org_id, 'Ganho', 7, '#10b981', TRUE, FALSE),
    (v_org_id, 'Perdido', 8, '#ef4444', FALSE, TRUE)
  ON CONFLICT DO NOTHING;

  -- 4. Inserir Serviços Iniciais da Agência
  INSERT INTO public.services (organization_id, name, description, category, default_price, is_recurring)
  VALUES
    (v_org_id, 'Gestão de Tráfego Pago', 'Gestão contínua de anúncios em Meta Ads, Google Ads e LinkedIn Ads', 'Tráfego', 2500.00, TRUE),
    (v_org_id, 'Social Media & Conteúdo', 'Planejamento, design e publicação estratégica para redes sociais', 'Conteúdo', 3000.00, TRUE),
    (v_org_id, 'Desenvolvimento de Site / Landing Page', 'Criação de sites e landing pages de alta conversão', 'Desenvolvimento', 5000.00, FALSE),
    (v_org_id, 'Consultoria de Marketing Digital', 'Diagnóstico estratégico e direcionamento de vendas', 'Consultoria', 4000.00, FALSE),
    (v_org_id, 'Branding & Identidade Visual', 'Construção completa de marca e manual de identidade', 'Design', 6000.00, FALSE)
  ON CONFLICT DO NOTHING;

  -- 5. Inserir Categorias Financeiras de Receita
  INSERT INTO public.financial_categories (organization_id, name, type)
  VALUES
    (v_org_id, 'Gestão de Tráfego', 'receita'),
    (v_org_id, 'Social Media', 'receita'),
    (v_org_id, 'Desenvolvimento', 'receita'),
    (v_org_id, 'Consultoria', 'receita'),
    (v_org_id, 'Branding', 'receita'),
    (v_org_id, 'Outras Receitas', 'receita')
  ON CONFLICT DO NOTHING;

  -- 6. Inserir Categorias Financeiras de Despesa
  INSERT INTO public.financial_categories (organization_id, name, type)
  VALUES
    (v_org_id, 'Ferramentas & Software', 'despesa'),
    (v_org_id, 'Prestadores & Equipe', 'despesa'),
    (v_org_id, 'Anúncios & Mídia', 'despesa'),
    (v_org_id, 'Infraestrutura & Hosting', 'despesa'),
    (v_org_id, 'Impostos & Taxas', 'despesa'),
    (v_org_id, 'Custos Operacionais', 'despesa'),
    (v_org_id, 'Outras Despesas', 'despesa')
  ON CONFLICT DO NOTHING;

  RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION public.bootstrap_organization IS 'Função segura para criar a organização inicial ELD Workspace com etapas, serviços e categorias financeiras padrão.';

-- Exemplo de Uso de Bootstrap para a Organização ELD (descomente ao executar com o UUID do usuário criado):
-- SELECT public.bootstrap_organization('ELD Agência', 'eld-agencia', 'SEU_USER_UUID_AQUI');
