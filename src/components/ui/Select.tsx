import { SelectHTMLAttributes, forwardRef } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(({ label, error, className = '', id, children, ...props }, ref) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={[
          'h-14 rounded-xl border border-border bg-white px-4 text-base text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent appearance-none',
          error ? 'border-red-500' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'
