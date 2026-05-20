export type Role = 'owner' | 'seller'

export interface AppUser {
  id: string
  name: string
  role: Role
}

export interface Product {
  id: string
  name: string
  brand: string
  created_at: string
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sale_price: number
  cost_price: number
  stock: number
  min_stock: number
  created_at: string
  product?: Product
}

export interface Combo {
  id: string
  name: string
  sale_price: number
  cost_price: number
  created_at: string
  items?: ComboItem[]
}

export interface ComboItem {
  id: string
  combo_id: string
  variant_id: string
  quantity: number
  variant?: ProductVariant & { product?: Product }
}

export interface Client {
  id: string
  name: string
  phone: string | null
  created_at: string
}

export type DeliveredBy = 'pocho' | 'owner'
export type SaleStatus = 'confirmed' | 'cancelled'
export type DeliveryType = 'ida' | 'ida_y_vuelta'

export interface Sale {
  id: string
  client_id: string | null
  seller_id: string
  delivered_by: DeliveredBy
  has_delivery: boolean
  total: number
  status: SaleStatus
  created_at: string
  client?: Client
  seller?: AppUser
  items?: SaleItem[]
  delivery?: Delivery
}

export interface SaleItem {
  id: string
  sale_id: string
  variant_id: string | null
  combo_id: string | null
  quantity: number
  unit_price: number
  is_combo: boolean
  combo_group_id: string | null
  combo_price: number | null
  variant?: ProductVariant & { product?: Product }
  combo?: Combo
}

export interface Delivery {
  id: string
  sale_id: string
  address: string
  schedule: string
  phone: string
  client_name: string
  type: DeliveryType
  shipping_cost: number
}

export type CommissionPerson = 'pri' | 'pocho'

export interface Commission {
  id: string
  person: CommissionPerson
  sale_id: string
  amount: number
  paid: boolean
  paid_at: string | null
  sale?: Sale
}

export interface CommissionPayment {
  id: string
  person: CommissionPerson
  amount: number
  date: string
  notes: string | null
}

export interface Settings {
  pocho_whatsapp_group: string
  cadete_whatsapp_number: string
  commission_pri_product: number
  commission_pri_combo: number
  commission_pocho: number
}

// Cart types (in-memory only, not persisted to DB)
export interface CartItem {
  id: string // temp uuid
  type: 'product' | 'fixed_combo'
  variant_id?: string
  combo_id?: string
  name: string
  variantName?: string
  quantity: number
  unit_price: number
  is_combo: boolean
  combo_group_id?: string // set when grouped as on-the-spot combo
  combo_price?: number
}
