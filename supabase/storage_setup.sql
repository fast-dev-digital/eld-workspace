-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE STORAGE - ELD WORKSPACE
-- Bucket: eld-documents
-- ============================================================================

-- 1. Criar o bucket público se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'eld-documents',
  'eld-documents',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800;

-- 2. Políticas de Acesso (RLS) para o bucket eld-documents
-- Permitir leitura pública de arquivos
CREATE POLICY "Permitir leitura pública de documentos da agência"
ON storage.objects FOR SELECT
USING (bucket_id = 'eld-documents');

-- Permitir inserção de arquivos por usuários autenticados e chave anon
CREATE POLICY "Permitir upload de documentos da agência"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eld-documents');

-- Permitir atualização de arquivos no bucket
CREATE POLICY "Permitir atualização de documentos da agência"
ON storage.objects FOR UPDATE
USING (bucket_id = 'eld-documents')
WITH CHECK (bucket_id = 'eld-documents');

-- Permitir remoção de arquivos no bucket
CREATE POLICY "Permitir exclusão de documentos da agência"
ON storage.objects FOR DELETE
USING (bucket_id = 'eld-documents');
