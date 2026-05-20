import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatPeso } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'

interface DayReport {
  income: number
  cogs: number
  commPri: number
  commPocho: number
  netProfit: number
  salesCount: number
}

interface TopItem { name: string; count: number }

export function ReportesPage() {
  const [tab, setTab] = useState<'day' | 'month'>('day')
  const [report, setReport] = useState<DayReport | null>(null)
  const [topProducts, setTopProducts] = useState<TopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  async function loadReport() {
    setLoading(true)

    const start = tab === 'day' ? `${selectedDate}T00:00:00` : `${selectedMonth}-01T00:00:00`
    const end = tab === 'day'
      ? `${selectedDate}T23:59:59`
      : `${selectedMonth}-31T23:59:59`

    const { data: sales } = await supabase
      .from('sales')
      .select('id, total, items:sale_items(unit_price, quantity, is_combo, combo_group_id, variant:product_variants(cost_price, product:products(name)))')
      .eq('status', 'confirmed')
      .gte('created_at', start)
      .lte('created_at', end)

    const { data: comms } = await supabase
      .from('commissions')
      .select('person, amount, sale_id')
      .in('sale_id', (sales ?? []).map((s: any) => s.id))

    const income = (sales ?? []).reduce((s: number, sale: any) => s + sale.total, 0)
    const cogs = (sales ?? []).reduce((s: number, sale: any) =>
      s + (sale.items ?? []).reduce((ss: number, item: any) => ss + (item.variant?.cost_price ?? 0) * item.quantity, 0), 0)
    const commPri = (comms ?? []).filter((c: any) => c.person === 'pri').reduce((s: number, c: any) => s + c.amount, 0)
    const commPocho = (comms ?? []).filter((c: any) => c.person === 'pocho').reduce((s: number, c: any) => s + c.amount, 0)

    setReport({ income, cogs, commPri, commPocho, netProfit: income - cogs - commPri - commPocho, salesCount: (sales ?? []).length })

    // Top products
    const productCounts: Record<string, number> = {}
    for (const sale of (sales ?? [])) {
      for (const item of (sale as any).items ?? []) {
        const name = item.variant?.product?.name ?? 'Desconocido'
        productCounts[name] = (productCounts[name] ?? 0) + item.quantity
      }
    }
    setTopProducts(Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })))

    setLoading(false)
  }

  useEffect(() => { loadReport() }, [tab, selectedDate, selectedMonth])

  return (
    <div>
      <PageHeader title="Reportes" />

      <div className="flex border-b border-border">
        {(['day', 'month'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-4 font-semibold text-sm transition-colors ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}>
            {t === 'day' ? 'Hoy' : 'Este mes'}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === 'day' ? (
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
        ) : (
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-brand" />
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Calculando...</p>
      ) : report ? (
        <div className="p-4 space-y-3">
          <div className="bg-gray-900 text-white rounded-2xl p-5">
            <p className="text-gray-400 text-sm">Ganancia neta</p>
            <p className="text-4xl font-extrabold mt-1">{formatPeso(report.netProfit)}</p>
            <p className="text-gray-400 text-sm mt-2">{report.salesCount} ventas</p>
          </div>

          {[
            { label: 'Ingresos totales', value: report.income, color: 'text-green-600' },
            { label: 'Costo de productos', value: -report.cogs, color: 'text-red-500' },
            { label: 'Comisión Pri', value: -report.commPri, color: 'text-red-500' },
            { label: 'Comisión Pocho', value: -report.commPocho, color: 'text-red-500' },
          ].map((row) => (
            <div key={row.label} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <span className="text-gray-700">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.value >= 0 ? '' : '−'}{formatPeso(Math.abs(row.value))}</span>
            </div>
          ))}

          {topProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-4">
              <p className="font-bold text-gray-900 mb-3">Productos más vendidos</p>
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-4">{i + 1}</span>
                    <span className="text-gray-900">{p.name}</span>
                  </div>
                  <span className="font-semibold text-gray-700">{p.count} unid.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
