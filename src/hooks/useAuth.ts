import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database.types'

export interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  organizationId: string | null
  organizationName: string | null
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'admin',
    organizationId: null,
    organizationName: 'ELD Workspace',
    isLoading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserRoleAndOrg(session)
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserRoleAndOrg(session)
      } else {
        setAuthState({
          user: null,
          session: null,
          role: null,
          organizationId: null,
          organizationName: null,
          isLoading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRoleAndOrg = async (session: Session) => {
    try {
      const { data: rawMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', session.user.id)

      const member = rawMember && rawMember.length > 0 ? (rawMember[0] as any) : null

      if (member) {
        const { data: rawOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', member.organization_id)

        const org = rawOrg && rawOrg.length > 0 ? (rawOrg[0] as any) : null

        setAuthState({
          user: session.user,
          session,
          role: (member.role as UserRole) || 'admin',
          organizationId: member.organization_id,
          organizationName: org?.name || 'ELD Workspace',
          isLoading: false,
        })
      } else {
        setAuthState({
          user: session.user,
          session,
          role: 'admin',
          organizationId: null,
          organizationName: 'ELD Workspace',
          isLoading: false,
        })
      }
    } catch {
      setAuthState({
        user: session.user,
        session,
        role: 'admin',
        organizationId: null,
        organizationName: 'ELD Workspace',
        isLoading: false,
      })
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return {
    ...authState,
    logout,
  }
}
