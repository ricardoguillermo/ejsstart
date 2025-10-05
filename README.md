# EJS Starter (Express + EJS + JSON storage)

## Requisitos
- Node 18+

## Paso a paso (local)
1) Copia `.env.example` a `.env` y completa:
```
SESSION_SECRET=algo_secreto
ADMIN_USER=admin
ADMIN_PASS=changeme
```
2) Instalar dependencias:
```
npm install
```
3) Ejecutar en desarrollo:
```
npm run dev
```
4) Ir a `http://localhost:3000`.
5) Admin en `http://localhost:3000/login` (usa las credenciales del .env).

## Estructura
- `server.js` arranca la app
- `src/views/` EJS (con layout y parciales)
- `src/routes/` rutas
- `src/controllers/` lógica de rutas
- `src/lib/db.js` almacenamiento en JSON (data/items.json)
- `public/` estáticos (CSS)
- `data/items.json` tus piezas

## Despliegue en Render (sugerido)
- Create New → Web Service → conecta tu repo
- Build Command: *(vacío, Render instalará deps)*
- Start Command: `node server.js`
- Variables de entorno: `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASS`
- **Persistencia**: este proyecto escribe en `data/items.json`. En Render, el filesystem es efímero entre deploys. Para que los cambios del admin persistan, usa **Disks** (Render → Disks) o una base de datos externa (p.ej. PostgreSQL o Mongo).

## Notas
- Seguridad: `express-session` con MemoryStore solo para desarrollo.
- Subida de archivos: por simplicidad, el formulario acepta URLs de imagen/audio/video. Si quieres subir archivos reales, luego agregamos un endpoint y un CDN (p.ej. BunnyCDN).
