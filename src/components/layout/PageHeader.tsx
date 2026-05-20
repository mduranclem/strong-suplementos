interface Props {
  title: string
  action?: React.ReactNode
}

export function PageHeader({ title, action }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border px-4 h-14 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
