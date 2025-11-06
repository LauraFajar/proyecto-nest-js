<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

AgroTIC - Sistema de Trazabilidad de Cultivos

Backend modular desarrollado con NestJS y PostgreSQL para la gestión y trazabilidad de cultivos de plátano, cacao y cilantro cimarrón.

## Características Principales

### Módulos Implementados

- **🔐 Autenticación**: JWT, registro, login, recuperación de contraseña
- **🌾 Cultivos**: Gestión de cultivos, actividades, calendario agrícola
- **📊 Sensores IoT**: Monitoreo en tiempo real, alertas automáticas, historial
- **📦 Inventario**: Control de insumos, stock bajo, reportes
- **💰 Finanzas**: Ingresos, egresos, análisis financiero
- **🔔 Alertas**: Notificaciones por email, sistema de alertas
- **📈 Reportes**: Integrados en cada módulo, sin tablas adicionales

### Optimizaciones Realizadas

- ✅ **Sin módulo de reportes separado**: Funcionalidad integrada en controladores existentes
- ✅ **Historial de sensores en JSON**: Evita tabla adicional para datos históricos
- ✅ **Alertas reutilizadas**: Una sola entidad para alertas y notificaciones
- ✅ **Entidades optimizadas**: Campos agregados a entidades existentes

## Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- Docker y Docker Compose
- npm o yarn

### Opción 1: Ejecutar con Docker (Recomendado)

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd proyecto-nest-js

# 2. Ejecutar toda la aplicación (API + PostgreSQL + Redis)
docker-compose up -d

# 3. Ver logs para verificar que todo funciona
docker-compose logs -f

# 4. La aplicación estará disponible en:
# - API: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Opción 2: Ejecutar Localmente

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd proyecto-nest-js

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones locales

# 4. Instalar y configurar PostgreSQL + Redis localmente
# O usar Docker solo para servicios:
docker run -d --name postgres-db -p 5432:5432 -e POSTGRES_DB=api_proyecto -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=123789 postgres:15
docker run -d --name redis-cache -p 6379:6379 redis:alpine

# 5. Ejecutar migraciones de base de datos
npm run typeorm:run-migrations

# 6. Ejecutar seeds (datos iniciales)
npm run seed

# 7. Ejecutar en modo desarrollo
npm run start:dev
```

### Variables de Entorno

```env
# Database
DB_HOST=localhost          # 'postgres' si usas Docker
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123789
DB_DATABASE=api_proyecto

# Redis
REDIS_HOST=localhost       # 'redis' si usas Docker
REDIS_PORT=6379

# JWT
JWT_SECRET=AGROTIC_LALUPA
JWT_EXPIRES_IN=24h

# SMTP (para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# API
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Ejecución

### Con Docker:
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir después de cambios
docker-compose up --build -d
```

### Local:
```bash
# Desarrollo (con hot reload)
npm run start:dev

# Producción
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Gestión de Base de Datos

```bash
# Ejecutar migraciones
npm run typeorm:run-migrations

# Revertir migración
npm run typeorm:revert-migration

# Generar nueva migración
npm run typeorm:generate-migration -- -n NombreMigracion

# Crear migración vacía
npm run typeorm:create-migration -- -n NombreMigracion

# Ejecutar seeds
npm run seed
```

## Testing y Calidad

```bash
# Tests unitarios
npm run test

# Tests con watch mode
npm run test:watch

# Cobertura de tests
npm run test:cov

# Tests e2e
npm run test:e2e

# Linter
npm run lint

# Formatear código
npm run format
```

## Construcción

