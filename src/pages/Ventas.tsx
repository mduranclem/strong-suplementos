import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useCartStore } from '../stores/cartStore'
import { ProductSelector } from './ventas/ProductSelector'
import { Cart } from './ventas/Cart'
import { CheckoutForm } from './ventas/CheckoutForm'

type Step = 'cart' | 'checkout'

export function VentasPage() {
  const [step, setStep] = useState<Step>('cart')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const itemCount = useCartStore((s) => s.items.length)

  function handleSuccess() {
    setStep('cart')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <PageHeader
        title={step === 'cart' ? 'Nueva venta' : 'Confirmar venta'}
        action={
          step === 'cart' ? (
            <Button size="sm" onClick={() => setSelectorOpen(true)}>
              + Agregar
            </Button>
          ) : undefined
        }
      />

      {step === 'cart' ? (
        <>
          <Cart onCheckout={() => { if (itemCount > 0) setStep('checkout') }} />
          <ProductSelector open={selectorOpen} onClose={() => setSelectorOpen(false)} />
        </>
      ) : (
        <CheckoutForm onBack={() => setStep('cart')} onSuccess={handleSuccess} />
      )}
    </div>
  )
}
