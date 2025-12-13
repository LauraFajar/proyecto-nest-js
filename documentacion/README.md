# Documentación de AGROTIC 

Este proyecto contiene la documentación de AGROTIC  construida con **Astro** y **Starlight**. Incluye guías de usuario y documentación técnica del backend NestJS.

## Requisitos
- `Node.js >= 18`
- `npm` (o `pnpm`/`yarn`)

## Instalación
1. Instala dependencias:
   ```
   npm install
   ```
2. Ejecuta en desarrollo:
   ```
   npm run dev
   ```
   La documentación se sirve en `http://localhost:4321/`.

## Comandos
- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila el sitio estático en `dist/`.
- `npm run preview`: previsualiza el build localmente.
- `npm run astro [...]`: comandos de la CLI de Astro (por ejemplo `astro check`).

Estos comandos están definidos en `package.json` (`documentacion_agrotic\package.json:1`).

## Estructura
- `src/content/docs/`: contenido principal (`.md` / `.mdx`).
- `src/assets/`: imágenes y recursos.
- `public/`: activos estáticos.
- `astro.config.mjs`: configuración de Starlight y la barra lateral (`documentacion_agrotic\astro.config.mjs:1`).

La página de inicio de la documentación se define en `src/content/docs/index.mdx` (`documentacion_agrotic\src\content\docs\index.mdx:1`).

## Despliegue
Tras `npm run build`, el sitio resultante queda en `dist/`. Puedes publicarlo en cualquier hosting de estáticos (Netlify, Vercel, GitHub Pages, etc.).

## Enlaces útiles
- Astro: https://docs.astro.build
- Starlight: https://starlight.astro.build
