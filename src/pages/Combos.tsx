import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Combo, ComboItem, ProductVariant, Product } from '../types'
import { formatPeso } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

interface VariantWithProduct extends ProductVariant { product: Product }
interface ComboWithItems extends Combo { items: (ComboItem & { variant: VariantWithProduct })[] }

export function CombosPage() {
  const [combos, setCombos] = useState<ComboWithItems[]>([])
  const [allVariants, setAllVariants] = useState<VariantWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editCombo, setEditCombo] = useState<ComboWithItems | null>(null)
  const [saving, setSaving] = useState(false)

  const [cName, setCName] = useState('')
  const [cSalePrice, setCSalePrice] = useState('')
  const [cCostPrice, setCCostPrice] = useState('')
  const [cItems, setCItems] = useState<{ variant_id: string; quantity: number }[]>([{ variant_id: '', quantity: 1 }])

  async function load() {
    setLoading(true)
    const [{ data: combosData }, { data: variantsData }] = await Promise.all([
      supabase.from('combos').select('*, items:combo_items(*, variant:product_variants(*, product:products(*)))').order('name'),
      supabase.from('product_variants').select('*, product:products(*)').order('name'),
    ])
    setCombos((combosData as ComboWithItems[]) ?? [])
    setAllVariants((variantsData as VariantWithProduct[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function calcCostFromItems(): number {
    return cItems.reduce((sum, ci) => {
      const v = allVariants.find((v) => v.id === ci.variant_id)
      return sum + (v?.cost_price ?? 0) * ci.quantity
    }, 0)
  }

  function openNew() {
    setEditCombo(null)
    setCName(''); setCSalePrice(''); setCCostPrice(''); setCItems([{ variant_id: '', quantity: 1 }])
    setModal(true)
  }

  function openEdit(c: ComboWithItems) {
    setEditCombo(c)
    setCName(c.name); setCSalePrice(String(c.sale_price)); setCCostPrice(String(c.cost_price))
    setCItems(c.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })))
    setModal(true)
  }

  function addItem() { setCItems((prev) => [...prev, { variant_id: '', quantity: 1 }]) }
  function removeItem(idx: number) { setCItems((prev) => prev.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: 'variant_id' | 'quantity', val: string | number) {
    setCItems((prev) => prev.map((ci, i) => i === idx ? { ...ci, [field]: val } : ci))
  }

  async function save() {
    if (!cName.trim() || !cSalePrice || cItems.some((i) => !i.variant_id)) return
    setSaving(true)
    const costPrice = parseFloat(cCostPrice) || calcCostFromItems()
    if (editCombo) {
      await supabase.from('combos').update({ name: cName, sale_price: parseFloat(cSalePrice), cost_price: costPrice }).eq('id', editCombo.id)
      await supabase.from('combo_items').delete().eq('combo_id', editCombo.id)
      await supabase.from('combo_items').insert(cItems.map((ci) => ({ combo_id: editCombo.id, ...ci })))
    } else {
      const { data: newCombo } = await supabase.from('combos').insert({ name: cName, sale_price: parseFloat(cSalePrice), cost_price: costPrice }).select().single()
      if (newCombo) {
        await supabase.from('combo_items').insert(cItems.map((ci) => ({ combo_id: (newCombo as Combo).id, ...ci })))
      }
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function deleteCombo(id: string) {
    if (!confirm('¿Eliminar combo?')) return
    await supabase.from('combos').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <PageHeader title="Combos" action={<Button size="sm" onClick={openNew}>+ Combo</Button>} />

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="p-4 space-y-3">
          {combos.map((combo) => (
            <div key={combo.id} className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{combo.name}</p>
                  <p className="text-brand font-semibold mt-0.5">{formatPeso(combo.sale_price)}</p>
                  <p className="text-sm text-gray-500">Costo: {formatPeso(combo.cost_price)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(combo)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600 active:bg-gray-50" aria-label="Editar">✏️</button>
                  <button onClick={() => deleteCombo(combo.id)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-200 text-red-500 active:bg-red-50" aria-label="Eliminar">🗑</button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {combo.items.map((item) => (
                  <div key={item.id} className="text-sm text-gray-600">
                    · {item.quantity}x {item.variant.product.name}{item.variant.name !== 'Único' ? ` (${item.variant.name})` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {combos.length === 0 && <p className="text-center text-gray-400 py-10">No hay combos creados</p>}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editCombo ? 'Editar combo' : 'Nuevo combo'}
        footer={<Button fullWidth loading={saving} onClick={save}>{editCombo ? 'Guardar cambios' : 'Crear combo'}</Button>}
      >
        <Input label="Nombre del combo" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Ej: Combo Definición" />
        <Input label="Precio de venta ($)" type="number" value={cSalePrice} onChange={(e) => setCSalePrice(e.target.value)} inputMode="numeric" />
        <Input
          label={`Precio de costo ($ — automático: ${formatPeso(calcCostFromItems())})`}
          type="number"
          value={cCostPrice}
          onChange={(e) => setCCostPrice(e.target.value)}
          placeholder={String(Math.round(calcCostFromItems()))}
          inputMode="numeric"
        />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Productos del combo</p>
          {cItems.map((ci, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <select
                value={ci.variant_id}
                onChange={(e) => updateItem(idx, 'variant_id', e.target.value)}
                className="flex-1 h-12 rounded-xl border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                aria-label="Variante"
              >
                <option value="">Seleccionar...</option>
                {allVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product.name}{v.name !== 'Único' ? ` (${v.name})` : ''} — {formatPeso(v.sale_price)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={ci.quantity}
                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                className="w-16 h-12 rounded-xl border border-border bg-white px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand"
                aria-label="Cantidad"
              />
              {cItems.length > 1 && (
                <button onClick={() => removeItem(idx)} className="h-12 w-12 rounded-xl border border-red-200 text-red-500 active:bg-red-50" aria-label="Quitar">✕</button>
              )}
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-brand font-medium py-2">+ Agregar producto</button>
        </div>
      </Modal>
    </div>
  )
}
