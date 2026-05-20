interface Props {
  children: React.ReactNode
  color?: 'orange' | 'red' | 'green' | 'gray' | 'blue'
}

const colors = {
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
}

export function Badge({ children, color = 'gray' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  )
}
