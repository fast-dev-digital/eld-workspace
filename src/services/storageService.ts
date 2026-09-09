import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface UploadResult {
  url: string
  fileName: string
  sizeBytes: number
  isLocal: boolean
}

const STORAGE_BUCKET = 'eld-documents'

/**
 * Converte um arquivo do navegador para Data URL base64 (usado em modo offline/fallback)
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export const storageService = {
  /**
   * Faz upload de arquivo para o Supabase Storage com fallback automático para modo local/offline
   */
  async uploadFile(file: File, folder: string = 'uploads'): Promise<UploadResult> {
    // 1. Caso esteja em modo standby (sem chaves Supabase), usa Data URL local
    if (!isSupabaseConfigured) {
      const dataUrl = await fileToDataUrl(file)
      return {
        url: dataUrl,
        fileName: file.name,
        sizeBytes: file.size,
        isLocal: true,
      }
    }

    // 2. Tentativa de upload no Supabase Storage
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${folder}/${Date.now()}_${sanitizedName}`

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        console.warn('⚠️ [Supabase Storage]: Falha no upload para o bucket. Usando fallback local:', error.message)
        const localDataUrl = await fileToDataUrl(file)
        return {
          url: localDataUrl,
          fileName: file.name,
          sizeBytes: file.size,
          isLocal: true,
        }
      }

      // Obter URL pública do arquivo enviado
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path)

      return {
        url: publicUrlData.publicUrl,
        fileName: file.name,
        sizeBytes: file.size,
        isLocal: false,
      }
    } catch (err: any) {
      console.warn('⚠️ [Storage Service]: Exceção durante upload remoto, revertendo para local:', err)
      const localDataUrl = await fileToDataUrl(file)
      return {
        url: localDataUrl,
        fileName: file.name,
        sizeBytes: file.size,
        isLocal: true,
      }
    }
  },
}
