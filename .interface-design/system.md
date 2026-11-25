# Sistema de diseño: EL BAZAR DE MALEJA

*Tu estilo, tu esencia.* Este archivo es la referencia que hay que respetar en cualquier cambio de interfaz (tienda y panel).

## Dirección

- **Tienda:** boutique editorial contemporánea, de lujo accesible. Más del 85 % del tráfico es móvil y llega desde Instagram y WhatsApp. Debe sentirse cálida, femenina y aireada. El fucsia guía la mirada hacia las acciones y nunca satura.
- **Panel:** el mostrador de la boutique: ordenado, calmo y rápido. Lo usa la dueña desde el celular, entre clientas y mensajes de WhatsApp. Lo primero que necesita es **atender pedidos pendientes**; lo segundo, publicar prendas.
- **Dominio:** etiqueta colgante, percha, probador, libreta de pedidos, papel de seda, cinta de raso.

## Firma

**La etiqueta colgante** (`components/brand/OrderTag.tsx`): el número de pedido `EBM-XXXX` va en una etiqueta con muesca y orificio. Se usa en:

- el inicio del panel (cola "Por atender"),
- la lista de pedidos,
- el detalle del pedido (en grande),
- la confirmación que ve la clienta (en fucsia).

Todo número de pedido nuevo debe usar `OrderTag`.

## Color

Los tokens viven en `tailwind.config.ts`. Regla: **los colores de marca son para acentos; los tonos `deep` son para texto.** Todos los textos cumplen el contraste AA (4,5:1).

| Token | Hex | Uso |
|---|---|---|
| `maleja` | `#F00072` | Acentos: anillos, bordes, íconos, puntos y decoración. **No** para texto chico ni para fondos con texto blanco. |
| `maleja-deep` | `#D60065` | Texto fucsia (eyebrows, precios en oferta, enlaces) y fondos con texto blanco (botón primario, badges). 5,19:1 sobre blanco. |
| `maleja-dark` | `#C8005E` | Hover de botones con texto blanco. |
| `maleja-hot` | `#FF4F9A` | Gradientes sutiles y decoración, nunca debajo de texto chico. |
| `maleja-pastel` | `#FFB6D0` | Bordes finos (`/40`–`/60`), fondos suaves y etiquetas. |
| `maleja-canvas` | `#FFF7FA` | Lienzo de tienda y panel, y fondo de la barra lateral. |
| `white` | `#FFFFFF` | Superficies: tarjetas, paneles y drawers. |
| `ink` | `#211820` | Texto principal y botón `dark`. |
| `ink-soft` | `#806B76` | Texto secundario y metadatos. Era `#8B7480`, ajustado para AA. |
| `ok` | `#13B86A` | Confirmación sólo en íconos y puntos de estado. |
| `ok-deep` | `#0C7D48` | Texto verde ("Disponible") y botones de WhatsApp con texto blanco. |

- Hay un solo acento por vista. El verde es semántico (WhatsApp y éxito), no compite con el fucsia.
- Los hovers de botones con texto **oscurecen** (`maleja-dark`, `brightness-90`), nunca aclaran.

## Tipografía

- **Serif editorial:** Cormorant Garamond (`font-serif`). Para títulos, logotipo y nombres de prendas. La cursiva (`italic`) se usa para la palabra de acento del título, en `text-maleja-deep`.
- **Sans geométrica:** Jost (`font-sans`). Para interfaz, precios y formularios.
- **Eyebrow** (`.eyebrow`): 11 px, mayúsculas, `tracking-luxe` (0,28em), `text-maleja-deep`.
- **Precios y datos:** siempre `tabular-nums`. Los Guaraníes se muestran con `formatPYG`, por ejemplo `Gs. 150.000`.
- Los títulos llevan `text-wrap: balance` y los párrafos `pretty` (definido globalmente en `globals.css`).
- Los inputs miden 16 px en móvil para que iOS no haga zoom.

## Profundidad

- **Tienda:** bordes finos `maleja-pastel/40` más sombras difusas suaves (`shadow-card`). Elevación al pasar el mouse: `-translate-y-1` y `shadow-card`.
- **Panel:** **sólo bordes** (`border-maleja-pastel/50`), sin sombras en las tarjetas. La barra lateral usa la misma superficie que el lienzo y la separa un borde fino. La navegación activa es un chip blanco con anillo, no un bloque fucsia.
- Las superposiciones (drawers, diálogos, toasts) usan `shadow-2xl` o `shadow-xl`.
- No hay brillos de color como hover principal.

