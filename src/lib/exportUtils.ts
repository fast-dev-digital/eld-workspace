import { formatCurrency, formatDate } from './formatters'
import { FinancialTransaction, Client } from '@/types/workspace.types'

/**
 * Utilitário profissional para exportação de dados para CSV compatível com Microsoft Excel (Windows/Mac)
 * Utiliza ponto-e-vírgula (;) como delimitador e BOM UTF-8 (\uFEFF) para preservar acentuação no Excel brasileiro.
 */

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta lançamentos financeiros detalhados (Extrato de Fluxo de Caixa)
 */
export function exportTransactionsCSV(
  transactions: FinancialTransaction[],
  periodLabel: string = 'Todos'
) {
  const headers = [
    'Tipo',
    'Descrição',
    'Categoria',
    'Cliente / Fornecedor',
    'Data Vencimento',
    'Data Competência',
    'Data Pagamento',
    'Valor (R$)',
    'Status',
    'Forma de Pagamento',
    'Recorrente',
    'Observações',
  ]

  const rows = transactions.map((t) => [
    escapeCSV(t.type === 'receita' ? 'Receita (+)' : 'Despesa (-)'),
    escapeCSV(t.description),
    escapeCSV(t.category),
    escapeCSV(t.type === 'receita' ? (t.clientName || '-') : (t.supplier || '-')),
    escapeCSV(formatDate(t.dueDate)),
    escapeCSV(formatDate(t.competenceDate)),
    escapeCSV(t.paymentDate ? formatDate(t.paymentDate) : '-'),
    escapeCSV(t.value.toFixed(2).replace('.', ',')),
    escapeCSV(t.status.toUpperCase()),
    escapeCSV(t.paymentMethod ? t.paymentMethod.toUpperCase() : '-'),
    escapeCSV(t.isRecurring ? 'Sim' : 'Não'),
    escapeCSV(t.notes || ''),
  ])

  // Metadados no topo do arquivo
  const metadata = [
    `"RELATÓRIO FINANCEIRO - ELD WORKSPACE";"Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}"`,
    `"Filtro de Período";"${periodLabel}"`,
    `"Total de Registros";"${transactions.length}"`,
    '',
  ]

  const csvBody = [
    ...metadata,
    headers.map((h) => `"${h}"`).join(';'),
    ...rows.map((r) => r.join(';')),
  ].join('\r\n')

  const dateSlug = new Date().toISOString().split('T')[0]
  downloadCSV(`extrato_financeiro_eld_${dateSlug}.csv`, csvBody)
}

/**
 * Exporta Demonstração de Resultado do Exercício (DRE Sintético)
 */
