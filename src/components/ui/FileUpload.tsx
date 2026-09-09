import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  X,
  CheckCircle2,
  Loader2,
  File,
} from 'lucide-react'
import { storageService } from '@/services/storageService'
import { toast } from 'sonner'

export interface FileUploadProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  folder?: string
  accept?: string
  placeholder?: string
  helpText?: string
  required?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Anexo / Documento',
  value = '',
  onChange,
  folder = 'uploads',
  accept = '.pdf,image/*,.doc,.docx,.xlsx',
  placeholder = 'Cole uma URL ou faça upload de um arquivo',
  helpText,
  required = false,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return

    // Limite de 25MB
    if (file.size > 25 * 1024 * 1024) {
      toast.error('O arquivo selecionado é maior que o limite de 25MB.')
      return
    }

    setIsUploading(true)
    try {
      const res = await storageService.uploadFile(file, folder)
      onChange(res.url)
      if (res.isLocal) {
        toast.info('Arquivo anexado com sucesso (armazenamento local).')
      } else {
        toast.success('Arquivo enviado com sucesso para a Nuvem!')
      }
    } catch {
      toast.error('Erro ao processar o upload do arquivo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const getFileIcon = (url: string) => {
    if (!url) return <FileText className="w-5 h-5 text-zinc-400" />
    const lower = url.toLowerCase()
    if (lower.includes('.pdf') || lower.startsWith('data:application/pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />
    }
    if (
      lower.includes('.png') ||
      lower.includes('.jpg') ||
      lower.includes('.jpeg') ||
      lower.includes('.webp') ||
      lower.startsWith('data:image/')
    ) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />
    }
    return <File className="w-5 h-5 text-brand-500" />
  }

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setInputMode(inputMode === 'upload' ? 'url' : 'upload')}
          className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
        >
          {inputMode === 'upload' ? (
            <>
              <LinkIcon className="w-3 h-3" /> Colar link externo
            </>
          ) : (
            <>
              <UploadCloud className="w-3 h-3" /> Fazer upload de arquivo
            </>
          )}
        </button>
      </div>

      {inputMode === 'url' ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-200 pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg border border-zinc-200"
              title="Limpar link"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-white rounded-lg border border-zinc-200 shrink-0">
                  {getFileIcon(value)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 truncate text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Arquivo Anexado</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate max-w-[280px]">
                    {value.startsWith('data:') ? 'Documento carregado localmente' : value}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-zinc-600 hover:text-brand-600 hover:bg-zinc-200/60 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                  title="Abrir anexo"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver
                </a>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remover anexo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-zinc-300 hover:border-brand-400 hover:bg-zinc-50/70'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept={accept}
                className="hidden"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-1">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                  <span className="text-xs font-semibold text-zinc-700">Enviando arquivo...</span>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-zinc-700">
                    <strong className="text-brand-600 font-semibold hover:underline">Clique para enviar</strong> ou arraste o arquivo aqui
                  </div>
                  <p className="text-[10px] text-zinc-400">PDF, Imagens, DOC ou Planilhas até 25MB</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helpText && <p className="text-[10px] text-zinc-400">{helpText}</p>}
    </div>
  )
}
