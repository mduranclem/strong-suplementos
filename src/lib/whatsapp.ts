import type { Sale, SaleItem, Delivery } from '../types'
import { formatPeso } from './format'

export function buildPochoMessage(sale: Sale, items: SaleItem[]): string {
  const clientName = sale.client?.name ?? 'Cliente'
  const lines = [clientName]
  for (const item of items) {
    const productName = item.combo
      ? item.combo.name
      : item.variant?.product?.name
        ? `${item.variant.product.name}${item.variant?.name !== 'Único' ? ' - ' + item.variant.name : ''}`
        : 'Producto'
    if (item.quantity > 1) {
      lines.push(`${item.quantity}x ${productName}`)
    } else {
      lines.push(productName)
    }
  }
  lines.push(`TOTAL = ${formatPeso(sale.total)}`)
  return lines.join('\n')
}

export function buildCadeteMessage(delivery: Delivery): string {
  const tipoLabel = delivery.type === 'ida' ? 'IDA' : 'IDA Y VUELTA'
  return [
    `📍 DIRECCIÓN: ${delivery.address}`,
    `🕐 HORARIO: ${delivery.schedule}`,
    `📞 TELÉFONO: ${delivery.phone}`,
    `👤 NOMBRE: ${delivery.client_name}`,
    `🔄 TIPO: ${tipoLabel}`,
    `💰 ENVÍO: ${formatPeso(delivery.shipping_cost)}`,
  ].join('\n')
}

export function openPochoWhatsApp(groupLink: string, message: string): void {
  const url = `${groupLink}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export function openCadeteWhatsApp(phone: string, message: string): void {
  const clean = phone.replace(/\D/g, '')
  const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}
