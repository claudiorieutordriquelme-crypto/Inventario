# Despliegue de Artesania Manager

Para que la app y el **link publico del catalogo** funcionen en internet (no solo en
tu equipo), hay que publicarla en un hosting. Ya estan listas las configuraciones para
**Vercel** (`vercel.json`) y **Netlify** (`netlify.toml`). Elige UNA de las dos opciones.

El repo se despliega solo en cada `git push` a `main`.

## Requisitos previos
- Repo en GitHub: `claudiorieutordriquelme-crypto/Inventario` (ya existe).
- Credenciales Supabase a mano (Project Settings > API):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` (la publishable/anon key, es publica; NUNCA la service_role).

---

## Opcion A: Vercel (recomendada, mas simple)

1. Entra a https://vercel.com y crea cuenta con tu GitHub.
2. **Add New > Project** > importa el repo `Inventario`.
3. Vercel detecta Vite automaticamente (build `npm run build`, output `dist`).
4. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. **Deploy**. Al terminar te da una URL tipo `https://inventario-xxx.vercel.app`.
6. (Opcional) **Settings > Domains** para conectar un dominio propio.

## Opcion B: Netlify

1. Entra a https://netlify.com y crea cuenta con GitHub.
2. **Add new site > Import an existing project** > repo `Inventario`.
3. Build command `npm run build`, publish directory `dist` (ya vienen en `netlify.toml`).
4. **Site settings > Environment variables**: agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. **Deploy**. URL tipo `https://inventario-xxx.netlify.app`.

---

## Despues de desplegar

- Abre la URL publica e inicia sesion; deberia comportarse igual que en local.
- El **link del catalogo** (boton "Compartir catalogo") ahora usara tu dominio real,
  asi que sirve para compartir en Instagram, WhatsApp y TikTok.
- Si cambiaste algo local, `git push` y el hosting redepliega solo.

## Notas de seguridad
- El `.env` local NO se sube al repo (esta en `.gitignore`); las variables se cargan en
  el panel del hosting.
- En el cliente va solo la **anon key** (publica por diseno). La `service_role` jamas.
- Recuerda reactivar "Confirm email" en Supabase antes de operar con clientes reales.

## Pendiente en Supabase
- Ejecutar una vez `supabase/migrations/0002_ideas.sql` en el SQL Editor para que el
  modulo Planning persista en la nube.
