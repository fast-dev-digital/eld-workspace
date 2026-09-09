# 🚀 Guia de Configuração do Supabase (Plug-and-Play) - ELD Workspace

Este guia explica como conectar o banco de dados oficial do **Supabase** ao **ELD Workspace** em menos de **3 minutos**.

---

## 📋 Passo a Passo Rápido

### Passo 1: Criar o Projeto no Supabase
1. Acesse [https://supabase.com](https://supabase.com) e faça login na sua conta;
2. Clique em **"New Project"**;
3. Preencha o nome do projeto (ex: `eld-workspace`), defina a senha do banco e selecione a região (ex: `Sao Paulo (sa-east-1)`);
4. Aguarde ~1 minuto até a criação do banco finalizar.

---

### Passo 2: Executar o Script de Instalação (1 Clique)
1. No painel do projeto no Supabase, clique no ícone **SQL Editor** no menu lateral esquerdo;
2. Clique em **"New Query"**;
3. Abra o arquivo [`supabase/setup_complete.sql`](./setup_complete.sql) deste repositório, **copie todo o seu conteúdo** e cole no editor do Supabase;
4. Clique no botão verde **"Run"** (no canto inferior direito do editor SQL);
5. ✅ Pronto! Todas as tabelas dos **10 módulos**, políticas de segurança (RLS), triggers de atualização e dados iniciais da ELD estarão criados!

---

### Passo 3: Configurar as Chaves no arquivo `.env`
1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) ➔ **API**;
2. Copie:
   - **Project URL** (ex: `https://xyzabcdef.supabase.co`)
   - **anon / public key** (chave pública)
3. No arquivo `.env` na raiz deste projeto, insira as credenciais:
   ```env
   VITE_SUPABASE_URL=https://xyzabcdef.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Reinicie o servidor local se necessário (`npm run dev`).

---

## 🛡️ O que o Script `setup_complete.sql` instala automaticamente:

| Módulo | Tabela Supabase | O que gerencia |
|---|---|---|
| **01. Comercial / CRM** | `public.leads` | Funil da Jornada Comercial (7 etapas: Lead ➔ Reunião ➔ Briefing ➔ Proposta ➔ Contrato ➔ Pagamento ➔ Cliente) |
| **02. Gestão de Clientes** | `public.clients` & `public.client_services` | Contas ativas, contatos, fee mensal (MRR) e serviços |
| **03. Gestão de Projetos** | `public.projects` | Prazos, evolução %, entregáveis e responsáveis |
| **04. Gestão de Tarefas** | `public.tasks` | 5 etapas do fluxo: Pendente ➔ Produção ➔ Aprovação ➔ Ajustes ➔ Concluído |
| **05. Briefings** | `public.briefings` | Briefings estruturados com objetivos, tom de voz, público e entregáveis |
| **06. Aprovações** | `public.approvals` | Peças em aprovação, versões, links externos e feedbacks |
| **07. Reuniões & Atas** | `public.meetings` | Pautas, atas, participantes e checklist de próximos passos |
| **08. Contratos** | `public.contracts` | Vigências, valores, formato de cobrança e links para PDFs |
| **09. Financeiro** | `public.financial_transactions` | Receitas, despesas, saldo operacional, DRE e metas |
| **Segurança & Usuários** | `public.profiles` & `public.organization_members` | Integração nativa com `auth.users` do Supabase e perfis RBAC |

---

## ⚡ Comportamento Dual-Mode (Standby vs Nuvem)
- **Sem as chaves no `.env`**: O sistema opera no **Modo Standby** sem travar o navegador, utilizando dados de demonstração salvos no `localStorage`.
- **Com as chaves no `.env`**: O sistema detecta a conexão automaticamente, sincroniza todas as leituras e gravações em tempo real diretamente na nuvem do Supabase.
