import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { CommissionPerson } from '../types'
import { formatPeso, formatDateTime } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/authStore'

interface CommissionWithSale {
  id: string
  person: CommissionPerson
  sale_id: string
  amount: number
  paid: boolean
  paid_at: string | null
  created_at: string
  sale: {
    id: string
    total: number
    created_at: string
    client: { name: string } | null
  }
}

export function ComisionesPage() {
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'owner'
  const [tab, setTab] = useState<CommissionPerson>('pri')
  const [pending, setPending] = useState<CommissionWithSale[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  async function load() {
    setLoading(true)
    const person = isOwner ? tab : 'pri'
    const { data } = await supabase
      .from('commissions')
      .select('*, sale:sales(id, total, created_at, client:clients(name))')
      .eq('person', person)
      .eq('paid', false)
      .order('created_at', { ascending: false })
    setPending((data as CommissionWithSale[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  const totalPending = pending.reduce((s, c) => s + c.amount, 0)

  async function markAllPaid() {
    if (!confirm(`¿Marcar ${formatPeso(totalPending)} como pagado?`)) return
    setPaying(true)
    const ids = pending.map((c) => c.id)
    await supabase.from('commissions').update({ paid: true, paid_at: new Date().toISOString() }).in('id', ids)
    await supabase.from('commission_payments').insert({ person: isOwner ? tab : 'pri', amount: totalPending, date: new Date().toISOString().split('T')[0] })
    setPaying(false)
    load()
  }

  return (
    <div>
      <PageHeader title="Comisiones" />

      {isOwner && (
        <div className="flex border-b border-border">
          {(['pri', 'pocho'] as CommissionPerson[]).map((p) => (
            <button
              key={p}
              onClick={() => setTab(p)}
              className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === p ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
            >
              {p === 'pri' ? 'Pri' : 'Pocho'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div>
          <div className="px-4 py-4 flex items-center justify-between bg-surface border-b border-border">
            <div>
              <p className="text-sm text-gray-500">Pendiente de cobro</p>
              <p className="text-3xl font-extrabold text-gray-900">{formatPeso(totalPending)}</p>
            </div>
            {isOwner && pending.length > 0 && (
              <Button size="sm" onClick={markAllPaid} loading={paying}>Marcar pagado</Button>
            )}
          </div>

          <div className="divide-y divide-border">
            {pending.map((c) => (
              <div key={c.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{c.sale.client?.name ?? 'Sin nombre'}</p>
                    <p className="text-sm text-gray-500">{formatDateTime(c.sale.created_at)}</p>
                    <p className="text-sm text-gray-500">Venta: {formatPeso(c.sale.total)}</p>
                  </div>
                  <span className="font-bold text-brand text-lg">+{formatPeso(c.amount)}</span>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="text-center text-gray-400 py-12">No hay comisiones pendientes</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
