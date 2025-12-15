# AgroTic APK — Guía rápida

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

## Cómo volver a manejar el aplicativo móvil
- Instala dependencias: `npm install`
- Inicia el servidor de desarrollo: `npm start` (Expo)
- Elige la plataforma:
  - Android: `npm run android` (requiere Android Studio y un AVD)
  - iOS (solo macOS): `npm run ios`
  - Web: `npm run web`
- Limpia caché si hay problemas: `expo start -c`
- Si usas dispositivo físico, configura la IP del backend como se indica en “Cambio de IP”.
- Verifica conexión: abre `http://<tu-ip-lan>:3001/health` o `:8080/health` desde el dispositivo.

## Cambio de IP para dispositivos físicos
- Obtén tu IP LAN en Windows: ejecuta `ipconfig` y usa el valor IPv4 de tu adaptador de red (por ejemplo `192.168.1.23`).
- Define la URL del backend en la app móvil mediante variable de entorno:
  - PowerShell:
    - `setx EXPO_PUBLIC_API_URL "http://<tu-ip-lan>:3001"`
    - Cierra y reabre la terminal y corre `npm run android`
  - Alternativo (si el puerto 3001 no es accesible desde la red): `setx EXPO_PUBLIC_API_URL "http://<tu-ip-lan>:8080"`
- La app detecta automáticamente `EXPO_PUBLIC_API_URL` en dispositivos físicos. En emuladores, usa:
  - Android: `http://10.0.2.2:3001`
  - iOS: `http://localhost:3001`
- Para el flujo de recuperación de contraseña (deeplink `agrotic://`), no necesitas IP pública; el enlace abre la pantalla interna de restablecer con el token.

## APK de AgroTIC (Android)
- ¿Qué es? Un paquete instalable que incluye el bundle JS, assets y configuración de red. Las peticiones REST usarán la URL definida por `EXPO_PUBLIC_API_URL` en tiempo de build/ejecución.
- Recomendado: usar EAS Build (Expo Application Services).
  1. Instala EAS CLI: `npm i -g eas-cli`
  2. Inicia sesión: `eas login`
  3. Configura `eas.json` con un perfil que genere APK y establezca la URL del backend:
     ```json
     {
       "cli": { "version": ">= 3.17.0" },
       "build": {
         "preview": {
           "android": { "buildType": "apk" },
           "env": { "EXPO_PUBLIC_API_URL": "http://<tu-ip-o-dominio>:8080" }
         },
         "production": {
           "android": { "buildType": "apk" },
           "env": { "EXPO_PUBLIC_API_URL": "https://api.tudominio.com" }
         }
       }
     }
     ```
  4. Ejecuta el build: `eas build -p android --profile preview`
  5. Descarga el `.apk` desde el panel de EAS o el enlace que da la CLI y pruébalo en un dispositivo.
- Consideraciones:
  - En producción, usa dominio público (`https://api.tudominio.com`) en `EXPO_PUBLIC_API_URL`.
  - Si cambias la IP/URL del backend, vuelve a recompilar o asegura que la app lea la variable en runtime.
  - Deep links del flujo de contraseña usan el esquema `agrotic://reset-password?token=...`. Si prefieres abrir una URL HTTP, el backend soporta `MOBILE_RESET_URL` para construir el enlace.
