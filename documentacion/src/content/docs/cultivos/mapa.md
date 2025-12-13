---
title: Mapa de Lotes
description: Documentación del módulo de lotes, que permite la gestión de los espacios o áreas donde se desarrollan los cultivos dentro del sistema.
---
# Módulo: Mapa de Lotes

Este documento describe los endpoints y flujos del mapa de lotes, incluyendo CRUD de `Lote` y operaciones de coordenadas. Se incluye también el acceso a datos geoespaciales y relación con `Sublote` para visualización.

## Seguridad y Accesos

- Autenticación: `JWT` obligatorio.
- Autorización: `RolesGuard` con roles `Admin`, `Instructor`, `Learner`, `Intern` según endpoint.
- Permisos: Decorador `Permisos` en operaciones sensibles (`editar`, `ver`, `eliminar`).

## Entidades

- `Lote`: `id_lote`, `nombre_lote`, `descripcion`, `activo`, `coordenadas` (Polygon), relaciones con `Sublote[]` y `Cultivo[]`.
- `Sublote` (referencia en mapa): `id_sublote`, `descripcion`, `ubicacion`, `coordenadas` (Polygon), relación con `Lote` y `Sensor[]`.

## Tablas de Base de Datos


#### Tabla: `lotes`

| Columna       | Tipo                | Nulo     | Default  | Clave | Referencia | Notas                         |
|---------------|---------------------|----------|----------|-------|------------|-------------------------------|
| `id_lote`     | integer             | NO       | —        | PK    | —          | Autogenerada                  |
| `nombre_lote` | varchar(30)         | NO       | —        | —     | —          | —                             |
| `descripcion` | varchar(50)         | SÍ       | —        | —     | —          | —                             |
| `activo`      | boolean             | NO       | true     | —     | —          | —                             |
| `coordenadas` | geography Polygon    | SÍ       | —        | —     | —          | `srid 4326` (WGS84)           |

Relaciones: 1:N con `cultivos`, 1:N con `sublotes`.

#### Tabla: `sublotes`

| Columna        | Tipo                | Nulo     | Default | Clave | Referencia            | Notas               |
|----------------|---------------------|----------|---------|-------|-----------------------|---------------------|
| `id_sublote`   | integer             | NO       | —       | PK    | —                     | Autogenerada        |
| `id_lote`      | integer             | NO       | —       | FK    | `lotes(id_lote)`      | —                   |
| `descripcion`  | varchar(50)         | NO       | —       | —     | —                     | —                   |
| `ubicacion`    | varchar(50)         | NO       | —       | —     | —                     | —                   |
| `coordenadas`  | geography Polygon    | SÍ       | —       | —     | —                     | `srid 4326`         |

Relaciones: 1:N con `sensores`.

#### Tabla: `cultivos`

| Columna                 | Tipo         | Nulo     | Default    | Clave | Referencia           | Notas                  |
|-------------------------|--------------|----------|------------|-------|----------------------|------------------------|
| `id_cultivo`            | integer      | NO       | —          | PK    | —                    | Autogenerada           |
| `nombre_cultivo`        | varchar(100) | NO       | —          | —     | —                    | —                      |
| `tipo_cultivo`          | varchar(20)  | NO       | —          | —     | —                    | `transitorios|perennes|semiperennes` |
| `fecha_siembra`         | date         | SÍ       | —          | —     | —                    | —                      |
| `fecha_cosecha_estimada`| date         | SÍ       | —          | —     | —                    | —                      |
| `fecha_cosecha_real`    | date         | SÍ       | —          | —     | —                    | —                      |
| `estado_cultivo`        | varchar      | NO       | `sembrado` | —     | —                    | —                      |
| `observaciones`         | text         | SÍ       | —          | —     | —                    | —                      |
| `id_lote`               | integer      | SÍ       | —          | FK    | `lotes(id_lote)`     | `onDelete: SET NULL`   |
| `id_insumo`             | integer      | SÍ       | —          | FK    | `insumos(id_insumo)` | `onDelete: SET NULL`   |

Relaciones: N:1 con `lote`, N:1 con `insumo`, 1:N con `actividades`.

#### Tabla: `sensores`

