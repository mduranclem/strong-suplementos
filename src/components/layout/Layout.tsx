import { BottomNav } from './BottomNav'

interface Props {
  children: React.ReactNode
}

export function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-surface font-sans">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