## Forma y espaciado

- **Radios:**
  - botones y chips: `rounded-full`;
  - inputs: `rounded-2xl`;
  - tarjetas del panel: `rounded-2xl` / `rounded-3xl`;
  - tarjetas de producto y categoría: `rounded-[22px]`;
  - drawer inferior: `rounded-t-[28px]`.
- **Áreas táctiles:** mínimo 44 × 44 px (`min-h-[44px]`, `size-11`).
- **Espaciado:** base de 4 px. Contenedor `container-lux` (`px-4 sm:px-6 lg:px-10`, `max-w-7xl`). Secciones de la tienda: `py-12 sm:py-16`.
- Los cuadrados se escriben con `size-*`.
- **Capas (z-index fijo):** `float` 30, `header` 40, `overlay` 60, `search` 70, `lightbox` 80, `toast` 90, `skip` 100. No se usan z-index arbitrarios.

## Movimiento

| Caso | Valores |
|---|---|
| Feedback de interacción (botones, chips) | 160–200 ms, `ease-lux` = `cubic-bezier(0.23,1,0.32,1)`, `active:scale-[0.97]` |
| Drawers y paneles | Curva `drawer` = `cubic-bezier(0.32,0.72,0,1)`. Entrada 400 ms, salida 220 ms (la salida es más rápida). |
| Navegación entre páginas | Sólo opacidad, 200 ms |
| Revelado al hacer scroll | `translateY(16px)` → 0 en 500 ms, una sola vez, con stagger de 50 ms |
| Diálogos | `scale(0.96)` → 1 en 200 ms |

- Nunca se anima desde `scale(0)`: el mínimo es 0,6–0,8 con opacidad.
- Sólo se animan `transform` y `opacity`. Nunca `transition-all`: siempre propiedades explícitas.
- En Framer Motion se usan strings de `transform` (aceleradas por GPU), salvo en gestos de arrastre.
- Los bucles se pausan fuera de pantalla (`IntersectionObserver`). Los pulsos tienen un número finito de repeticiones.
- No se anima `blur` ni `backdrop-filter` en superficies grandes.
- Los hovers sólo aplican con puntero real (`hoverOnlyWhenSupported`).
- `MotionConfig reducedMotion="user"` respeta la opción "reducir movimiento" del sistema.

## Accesibilidad

- Los diálogos usan `useDialogA11y`: atrapa el foco, Escape cierra, bloquea el scroll y devuelve el foco al disparador. Llevan `data-dialog-panel`.
- Las acciones destructivas del panel usan `useConfirm()` (`AlertDialog`), nunca `confirm()`. El foco inicial va a "Cancelar".
- Las selecciones (color, talla, pago) usan `input type="radio"` nativo con `sr-only` dentro de un `label` estilizado, y el foco visible con `has-[:focus-visible]`.
- `Field` vincula el error y la ayuda con `aria-describedby` cuando el hijo directo tiene `id === htmlFor`.
- Los botones sólo con ícono llevan `aria-label`, y los íconos decorativos `aria-hidden` (lucide ya lo hace por defecto).
- Los estados deshabilitados no dependen sólo del color: se usa tachado, borde punteado o un texto explicativo.

## Patrones clave

- **Estado vacío del catálogo:** `EmptyCollection` ("Próximamente nuevas colecciones"), con **una sola acción principal**. No se inventan productos, precios ni marcas.
- **Configuración pendiente:** si falta un dato, se muestra un placeholder honesto ("Configuración pendiente") en lugar de un valor de ejemplo.
- **Inicio del panel:** primero la cola "Por atender" (del pedido más antiguo al más nuevo, con acciones de WhatsApp y Revisar). Después la barra de progreso de puesta a punto y la lista "Para reponer". No hay tarjetas de "ícono + número grande".
- **Metadatos:** usar `pageMeta()` de `lib/seo.ts`, que mantiene alineados title, canonical y og:url. Los listados paginados usan `paginatedPath()`.
