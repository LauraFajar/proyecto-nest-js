---
title: Cultivos
description: Documentación del módulo de cultivos del backend (NestJS), incluyendo entidad, DTOs, rutas y reglas de negocio.
---

# Módulo de Cultivos

Este documento describe el módulo de Cultivos del backend (NestJS), incluyendo su entidad, DTOs, rutas disponibles, reglas de negocio, ejemplos de uso y posibles errores.

## Resumen
- Autenticación: todas las rutas están protegidas con JWT (`@UseGuards(AuthGuard('jwt'))`).
- Base de datos: usa TypeORM con la entidad `Cultivo` y relaciones a `Lote` e `Insumo`.
- Funcionalidad principal:
  - Alta, consulta, actualización y eliminación de cultivos.
  - Estadísticas por estado y tipo de cultivo.
  - Consulta tipo calendario por rango de fechas de siembra.

## Entidad `Cultivo`
Tabla: `cultivos`

Campos principales:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_cultivo | PK, auto | identificador |
| nombre_cultivo | string, requerido | nombre |
| tipo_cultivo | string, requerido | uno de transitorios \| perennes \| semiperennes |
| fecha_siembra | date, opcional | |
| fecha_cosecha_estimada | date, opcional | |
| fecha_cosecha_real | date, opcional | |
| estado_cultivo | string, requerido, default sembrado | sembrado \| en_crecimiento \| cosechado \| perdido |
| observaciones | text, opcional | |
| id_lote | int, opcional | relación con Lote (on delete: SET NULL) |
| id_insumo | int, opcional | relación con Insumo (on delete: SET NULL) |

Relaciones:
- `lote: Lote | null` (`@ManyToOne`).
- `insumo: Insumo | null` (`@ManyToOne`).
- `actividades: Actividad[]` (`@OneToMany`).

## DTOs y Validaciones
### `CreateCultivoDto`

| Campo | Validaciones |
|-------|--------------|
| nombre_cultivo | @IsString, @IsNotEmpty |
| tipo_cultivo | @IsString, @IsNotEmpty, @IsIn(['transitorios','perennes','semiperennes']) |
| id_lote | @IsNumber, @IsInt, @Min(1) |
| id_insumo? | @IsOptional, @IsNumber, @IsInt, @Min(1) |
| fecha_siembra? | @IsOptional, @IsDateString |
| fecha_cosecha_estimada? | @IsOptional, @IsDateString |
| fecha_cosecha_real? | @IsOptional, @IsDateString |
| estado_cultivo? | @IsOptional, @IsString, @IsIn(['sembrado','en_crecimiento','cosechado','perdido']) |
| observaciones? | @IsOptional, @IsString |

### `UpdateCultivoDto`
- Extiende `PartialType(CreateCultivoDto)`: todos los campos anteriores pasan a ser opcionales.

### `PaginationDto`

| Campo | Validaciones |
|-------|--------------|
| page? | @Type(() => Number), @IsInt, @Min(1), default 1 |
| limit? | @Type(() => Number), @IsInt, @Min(1), @Max(100), default 10 |

## Crear Cultivo
Crea un nuevo cultivo. Valida existencia de lote e insumo si se informan.

* **Endpoint:**  
  `POST /cultivos`

* **Body:**
    ```json
    {
      "nombre_cultivo": "Maíz",
      "tipo_cultivo": "transitorios",
      "id_lote": 1
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_cultivo": 1,
      "nombre_cultivo": "Maíz",
      "tipo_cultivo": "transitorios",
      "estado_cultivo": "sembrado",
      "id_lote": 1
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Datos inválidos.
  - **404 Not Found:** Lote o insumo no encontrado.

## Listar Cultivos
Lista cultivos con paginación.

* **Endpoint:**  
  `GET /cultivos`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "items": [
        {
          "id_cultivo": 1,
          "nombre_cultivo": "Maíz",
          "tipo_cultivo": "transitorios",
          "estado_cultivo": "sembrado"
        }
      ],
      "meta": {
        "totalItems": 1,
        "itemsPerPage": 10,
        "currentPage": 1,
        "totalPages": 1
      }
    }
    ```

