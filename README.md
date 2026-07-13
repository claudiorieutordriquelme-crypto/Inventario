# Artesania Manager

Software de gestion para un negocio de manualidades (crochet / estampado): inventario,
funnel de clientes, notificaciones de entrega, catalogo compartible en redes y comunidad.

Una sola base de codigo (React + TypeScript + Vite) que corre en el navegador del PC hoy,
y se empaqueta como **app de escritorio** (Electron) y **app movil** (Capacitor).

## Estado actual (MVP)

- **Dos modos automaticos** segun exista o no `.env`:
  - Sin `.env`: **modo local** (localStorage), sin login, funciona de inmediato.
  - Con `.env`: **modo nube** (Supabase), con login y multiusuario. Ver "Modo nube".
- Toda la data pasa por una unica capa (`src/lib/store.ts`); la UI es identica en ambos modos.

Modulos incluidos:

| Modulo | Que hace |
|---|---|
| Dashboard | KPIs: valor de inventario, pipeline, cycle time, conversion, alertas y entregas |
| Inventario | Insumos, productos, receta (BOM), kardex de movimientos, produccion con descuento de insumos, alertas por punto de reorden (ROP) |
| Funnel | Tablero por etapas (Lead -> Entregado), cycle time (promedio y mediana), valor del pipeline |
| Clientes | Base de contactos con canal de captacion |
| Notificaciones | Alertas in-app de entregas proximas/vencidas y quiebres de stock |
| Catalogo | Disenos para compartir en WhatsApp / Instagram / TikTok (Web Share API) |
| Comunidad | Publicaciones internas con likes |

## Requisitos

- Node.js 20+ y npm 10+.

## Uso (desarrollo / PC)

```bash
npm install
npm run dev      # abre http://localhost:5173
npm run build    # valida tipos y genera build de produccion en dist/
```

## App de escritorio (Electron)

Herramientas de empaquetado no vienen en la instalacion base para mantenerla liviana.
Instalarlas cuando se quiera generar el ejecutable:

```bash
npm install -D electron electron-builder concurrently wait-on
npm run electron:dev     # app de escritorio en modo desarrollo
npm run electron:build   # genera instalador (requiere config de electron-builder)
```

## App movil (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli
npx cap init            # usa capacitor.config.ts ya incluido
npm install @capacitor/android
npx cap add android
npm run cap:sync        # build web + sync
npx cap run android     # requiere Android Studio / emulador
```
> iOS requiere macOS con Xcode.

## Modo nube (Supabase) - multiusuario

La integracion **ya esta cableada** en el codigo (`@supabase/supabase-js` instalado, cliente
en `src/lib/supabase.ts`, login en `src/features/auth/`, y sincronizacion automatica en
`src/lib/store.ts`). Se activa sola cuando existe el archivo `.env`. Pasos:

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pegar y ejecutar `supabase/migrations/0001_schema.sql`
   (crea las 8 tablas en formato JSONB + Row Level Security).
3. En **Authentication > Providers**, dejar habilitado **Email**. Para probar rapido, puedes
   desactivar "Confirm email" mientras desarrollas.
4. En **Project Settings > API**, copiar la **Project URL** y la **anon public key**.
5. Copiar `.env.example` a `.env` y completar:
   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
6. `npm run dev` -> aparece la pantalla de login. Crea una cuenta y entra.
   La primera vez se siembran datos de ejemplo en tu cuenta (puedes borrarlos).

Como funciona: al iniciar sesion, `initCloud()` descarga tus datos; cada cambio se sincroniza
solo (upsert/delete por diff). Los componentes de UI no cambian entre modo local y nube.

> Seguridad: en el cliente va **solo** la anon key (es publica por diseno). La `service_role`
> jamas debe ir al frontend ni al repositorio. RLS aisla los datos por usuario desde el dia uno.
> El `.env` esta en `.gitignore`: no se sube al repo.

## Marcos aplicados

- **Inventario - Punto de Reorden (ROP)** (ASCM/APICS): alerta cuando `stock_actual <= stock_minimo`.
  `ROP = demanda_diaria * lead_time + stock_seguridad`. Helper `sugerirStockMinimo` en
  `src/lib/inventory.ts`. En el MVP el minimo se fija manual y se recalibra con historial real.
- **Funnel - Cycle Time** (lean): `entregado - creado`. Se reporta promedio **y** mediana + n,
  porque con bajo volumen el promedio es ruidoso.

## Marca

- Tipografia: **Barlow**.
- Colores: `#002eff` (primary), `#ff3d00` (accent), `#41e8b4` (secondary). Definidos en
  `tailwind.config.js`. No usar colores fuera de esa paleta.

## Estructura

```
src/
  lib/          store (datos), tipos, formato CLP/fechas, ROP, cycle time, notificaciones, share
  components/   Layout + primitivas de UI (Card, Modal, Badge, StatTile...)
  features/     dashboard, inventory, funnel, catalog, community, notifications
electron/       envoltorio de escritorio
supabase/       migracion SQL de referencia para la nube
```

## Roadmap

- Integracion ecommerce / TikTok Shop (Fase 6): la tabla `products` ya trae SKU, precio,
  stock e imagen para sincronizar con la plataforma de venta.
- Notificaciones por email (Supabase Edge Functions) y push movil (FCM via Capacitor).
