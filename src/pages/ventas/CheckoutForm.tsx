import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Client, DeliveryType } from '../../types'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { formatPeso } from '../../lib/format'
import { buildPochoMessage, buildCadeteMessage, openPochoWhatsApp, openCadeteWhatsApp } from '../../lib/whatsapp'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

interface Props {
  onBack: () => void
  onSuccess: () => void
}

export function CheckoutForm({ onBack, onSuccess }: Props) {
  const cart = useCartStore()
  const user = useAuthStore((s) => s.user)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ saleId: string; pochoMsg: string; cadeteMsg: string } | null>(null)
  const [pochoGroupLink, setPochoGroupLink] = useState('')
  const [cadeteNumber, setCadeteNumber] = useState('')

  // Delivery form
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliverySchedule, setDeliverySchedule] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [deliveryClientName, setDeliveryClientName] = useState('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('ida')
  const [deliveryShipping, setDeliveryShipping] = useState('')

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients((data as Client[]) ?? []))
    supabase.from('settings').select('key, value').in('key', ['pocho_whatsapp_group', 'cadete_whatsapp_number']).then(({ data }) => {
      if (data) {
        const map = Object.fromEntries((data as { key: string; value: string }[]).map((r) => [r.key, r.value]))
        setPochoGroupLink(map.pocho_whatsapp_group ?? '')
        setCadeteNumber(map.cadete_whatsapp_number ?? '')
      }
    })
  }, [])

  function handleClientNameChange(val: string) {
    cart.setClientName(val)
    cart.setClientId(null)
    if (val.length > 0) {
      setClientSuggestions(clients.filter((c) => c.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5))
    } else {
      setClientSuggestions([])
    }
  }

  function selectClient(c: Client) {
    cart.setClientName(c.name)
    cart.setClientId(c.id)
    setDeliveryClientName(c.name)
    setClientSuggestions([])
  }

  async function handleConfirm() {
    if (!cart.clientName.trim()) return alert('Ingresá el nombre del cliente')
    if (cart.hasDelivery && !deliveryAddress.trim()) return alert('Completá la dirección de envío')
    setSaving(true)

    // Resolve or create client
    let clientId = cart.clientId
    if (!clientId) {
      const { data: existing } = await supabase.from('clients').select('id').ilike('name', cart.clientName.trim()).single()
      if (existing) {
        clientId = (existing as { id: string }).id
      } else {
        const { data: newClient } = await supabase.from('clients').insert({ name: cart.clientName.trim() }).select('id').single()
        clientId = (newClient as { id: string }).id
      }
    }

    // Get commission settings
    const { data: settingsData } = await supabase.from('settings').select('key, value').in('key', ['commission_pri_product', 'commission_pri_combo', 'commission_pocho'])
    const settings = Object.fromEntries((settingsData as { key: string; value: string }[] ?? []).map((r) => [r.key, parseFloat(r.value)]))
    const commPriProduct = settings.commission_pri_product ?? 2000
    const commPriCombo = settings.commission_pri_combo ?? 2500
    const commPocho = settings.commission_pocho ?? 1000

    // Create sale
    const { data: saleData, error: saleError } = await supabase.from('sales').insert({
      client_id: clientId,
      seller_id: user!.id,
      delivered_by: cart.deliveredBy,
      has_delivery: cart.hasDelivery,
      total: cart.total(),
      status: 'confirmed',
    }).select().single()

    if (saleError || !saleData) { setSaving(false); alert('Error al guardar la venta'); return }
    const sale = saleData as { id: string }

    // Create sale items
    const saleItems = cart.items.map((item) => ({
      sale_id: sale.id,
      variant_id: item.variant_id ?? null,
      combo_id: item.combo_id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      is_combo: item.is_combo,
      combo_group_id: item.combo_group_id ?? null,
      combo_price: item.combo_price ?? null,
    }))
    await supabase.from('sale_items').insert(saleItems)

    // Decrement stock for each variant
    for (const item of cart.items) {
      if (item.variant_id) {
        await supabase.rpc('decrement_stock', { variant_id: item.variant_id, qty: item.quantity })
      }
    }

    // Create delivery if needed
    if (cart.hasDelivery) {
      await supabase.from('deliveries').insert({
        sale_id: sale.id,
        address: deliveryAddress,
        schedule: deliverySchedule,
        phone: deliveryPhone,
        client_name: deliveryClientName || cart.clientName,
        type: deliveryType,
        shipping_cost: parseFloat(deliveryShipping) || 0,
      })
    }

    // Calculate commissions
    const commissions: { person: string; sale_id: string; amount: number }[] = []
    const countedGroups = new Set<string>()
    for (const item of cart.items) {
      if (item.is_combo) {
        const groupKey = item.combo_group_id ?? item.id
        if (!countedGroups.has(groupKey)) {
          countedGroups.add(groupKey)
          commissions.push({ person: 'pri', sale_id: sale.id, amount: commPriCombo })
        }
      } else {
        commissions.push({ person: 'pri', sale_id: sale.id, amount: commPriProduct })
      }
    }
    if (cart.deliveredBy === 'pocho') {
      commissions.push({ person: 'pocho', sale_id: sale.id, amount: commPocho })
    }
    if (commissions.length > 0) await supabase.from('commissions').insert(commissions)

    // Build whatsapp messages
    const fullSale = { id: sale.id, client: { id: clientId!, name: cart.clientName }, seller_id: user!.id, delivered_by: cart.deliveredBy, has_delivery: cart.hasDelivery, total: cart.total(), status: 'confirmed' as const, created_at: new Date().toISOString() }
    const pochoMsg = cart.deliveredBy === 'pocho' ? buildPochoMessage(fullSale as any, cart.items.map((i) => ({ ...i, variant: { product: { name: i.name } }, combo: i.combo_id ? { name: i.name } : undefined } as any))) : ''
    const cadeteMsg = cart.hasDelivery ? buildCadeteMessage({ id: '', sale_id: sale.id, address: deliveryAddress, schedule: deliverySchedule, phone: deliveryPhone, client_name: deliveryClientName || cart.clientName, type: deliveryType, shipping_cost: parseFloat(deliveryShipping) || 0 }) : ''

    setSaving(false)
    setDone({ saleId: sale.id, pochoMsg, cadeteMsg })
  }

  if (done) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">¡Venta registrada!</h2>
          <p className="text-gray-500 mt-1">{formatPeso(cart.total())}</p>
        </div>

        {done.pochoMsg && (
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => openPochoWhatsApp(pochoGroupLink, done.pochoMsg)}
          >
            📲 Enviar a Pocho
          </Button>
        )}

        {done.cadeteMsg && (
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => openCadeteWhatsApp(cadeteNumber, done.cadeteMsg)}
          >
            🛵 Enviar al cadete
          </Button>
        )}

        <Button fullWidth size="lg" onClick={() => { cart.clear(); onSuccess() }}>
          Nueva venta
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="text-right text-2xl font-extrabold text-gray-900">
          Total: {formatPeso(cart.total())}
        </div>

        {/* Client */}
        <div className="relative">
          <Input
            label="Cliente"
            value={cart.clientName}
            onChange={(e) => handleClientNameChange(e.target.value)}
            placeholder="Nombre del cliente"
            autoComplete="off"
          />
          {clientSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 bg-white border border-border rounded-xl shadow-lg overflow-hidden mt-1">
              {clientSuggestions.map((c) => (
                <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left px-4 py-3 active:bg-surface border-b border-border last:border-0">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delivered by */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">¿Quién entrega?</p>
          <div className="flex gap-3">
            {(['pocho', 'owner'] as const).map((v) => (
              <button
                key={v}
                onClick={() => cart.setDeliveredBy(v)}
                className={`flex-1 h-14 rounded-xl border-2 font-semibold text-sm transition-colors ${cart.deliveredBy === v ? 'border-gray-900 bg-gray-900 text-white' : 'border-border bg-white text-gray-700'}`}
              >
                {v === 'pocho' ? 'Pocho' : 'Mateo'}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery toggle */}
        <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 h-14">
          <span className="font-medium text-gray-900">¿Tiene envío a domicilio?</span>
          <button
            role="switch"
            aria-checked={cart.hasDelivery}
            onClick={() => cart.setHasDelivery(!cart.hasDelivery)}
            className={`relative h-7 w-12 rounded-full transition-colors ${cart.hasDelivery ? 'bg-brand' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${cart.hasDelivery ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Delivery fields */}
        {cart.hasDelivery && (
          <div className="space-y-3 bg-surface rounded-2xl p-4 border border-border">
            <p className="font-semibold text-gray-900">Datos de envío</p>
            <Input label="Dirección" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ej: San Martín 1234" />
            <Input label="Horario" value={deliverySchedule} onChange={(e) => setDeliverySchedule(e.target.value)} placeholder="Ej: De 14 a 18hs" />
            <Input label="Teléfono del cliente" type="tel" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} inputMode="tel" />
            <Input label="Nombre (para mensaje)" value={deliveryClientName} onChange={(e) => setDeliveryClientName(e.target.value)} placeholder={cart.clientName} />
            <Select label="Tipo de envío" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}>
              <option value="ida">IDA (cliente ya pagó)</option>
              <option value="ida_y_vuelta">IDA Y VUELTA (paga al cadete)</option>
            </Select>
            <Input label="Monto del envío ($)" type="number" value={deliveryShipping} onChange={(e) => setDeliveryShipping(e.target.value)} inputMode="numeric" />
          </div>
        )}

        <div className="flex gap-3 pb-4">
          <Button variant="ghost" onClick={onBack} className="flex-1">← Volver</Button>
          <Button onClick={handleConfirm} loading={saving} className="flex-1" size="lg">Confirmar</Button>
        </div>
      </div>
    </div>
  )
}
