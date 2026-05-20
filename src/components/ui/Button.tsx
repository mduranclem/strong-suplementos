import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white active:bg-brand-dark disabled:opacity-40',
  secondary: 'bg-gray-900 text-white active:bg-gray-800 disabled:opacity-40',
  danger: 'bg-red-500 text-white active:bg-red-600 disabled:opacity-40',
  ghost: 'bg-transparent text-gray-700 border border-border active:bg-gray-100 disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-14 px-4 text-base',
  lg: 'h-16 px-5 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
      {children}
    </button>
  )
}
