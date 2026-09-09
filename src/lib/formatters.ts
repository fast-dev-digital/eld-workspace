import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata um valor numérico para Moeda Brasileira (BRL)
 * Exemplo: 1234.56 -> R$ 1.234,56
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata uma data no formato brasileiro dd/MM/yyyy
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
    if (!isValid(date)) return '-'
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}

/**
 * Formata uma data e hora no formato brasileiro dd/MM/yyyy HH:mm
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
    if (!isValid(date)) return '-'
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return '-'
  }
}

/**
 * Retorna classes CSS de status com base nas cores semânticas do ELD Workspace
 */
export function getStatusBadgeClasses(type: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'): string {
  switch (type) {
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'green':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'yellow':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'red':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'purple':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'gray':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
