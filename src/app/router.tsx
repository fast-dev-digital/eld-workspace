import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CRMPage } from '@/features/crm/CRMPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { BriefingsPage } from '@/features/briefings/BriefingsPage'
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage'
import { MeetingsPage } from '@/features/meetings/MeetingsPage'
import { ContractsPage } from '@/features/contracts/ContractsPage'
import { FinancialPage } from '@/features/financial/FinancialPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      // Dashboard & Indicadores
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      // Comercial / CRM
      {
        path: 'crm',
        element: <CRMPage />,
      },
      {
        path: 'leads',
        element: <Navigate to="/crm" replace />,
      },
      {
        path: 'pipeline',
        element: <Navigate to="/crm" replace />,
      },
      // Gestão de Clientes
      {
        path: 'clientes',
        element: <ClientsPage />,
      },
      // Gestão de Projetos
      {
        path: 'projetos',
        element: <ProjectsPage />,
      },
      // Gestão de Tarefas
      {
        path: 'tarefas',
        element: <TasksPage />,
      },
      // Briefings
      {
        path: 'briefings',
        element: <BriefingsPage />,
      },
      {
        path: 'briefing',
        element: <Navigate to="/briefings" replace />,
      },
      // Aprovações e Entregas
      {
        path: 'aprovacoes',
        element: <ApprovalsPage />,
      },
      // Reuniões & Atas
      {
        path: 'reunioes',
        element: <MeetingsPage />,
      },
      {
        path: 'follow-ups',
        element: <Navigate to="/reunioes" replace />,
      },
      {
        path: 'alertas',
        element: <Navigate to="/dashboard" replace />,
      },
      // Contratos e Documentos
      {
        path: 'contratos',
        element: <ContractsPage />,
      },
      // Financeiro
      {
        path: 'financeiro',
        element: <FinancialPage />,
      },
      {
        path: 'financeiro/receitas',
        element: <Navigate to="/financeiro" replace />,
      },
      {
        path: 'financeiro/despesas',
        element: <Navigate to="/financeiro" replace />,
      },
      // Sistema / Configurações
      {
        path: 'configuracoes',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
