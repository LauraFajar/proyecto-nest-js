# AGROTIC Backend API

Backend de la plataforma AGROTIC, una solución integral para la gestión y trazabilidad agrícola. Desarrollado con NestJS, proporciona una API robusta y escalable para todas las operaciones del sistema, desde la gestión de cultivos hasta el monitoreo de sensores IoT en tiempo real.

## ✨ Características Principales

-   **Arquitectura Modular**: Cada funcionalidad principal (usuarios, cultivos, finanzas) está encapsulada en su propio módulo.
-   **Autenticación y Autorización**: Seguridad basada en tokens JWT con un sistema de guardas para proteger las rutas.
-   **Base de Datos Geoespacial**: Utiliza PostgreSQL con la extensión PostGIS para almacenar y consultar datos geográficos de lotes y cultivos.
-   **Comunicación en Tiempo Real**: Integra WebSockets y MQTT para notificaciones instantáneas y monitoreo de dispositivos IoT.
-   **Caché de Datos**: Implementa Redis para el almacenamiento en caché, mejorando el rendimiento de las consultas frecuentes.
-   **Contenerización**: Totalmente configurado para ejecutarse en contenedores Docker, facilitando el despliegue y la escalabilidad.

## 🚀 Tecnologías

-   **Framework**: NestJS
-   **Lenguaje**: TypeScript
-   **Base de Datos**: PostgreSQL + PostGIS (para datos geoespaciales)
-   **ORM**: TypeORM
-   **Caché**: Redis
-   **Contenerización**: Docker y Docker Compose
-   **Autenticación**: JWT (JSON Web Tokens)
-   **Comunicación Real-time**: WebSockets, MQTT

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura modular estándar de NestJS, donde cada recurso o dominio de negocio tiene su propio directorio dentro de `src/`.

```
src/
├── auth/             # Lógica de autenticación, JWT y guardas
├── usuarios/         # Gestión de usuarios y perfiles
├── cultivos/         # Gestión de cultivos
├── lotes/            # Gestión de lotes de tierra (con datos geoespaciales)
├── insumos/          # Gestión de insumos agrícolas
├── inventario/       # Control de inventario
├── finanzas/         # Módulo de finanzas
├── sensores/         # Lógica para sensores IoT
├── alertas/          # Sistema de alertas en tiempo real
├── app.module.ts     # Módulo raíz de la aplicación
└── main.ts           # Punto de entrada de la aplicación
```

## ⚙️ Configuración del Entorno

Antes de ejecutar el proyecto, es necesario crear un archivo `.env` en la raíz del directorio. Este archivo contendrá todas las variables de entorno y secretos que la aplicación necesita para funcionar.

**Ejemplo de `.env`:**

```env
# Configuración del servidor
NODE_ENV=development
PORT=3001

# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_de_db
DB_DATABASE=api_proyecto

# JWT Secret Key
JWT_SECRET=tu_clave_secreta_para_jwt
JWT_EXPIRES_IN=1d

# SMTP Configuración para Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_app_de_google

# URLs y CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# MQTT (si está habilitado)
ENABLE_MQTT=true
MQTT_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=luixxa/dht11
MQTT_RECONNECT_MS=5000
MQTT_KEEPALIVE=30
MQTT_QOS=0

# WebSockets
SOCKET_IO_PATH=/socket.io
SOCKET_IO_NAMESPACE=/iot
```

## 🔧 Instalación y Ejecución Local

### Prerrequisitos

-   Node.js (v18 o superior)
-   NPM
-   Una instancia de PostgreSQL con PostGIS y Redis en ejecución.

### Pasos

1.  **Clonar el repositorio (si aún no lo has hecho):**
    ```bash
    git clone https://github.com/LauraFajar/proyecto-nest-js.git
    cd proyecto-nest-js
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar migraciones de la base de datos (si es necesario):**
    *Nota: Asegúrate de que TypeORM CLI esté configurado en `package.json`.*
    ```bash
    npm run typeorm:run-migrations
    ```

4.  **Poblar la base de datos con datos iniciales (seeding):**
    ```bash
    npm run seed
    ```

5.  **Iniciar la aplicación en modo de desarrollo:**
    El servidor se ejecutará en el puerto definido en tu `.env` (ej. `http://localhost:3001`).
    ```bash
    npm run start:dev
    ```

## 🐳 Ejecución con Docker

La forma más sencilla de levantar todo el entorno (API, base de datos y Redis) es usando Docker Compose.

### Prerrequisitos

-   Docker
-   Docker Compose

### Pasos

1.  **Crear el archivo `.env`:**
    Asegúrate de que el archivo `.env` exista en la raíz del proyecto. Los valores de este archivo serán utilizados por los contenedores.

2.  **Levantar los servicios:**
    Este comando construirá las imágenes (si es la primera vez) y levantará los contenedores de la API, la base de datos de PostgreSQL y el servidor de Redis.
    ```bash
    docker-compose up -d
    ```
    *Usa el flag `-d` para ejecutar los contenedores en segundo plano.*

3.  **Verificar los logs (opcional):**
    ```bash
    docker-compose logs -f api
    ```

4.  **Detener los servicios:**
    ```bash
    docker-compose down
    ```

## 📦 Módulos Principales de la API

-   **Auth**: Autenticación y gestión de tokens.
-   **Usuarios**: CRUD de usuarios.
-   **Cultivos**: Gestión de los diferentes tipos de cultivos.
-   **Lotes**: Administración de las parcelas de tierra.
-   **Insumos**: Gestión de fertilizantes, pesticidas, etc.
-   **Inventario**: Control de stock de insumos.
-   **Finanzas**: Seguimiento de transacciones financieras.
-   **Sensores**: Recepción y gestión de datos de dispositivos IoT.
-   **Alertas**: Emisión de alertas basadas en umbrales de sensores u otros eventos.
-   **Actividades**: Registro de actividades agrícolas.
-   **Reportes**: Generación de reportes.
