# Teste de carga — ELD Workspace / Supabase

Executado em 2026-09-10, projeto `ixovqxfhqsskdvfrlfzt`. Modo: **inserir, medir e limpar**
(prefixo `LOAD-`). Escala pequena (~8.100 linhas de pico). Banco restaurado ao final.

## Massa gerada

| Tabela | Linhas |
|---|---|
| leads | 1.000 (+2.000 num 2º lote) |
| clients | 800 |
| client_services | 1.600 |
| projects | 500 |
| tasks | 1.000 |
| financial_transactions | 1.200 |

## Throughput de escrita

Bulk `INSERT ... SELECT generate_series(1,2000)` em `leads`:

| Fase | Tempo |
|---|---|
| Geração + insert das 2.000 linhas | ~13,6 ms |
| **Trigger FK `leads_organization_id_fkey`** (2.000 checks) | **15,9 ms** |
| Trigger FK `leads_converted_client_id_fkey` | 1,9 ms |
| **Total** | **33,3 ms** (~60k linhas/s) |

➡️ **Achado #1:** quase metade do custo de INSERT é validação de FK linha-a-linha,
porque **nenhuma FK tem índice de cobertura**. Em cargas maiores (ex: import CSV) isso
domina o tempo.

## Latência de leitura (base cheia, EXPLAIN ANALYZE)

| Query do app | Plano | Tempo |
|---|---|---|
| `fetchAllData` — clients LEFT JOIN client_services + ORDER BY created_at | Hash Right Join + Seq Scan + quicksort | **2,87 ms** |
| `fetchAllData` — tasks ORDER BY due_date | Seq Scan + Sort | **0,74 ms** |
| Filtro de período financeiro (`due_date BETWEEN`) | Seq Scan | **~0,8 ms** |
| Meta financeira (`sum(value) WHERE type/status/competence_date`) | Seq Scan, 1.166 linhas descartadas pelo filtro | **0,85 ms** |
| `fetchAllData` completo (9 queries sequenciais) | — | poucos ms |

➡️ Em ~8k linhas **tudo é Seq Scan e ainda é rápido** (< 3 ms). O gargalo NÃO é o
banco nessa escala — é a rede (9 round-trips do `Promise.all` no `supabaseService`)
e o parse no browser.

## Recomendações (por prioridade)

### 1. Criar índices nas FKs — advisor "unindexed_foreign_keys" (22 ocorrências) ✅ FEITO
Migration criada em `supabase/migrations/20260910000000_add_fk_and_dashboard_indexes.sql`
(inclui também os índices compostos do item 2). **Aplicar com `supabase db push` ou
pelo SQL Editor do dashboard** — a aplicação via MCP foi bloqueada pelo classificador
de permissões desta sessão.

Impacta INSERT/UPDATE (checks de FK) e JOINs. Conteúdo:

```sql
CREATE INDEX ON leads (organization_id);
CREATE INDEX ON leads (converted_client_id);
CREATE INDEX ON clients (organization_id);
CREATE INDEX ON client_services (client_id);
CREATE INDEX ON client_services (organization_id);
CREATE INDEX ON projects (client_id);
CREATE INDEX ON projects (organization_id);
CREATE INDEX ON tasks (client_id);
CREATE INDEX ON tasks (project_id);
CREATE INDEX ON tasks (organization_id);
CREATE INDEX ON briefings (client_id);
CREATE INDEX ON briefings (project_id);
CREATE INDEX ON briefings (organization_id);
CREATE INDEX ON approvals (client_id);
CREATE INDEX ON approvals (project_id);
CREATE INDEX ON approvals (organization_id);
CREATE INDEX ON contracts (client_id);
CREATE INDEX ON contracts (organization_id);
CREATE INDEX ON financial_transactions (client_id);
CREATE INDEX ON financial_transactions (organization_id);
CREATE INDEX ON meetings (organization_id);
CREATE INDEX ON organization_members (user_id);
```

### 2. Índices para as queries de ordenação/filtro do dashboard
```sql
CREATE INDEX ON tasks (organization_id, due_date);
CREATE INDEX ON financial_transactions (organization_id, due_date);
CREATE INDEX ON financial_transactions (organization_id, type, status, competence_date);
CREATE INDEX ON leads (organization_id, created_at DESC);
CREATE INDEX ON projects (organization_id, created_at DESC);
```

### 3. RLS — advisor "auth_rls_initplan" (WARN)
Policies em `profiles`, `organization_members`, `financial_transactions` reavaliam
`auth.<fn>()` por linha. Trocar por `(select auth.<fn>())`.

### 4. Policies duplicadas — advisor "multiple_permissive_policies" (WARN)
`financial_transactions` tem 2 policies redundantes (`Acesso completo a financas` +
`Acesso completo a financeiro`) para TODAS as ações/roles. Remover uma.

### 5. App — `fetchAllData` faz 9 requisições
Para orgs grandes, considerar um RPC único (`get_workspace_snapshot(org_id)`) que
devolve tudo num payload, ou paginação nas tabelas de alto volume (tasks, transações).

## Conclusão

O schema aguenta bem a carga esperada de uma agência (centenas de clientes, milhares
de tarefas) — latências sub-5ms. Os **índices de FK são a única mudança realmente
necessária** antes de crescer; o resto é otimização incremental.

---

## Tratamento de erro no app (feito nesta rodada)

### Descoberta sobre CASCADE
As FKs **já têm `ON DELETE CASCADE` / `SET NULL`** desde a migration inicial
(`20260804000000_initial_schema.sql`). Deletar cliente → apaga projetos/tarefas/
briefings/aprovações/contratos/serviços e zera `client_id` em transações e
`converted_client_id` em leads. **Nenhuma mudança de CASCADE foi necessária.**

### O problema real: erros silenciosos
`supabaseService` fazia `console.warn` e seguia; `WorkspaceContext` fazia optimistic
update **sem `await`** e sempre dava `toast.success`. Se uma constraint (`CHECK`,
`NOT NULL`, FK) rejeitasse, o usuário via "✅ sucesso", o dado aparecia na tela e
sumia no próximo reload.

### Correções aplicadas

**`src/services/supabaseService.ts`**
- Todo `save*` / `delete*` agora retorna `Promise<MutationResult>` (`{ error: string | null }`)
- Novo `friendlyDbError()` traduz códigos do Postgres para PT-BR:
  `23505` duplicata · `23503` FK · `23502` campo obrigatório · `23514` valor inválido ·
  `22P02` formato · `42501` sem permissão (RLS)
- Helper `run()` centraliza try/catch + log + normalização

**`src/context/WorkspaceContext.tsx`**
- Novo helper `syncOrRevert(op, rollback, okMsg?)`: aplica a gravação, e se falhar
  **reverte o optimistic update** (restaura o item anterior / remove o inserido /
  readiciona o removido) e mostra `toast.error(mensagem)`
- Todos os 30 handlers CRUD (add/update/delete de leads, clients, projects, tasks,
  briefings, approvals, meetings, contracts, transactions) migrados para o padrão
- `convertLeadToClient`: só marca o lead como `cliente` **se** o cliente foi gravado
- `updateApprovalStatus`: toast de aprovado/ajustes só aparece após sucesso

`tsc --noEmit` limpo.
