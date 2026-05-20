import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error || !data.session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, role')
          .eq('id', data.session.user.id)
          .single()
        setUser(profile ?? null)
      } catch {
        setUser(null)
      }
      setLoading(false)
    }).catch(() => {
      setUser(null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null)
        return
      }
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, role')
          .eq('id', session.user.id)
          .single()
        setUser(profile ?? null)
      } catch {
        setUser(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setLoading])
}

export async function signOut() {
  await supabase.auth.signOut()
}