export function exportDRECSV(
  transactions: FinancialTransaction[],
  periodLabel: string = 'Consolidado'
) {
  const receitas = transactions.filter((t) => t.type === 'receita')
  const despesas = transactions.filter((t) => t.type === 'despesa')

  const totalReceitas = receitas.reduce((acc, t) => acc + t.value, 0)
  const totalDespesas = despesas.reduce((acc, t) => acc + t.value, 0)
  const saldoLiquido = totalReceitas - totalDespesas
  const margem = totalReceitas > 0 ? ((saldoLiquido / totalReceitas) * 100).toFixed(1) + '%' : '0%'

  // Agrupamento de receitas por categoria
  const catReceitasMap: Record<string, number> = {}
  receitas.forEach((r) => {
    catReceitasMap[r.category] = (catReceitasMap[r.category] || 0) + r.value
  })

  // Agrupamento de despesas por categoria
  const catDespesasMap: Record<string, number> = {}
  despesas.forEach((d) => {
    catDespesasMap[d.category] = (catDespesasMap[d.category] || 0) + d.value
  })

  const lines: string[] = [
    `"DRE SINTÉTICO GERENCIAL - ELD AGÊNCIA"`,
    `"Período Analisado";"${periodLabel}"`,
    `"Data de Emissão";"${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}"`,
    '',
    `"INDICADOR / CONTA";"VALOR (R$)";"PARTICIPAÇÃO"`,
    `"(+) RECEITA OPERACIONAL BRUTA";"${totalReceitas.toFixed(2).replace('.', ',')}";"100,0%"`,
  ]

  Object.entries(catReceitasMap).forEach(([cat, val]) => {
    const part = totalReceitas > 0 ? ((val / totalReceitas) * 100).toFixed(1) + '%' : '0%'
    lines.push(`"    • ${cat}";"${val.toFixed(2).replace('.', ',')}";"${part}"`)
  })

  lines.push('')
  lines.push(`"(-) DESPESAS OPERACIONAIS TOTAIS";"${totalDespesas.toFixed(2).replace('.', ',')}";"${totalReceitas > 0 ? ((totalDespesas / totalReceitas) * 100).toFixed(1) + '%' : '0%'}"`)

  Object.entries(catDespesasMap).forEach(([cat, val]) => {
    const part = totalReceitas > 0 ? ((val / totalReceitas) * 100).toFixed(1) + '%' : '0%'
    lines.push(`"    • ${cat}";"${val.toFixed(2).replace('.', ',')}";"${part}"`)
  })

  lines.push('')
  lines.push(`"(=) RESULTADO LÍQUIDO OPERACIONAL";"${saldoLiquido.toFixed(2).replace('.', ',')}";"${margem}"`)
  lines.push(`"MARGEM LÍQUIDA";"${margem}";"-"`)

  const dateSlug = new Date().toISOString().split('T')[0]
  downloadCSV(`dre_gerencial_eld_${dateSlug}.csv`, lines.join('\r\n'))
}

/**
 * Exporta Base Completa de Clientes
 */
export function exportClientsCSV(clients: Client[]) {
  const headers = [
    'Razão Social',
    'Nome Fantasia',
    'CNPJ / Documento',
    'Contato Principal',
    'Telefone / WhatsApp',
    'E-mail',
    'Segmento',
    'Status da Conta',
    'Responsável ELD',
    'Fee Mensal Recorrente (R$)',
    'Data de Início',
    'Quantidade de Serviços',
    'Lista de Serviços',
    'Observações',
  ]

  const rows = clients.map((c) => {
    const servicosStr = (c.services || []).map((s) => `${s.name} (${formatCurrency(s.value)})`).join(' | ')
    return [
      escapeCSV(c.companyName),
      escapeCSV(c.tradeName),
      escapeCSV(c.document || '-'),
      escapeCSV(c.contactName),
      escapeCSV(c.phone),
      escapeCSV(c.email),
      escapeCSV(c.segment || '-'),
      escapeCSV(c.status.toUpperCase()),
      escapeCSV(c.responsible),
      escapeCSV(c.monthlyValue.toFixed(2).replace('.', ',')),
      escapeCSV(formatDate(c.startDate)),
      escapeCSV(c.services?.length || 0),
      escapeCSV(servicosStr || '-'),
      escapeCSV(c.notes || ''),
    ]
  })

  const metadata = [
    `"RELATÓRIO DE CLIENTES - ELD WORKSPACE";"Gerado em: ${new Date().toLocaleDateString('pt-BR')}"`,
    `"Total de Clientes";"${clients.length}"`,
    `"MRR Total da Carteira";"${formatCurrency(clients.reduce((acc, c) => acc + (c.status === 'ativo' ? c.monthlyValue : 0), 0))}"`,
    '',
  ]

  const csvBody = [
    ...metadata,
    headers.map((h) => `"${h}"`).join(';'),
    ...rows.map((r) => r.join(';')),
  ].join('\r\n')

  const dateSlug = new Date().toISOString().split('T')[0]
  downloadCSV(`clientes_eld_${dateSlug}.csv`, csvBody)
}
