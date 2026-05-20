import { create } from 'zustand'
import type { CartItem } from '../types'

const newId = () => crypto.randomUUID()

interface CartState {
  items: CartItem[]
  clientName: string
  clientId: string | null
  deliveredBy: 'pocho' | 'owner'
  hasDelivery: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  updatePrice: (id: string, price: number) => void
  groupAsCombo: (ids: string[], comboPrice: number) => void
  ungroupCombo: (comboGroupId: string) => void
  setClientName: (name: string) => void
  setClientId: (id: string | null) => void
  setDeliveredBy: (v: 'pocho' | 'owner') => void
  setHasDelivery: (v: boolean) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  clientName: '',
  clientId: null,
  deliveredBy: 'pocho',
  hasDelivery: false,

  addItem: (item) =>
    set((s) => ({ items: [...s.items, { ...item, id: newId() }] })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  updateQuantity: (id, qty) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    })),

  updatePrice: (id, price) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, unit_price: price } : i)),
    })),

  groupAsCombo: (ids, comboPrice) => {
    const groupId = newId()
    const pricePerItem = comboPrice / ids.length
    set((s) => ({
      items: s.items.map((i) =>
        ids.includes(i.id)
          ? { ...i, is_combo: true, combo_group_id: groupId, combo_price: comboPrice, unit_price: pricePerItem }
          : i
      ),
    }))
  },

  ungroupCombo: (comboGroupId) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.combo_group_id === comboGroupId
          ? { ...i, is_combo: false, combo_group_id: undefined, combo_price: undefined }
          : i
      ),
    })),

  setClientName: (clientName) => set({ clientName }),
  setClientId: (clientId) => set({ clientId }),
  setDeliveredBy: (deliveredBy) => set({ deliveredBy }),
  setHasDelivery: (hasDelivery) => set({ hasDelivery }),
  clear: () =>
    set({
      items: [],
      clientName: '',
      clientId: null,
      deliveredBy: 'pocho',
      hasDelivery: false,
    }),

  total: () => {
    const items = get().items
    // For combos, count each group once at combo_price
    const counted = new Set<string>()
    let sum = 0
    for (const item of items) {
      if (item.combo_group_id) {
        if (!counted.has(item.combo_group_id)) {
          counted.add(item.combo_group_id)
          sum += item.combo_price ?? 0
        }
      } else {
        sum += item.unit_price * item.quantity
      }
    }
    return sum
  },
}))
