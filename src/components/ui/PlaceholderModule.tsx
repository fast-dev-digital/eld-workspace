import React from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface PlaceholderModuleProps {
  title: string
  category: string
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ title, category }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Módulo de {category} do ELD Workspace</p>
      </div>
      <Badge variant="blue">{category}</Badge>
    </div>
    <Card className="p-8 text-center space-y-2">
      <h3 className="text-base font-semibold text-zinc-800">Módulo Mapeado e Pronto para Dados Supabase</h3>
      <p className="text-xs text-zinc-500 max-w-md mx-auto">
        A fundação da arquitetura, RLS, esquema de banco e layout SaaS estão plenamente ativos.
      </p>
    </Card>
  </div>
)