## Obtener Cultivo por ID
Obtiene un cultivo específico.

* **Endpoint:**  
  `GET /cultivos/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_cultivo": 1,
      "nombre_cultivo": "Maíz",
      "tipo_cultivo": "transitorios",
      "estado_cultivo": "sembrado"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Cultivo no encontrado.

## Actualizar Cultivo
Actualiza un cultivo. Valida lote e insumo si cambian.

* **Endpoint:**  
  `PATCH /cultivos/:id`

* **Body:**
    ```json
    {
      "estado_cultivo": "en_crecimiento"
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_cultivo": 1,
      "nombre_cultivo": "Maíz",
      "tipo_cultivo": "transitorios",
      "estado_cultivo": "en_crecimiento"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Cultivo no encontrado.
  - **400 Bad Request:** Datos inválidos.

## Eliminar Cultivo
Elimina un cultivo.

* **Endpoint:**  
  `DELETE /cultivos/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Cultivo eliminado correctamente"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Cultivo no encontrado.

- `GET /cultivos/estadisticas`
  - Respuesta: `{ total, por_estado: [{ estado, total }], por_tipo: [{ tipo, total }] }`.

- `GET /cultivos/calendario`
  - Query: `fecha_desde?`, `fecha_hasta?` (YYYY-MM-DD).
  - Selección: incluye `lote.nombre_lote` y campos clave del cultivo.
  - Respuesta: lista de cultivos dentro del rango (si se provee), o todos si no se filtra.

## Reglas de Negocio Destacadas
- `estado_cultivo`: default `sembrado` al crear si no se especifica.
- Validación de referencias:
  - `id_lote` e `id_insumo` deben existir para crear o actualizar; si no, `404`.
- Fechas (`fecha_*`): se guardan como `Date`; el servicio castea strings a `Date` cuando actualiza.
- Paginación: orden por `fecha_siembra DESC` en `findAll`.

## Ejemplos
### Crear cultivo
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_cultivo": "Tomate Roma",
    "tipo_cultivo": "transitorios",
    "id_lote": 3,
    "id_insumo": 12,
    "fecha_siembra": "2025-01-10",
    "estado_cultivo": "sembrado",
    "observaciones": "Siembra de verano"
  }' \
  https://<API_BASE_URL>/cultivos
```

### Listar cultivos (paginado)
```bash
curl -H "Authorization: Bearer <token>" \
  "https://<API_BASE_URL>/cultivos?page=1&limit=20"
```

### Obtener por ID
```bash
curl -H "Authorization: Bearer <token>" \
  https://<API_BASE_URL>/cultivos/5
```

### Actualizar cultivo
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado_cultivo": "en_crecimiento",
    "fecha_cosecha_estimada": "2025-03-20",
    "observaciones": "Buen desarrollo de las plantas"
  }' \
  https://<API_BASE_URL>/cultivos/5
```

### Eliminar cultivo
```bash
curl -X DELETE -H "Authorization: Bearer <token>" \
  https://<API_BASE_URL>/cultivos/5
```

### Estadísticas
```bash
curl -H "Authorization: Bearer <token>" \
  https://<API_BASE_URL>/cultivos/estadisticas
```

### Calendario por rango
```bash
curl -H "Authorization: Bearer <token>" \
  "https://<API_BASE_URL>/cultivos/calendario?fecha_desde=2025-01-01&fecha_hasta=2025-03-31"
```

## Errores comunes
- `404 Not Found`:
  - Lote/insumo no existen al crear o actualizar.
  - Cultivo no encontrado por ID.
- `400 Bad Request`:
  - Validaciones de `CreateCultivoDto`/`UpdateCultivoDto` fallan (tipo no permitido, fechas inválidas, etc.).
- `401 Unauthorized`:
  - Falta o expira el JWT.

## Notas y buenas prácticas
- Proporciona `tipo_cultivo` válido y `id_lote` existente en creación.
- Usa formato `YYYY-MM-DD` para fechas en requests.
- Si deseas quitar el `insumo` asociado, envía `id_insumo: null` en el PATCH.
- Para listados grandes, ajusta `limit` (máximo 100) y pagina con `page`.

---
