import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatPeso, formatDateTime } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/authStore'
import { useRealtime } from '../hooks/useRealtime'

interface SaleRow {
  id: string
  total: number
  status: 'confirmed' | 'cancelled'
  created_at: string
  delivered_by: string
  has_delivery: boolean
  client: { name: string } | null
  seller: { name: string } | null
  items: { id: string; quantity: number; unit_price: number; is_combo: boolean; variant: { name: string; product: { name: string } } | null; combo: { name: string } | null }[]
}

export function HistorialPage() {
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'owner'
  const [sales, setSales] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('sales')
      .select(`
        id, total, status, created_at, delivered_by, has_delivery,
        client:clients(name),
        seller:users(name),
        items:sale_items(
          id, quantity, unit_price, is_combo,
          variant:product_variants(name, product:products(name)),
          combo:combos(name)
        )
      `)
      .gte('created_at', `${dateFilter}T00:00:00`)
      .lte('created_at', `${dateFilter}T23:59:59`)
      .order('created_at', { ascending: false })

    if (!isOwner) query = query.eq('seller_id', user!.id)

    const { data } = await query
    setSales((data as unknown as SaleRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [dateFilter])
  useRealtime(['sales', 'sale_items'], load)

  async function cancelSale(saleId: string) {
    if (!confirm('¿Anular esta venta? El stock se restaurará automáticamente.')) return
    setCancelling(saleId)
    await supabase.from('sales').update({ status: 'cancelled' }).eq('id', saleId)
    // Mark commissions as void (delete pending ones)
    await supabase.from('commissions').delete().eq('sale_id', saleId).eq('paid', false)
    setCancelling(null)
    load()
  }

  const dailyTotal = sales.filter((s) => s.status === 'confirmed').reduce((sum, s) => sum + s.total, 0)

  return (
    <div>
      <PageHeader title="Historial de ventas" />

      <div className="px-4 pt-4 pb-3 space-y-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Filtrar por fecha"
        />
        {!loading && (
          <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border">
            <span className="text-gray-600 text-sm">{sales.filter((s) => s.status === 'confirmed').length} ventas</span>
            <span className="font-bold text-gray-900">{formatPeso(dailyTotal)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="divide-y divide-border">
          {sales.map((sale) => (
            <div key={sale.id}>
              <button
                onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                className={`w-full flex items-center justify-between px-4 py-4 active:bg-surface text-left ${sale.status === 'cancelled' ? 'opacity-50' : ''}`}
                aria-expanded={expanded === sale.id}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{sale.client?.name ?? 'Sin nombre'}</span>
                    {sale.status === 'cancelled' && <Badge color="red">ANULADA</Badge>}
                    {sale.has_delivery && <Badge color="blue">Envío</Badge>}
                    {sale.delivered_by === 'pocho' && <Badge color="gray">Pocho</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(sale.created_at)}</p>
                  {isOwner && sale.seller && (
                    <p className="text-xs text-gray-400">{sale.seller.name}</p>
                  )}
                </div>
                <div className="text-right ml-3">
                  <p className={`font-bold text-lg ${sale.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {formatPeso(sale.total)}
                  </p>
                  <p className="text-gray-400 text-sm">{expanded === sale.id ? '▴' : '▾'}</p>
                </div>
              </button>

              {expanded === sale.id && (
                <div className="bg-surface px-4 pb-4 space-y-3">
                  <div className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {item.combo
                              ? item.combo.name
                              : item.variant
                                ? `${item.variant.product.name}${item.variant.name !== 'Único' ? ` (${item.variant.name})` : ''}`
                                : 'Producto'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{item.quantity}x {formatPeso(item.unit_price)}</span>
                            {item.is_combo && <Badge color="orange">COMBO</Badge>}
                          </div>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{formatPeso(item.unit_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {sale.status === 'confirmed' && (
                    <Button
                      variant="danger"
                      fullWidth
                      size="sm"
                      loading={cancelling === sale.id}
                      onClick={() => cancelSale(sale.id)}
                    >
                      Anular venta
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          {sales.length === 0 && (
            <p className="text-center text-gray-400 py-12">No hay ventas en esta fecha</p>
          )}
        </div>
      )}
    </div>
  )
}
