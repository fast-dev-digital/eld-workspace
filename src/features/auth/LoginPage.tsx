import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ELDLogo } from '@/components/ui/ELDLogo'
import { useWorkspace } from '@/context/WorkspaceContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setCurrentUser } = useWorkspace()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickLogin = () => {
    setCurrentUser({
      name: 'Diretoria Executiva',
      email: 'admin@eld.agencia',
      role: 'admin',
    })
    toast.success('Bem-vindo ao ELD Workspace! Acesso concedido com sucesso.')
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseConfigured) {
      setCurrentUser({
        name: email.split('@')[0] || 'Gestor ELD',
        email: email || 'admin@eld.agencia',
        role: 'admin',
      })
      toast.success('Login efetuado no ELD Workspace!')
      navigate('/dashboard')
      return
    }

    if (!email || !password) {
      toast.error('Informe e-mail e senha para continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          toast.error(error.message)
          return
        }
        toast.success('Conta criada! Verifique seu e-mail se a confirmação estiver ativa, ou faça login.')
        setMode('login')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Login efetuado no ELD Workspace!')
      navigate('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Highlights */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
            <ELDLogo variant="white" size="lg" showSubtitle subtitle="WORKSPACE" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Painel Operacional</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Central de gestão comercial, projetos, entregas e finanças da ELD
            </p>
          </div>
        </div>

        {/* Access Card */}
        <Card className="shadow-2xl border-zinc-800 bg-zinc-900 text-white p-6 sm:p-8 space-y-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="seu.nome@eld.agencia"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500"
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-xs hover:shadow-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              disabled={isSubmitting}
            >
              {mode === 'signup' ? 'Criar Conta' : 'Entrar no Workspace'}
            </Button>
          </form>

          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {mode === 'login' ? 'Não tem conta? Criar uma agora' : 'Já tem conta? Fazer login'}
            </button>
          )}

          {!isSupabaseConfigured && (
            <>
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase tracking-widest absolute">
                  ou acesso direto
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs"
                onClick={handleQuickLogin}
              >
                Acessar com Perfil Centralizado (Diretoria)
              </Button>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1 text-xs text-zinc-500">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>ELD Workspace • Sistema Integrado de Operação</span>
          </div>
          <p className="text-[11px] text-zinc-600">
            Versão 1.0 • Sistema Integrado de Gestão
          </p>
        </div>
      </div>
    </div>
  )
}
