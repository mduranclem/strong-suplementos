import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', id, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={[
          'h-14 rounded-xl border border-border bg-white px-4 text-base text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          error ? 'border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
