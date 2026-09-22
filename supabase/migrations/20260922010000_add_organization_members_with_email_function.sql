-- Expõe o e-mail (armazenado em auth.users) dos membros da organização do
-- usuário chamador, sem permitir leitura de e-mails de fora da organização.
CREATE OR REPLACE FUNCTION public.get_organization_members_with_email(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado a esta organização';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email::TEXT,
    p.phone,
    p.department,
    om.role,
    om.created_at
  FROM public.organization_members om
  JOIN public.profiles p ON p.id = om.user_id
  JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id = p_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_members_with_email(UUID) TO authenticated;
