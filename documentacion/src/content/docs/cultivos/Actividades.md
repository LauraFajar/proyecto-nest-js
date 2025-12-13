---
title: Actividades
description: Documentación del módulo de actividades, que permite gestionar las tareas agrícolas relacionadas con los cultivos y su seguimiento.
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo           | Tipo               |
|-----------------|--------------------|
| `id_actividad`  | number             |
| `tipo_actividad`| string             |
| `fecha`         | string (YYYY-MM-DD) |
| `responsable`   | string             |
| `detalles`      | string             |
| `estado`        | string             |
| `id_cultivo`    | number             |

---
# Módulo: Actividades

Documentación completa de CRUD y endpoints auxiliares para gestión de actividades agrícolas, incluyendo fotos, recursos, reportes y estadísticas.

## Seguridad

- Autenticación: `JwtAuthGuard` obligatorio en todos los endpoints.
- Validaciones: `class-validator` sobre DTOs y `ValidationPipe` en listados.

## Entidad Actividad (resumen)

Campos principales:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_actividad | number | |
| tipo_actividad | string | |
| fecha | string (YYYY-MM-DD) | |
| responsable | string | |
| detalles | string | |
| estado | string | |
| id_cultivo | number | |
| costo_mano_obra | | |
| costo_maquinaria | | |
| observaciones | | |

- Relaciones: `cultivo`, `fotos` (`FotoActividad[]`), `recursos` (tabla `utiliza` con `Insumo`).

## DTOs de Entrada

### `CreateActividadeDto`

| Campo | Tipo/Validaciones |
|-------|-------------------|
| tipo_actividad | siembra\|riego\|fertilizacion\|poda\|cosecha\|otro |
| fecha | ISO string |
| responsable | string |
| responsable_id? | number |
| detalles | string |
| id_cultivo | number |
| estado? | pendiente\|en_progreso\|completada\|cancelada |
| costo_estimado? | number |
| costo_real? | number |
| horas_trabajadas? | number |
| tarifa_hora? | number |
| costo_mano_obra? | number |
| costo_maquinaria? | number |
| observaciones? | string |
| fotografias? | string[] |
| recursos? | [{ id_insumo, cantidad?, horas_uso?, costo_unitario? }] |

### `UpdateActividadeDto`
- Parcial conforme a `CreateActividadeDto`.

### `PaginationDto`
- Para listados: filtros y paginación.

## Endpoints CRUD

## Crear Actividad
Crea una nueva actividad agrícola.

* **Endpoint:**  
  `POST /actividades`

* **Body:**
    ```json
    {
      "tipo_actividad": "siembra",
      "fecha": "2025-01-15",
      "responsable": "Juan Pérez",
      "detalles": "Siembra de maíz híbrido",
      "id_cultivo": 101,
      "estado": "pendiente",
      "horas_trabajadas": 5,
      "tarifa_hora": 8,
      "recursos": [
        { "id_insumo": 44, "cantidad": 10, "costo_unitario": 3.5 },
        { "id_insumo": 12, "horas_uso": 2 }
      ]
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_actividad": 1,
      "tipo_actividad": "siembra",
      "fecha": "2025-01-15",
      "responsable": "Juan Pérez",
      "detalles": "Siembra de maíz híbrido",
      "estado": "pendiente"
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Datos inválidos.
  - **404 Not Found:** Cultivo no encontrado.

## Listar Actividades
Lista actividades con paginación y filtros.

* **Endpoint:**  
  `GET /actividades`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_actividad": 1,
        "tipo_actividad": "siembra",
        "fecha": "2025-01-15",
        "responsable": "Juan Pérez",
        "estado": "pendiente"
      }
    ]
    ```

### Obtener Actividad por ID

- `GET /actividades/:id`
- Respuesta 200: incluye relación `fotos`.

### Actualizar Actividad

- `PATCH /actividades/:id`
- Body parcial (UpdateActividadeDto). Reglas destacadas:
  - Si se envían `horas_trabajadas` y `tarifa_hora` sin `costo_mano_obra`, se calcula `costo_mano_obra = horas * tarifa`.
  - `recursos`: si se envía el arreglo completo, la lógica actualiza/crea y elimina asociaciones faltantes.
- Ejemplo:
  ```json
  {
    "estado": "en_progreso",
    "horas_trabajadas": 6,
    "tarifa_hora": 9,
    "recursos": [
      { "id_insumo": 44, "cantidad": 8, "costo_unitario": 3.5 },
      { "id_insumo": 12, "horas_uso": 3 }
    ]
  }
  ```
- Respuesta 200: actividad actualizada.

### Eliminar Actividad

- `DELETE /actividades/:id`
- Respuesta 204: sin contenido.

## Fotos de Actividades

### Subir Foto

- `POST /actividades/upload-photo/:actividadId`
- `multipart/form-data`, campo `photo`.
- Almacenamiento: `./uploads/actividades` con nombre UUID y extensión original.
- Respuesta 201: metadatos de la foto registrada.
- Ejemplo cURL:
```bash
curl -X POST "https://api.example.com/actividades/upload-photo/123" \
  -H "Authorization: Bearer <JWT>" \
  -F "photo=@/ruta/a/foto.jpg"
```

### Listar Fotos de una Actividad

- `GET /actividades/:actividadId/photos`
- Orden: `fecha_carga DESC`.

### Eliminar Foto

- `DELETE /actividades/fotos/:id`
- Respuesta 204. Intenta borrar archivo físico si existe.

## Recursos usados en Actividad

### Listar Recursos

- `GET /actividades/:actividadId/recursos`
- Incluye datos del `Insumo`, categoría, banderas de herramienta según criterio.
- Ejemplo de respuesta:
  ```json
  [
    { "id_insumo": 44, "nombre_insumo": "Semilla Maíz", "es_herramienta": false, "cantidad": 10, "costo_unitario": 3.5 },
    { "id_insumo": 12, "nombre_insumo": "Tractor", "es_herramienta": true, "horas_uso": 3 }
  ]
  ```

## Reporte y Estadísticas

### Reporte de Actividades

- `GET /actividades/reporte`
- Query:
  - `id_cultivo?`: number
  - `fecha_inicio?`: string ISO
  - `fecha_fin?`: string ISO
- Respuesta 200: lista de actividades ordenadas por `fecha DESC` con info básica y del cultivo.

### Estadísticas de Actividades

- `GET /actividades/estadisticas`
- Respuesta 200:
  ```json
  {
    "total": 25,
    "por_estado": {
      "completadas": 8,
      "pendientes": 12,
      "en_progreso": 5
    },
    "costo_promedio": 0,
    "actividades_por_cultivo": { "101": 7, "102": 5 }
  }
  ```

## Ejemplos cURL adicionales

### Crear actividad con recursos
```bash
curl -X POST "https://api.example.com/actividades" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_actividad": "riego",
    "fecha": "2025-02-10",
    "responsable": "Ana Ruiz",
    "detalles": "Riego por goteo",
    "id_cultivo": 102,
    "estado": "en_progreso",
    "recursos": [
      { "id_insumo": 77, "cantidad": 200, "costo_unitario": 0.02 },
      { "id_insumo": 12, "horas_uso": 1 }
    ]
  }'
```

### Listar actividades de un cultivo
```bash
curl -X GET "https://api.example.com/actividades?id_cultivo=101&page=1&limit=10" \
  -H "Authorization: Bearer <JWT>"
```

