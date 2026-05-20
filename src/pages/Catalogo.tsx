import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Product, ProductVariant } from '../types'
import { formatPeso } from '../lib/format'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

export function CatalogoPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'product' | 'variant' | null>(null)
  const [editProduct, setEditProduct] = useState<ProductWithVariants | null>(null)
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // product form state
  const [pName, setPName] = useState('')
  const [pBrand, setPBrand] = useState('')
  // variant form state
  const [vName, setVName] = useState('')
  const [vSalePrice, setVSalePrice] = useState('')
  const [vCostPrice, setVCostPrice] = useState('')
  const [vStock, setVStock] = useState('')
  const [vMinStock, setVMinStock] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .order('name')
    setProducts((data as ProductWithVariants[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const brands = [...new Set(products.map((p) => p.brand))].sort()
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchBrand = !brandFilter || p.brand === brandFilter
    return matchSearch && matchBrand
  })

  function openNewProduct() {
    setEditProduct(null)
    setPName(''); setPBrand('')
    setModal('product')
  }

  function openEditProduct(p: ProductWithVariants) {
    setEditProduct(p)
    setPName(p.name); setPBrand(p.brand)
    setModal('product')
  }

  function openNewVariant(productId: string) {
    setSelectedProductId(productId)
    setEditVariant(null)
    setVName(''); setVSalePrice(''); setVCostPrice(''); setVStock('0'); setVMinStock('0')
    setModal('variant')
  }

  function openEditVariant(v: ProductVariant, productId: string) {
    setSelectedProductId(productId)
    setEditVariant(v)
    setVName(v.name); setVSalePrice(String(v.sale_price)); setVCostPrice(String(v.cost_price))
    setVStock(String(v.stock)); setVMinStock(String(v.min_stock))
    setModal('variant')
  }

  async function saveProduct() {
    if (!pName.trim() || !pBrand.trim()) return
    setSaving(true)
    if (editProduct) {
      await supabase.from('products').update({ name: pName, brand: pBrand }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert({ name: pName, brand: pBrand })
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar producto y todas sus variantes?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  async function saveVariant() {
    if (!vName.trim() || !vSalePrice || !vCostPrice) return
    setSaving(true)
    const payload = {
      product_id: selectedProductId,
      name: vName,
      sale_price: parseFloat(vSalePrice),
      cost_price: parseFloat(vCostPrice),
      stock: parseInt(vStock) || 0,
      min_stock: parseInt(vMinStock) || 0,
    }
    if (editVariant) {
      await supabase.from('product_variants').update(payload).eq('id', editVariant.id)
    } else {
      await supabase.from('product_variants').insert(payload)
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function deleteVariant(id: string) {
    if (!confirm('¿Eliminar variante?')) return
    await supabase.from('product_variants').delete().eq('id', id)
    load()
  }

  const hasLowStock = (v: ProductVariant) => v.stock <= v.min_stock

  return (
    <div>
      <PageHeader
        title="Catálogo"
        action={<Button size="sm" onClick={openNewProduct}>+ Producto</Button>}
      />

      <div className="p-4 space-y-3">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar producto"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setBrandFilter('')}
            className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${!brandFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-border'}`}
          >
            Todas
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b === brandFilter ? '' : b)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${brandFilter === b ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-border'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="px-4 space-y-3 pb-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <p className="font-bold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openNewVariant(product.id)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600 active:bg-gray-50" aria-label="Agregar variante">＋</button>
                  <button onClick={() => openEditProduct(product)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-border text-gray-600 active:bg-gray-50" aria-label="Editar producto">✏️</button>
                  <button onClick={() => deleteProduct(product.id)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-200 text-red-500 active:bg-red-50" aria-label="Eliminar producto">🗑</button>
                </div>
              </div>
              {product.variants.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">Sin variantes. Agregá una variante para poder vender este producto.</p>
              ) : (
                <div className="divide-y divide-border">
                  {product.variants.map((v) => (
                    <div key={v.id} className={`flex items-center justify-between px-4 py-3 ${hasLowStock(v) ? 'bg-red-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">{v.name}</span>
                          {hasLowStock(v) && <Badge color="red">⚠ Stock bajo</Badge>}
                        </div>
                        <div className="flex gap-4 mt-0.5">
                          <span className="text-sm text-gray-700">Venta: <strong>{formatPeso(v.sale_price)}</strong></span>
                          <span className="text-sm text-gray-500">Costo: {formatPeso(v.cost_price)}</span>
                        </div>
                        <span className="text-xs text-gray-500">Stock: {v.stock} (mín: {v.min_stock})</span>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => openEditVariant(v, product.id)} className="h-9 w-9 flex items-center justify-center rounded-xl border border-border text-gray-600 active:bg-gray-50 text-sm" aria-label="Editar variante">✏️</button>
                        <button onClick={() => deleteVariant(v.id)} className="h-9 w-9 flex items-center justify-center rounded-xl border border-red-200 text-red-500 active:bg-red-50 text-sm" aria-label="Eliminar variante">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-10">No hay productos que coincidan</p>
          )}
        </div>
      )}

      <Modal
        open={modal === 'product'}
        onClose={() => setModal(null)}
        title={editProduct ? 'Editar producto' : 'Nuevo producto'}
        footer={<Button fullWidth loading={saving} onClick={saveProduct}>{editProduct ? 'Guardar cambios' : 'Crear producto'}</Button>}
      >
        <Input label="Nombre" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Ej: Proteína WPC" />
        <Input label="Marca" value={pBrand} onChange={(e) => setPBrand(e.target.value)} placeholder="Ej: Optimum Nutrition" />
      </Modal>

      <Modal
        open={modal === 'variant'}
        onClose={() => setModal(null)}
        title={editVariant ? 'Editar variante' : 'Nueva variante'}
        footer={<Button fullWidth loading={saving} onClick={saveVariant}>{editVariant ? 'Guardar cambios' : 'Crear variante'}</Button>}
      >
        <Input label="Nombre de variante" value={vName} onChange={(e) => setVName(e.target.value)} placeholder='Ej: Chocolate (o "Único" si no hay variantes)' />
        <Input label="Precio de venta ($)" type="number" value={vSalePrice} onChange={(e) => setVSalePrice(e.target.value)} inputMode="numeric" />
        <Input label="Precio de costo ($)" type="number" value={vCostPrice} onChange={(e) => setVCostPrice(e.target.value)} inputMode="numeric" />
        <div className="flex gap-3">
          <Input label="Stock actual" type="number" value={vStock} onChange={(e) => setVStock(e.target.value)} inputMode="numeric" />
          <Input label="Stock mínimo" type="number" value={vMinStock} onChange={(e) => setVMinStock(e.target.value)} inputMode="numeric" />
        </div>
      </Modal>
    </div>
  )
}
