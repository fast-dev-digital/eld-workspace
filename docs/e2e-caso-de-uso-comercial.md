# Caso de Uso E2E — "Fechamento de novo cliente e primeira entrega"

Teste ponta a ponta executado direto no banco Supabase (projeto `ixovqxfhqsskdvfrlfzt`)
em 2026-09-10. Todos os dados usaram o prefixo `E2E-` e foram removidos ao final
(banco retornou ao estado original).

## Cenário

A agência ELD recebe um lead pelo Instagram (Padaria Pão Quente). O comercial faz
uma reunião de diagnóstico, envia proposta, fecha contrato, converte o lead em
cliente, abre um projeto de rebranding, aprova o briefing, executa uma tarefa pelo
workflow de 5 etapas, roda um ciclo de aprovação com o cliente e registra a receita
no financeiro.

## Fluxo (10 passos)

| # | Ação | Tabelas | Regra validada |
|---|------|---------|----------------|
| 1 | Cadastra lead quente | `leads` | origem/temperatura/valor estimado |
| 2 | Agenda reunião e avança lead p/ `reuniao` | `meetings`, `leads` | `related_to_type='lead'`, vínculo por `related_to_id` |
| 3 | Lead avança `proposta` → `contrato` | `leads` | transições de `stage` |
| 4 | Converte lead em cliente (`onboarding`) + 2 serviços | `clients`, `client_services`, `leads.converted_client_id` | vínculo lead↔cliente |
| 5 | Cria contrato `vigente` (recorrente + pontual) | `contracts` | `billing_type`, período 12 meses |
| 6 | Abre projeto `em_andamento` | `projects` | `progress` 0–100, `deliverables_count` |
| 7 | Briefing `aprovado` ligado a cliente+projeto | `briefings` | FK `project_id`, `status` |
| 8 | Tarefa percorre `pendente → em_producao → em_aprovacao → ajustes → concluido` | `tasks` | `completed_at` preenchido só no fim |
| 9 | Aprovação: `aguardando_cliente → ajustes_solicitados (v2) → aprovado / entrega`; projeto vai a 40% | `approvals`, `projects` | versionamento, feedback, `stage` |
| 10 | 2 receitas: entrada `recebido` (R$1.150 pix) + fee mensal `pendente` (R$1.200 boleto) | `financial_transactions` | `type`, `status`, `payment_date` |

## Resultado dos testes

**Testes positivos — 12/12 PASS**

- T1 lead convertido (stage=cliente + converted_client_id) — PASS
- T2 cliente onboarding com 2 serviços — PASS
- T3 reunião vinculada ao lead — PASS
- T4 contrato vigente do cliente — PASS
- T5 projeto em_andamento vinculado ao cliente — PASS
- T6 briefing aprovado ligado a cliente+projeto — PASS
- T7 tarefa concluída com completed_at preenchido — PASS
- T8 aprovação final: aprovado / stage=entrega / version=2 / feedback salvo — PASS
- T9 projeto progrediu (progress=40, entregues=2) — PASS
- T10 financeiro: 1 recebido + 1 pendente do cliente — PASS
- T11 receita recebida = 1150.00 com payment_date — PASS
- T12 integridade: nenhum registro órfão de organization_id — PASS

**Testes negativos (CHECK constraints) — 3/3 PASS**

- N1 `leads.stage = 'estagio_invalido'` rejeitado (`check_violation`) — PASS
- N2 `projects.progress = 150` rejeitado — PASS
- N3 `financial_transactions.type = 'transferencia'` rejeitado (valor válido é `receita`/`despesa`; `transferencia` só existe em `payment_method`) — PASS

## Execução 2 — inserção PERSISTENTE (dados mantidos no banco)

Rodado em 2026-09-10. Os 10 registros abaixo **permanecem no banco** para inspeção
na aplicação / dashboard Supabase.

| Registro | ID |
|---|---|
| lead | `8b053706-82cc-46d7-bc58-8fa19af74111` |
| client | `88d6216c-65c9-427e-a141-524d5439b505` |
| meeting | `adf4e6df-88ba-4a4a-8b67-5511e0858dd5` |
| contract | `eb03c1f4-fa42-4fc1-adb1-da40a5d35a41` |
| project | `ca1c14ed-9b4a-4a1c-8a16-25b5d6e48928` |
| briefing | `01e275c3-6322-4fe0-bad6-90d609e30131` |
| task | `34e655b9-f708-4d33-8961-6e83d4ec4142` |
| approval | `ac17d8af-49dd-41ce-af1c-11502983b942` |
| client_services | 2 linhas |
| financial_transactions | 2 linhas |

Resultado: **12/12 PASS** após correção do T1.

### Bug encontrado no próprio script de teste (não no sistema)

A 1ª tentativa da execução 2 usou uma CTE `WITH ... UPDATE leads ...` cujo alias
não era referenciado pelo `SELECT` final. O PostgreSQL **não executa CTEs
data-modifying que não estão no grafo de dependências da instrução top-level** —
então a conversão lead→cliente não aconteceu (T1 FAIL). Corrigido com um `UPDATE`
direto (que é como o `supabaseService.saveLead` faz de verdade). Lição: encadear
escritas em CTE exige `RETURNING` + referência no corpo principal.

### Como limpar esses dados depois

```sql
DELETE FROM financial_transactions WHERE description LIKE 'E2E-%';
DELETE FROM approvals WHERE title LIKE 'E2E-%';
DELETE FROM tasks WHERE title LIKE 'E2E-%';
DELETE FROM briefings WHERE title = 'Briefing de Identidade Visual';
DELETE FROM meetings WHERE title LIKE 'E2E-%';
DELETE FROM contracts WHERE client_name LIKE 'E2E-%';
DELETE FROM projects WHERE name LIKE 'E2E-%';
DELETE FROM client_services WHERE client_id = '88d6216c-65c9-427e-a141-524d5439b505';
UPDATE leads SET converted_client_id = NULL WHERE name LIKE 'E2E-%';
DELETE FROM clients WHERE company_name LIKE 'E2E-%';
DELETE FROM leads WHERE name LIKE 'E2E-%';
```

## Observações / dívidas encontradas

1. **Avisos de segurança do Supabase advisor** (`get_advisors security`):
   funções `SECURITY DEFINER` (`handle_new_user`, `handle_updated_at`,
   `rls_auto_enable`) estão executáveis por `anon`/`authenticated` via
   `/rest/v1/rpc/...`. São triggers internas — devem ter `EXECUTE` revogado do
   público. Ref: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

2. RLS está habilitado em todas as tabelas; o teste rodou como service role (MCP).
   Um teste com o token `anon`/`authenticated` do app validaria as policies em si.

3. O `src/services/supabaseService.ts` não persiste `meetings.related_to_id` a
   partir de lead recém-criado em memória (usa `relatedToId` do objeto) — cobrir
   no teste de front quando houver.