| Columna            | Tipo                 | Nulo     | Default | Clave | Referencia               | Notas                           |
|--------------------|----------------------|----------|---------|-------|--------------------------|---------------------------------|
| `id_sensor`        | integer              | NO       | —       | PK    | —                        | Autogenerada                    |
| `tipo_sensor`      | varchar              | NO       | —       | —     | —                        | —                               |
| `valor_minimo`     | decimal(10,2)        | SÍ       | —       | —     | —                        | —                               |
| `valor_maximo`     | decimal(10,2)        | SÍ       | —       | —     | —                        | —                               |
| `valor_actual`     | decimal(10,2)        | SÍ       | —       | —     | —                        | —                               |
| `ultima_lectura`   | timestamp            | SÍ       | —       | —     | —                        | —                               |
| `estado`           | varchar              | NO       | `activo`| —     | —                        | —                               |
| `configuracion`    | text                 | SÍ       | —       | —     | —                        | —                               |
| `historial_lecturas`| json                | SÍ       | —       | —     | —                        | Arreglo de lecturas             |
| `mqtt_host`        | varchar              | SÍ       | —       | —     | —                        | —                               |
| `mqtt_port`        | int                  | SÍ       | —       | —     | —                        | —                               |
| `mqtt_topic`       | varchar              | SÍ       | —       | —     | —                        | —                               |
| `mqtt_username`    | varchar              | SÍ       | —       | —     | —                        | —                               |
| `mqtt_password`    | varchar              | SÍ       | —       | —     | —                        | —                               |
| `mqtt_enabled`     | boolean              | NO       | false   | —     | —                        | —                               |
| `mqtt_client_id`   | varchar              | SÍ       | —       | —     | —                        | —                               |
| `https_url`        | varchar              | SÍ       | —       | —     | —                        | —                               |
| `https_method`     | varchar              | SÍ       | —       | —     | —                        | —                               |
| `https_headers`    | varchar              | SÍ       | —       | —     | —                        | JSON string                     |
| `https_enabled`    | boolean              | NO       | false   | —     | —                        | —                               |
| `https_auth_token` | varchar              | SÍ       | —       | —     | —                        | —                               |
| `created_at`       | timestamp            | NO       | now()   | —     | —                        | CreateDateColumn                |
| `updated_at`       | timestamp            | NO       | now()   | —     | —                        | UpdateDateColumn                |
| `id_sublote`       | integer              | NO       | —       | FK    | `sublotes(id_sublote)`   | N:1                              |


## Esquema de Coordenadas (Polygon)

- Tipo: `number[][][]` (colección de anillos). Ejemplo: `[[[lon, lat], [lon, lat], ...]]]`.
- Se aceptan claves `coordenadas` o `coordinates` en endpoints de coordenadas.

## Endpoints Lotes

### Crear Lote

- `POST /lotes`
- Roles: `Admin`, `Instructor`
- Body (CreateLoteDto):
  ```json
  {
    "nombre_lote": "Lote A",
    "descripcion": "Sector norte",
    "activo": true,
    "coordenadas": [[[ -76.5001, 3.4201 ], [ -76.5009, 3.4208 ], [ -76.5014, 3.4202 ], [ -76.5001, 3.4201 ]]]
  }
  ```
- Respuesta 201:
  ```json
  {
    "id_lote": 12,
    "nombre_lote": "Lote A",
    "descripcion": "Sector norte",
    "activo": true,
    "coordenadas": [[[ -76.5001, 3.4201 ], [ -76.5009, 3.4208 ], [ -76.5014, 3.4202 ], [ -76.5001, 3.4201 ]]],
    "sublotes": [],
    "cultivos": []
  }
  ```

### Listar Lotes

- `GET /lotes`
- Roles: `Admin`, `Instructor`, `Learner`, `Intern`
- Respuesta 200:
  ```json
  [
    {
      "id_lote": 12,
      "nombre_lote": "Lote A",
      "descripcion": "Sector norte",
      "activo": true
    }
  ]
  ```

### Datos para Mapa

