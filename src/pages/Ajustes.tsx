import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { signOut } from '../hooks/useAuth'

type SettingKey = 'pocho_whatsapp_group' | 'cadete_whatsapp_number' | 'commission_pri_product' | 'commission_pri_combo' | 'commission_pocho'

const KEYS: SettingKey[] = ['pocho_whatsapp_group', 'cadete_whatsapp_number', 'commission_pri_product', 'commission_pri_combo', 'commission_pocho']

const LABELS: Record<SettingKey, string> = {
  pocho_whatsapp_group: 'Link grupo WhatsApp de Pocho',
  cadete_whatsapp_number: 'Número WhatsApp del cadete (con código de país)',
  commission_pri_product: 'Comisión Pri por producto ($)',
  commission_pri_combo: 'Comisión Pri por combo ($)',
  commission_pocho: 'Comisión Pocho por entrega ($)',
}

export function AjustesPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Invite seller form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  useEffect(() => {
    supabase.from('settings').select('key, value').in('key', KEYS).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        for (const row of data as { key: string; value: string }[]) { map[row.key] = row.value }
        setValues(map)
      }
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    for (const key of KEYS) {
      await supabase.from('settings').upsert({ key, value: values[key] ?? '' }, { onConflict: 'key' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Registers the user profile row. The account itself is created via Supabase
  // dashboard or the invite flow — the anon key cannot call auth.admin.createUser.
  // This function registers the profile for an already-existing auth user by email.
  async function registerSellerProfile() {
    if (!inviteEmail || !inviteName) return
    setInviting(true)
    setInviteMsg('')

    // Find the user in auth by checking if they exist in users table by email
    // We use a Supabase Edge Function approach: store a "pending invite" in settings
    // and let the seller register themselves via /register route.
    // Simpler fallback: the owner creates the auth user from the Supabase dashboard
    // and then uses this form to assign their name+role.
    const { data: authUser } = await supabase.rpc('get_user_id_by_email', { email: inviteEmail })
    if (!authUser) {
      setInviteMsg('No se encontró un usuario con ese email. Crealo primero desde el dashboard de Supabase.')
      setInviting(false)
      return
    }
    const { error } = await supabase.from('users').upsert({ id: authUser, name: inviteName, role: 'seller' }, { onConflict: 'id' })
    if (error) {
      setInviteMsg('Error al asignar perfil: ' + error.message)
    } else {
      setInviteMsg('✓ Perfil de vendedora asignado correctamente')
      setInviteEmail('')
      setInviteName('')
    }
    setInviting(false)
  }

  return (
    <div>
      <PageHeader title="Ajustes" />
      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <p className="font-bold text-gray-900">Configuración general</p>
            {KEYS.map((key) => (
              <Input
                key={key}
                label={LABELS[key]}
                value={values[key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                inputMode={key.startsWith('commission') ? 'numeric' : undefined}
                type={key.startsWith('commission') ? 'number' : 'text'}
              />
            ))}
            <Button fullWidth loading={saving} onClick={save} variant={saved ? 'secondary' : 'primary'}>
              {saved ? '✓ Guardado' : 'Guardar cambios'}
            </Button>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <div>
              <p className="font-bold text-gray-900">Asignar rol vendedora</p>
              <p className="text-sm text-gray-500 mt-1">
                Primero creá el usuario desde el <strong>Dashboard de Supabase → Authentication → Users → Invite user</strong>. Luego ingresá sus datos acá para asignarle el rol.
              </p>
            </div>
            <Input label="Nombre" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Pri" />
            <Input label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="pri@strong.com" />
            <Button fullWidth loading={inviting} onClick={registerSellerProfile} variant="secondary">
              Asignar perfil de vendedora
            </Button>
            {inviteMsg && (
              <p className={`text-sm ${inviteMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{inviteMsg}</p>
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
            <p className="font-semibold text-gray-900 text-sm">Cómo crear la cuenta de Pri</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Abrí el Dashboard de Supabase</li>
              <li>Ir a Authentication → Users → Invite user</li>
              <li>Ingresá el email de Pri</li>
              <li>Ella recibirá un link para establecer su contraseña</li>
              <li>Volvé acá y asigná su nombre con el formulario de arriba</li>
            </ol>
          </div>

          <div className="border-t border-border pt-6">
            <Button fullWidth variant="danger" onClick={() => signOut()}>Cerrar sesión</Button>
          </div>
        </div>
      )}
    </div>
  )
}
