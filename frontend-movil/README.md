# AGROTIC APK — Guía rápida

## Requisitos
- Node.js 18+
- Expo CLI instalado globalmente (`npm i -g expo`)
- Dispositivo o emulador Android/iOS, o navegador para modo web

## Instalación
- `npm install`

## Scripts
- `npm start` inicia el servidor de desarrollo de Expo
- `npm run android` abre en emulador/dispositivo Android
- `npm run ios` abre en simulador/dispositivo iOS (macOS)
- `npm run web` abre en navegador

## Configuración de API
- La app detecta automáticamente el host de desarrollo y construye `baseUrl`:
  - Android emulador: `http://10.0.2.2:3001`
  - iOS simulador: `http://localhost:3001`
  - Dispositivo físico (misma red): usa `EXPO_PUBLIC_API_URL`
- Para dispositivos físicos, define la variable con el IP LAN de tu PC:
  - PowerShell (Windows):
    - `setx EXPO_PUBLIC_API_URL "http://<tu-ip-lan>:3001"`
    - Cierra y reabre la terminal y ejecuta `npm run android`
  - Si tu red bloquea el puerto 3001, puedes usar el proxy del backend:
    - `setx EXPO_PUBLIC_API_URL "http://<tu-ip-lan>:8080"`

## Backend
- Proyecto NestJS (`proyecto-nest-js`) expone:
  - API en `:3001`
  - Proxy adicional en `:8080`
  - Health-check en `GET /health`
- Verifica conectividad desde tu dispositivo a `http://<tu-ip-lan>:3001/health` o `:8080/health`

## Autenticación
- La app obtiene el token JWT en login y lo envía como `Authorization: Bearer <token>` en las peticiones.

## Estructura relevante
- `App.js` navegación y providers (Auth, Alert, React Query)
- `src/contexts` manejo de sesión y notificaciones
- `src/pages` módulos funcionales (cultivos, finanzas, actividades, inventario, reportes)
- `src/services` servicios REST; todos usan `baseUrl`

## Problemas comunes
- Dispositivo físico no conecta: revisa firewall y usa `EXPO_PUBLIC_API_URL` con IP correcta
- CORS en web: valida que el backend permita `origin` y `credentials`
- Emulador Android: usa `10.0.2.2` para acceder a `localhost` del host

## Consejos de desarrollo
- Usa `npm start` y escanea el QR con Expo Go
- Prueba `/health` antes de navegar para confirmar conexión

