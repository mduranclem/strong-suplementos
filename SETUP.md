# Strong Suplementos POS — Setup

## 1. Supabase

1. Crear un proyecto nuevo en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql` completo
3. Ir a **Authentication → Settings → Email** y configurar la confirmación según prefieras
4. Copiar `Project URL` y `anon public key` desde **Settings → API**

## 2. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto (no se commitea):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Crear cuenta del dueño (Mateo)

1. Ir a Supabase → **Authentication → Users → Add user**
2. Ingresar email y contraseña de Mateo
3. Ejecutar en SQL Editor:
```sql
INSERT INTO public.users (id, name, role)
SELECT id, 'Mateo', 'owner'
FROM auth.users
WHERE email = 'mateo@strong.com'; -- cambiá por el email real
```

## 4. Crear cuenta de Pri

1. En Supabase → **Authentication → Users → Invite user** — ingresar el email de Pri
2. Ella recibirá un link para poner su contraseña
3. Una vez que aceptó, ir a **Ajustes** en la app → "Asignar perfil de vendedora" → ingresar su nombre y email

## 5. Desarrollo local

```bash
npm install
npm run dev
```

## 6. Deploy en Easypanel (VPS)

1. Subir el código a un repo Git (GitHub/GitLab)
2. En Easypanel → **New App → App**
3. Conectar el repo y usar el `Dockerfile` incluido
4. En la sección **Environment Variables** agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Hacer deploy — Easypanel buildea con Docker y sirve con Nginx en el puerto 80

## Estructura de archivos

```
src/
├── components/
│   ├── ui/          Button, Input, Badge, Modal, Select
│   └── layout/      Layout, BottomNav, PageHeader
├── hooks/           useAuth, useRealtime
├── lib/             supabase, format, whatsapp
├── pages/
│   ├── ventas/      ProductSelector, Cart, CheckoutForm
│   ├── Ventas.tsx
│   ├── Catalogo.tsx
│   ├── Combos.tsx
│   ├── Historial.tsx
│   ├── Comisiones.tsx
│   ├── Reportes.tsx
│   ├── Clientes.tsx
│   └── Ajustes.tsx
├── stores/          authStore, cartStore
└── types/           index.ts
supabase/
└── schema.sql       Schema completo + RLS + funciones
```

## Notas importantes

- **Realtime**: activo en `sales`, `sale_items`, `product_variants`, `commissions`, `clients`. El dueño y Pri ven cambios en tiempo real sin recargar.
- **Stock**: se descuenta automáticamente al confirmar una venta. Si se anula la venta, el trigger `trigger_restore_stock` restaura el stock.
- **RLS**: Pri solo puede ver sus propias ventas y comisiones. No tiene acceso a costos, reportes ni ajustes.
- **Combos en el momento**: se arman seleccionando 2+ productos del carrito y tocando "Armar combo". La comisión se aplica una sola vez por grupo.
