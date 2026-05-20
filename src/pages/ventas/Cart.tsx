import { useState } from 'react'
import { useCartStore } from '../../stores/cartStore'
import type { CartItem } from '../../types'
import { formatPeso } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

interface Props {
  onCheckout: () => void
}

export function Cart({ onCheckout }: Props) {
  const { items, removeItem, updateQuantity, groupAsCombo, ungroupCombo, total } = useCartStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [comboModal, setComboModal] = useState(false)
  const [comboPrice, setComboPrice] = useState('')

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleGroup() {
    if (selected.size < 2) return alert('Seleccioná al menos 2 productos para armar un combo')
    setComboModal(true)
  }

  function confirmGroup() {
    const price = parseFloat(comboPrice)
    if (!price || price <= 0) return
    groupAsCombo(Array.from(selected), price)
    setSelected(new Set())
    setComboPrice('')
    setComboModal(false)
  }

  // Group items by combo_group_id for display
  const comboGroups = new Map<string, CartItem[]>()
  const standalone: CartItem[] = []
  for (const item of items) {
    if (item.combo_group_id) {
      const group = comboGroups.get(item.combo_group_id) ?? []
      group.push(item)
      comboGroups.set(item.combo_group_id, group)
    } else {
      standalone.push(item)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
        <div className="text-5xl mb-4" aria-hidden="true">🛒</div>
        <p className="text-gray-500">El carrito está vacío</p>
        <p className="text-sm text-gray-400 mt-1">Tocá "Agregar" para comenzar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-brand text-white px-4 py-3 flex items-center justify-between">
          <span className="font-medium">{selected.size} seleccionados</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="text-sm underline">Cancelar</button>
            <button onClick={handleGroup} className="bg-white text-brand font-semibold px-3 py-1.5 rounded-lg text-sm">Armar combo</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {/* Combo groups */}
        {Array.from(comboGroups.entries()).map(([groupId, groupItems]) => (
          <div key={groupId} className="bg-orange-50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <Badge color="orange">COMBO</Badge>
              <div className="flex items-center gap-2">
                <span className="font-bold text-brand">{formatPeso(groupItems[0].combo_price ?? 0)}</span>
                <button onClick={() => ungroupCombo(groupId)} className="text-xs text-gray-500 underline">Desagrupar</button>
              </div>
            </div>
            {groupItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <p className="text-sm text-gray-700">{item.name}{item.variantName ? ` (${item.variantName})` : ''}</p>
                <button onClick={() => removeItem(item.id)} className="text-red-400 text-sm px-2 py-1" aria-label="Quitar">✕</button>
              </div>
            ))}
          </div>
        ))}

        {/* Standalone items */}
        {standalone.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${selected.has(item.id) ? 'bg-blue-50' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggleSelect(item.id)}
              className="h-5 w-5 rounded border-border accent-brand"
              aria-label={`Seleccionar ${item.name}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}{item.variantName ? ` (${item.variantName})` : ''}</p>
              {item.is_combo && <Badge color="orange">COMBO</Badge>}
              <p className="text-sm text-brand font-semibold">{formatPeso(item.unit_price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="h-9 w-9 flex items-center justify-center rounded-xl border border-border text-gray-700 active:bg-gray-100 font-bold" aria-label="Menos">−</button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-9 w-9 flex items-center justify-center rounded-xl border border-border text-gray-700 active:bg-gray-100 font-bold" aria-label="Más">+</button>
              <button onClick={() => removeItem(item.id)} className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-200 text-red-500 active:bg-red-50 ml-1" aria-label="Quitar">✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-extrabold text-gray-900">{formatPeso(total())}</span>
        </div>
        <Button fullWidth size="lg" onClick={onCheckout}>Confirmar venta →</Button>
      </div>

      {comboModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Precio del combo</h2>
            <p className="text-sm text-gray-500">Ingresá el precio total para los {selected.size} productos seleccionados</p>
            <Input
              label="Precio del combo ($)"
              type="number"
              value={comboPrice}
              onChange={(e) => setComboPrice(e.target.value)}
              inputMode="numeric"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setComboModal(false)}>Cancelar</Button>
              <Button fullWidth onClick={confirmGroup}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
