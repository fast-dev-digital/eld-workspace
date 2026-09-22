-- Adiciona campo de departamento ao perfil, usado no cadastro de colaboradores
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
