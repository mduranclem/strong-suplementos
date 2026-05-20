/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __SUPABASE_URL__?: string
    __SUPABASE_ANON_KEY__?: string
  }
}

// En produccion se inyectan via env-config.js; en desarrollo se usan las variables de Vite
const url = window.__SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL as string
const key = window.__SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key)
