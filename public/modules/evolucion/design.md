# EVOLUCIÓN — Design System (UX/UI)

## Objetivo

Seguimiento visual del dominio de habilidades por embajador según su cargo. Layout **horizontal** que aprovecha el ancho de pantalla; progreso acumulativo hasta 100% con celebraciones en hitos 30/50/70/90/100.

## Tokens (heredados de `styles.css`)

| Token | Uso |
|-------|-----|
| `--primary` | Progreso activo, hitos 50% |
| `--success` | Ítem completado, hito 100% |
| `--warning` | Hito 70%, categorías parciales |
| `--info` | Hito 30% |
| `--danger` | Errores de red |
| `--bg-card` | Columnas de categoría |
| `--border` | Separadores |

## Vistas

### Tab 1 — Embajadores (resumen)

- Grid responsive de tarjetas (`minmax(260px, 1fr)`).
- Cada tarjeta: avatar/iniciales, nombre, cargo, barra de progreso, % numérico.
- Click abre tab Detalle con ese embajador preseleccionado.
- Filtro por cargo y búsqueda por nombre.

### Tab 2 — Detalle (matriz horizontal)

```
┌ Header sticky ─────────────────────────────────────────────┐
│ [← volver]  Selector embajador  │  Barra global 72%        │
│ Stepper: [30✓] [50✓] [70●] [90○] [100○]                    │
└────────────────────────────────────────────────────────────┘
┌ Scroll horizontal ───────────────────────────────────────────┐
│ [Col Cat.1] [Col Cat.2] [Col Cat.3] ... [Col KPI]           │
└──────────────────────────────────────────────────────────────┘
```

- **Columnas de categoría**: `flex` + `overflow-x: auto`, ancho fijo ~280px, gap 16px.
- **Ítems**: chip con checkbox + texto (2 líneas max, ellipsis).
- **Mini-barra** por categoría al pie de cada columna.
- Sticky header con progreso global mientras se hace scroll vertical interno en columnas altas.

## Componentes

| Componente | Clase | Comportamiento |
|------------|-------|----------------|
| Tarjeta embajador | `.evo-card` | Hover lift, click → detalle |
| Columna categoría | `.evo-col` | Título, lista chips, footer % |
| Chip ítem | `.evo-chip` | Toggle check, estado `.done` |
| Barra global | `.evo-progress-bar` | Ancho = % |
| Stepper hitos | `.evo-milestones` | `.reached` / `.pending` |
| Modal alarma | `.evo-alarm-overlay` | Según umbral |
| Skeleton | `.evo-skeleton` | Loading |

## Alarmas

| Umbral | Color | Icono | Sonido |
|--------|-------|-------|--------|
| 30% | `--info` | 🌱 | Beep 440Hz 150ms |
| 50% | `--primary` | ⭐ | Tono ascendente 440→660Hz |
| 70% | `--warning` | 🔥 | Doble beep |
| 90% | `--warning` + glow | 🚀 | Secuencia 3 tonos |
| 100% | `--success` | 🏆 | Fanfarria + confetti CSS |

- Modal centrado, backdrop blur, botón "Continuar".
- Una sola vez por umbral (persistido en BD).
- Texto: *"¡{nombre} alcanzó el {X}% en su evolución como {cargo}!"*

## Estados

- **Loading**: skeleton en grid y columnas.
- **Empty**: sin embajadores activos o cargo sin matriz.
- **Saving**: chip disabled + spinner en ítem tocado.
- **Error**: toast rojo arriba a la derecha, auto-dismiss 4s.

## Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| ≥1200px | 4+ columnas visibles, grid 3-4 tarjetas |
| 768–1199px | 2-3 columnas visibles, scroll horizontal |
| <768px | Header apilado, columnas 85vw, tarjetas 1 col |

## Accesibilidad

- Checkboxes nativos con `aria-label` = texto del ítem.
- Modal alarma: `role="dialog"`, `aria-modal="true"`.
- Contraste mínimo 4.5:1 sobre `--bg-card`.
- Focus visible en chips y botones.

## Interacción

1. Supervisor marca ítem → PATCH API → actualiza % local.
2. Si cruza umbral nuevo → modal + sonido.
3. Desmarcar ítem reduce % pero **no** revoca alarmas ya registradas.