- `GET /lotes/map-data`
- Roles: `Admin`, `Instructor`, `Learner`, `Intern`
- Retorna lotes con datos geoespaciales y sublotes relacionados:
  ```json
  [
    {
      "id_lote": 12,
      "nombre_lote": "Lote A",
      "coordenadas": [[[ -76.5001, 3.4201 ], [ -76.5009, 3.4208 ], [ -76.5014, 3.4202 ], [ -76.5001, 3.4201 ]]],
      "sublotes": [
        {
          "id_sublote": 5,
          "descripcion": "A-1",
          "ubicacion": "Norte",
          "coordenadas": [[[ -76.5002, 3.4202 ], [ -76.5007, 3.4206 ], [ -76.5011, 3.4203 ], [ -76.5002, 3.4202 ]]]
        }
      ]
    }
  ]
  ```

### Obtener Lote

- `GET /lotes/:id`
- Roles: `Admin`, `Instructor`, `Learner`, `Intern`
- Respuesta 200:
  ```json
  {
    "id_lote": 12,
    "nombre_lote": "Lote A",
    "descripcion": "Sector norte",
    "activo": true,
    "coordenadas": [[[ ... ]]],
    "sublotes": []
  }
  ```

### Actualizar Lote

- `PATCH /lotes/:id`
- Roles: `Admin`, `Instructor`
- Permiso: `{ recurso: 'lotes', accion: 'editar' }`
- Body (UpdateLoteDto, parcial):
  ```json
  { "descripcion": "Sector norte actualizado", "activo": false }
  ```
- Respuesta 200: objeto `Lote` actualizado.

### Eliminar Lote

- `DELETE /lotes/:id`
- Roles: `Admin`, `Instructor`
- Respuesta 200/204 según configuración: eliminación por `delete(id)`.

### Actualizar Coordenadas (PUT)

- `PUT /lotes/:id/coordenadas`
- Roles: `Admin`, `Instructor`, `Learner`, `Intern`
- Permiso: `{ recurso: 'lotes', accion: 'editar' }`
- Body:
  ```json
  {
    "coordenadas": [[[ -76.50, 3.42 ], [ -76.501, 3.421 ], [ -76.502, 3.42 ], [ -76.50, 3.42 ]]]
  }
  ```
- Respuesta 200: `Lote` con `coordenadas` actualizadas.

### Crear/Actualizar Coordenadas (POST)

- `POST /lotes/:id/coordenadas`
- Roles: `Admin`, `Instructor`, `Learner`, `Intern`
- Permiso: `{ recurso: 'lotes', accion: 'editar' }`
- Body acepta `coordenadas` o `coordinates` con el mismo formato.
- Respuesta 200: `Lote` con `coordenadas` actualizadas.

## Endpoints Sublotes (referencia de mapa)

### Crear Sublote
- `POST /sublotes` (Roles: `Admin`, `Instructor`)
- Body:
  ```json
  {
    "descripcion": "A-1",
    "ubicacion": "Norte",
    "id_lote": 12,
    "coordenadas": [[[ -76.5002, 3.4202 ], [ -76.5007, 3.4206 ], [ -76.5011, 3.4203 ], [ -76.5002, 3.4202 ]]]
  }
  ```

### Listar Sublotes
- `GET /sublotes` (Roles: `Admin`, `Instructor`, `Learner`, `Intern`)

### Datos para Mapa de Sublotes
- `GET /sublotes/map-data` (Roles: `Admin`, `Instructor`, `Learner`, `Intern`)

### Sensores de un Sublote
- `GET /sublotes/:id/sensores`

### Estadísticas de un Sublote
- `GET /sublotes/:id/estadisticas`

### Obtener / Actualizar / Eliminar Sublote
- `GET /sublotes/:id`
- `PATCH /sublotes/:id`
- `DELETE /sublotes/:id`

## Ejemplos cURL

### Crear Lote
```bash
curl -X POST "https://api.example.com/lotes" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_lote": "Lote A",
    "descripcion": "Sector norte",
    "activo": true,
    "coordenadas": [[[ -76.5001, 3.4201 ], [ -76.5009, 3.4208 ], [ -76.5014, 3.4202 ], [ -76.5001, 3.4201 ]]]
  }'
```

### Actualizar Coordenadas
```bash
curl -X PUT "https://api.example.com/lotes/12/coordenadas" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "coordenadas": [[[ -76.50, 3.42 ], [ -76.501, 3.421 ], [ -76.502, 3.42 ], [ -76.50, 3.42 ]]]
  }'
```

### Obtener Map Data
```bash
curl -X GET "https://api.example.com/lotes/map-data" \
  -H "Authorization: Bearer <JWT>"
```
