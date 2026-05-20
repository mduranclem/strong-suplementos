import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Product, ProductVariant, Combo } from '../../types'
import { formatPeso } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { useCartStore } from '../../stores/cartStore'

interface ProductWithVariants extends Product { variants: ProductVariant[] }

interface Props {
  open: boolean
  onClose: () => void
}

export function ProductSelector({ open, onClose }: Props) {
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [variantModal, setVariantModal] = useState<ProductWithVariants | null>(null)
  const [loaded, setLoaded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    if (!open || loaded) return
    Promise.all([
      supabase.from('products').select('*, variants:product_variants(*)').order('name'),
      supabase.from('combos').select('*').order('name'),
    ]).then(([{ data: p }, { data: c }]) => {
      setProducts((p as ProductWithVariants[]) ?? [])
      setCombos((c as Combo[]) ?? [])
      setLoaded(true)
    })
  }, [open, loaded])

  const brands = [...new Set(products.map((p) => p.brand))].sort()
  const filteredProducts = products.filter((p) => {
    return p.name.toLowerCase().includes(search.toLowerCase()) && (!brandFilter || p.brand === brandFilter)
  })
  const filteredCombos = combos.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  function handleSelectProduct(p: ProductWithVariants) {
    if (p.variants.length === 1) {
      const v = p.variants[0]
      addItem({ type: 'product', variant_id: v.id, name: p.name, variantName: v.name !== 'Único' ? v.name : undefined, quantity: 1, unit_price: v.sale_price, is_combo: false })
      onClose()
    } else {
      setVariantModal(p)
    }
  }

  function handleSelectVariant(p: ProductWithVariants, v: ProductVariant) {
    addItem({ type: 'product', variant_id: v.id, name: p.name, variantName: v.name, quantity: 1, unit_price: v.sale_price, is_combo: false })
    setVariantModal(null)
    onClose()
  }

  function handleSelectCombo(c: Combo) {
    addItem({ type: 'fixed_combo', combo_id: c.id, name: c.name, quantity: 1, unit_price: c.sale_price, is_combo: true })
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white flex flex-col" role="dialog" aria-modal="true" aria-label="Seleccionar producto">
        <div className="sticky top-0 bg-white border-b border-border px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600" aria-label="Cerrar">✕</button>
            <Input
              placeholder="Buscar producto o combo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
              aria-label="Buscar"
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setBrandFilter('')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium border ${!brandFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-border'}`}>Todos</button>
            {brands.map((b) => (
              <button key={b} onClick={() => setBrandFilter(b === brandFilter ? '' : b)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium border ${brandFilter === b ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-border'}`}>{b}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCombos.length > 0 && (
            <div>
              <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Combos</p>
              <div className="divide-y divide-border">
                {filteredCombos.map((c) => (
                  <button key={c.id} onClick={() => handleSelectCombo(c)} className="w-full flex items-center justify-between px-4 py-4 active:bg-surface text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{c.name}</span>
                        <Badge color="orange">COMBO</Badge>
                      </div>
                    </div>
                    <span className="font-bold text-brand">{formatPeso(c.sale_price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div>
              <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</p>
              <div className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <button key={p.id} onClick={() => handleSelectProduct(p)} className="w-full flex items-center justify-between px-4 py-4 active:bg-surface text-left">
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.brand}</p>
                      {p.variants.length > 1 && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.variants.length} variantes disponibles</p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 ml-4">
                      {p.variants.length === 1 ? formatPeso(p.variants[0].sale_price) : '▸'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && filteredCombos.length === 0 && (
            <p className="text-center text-gray-400 py-16">No se encontraron resultados</p>
          )}
        </div>
      </div>

      {variantModal && (
        <div className="fixed inset-0 z-60 bg-white flex flex-col" role="dialog" aria-modal="true" aria-label="Seleccionar variante">
          <div className="sticky top-0 bg-white border-b border-border px-4 h-14 flex items-center gap-3">
            <button onClick={() => setVariantModal(null)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600" aria-label="Volver">←</button>
            <h2 className="font-bold text-gray-900">{variantModal.name}</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {variantModal.variants.map((v) => (
              <button key={v.id} onClick={() => handleSelectVariant(variantModal, v)} className="w-full flex items-center justify-between px-4 py-5 active:bg-surface text-left">
                <span className="font-semibold text-gray-900 text-lg">{v.name}</span>
                <div className="text-right">
                  <p className="font-bold text-brand text-lg">{formatPeso(v.sale_price)}</p>
                  <p className="text-xs text-gray-500">Stock: {v.stock}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
