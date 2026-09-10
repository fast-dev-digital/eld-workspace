-- ============================================================
-- Índices de cobertura para foreign keys + índices do dashboard
-- Motivado pelo teste de carga (docs/teste-de-carga.md) e pelo
-- advisor de performance do Supabase (unindexed_foreign_keys, 22 ocorrências).
--
-- Sem risco para o app: todos NÃO-únicos, transparentes para SELECT/JOIN/FK-check.
-- As regras ON DELETE (CASCADE / SET NULL) já existem na migration inicial e
-- NÃO são alteradas aqui.
-- ============================================================

-- --- FKs sem índice de cobertura ---
CREATE INDEX IF NOT EXISTS idx_leads_organization_id       ON leads (organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_converted_client_id   ON leads (converted_client_id);
CREATE INDEX IF NOT EXISTS idx_clients_organization_id      ON clients (organization_id);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id    ON client_services (client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_org_id       ON client_services (organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id           ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id     ON projects (organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id              ON tasks (client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id             ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id        ON tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_briefings_client_id          ON briefings (client_id);
CREATE INDEX IF NOT EXISTS idx_briefings_project_id         ON briefings (project_id);
CREATE INDEX IF NOT EXISTS idx_briefings_organization_id    ON briefings (organization_id);
CREATE INDEX IF NOT EXISTS idx_approvals_client_id          ON approvals (client_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project_id         ON approvals (project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_organization_id    ON approvals (organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id          ON contracts (client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organization_id    ON contracts (organization_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_client_id             ON financial_transactions (client_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_organization_id       ON financial_transactions (organization_id);
CREATE INDEX IF NOT EXISTS idx_meetings_organization_id     ON meetings (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id          ON organization_members (user_id);

-- --- Índices compostos p/ ordenações e filtros do dashboard ---
-- fetchAllData: tasks ordenadas por due_date; indicador de tarefas atrasadas
CREATE INDEX IF NOT EXISTS idx_tasks_org_due_date           ON tasks (organization_id, due_date);
-- fetchAllData: financial_transactions ordenadas por due_date desc; filtro de período
CREATE INDEX IF NOT EXISTS idx_fin_tx_org_due_date          ON financial_transactions (organization_id, due_date DESC);
-- Meta financeira: sum(value) where type/status/competence_date
CREATE INDEX IF NOT EXISTS idx_fin_tx_org_goal              ON financial_transactions (organization_id, type, status, competence_date);
-- fetchAllData: leads e projects ordenados por created_at desc
CREATE INDEX IF NOT EXISTS idx_leads_org_created            ON leads (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_org_created         ON projects (organization_id, created_at DESC);
-- fetchAllData: meetings ordenadas por date_time
CREATE INDEX IF NOT EXISTS idx_meetings_org_date_time       ON meetings (organization_id, date_time);
