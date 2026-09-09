import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { WorkspaceProvider } from '@/context/WorkspaceContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface AppProvidersProps {
  children: React.ReactNode
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </WorkspaceProvider>
    </QueryClientProvider>
  )
}