```bash
# Construir para producción
npm run build

# El código compilado queda en dist/
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Iniciar sesión (devuelve `imagen_url`)
- `POST /auth/forgot-password` - Solicitar recuperación
- `POST /auth/reset-password` - Resetear contraseña

### Usuarios
- `GET /usuarios` - Listar usuarios (Admin)
- `GET /usuarios/:id` - Obtener usuario (Admin)
- `PATCH /usuarios/:id` - Actualizar usuario (Admin o propio perfil)
- `POST /usuarios/:id/upload-imagen` - Subir imagen de perfil

### Cultivos
- `GET /cultivos` - Listar cultivos
- `POST /cultivos` - Crear cultivo
- `GET /cultivos/reporte` - Reporte de cultivos
- `GET /cultivos/estadisticas` - Estadísticas
- `GET /cultivos/calendario` - Calendario agrícola

### Actividades
- `GET /actividades` - Listar actividades
- `GET /actividades/reporte` - Reporte de actividades
- `GET /actividades/estadisticas` - Estadísticas

### Sensores IoT
- `GET /sensores` - Listar sensores
- `POST /sensores/:id/lectura` - Registrar lectura
- `GET /sensores/:id/historial` - Historial de lecturas
- `GET /sensores/:id/recomendaciones` - Obtener recomendaciones
- `GET /sensores/tiempo-real` - Datos en tiempo real

### Inventario
- `GET /inventario` - Listar inventario
- `GET /inventario/reporte` - Reporte de inventario
- `GET /inventario/stock-bajo` - Items con stock bajo
- `GET /inventario/estadisticas` - Estadísticas

### Alertas/Notificaciones
- `GET /alertas` - Listar alertas
- `GET /alertas/usuario/:id` - Alertas por usuario
- `POST /alertas/notificar/sensor` - Notificar alerta de sensor
- `PATCH /alertas/:id/marcar-leida` - Marcar como leída
- `POST /alertas/notificar/stock-bajo` - Notificar stock bajo
- `POST /alertas/notificar/actividad-vencida` - Notificar actividad vencida

### EPA (Enfermedades, Plagas, Arvenses)
- `GET /epa` - Listar EPA
- `POST /epa` - Crear EPA (con imagen opcional)
- `GET /epa/:id` - Obtener EPA (incluye `imagen_referencia`)
- `PATCH /epa/:id` - Actualizar EPA
- `POST /epa/:id/upload-imagen` - Subir imagen a EPA existente
- `GET /epa/buscar` - Buscar EPA
- `GET /epa/tipos` - Tipos disponibles

## 🏗️ Arquitectura

### Estructura del Proyecto

```
src/
├── auth/                 # Autenticación y autorización
├── actividades/          # Gestión de actividades agrícolas
├── alertas/             # Sistema de alertas y notificaciones
├── cultivos/            # Gestión de cultivos
├── inventario/          # Control de inventario
├── sensores/            # IoT y monitoreo
├── usuarios/            # Gestión de usuarios
└── [otros módulos]/     # Módulos adicionales
```

### Entidades Principales

- **Usuario**: Gestión de usuarios y roles
- **Cultivo**: Información de cultivos y lotes
- **Actividad**: Actividades agrícolas con fechas y costos
- **Sensor**: Sensores IoT con historial JSON
- **Alerta**: Alertas y notificaciones unificadas
- **Inventario**: Control de stock de insumos

## 🔧 Tecnologías Utilizadas

- **Framework**: NestJS (Node.js)
- **Base de Datos**: PostgreSQL (en contenedor Docker)
- **Cache**: Redis (en contenedor Docker)
- **ORM**: TypeORM con Migraciones
- **Autenticación**: JWT + Passport
- **Email**: Nodemailer
- **Validación**: Class Validator + Class Transformer
- **File Upload**: Multer con configuración dinámica
- **WebSockets**: Socket.io para alertas en tiempo real
- **Contenedores**: Docker + Docker Compose
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## Funcionalidades IoT

- **Registro automático** de lecturas de sensores (humedad, temperatura, pH)
- **Alertas configurables** por umbrales mínimo/máximo
- **Historial JSON** optimizado (sin tablas adicionales)
- **Recomendaciones inteligentes** basadas en lecturas
- **WebSockets** para monitoreo en tiempo real
- **Notificaciones automáticas** por email

## Sistema de Alertas

- **Alertas de sensores** fuera de rango
- **Notificaciones de stock bajo** en inventario
- **Recordatorios** de actividades vencidas
- **Envío automático** por email con templates HTML
- **Estado de lectura** por usuario
- **WebSockets** para notificaciones en tiempo real

## Sistema de Archivos

- **Upload de imágenes** para usuarios y EPA
- **Carpetas organizadas**: `uploads/usuarios/`, `uploads/epa/`
- **Nombres únicos** con UUID
- **URLs accesibles** vía HTTP
- **Configuración dinámica** por módulo

## Reportes Integrados

Los reportes están integrados directamente en cada módulo:

- **Actividades**: Por cultivo, fechas, estados, costos
- **Inventario**: Stock, valorización, categorías, estadísticas
- **Sensores**: Lecturas, alertas, estadísticas IoT
- **Finanzas**: Ingresos, egresos, rentabilidad
- **Cultivos**: Estadísticas, calendario agrícola

## Seguridad y Escalabilidad

- **Autenticación JWT** con refresh tokens
- **Role-based access control** (RBAC)
- **Guards y decorators** personalizados
- **Validación de DTOs** con class-validator
- **Hashing de contraseñas** con bcrypt
- **Rate limiting** implícito
- **CORS configurado** para frontend
- **Cache Redis** para optimización
- **Arquitectura preparada** para microservicios

## Infraestructura Docker

- **Contenedores independientes**: API, PostgreSQL, Redis
- **Redes aisladas** para comunicación segura
- **Volúmenes persistentes** para datos
- **Configuración de producción** lista
- **Escalabilidad horizontal** preparada

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request
