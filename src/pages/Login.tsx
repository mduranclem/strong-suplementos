import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError('Usuario o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-3" aria-hidden="true">💪</div>
          <h1 className="text-3xl font-extrabold text-white">Strong</h1>
          <p className="text-gray-400 mt-1">Sistema de ventas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 rounded-xl border border-gray-700 bg-gray-800 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 rounded-xl border border-gray-700 bg-gray-800 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
