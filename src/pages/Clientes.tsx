import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Client, Sale } from '../types'
import { formatPeso, formatDateTime } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'

interface ClientWithSales extends Client {
  sales: (Sale & { items_count: number })[]
}

export function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClientWithSales | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => {
      setClients((data as Client[]) ?? [])
      setLoading(false)
    })
  }, [])

  async function openClient(c: Client) {
    const { data } = await supabase
      .from('sales')
      .select('*, items:sale_items(count)')
      .eq('client_id', c.id)
      .order('created_at', { ascending: false })
    setSelected({ ...c, sales: (data ?? []).map((s: any) => ({ ...s, items_count: s.items?.[0]?.count ?? 0 })) } as ClientWithSales)
  }

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  if (selected) {
    const totalSpent = selected.sales.filter((s) => s.status === 'confirmed').reduce((sum, s) => sum + s.total, 0)
    return (
      <div>
        <div className="sticky top-0 bg-white border-b border-border px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600" aria-label="Volver">←</button>
          <h1 className="font-bold text-gray-900 text-lg">{selected.name}</h1>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-900 text-white rounded-2xl p-4">
            <p className="text-gray-400 text-sm">Total comprado</p>
            <p className="text-3xl font-extrabold">{formatPeso(totalSpent)}</p>
            <p className="text-gray-400 text-sm mt-1">{selected.sales.length} compras</p>
            {selected.phone && <p className="text-gray-300 mt-2 text-sm">📞 {selected.phone}</p>}
          </div>

          <p className="font-semibold text-gray-900">Historial de compras</p>
          <div className="space-y-2">
            {selected.sales.map((sale) => (
              <div key={sale.id} className={`bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between ${sale.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <div>
                  <p className="text-sm text-gray-500">{formatDateTime(sale.created_at)}</p>
                  {sale.status === 'cancelled' && <p className="text-xs text-red-500 font-semibold">ANULADA</p>}
                </div>
                <span className={`font-bold ${sale.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{formatPeso(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Clientes" />
      <div className="p-4">
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar cliente" />
      </div>
      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => openClient(c)} className="w-full flex items-center justify-between px-4 py-4 active:bg-surface text-left">
              <div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 py-10">No hay clientes</p>}
        </div>
      )}
    </div>
  )
}
