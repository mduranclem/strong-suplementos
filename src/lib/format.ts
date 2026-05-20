export function formatPeso(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-AR')
}

export function parsePeso(str: string): number {
  return parseFloat(str.replace(/[$.]/g, '').replace(',', '.')) || 0
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
