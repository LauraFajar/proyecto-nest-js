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

## 🌱 Características Principales

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

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd proyecto-nest-js

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Configuración de Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb api_proyecto

# Las migraciones se ejecutan automáticamente al iniciar
```

### Variables de Entorno

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=api_proyecto

# JWT
JWT_SECRET=AGROTIC_LALUPA
JWT_EXPIRES_IN=24h

# SMTP (para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
```

## 🏃‍♂️ Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod

# El servidor estará disponible en http://localhost:3000
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Iniciar sesión
- `POST /auth/forgot-password` - Solicitar recuperación
- `POST /auth/reset-password` - Resetear contraseña

### Cultivos
- `GET /cultivos` - Listar cultivos
- `POST /cultivos` - Crear cultivo
- `GET /cultivos/reporte` - Reporte de cultivos

### Actividades
- `GET /actividades` - Listar actividades
- `GET /actividades/reporte` - Reporte de actividades
- `GET /actividades/estadisticas` - Estadísticas

### Sensores IoT
- `GET /sensores` - Listar sensores
- `POST /sensores/:id/lectura` - Registrar lectura
- `GET /sensores/:id/historial` - Historial de lecturas
- `GET /sensores/:id/recomendaciones` - Obtener recomendaciones

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

- **Framework**: NestJS
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT + Passport
- **Email**: Nodemailer
- **Validación**: Class Validator
- **Documentación**: Swagger (opcional)

## 📊 Funcionalidades IoT

- Registro automático de lecturas de sensores
- Alertas por umbrales configurables
- Historial de datos en formato JSON
- Recomendaciones basadas en lecturas
- Notificaciones por email automáticas

## 🚨 Sistema de Alertas

- Alertas de sensores fuera de rango
- Notificaciones de stock bajo
- Recordatorios de actividades vencidas
- Envío automático por email
- Estado de lectura por usuario

## 📈 Reportes Integrados

Los reportes están integrados directamente en cada módulo:

- **Actividades**: Por cultivo, fechas, estados
- **Inventario**: Stock, valorización, categorías
- **Sensores**: Lecturas, alertas, estadísticas
- **Finanzas**: Ingresos, egresos, rentabilidad

## 🔒 Seguridad

- Autenticación JWT
- Protección de rutas con guards
- Validación de datos de entrada
- Manejo seguro de contraseñas
- Tokens de recuperación con expiración

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.
