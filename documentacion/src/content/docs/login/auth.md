---
title: Autenticación 
description: Aquí se documentan los endpoints relacionados con la autenticación de usuarios, incluyendo el registro, inicio de sesión y los procesos de recuperación y restablecimiento de contraseña.
sidebar:
  order: 1
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo              | Tipo               |
|--------------------|--------------------|
| `id_usuarios`      | number             |
| `nombres`          | string             |
| `email`            | string             |
| `tipo_documento`   | string             |
| `numero_documento` | string             |
| `password`         | string (solicitudes) |
| `id_rol`           | number (solicitudes) |
| `access_token`     | string (respuesta de login) |

---
#  Autenticación 

Este módulo gestiona el registro de usuarios, el inicio de sesión y los procesos de recuperación de contraseñas dentro del sistema.

---

## Endpoints
- `POST /auth/login`
  - Público. Valida credenciales y devuelve JWT y datos básicos del usuario.
- `GET /auth/me`
  - Protegido con `JwtAuthGuard`. Devuelve el usuario actual a partir del token.
- `POST /auth/refresh`
  - Protegido con `JwtAuthGuard`. Emite un nuevo `access_token` usando el usuario del token vigente.
- Relacionados:
  - `POST /auth/forgot-password` y `POST /auth/reset-password` para recuperación (ver backend-tecnico.md).

## DTOs y validaciones
- `LoginDto` (`src/auth/dto/login.dto.ts`):
  - `numero_documento: string` (obligatorio)
  - `password: string` (obligatorio)
- Validación vía `class-validator` y `ValidationPipe` global (whitelist/transform/forbidNonWhitelisted).

## Flujo de login (`AuthController` + `AuthService`)
- `POST /auth/login`:
  - Recibe `LoginDto`.
  - `AuthService.validateUser(numero_documento, password)`:
    - Busca usuario por documento (`UsuariosService.findOneByDocumento`).
    - Compara contraseña con `bcrypt.compare`.
    - Si es correcta, devuelve payload del usuario sin `password`.
  - Si el usuario no existe o la contraseña es inválida se lanza `UnauthorizedException`.
  - `AuthService.login(user)` normaliza el rol y firma JWT (`JwtService.sign`).
  - Respuesta:
    ```json
    {
      "access_token": "<jwt>",
      "user": {
        "id_usuarios": 1,
        "numero_documento": "123456",
        "email": "usuario@dominio.com",
        "nombres": "Nombre Apellido",
        "rol": "Administrador",
        "imagen_url": "/uploads/usuarios/abc.png"
      }
    }
    ```

## Roles y normalización
- Normalización en `AuthService.login`/`refresh`:
  - BD → Enum app:
    - `Administrador` → `Admin`
    - `Instructor` → `Instructor`
    - `Aprendiz` → `Learner`
    - `Pasante` → `Intern`
    - `Invitado` → `Guest`
- Si el usuario no tiene rol o faltan campos clave, se lanza `UnauthorizedException`.

## JWT y seguridad
- `JwtModule` configurado en `AuthModule`:
  - `secret: 'AGROTIC_LALUPA'` (recomendado mover a `.env`).
  - `signOptions: { expiresIn: '1h' }`.
- `JwtStrategy` valida el token y popula `req.user`.
- `JwtAuthGuard` protege rutas `me` y `refresh`.
- `GET /auth/me`:
  - Usa `req.user` (`sub`/`id_usuarios`) para cargar el usuario desde BD y devolver sus datos.
- `POST /auth/refresh`:
  - Usa `req.user` para firmar un nuevo `access_token` y retorna también el objeto `user`.

## Errores comunes
- `401 Unauthorized` en login:
  - Número de documento o contraseña incorrectos.
  - Usuario sin rol asignado o datos incompletos.
- `401 Unauthorized` en `me`/`refresh`:
  - Token ausente, inválido o usuario no encontrado.

## Ejemplos de uso
- Login (cURL):
  ```bash
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{ "numero_documento": "123456", "password": "MiSecreta123" }'
  ```
- Usar el token:
  ```bash
  TOKEN=eyJhbGciOiJI... 
  curl http://localhost:3001/auth/me -H "Authorization: Bearer $TOKEN"
  ```
- Refresh:
  ```bash
  curl -X POST http://localhost:3001/auth/refresh -H "Authorization: Bearer $TOKEN"
  ```

## Recomendaciones
- Mover `JWT secret` a `.env` y cargarlo con `ConfigModule`.
- Considerar refresh tokens dedicados y revocación si se requiere mayor seguridad.
- Limitar orígenes CORS en producción a dominios confiables.
- Registrar intentos fallidos y aplicar políticas de bloqueo si el caso lo amerita.

## Integración con clientes
- Web (React): enviar `numero_documento` y `password`, almacenar `access_token` y enlazarlo a `Authorization: Bearer`.
- Móvil (Expo): igual que web; el token se usa para consumir endpoints protegidos.

