import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      dialogRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col outline-none"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <h2 id="modal-title" className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-500 active:bg-gray-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
        {footer && (
          <div className="px-4 pb-4 pt-3 border-t border-border">{footer}</div>
        )}
      </div>
    </div>
  )
}
