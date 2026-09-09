# ELD Workspace — MVP

Sistema interno de gestão para agências de marketing integrando Leads, Pipeline Comercial, Follow-ups, Clientes, Projetos, Tarefas, Financeiro Gerencial (Receitas/Despesas/MRR), Alertas e Briefing Inteligente Diário.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18+, TypeScript (modo estrito), Vite, Tailwind CSS (v3).
- **Gerenciamento de Estado & Cache**: TanStack Query (`@tanstack/react-query`).
- **Roteamento**: React Router v6.
- **Formulários & Validação**: React Hook Form + Zod.
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS, Storage).
- **Hospedagem & Deploy**: Firebase Hosting.
- **Ícones & Feedbacks**: Lucide React + Sonner.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar e Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha as credenciais do seu projeto Supabase:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse em: `http://localhost:5173`

---

## 🗄️ Supabase & Banco de Dados

### 1. Executar Migrations no Supabase

As migrations estão localizadas no diretório `supabase/migrations/`:

```bash
# Se utilizar Supabase CLI
supabase db push

# Ou execute o conteúdo SQL de supabase/migrations/20260804000000_initial_schema.sql no SQL Editor do Dashboard Supabase
```

### 2. Executar Seed & Bootstrap da Organização ELD

Execute o arquivo `supabase/seed.sql` no SQL Editor do Supabase para inserir as etapas do pipeline padrão, serviços e categorias financeiras.

Para registrar o primeiro administrador da organização **ELD Workspace**:

```sql
-- Após o usuário criar sua conta via Supabase Auth, execute:
SELECT public.bootstrap_organization(
  'ELD Workspace',
  'eld-agencia',
  'UUID_DO_USUARIO_CRIADO_NO_SUPABASE_AUTH'
);
```

### 3. Regenerar Tipos do TypeScript (`database.types.ts`)

Conforme exigido pelo projeto, execute o seguinte comando sempre que alterar o esquema do banco de dados no Supabase:

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.types.ts
```

---

## 🔒 Matriz de Permissões & Segurança (RLS)

- **Administrador (`admin`)**: Acesso total a todos os módulos, gestão de usuários, financeiro e configurações.
- **Comercial (`comercial`)**: Leads, Pipeline, Follow-ups e Clientes.
- **Operacional (`operacional`)**: Clientes, Projetos, Tarefas e Follow-ups.
- **Financeiro (`financeiro`)**: Módulo Financeiro (Receitas/Despesas/MRR) e Clientes.

---

## 📦 Verificação de Qualidade & Build

```bash
# Checagem estrita de tipos
npm run typecheck # (ou npx tsc --noEmit)

# Linting
npm run lint

# Build de produção
npm run build
```

---

## 🌐 Deploy no Firebase Hosting

```bash
# 1. Compilar projeto
npm run build

# 2. Deploy via Firebase CLI
npx firebase-tools deploy --only hosting
```

---

## 📋 Próximas Fases Recomendadas

1. **FASE 2 — Módulo Comercial**: Implementação das telas interativas de Leads (Kanban com drag-and-drop), Modal de Perda com motivo e execução da RPC `convert_lead_to_client`.
2. **FASE 3 — Módulo Operacional**: Gestão 360º de Clientes, Contratos e Kanban de Projetos com progresso automático.
3. **FASE 4 — Módulo Financeiro Gerencial**: Lançamento de Receitas e Despesas com cálculo de MRR e Previsão de 30 dias.
4. **FASE 5 — Inteligência & Dashboard Executivo**: Motor determinístico `briefingService.ts` e gráficos Recharts.
