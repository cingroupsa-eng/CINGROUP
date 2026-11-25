# EL BAZAR DE MALEJA — Guía de configuración

*Tu estilo, tu esencia.*

Tienda online de moda (Next.js + Supabase) con pedidos por WhatsApp. Esta guía explica, paso a paso, cómo dejarla funcionando en producción. No hace falta saber programar: sólo seguir el orden.

---

## Resumen rápido

| Paso | Qué hacés | Dónde |
|---|---|---|
| 1 | Crear el proyecto de base de datos | supabase.com |
| 2 | Ejecutar `supabase/schema.sql` | Supabase → SQL Editor |
| 3 | Copiar las claves en `.env.local` | Supabase → Project Settings → API |
| 4 | Crear tu usuario y darle rol **admin** | Supabase → Authentication + SQL |
| 5 | Desplegar en Vercel | vercel.com |
| 6 | Cargar WhatsApp, redes y datos del negocio | `/admin/configuracion` |
| 7 | Cargar y publicar prendas | `/admin/productos` |

---

## 1. Crear el proyecto en Supabase

1. Entrá a <https://supabase.com> y creá una cuenta (gratis).
2. **New project** → nombre `el-bazar-de-maleja`, región **South America (São Paulo)** (la más cercana a Paraguay), y guardá la contraseña de la base de datos en un lugar seguro.
3. Esperá 1–2 minutos a que el proyecto termine de crearse.

## 2. Crear las tablas, la seguridad y el almacenamiento de fotos

1. En el menú lateral: **SQL Editor → New query**.
2. Abrí el archivo [`supabase/schema.sql`](supabase/schema.sql) de este proyecto, copiá **todo** el contenido, pegalo y presioná **Run**.
3. Debe terminar sin errores. Esto crea:
   - Las tablas: `profiles`, `store_settings`, `categories`, `brands`, `products`, `product_images`, `product_variants`, `orders` y `order_items`.
   - Las 9 categorías iniciales: Ropa, Vestidos, Blusas, Pantalones, Conjuntos, Calzados, Carteras, Accesorios y Ofertas.
   - La configuración de la tienda: nombre, eslogan y métodos de pago (Transferencia y Efectivo). **WhatsApp queda vacío** hasta que lo cargues.
   - La seguridad **RLS**: el público sólo ve prendas publicadas y nunca ve pedidos; sólo las administradoras pueden modificar datos.
   - Los buckets públicos `products` y `branding` para las fotos. Sólo las administradoras pueden subir archivos.
   - La función `create_order`, que valida precios y stock en el servidor y genera los números `EBM-0001`, `EBM-0002`, …
   - El descuento automático de stock al **confirmar** un pedido y la devolución del stock si se cancela.

> El script se puede volver a ejecutar sin perder datos (es idempotente).

## 3. Variables de entorno

En Supabase: **Project Settings → API**. Copiá:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Para desarrollo local, creá un archivo `.env.local` en la raíz del proyecto, tomando como base `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> 🔒 **Nunca** uses la clave `service_role` en este proyecto ni la subas a Vercel. No hace falta: toda la seguridad depende de RLS y de la función `create_order`. La `anon key` es pública por diseño.

## 4. Crear el primer usuario administrador

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Cargá tu correo y una contraseña segura, y marcá **Auto Confirm User**.
3. Volvé a **SQL Editor** y ejecutá lo siguiente, cambiando el correo por el tuyo:

```sql
update public.profiles
set role = 'admin', full_name = 'Maleja'
where id = (select id from auth.users where email = 'TU-CORREO@ejemplo.com');
```

4. **Muy recomendado:** en **Authentication → Sign In / Providers → Email**, desactivá **Allow new users to sign up**. Así nadie más puede crear cuentas. Aunque alguien lograra registrarse, su cuenta nacería con rol `user`, sin acceso al panel.

Para agregar otra administradora, repetí los pasos 1–3 con su correo.

## 5. Probar localmente (opcional)

```bash
npm install
npm run dev        # http://localhost:3000  y  http://localhost:3000/admin
```

Otros comandos útiles:

```bash
npm run typecheck  # verificación de tipos (tsc --noEmit)
npm run build      # compilación de producción
```

## 6. Desplegar en Vercel

1. Subí el repositorio a GitHub (ya está en `cingroupsa-eng/CINGROUP`).
2. En <https://vercel.com> → **Add New → Project** → importá el repositorio. Vercel detecta Next.js automáticamente.
3. En **Environment Variables** cargá estas tres:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`: la URL final, por ejemplo `https://elbazardemaleja.com` (sin `/` al final).
4. **Deploy**.
5. Si conectás un dominio propio (Vercel → Settings → Domains), actualizá `NEXT_PUBLIC_SITE_URL` y volvé a desplegar.
6. En Supabase → **Authentication → URL Configuration**, poné tu dominio en **Site URL**.

