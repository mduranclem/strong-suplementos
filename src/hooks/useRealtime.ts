import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Table = 'sales' | 'sale_items' | 'product_variants' | 'commissions' | 'clients'

export function useRealtime(tables: Table[], onUpdate: () => void) {
  useEffect(() => {
    const channels = tables.map((table) =>
      supabase
        .channel(`realtime-${table}-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, onUpdate)
        .subscribe()
    )
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [])
}
