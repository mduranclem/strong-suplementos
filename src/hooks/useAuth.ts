import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Si en 6 segundos no respondió Supabase, mostrar login igual
    const fallback = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession().then(async ({ data }) => {
      clearTimeout(fallback)
      if (!data.session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('id', data.session.user.id)
        .single()
      setUser(profile ?? null)
      setLoading(false)
    }).catch(() => {
      clearTimeout(fallback)
      setUser(null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) { setUser(null); return }
      const { data: profile } = await supabase
        .from('users').select('id, name, role').eq('id', session.user.id).single()
      setUser(profile ?? null)
    })

    return () => { clearTimeout(fallback); listener.subscription.unsubscribe() }
  }, [setUser, setLoading])
}

export async function signOut() {
  await supabase.auth.signOut()
}
