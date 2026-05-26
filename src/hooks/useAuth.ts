import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 6000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(fallback)
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('users').select('id, name, role').eq('id', session.user.id).single()
      setUser(profile ?? null)
      setLoading(false)
    })

    return () => { clearTimeout(fallback); subscription.unsubscribe() }
  }, [setUser, setLoading])
}

export async function signOut() {
  await supabase.auth.signOut()
}