## 7. Configurar la tienda desde el panel

Ingresá a `https://TU-DOMINIO/admin` con el usuario del paso 4.

1. **Configuración → WhatsApp de la tienda**: cargá el número con código de país, por ejemplo `595981123456`. También acepta `0981 123 456` y lo convierte solo. Usá **probar enlace** para verificarlo.
   - ⚠️ Mientras no esté cargado, el carrito muestra *"Pedidos online muy pronto"*, el botón flotante de WhatsApp no aparece y el servidor rechaza cualquier pedido. El panel muestra el aviso *"Falta configurar el número de WhatsApp de la tienda"*.
2. Completá redes sociales, dirección, horarios, información de entregas y los métodos de pago activos. Mientras falten, el pie de página muestra *"Configuración pendiente"*.
3. **Portada**: subí la foto principal (vertical 4:5) y, si querés, un título y un subtítulo propios.
4. **Logotipo** (opcional): si no subís uno, se usa el logotipo tipográfico de la marca.

## 8. Cargar prendas

**Productos → Nueva prenda**:

- **Fotos**: arrastralas o tocá para elegirlas (hasta 12). Se comprimen automáticamente. La primera es la portada y se reordenan con las flechas.
- **Precio** en Guaraníes enteros, por ejemplo `150000`, que se muestra como **Gs. 150.000**. Si cargás un **precio anterior** mayor, se muestra tachado con el % de descuento.
- **Tallas, colores y stock**: usá la *Carga rápida* (un color + varias tallas) o agregá variantes una por una. Cada combinación talla + color tiene su propio stock.
- **Visibilidad**: *Publicada*, *Nuevo*, *Destacada*, *En oferta*. Las prendas nacen **ocultas**: activá *Publicada* cuando estén listas.

Mientras no haya prendas publicadas, la tienda muestra la sección elegante *"Próximamente nuevas colecciones"* con acceso a WhatsApp y redes. No se muestran productos de ejemplo.

## 9. Flujo de un pedido

1. La clienta elige color, talla y cantidad, y completa nombre, teléfono, método de pago y observaciones.
2. El servidor vuelve a validar los precios reales y el stock disponible, registra el pedido `EBM-XXXX` con estado **Pendiente** y abre WhatsApp con el resumen completo.
3. En **Pedidos** ves la solicitud. Desde ahí podés escribirle a la clienta por WhatsApp, cambiar el estado con un clic y anotar notas internas.
4. Al pasar a **Confirmado** (o a un estado posterior), el stock se descuenta automáticamente. Si lo cancelás o lo volvés a *Pendiente*, el stock se repone.
5. Si no hay stock suficiente al confirmar, el sistema avisa y no confirma el pedido.

> Antispam: se aceptan como máximo 5 solicitudes pendientes por teléfono por hora.

## 10. Instalar como app (PWA)

- **iPhone (Safari)**: Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*.

Los íconos se generan desde el isotipo vectorial con `node scripts/generate-icons.mjs`, que requiere Playwright.

---

## Estructura del proyecto

```
app/
  (store)/           Tienda pública: inicio, /tienda, /categoria/[slug], /producto/[slug]
  admin/(auth)/      /admin/login
  admin/(panel)/     Dashboard, productos, categorías, pedidos, configuración
  api/search/        Buscador instantáneo
  manifest.ts, sitemap.ts, robots.ts, opengraph-image.tsx
components/
  brand/             Logotipo e isotipo SVG
  store/ product/ cart/   Interfaz pública, galería, carrito y checkout
  admin/             Panel administrativo
  ui/                Botones, campos, drawer y precios
lib/
  actions/           Server Actions (checkout y admin)
  supabase/          Clientes browser/server y middleware
  data.ts            Lecturas públicas (con caché)
  validations.ts     Esquemas Zod (cliente + servidor)
  whatsapp.ts        Constructor del mensaje de pedido
supabase/schema.sql  Base de datos completa
middleware.ts        Protege /admin
```

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| El panel dice *"Acceso restringido"* | Falta el paso 4: asignar `role = 'admin'`. |
| *"No tenés permisos para subir archivos"* | Igual que el anterior, o no se ejecutó la parte de Storage de `schema.sql`. |
| El carrito dice *"Pedidos online muy pronto"* | Cargá el WhatsApp en Configuración. |
| Las fotos no cargan en producción | Verificá que `NEXT_PUBLIC_SUPABASE_URL` esté en Vercel y volvé a desplegar. |
| Un cambio del panel no aparece en la tienda | La tienda se actualiza al guardar. Si no, recargá la página: se cachea hasta 2 minutos. |
