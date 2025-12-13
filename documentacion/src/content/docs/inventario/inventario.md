---
title: Inventario
description: Este modulo permite gestionar y consultar el inventario de insumos agrícolas, incluyendo reportes y estadísticas.
slug: inventario/inventario
---


## Seguridad y Autorización
- Autenticación JWT vía `AuthGuard('jwt')`.
- Control de roles con `RolesGuard` y `@Roles` (Admin, Instructor, Learner, Intern según endpoint).
- Control fino de permisos con `@Permisos({ recurso: 'inventario', accion })`.

## Entidad y Tablas

### Entidad `Inventario`
- Tabla: `inventario`
- Relación: `OneToOne` con `insumos` (campo `id_insumo`), `eager`.

### Tablas

#### Tabla `inventario`
| Columna          | Tipo                 | Nulo | Default | PK/FK  | Referencia     | Notas                         |
|------------------|----------------------|------|---------|--------|----------------|-------------------------------|
| `id_inventario`  | `serial`             | No   | —       | PK     | —              | Identificador único           |
| `cantidad_stock` | `integer`            | No   | —       | —      | —              | Cantidad en stock             |
| `unidad_medida`  | `varchar`            | No   | —       | —      | —              | Unidad (ej. kg, l, pzas)      |
| `fecha`          | `date`               | Sí   | —       | —      | —              | Fecha del registro            |
| `id_insumo`      | `integer`            | Sí   | —       | FK     | `insumos.id_insumo` | Insumo asociado (relación 1:1) |

#### Tabla `insumos` (referenciada)
| Columna                | Tipo                      | Nulo | Default | PK/FK | Referencia              | Notas                                         |
|------------------------|---------------------------|------|---------|-------|-------------------------|-----------------------------------------------|
| `id_insumo`            | `serial`                  | No   | —       | PK    | —                       | Identificador único                           |
| `nombre_insumo`        | `varchar`                 | No   | —       | —     | —                       | Nombre                                        |
| `codigo`               | `varchar`                 | No   | —       | —     | —                       | Código interno                                |
| `fecha_entrada`        | `date`                    | No   | —       | —     | —                       | Fecha de entrada                              |
| `observacion`          | `varchar`                 | No   | —       | —     | —                       | Observaciones                                 |
| `id_categoria`         | `integer`                 | Sí   | —       | FK    | `categorias.id_categoria` | Categoría                                     |
| `id_almacen`           | `integer`                 | Sí   | —       | FK    | `almacenes.id_almacen`   | Almacén                                       |
| `es_herramienta`       | `boolean`                 | No   | `false` | —     | —                       | Si el insumo es herramienta                   |
| `costo_compra`         | `numeric(12,2)`           | Sí   | —       | —     | —                       | Costo de compra                               |
| `vida_util_horas`      | `numeric(10,2)`           | Sí   | —       | —     | —                       | Vida útil en horas                            |
| `depreciacion_por_hora`| `numeric(12,2)`           | Sí   | —       | —     | —                       | Depreciación por hora                         |
| `depreciacion_acumulada`| `numeric(12,2)`          | Sí   | `0`     | —     | —                       | Depreciación acumulada                        |
| `fecha_compra`         | `date`                    | Sí   | —       | —     | —                       | Fecha de compra                               |

## DTOs de Entrada

### `CreateInventarioDto`
- `cantidad_stock: number` (obligatorio)
- `unidad_medida: string` (obligatorio)
- `fecha?: string` (date, opcional)

### `UpdateInventarioDto`
- Parcial de `CreateInventarioDto` (todos opcionales)

## Endpoints

## Crear Item de Inventario
Permite crear un nuevo item en el inventario. Requiere permisos de 'crear'.

* **Endpoint:**  
  `POST /inventario`

* **Body:**
    ```json
    {
      "cantidad_stock": 100,
      "unidad_medida": "kg",
      "fecha": "2025-01-15"
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_inventario": 1,
      "cantidad_stock": 100,
      "unidad_medida": "kg",
      "fecha": "2025-01-15",
      "id_insumo": null,
      "insumo": null
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Campos inválidos o formato incorrecto.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Listar Inventario
Lista todos los items del inventario con relación al insumo. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /inventario`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_inventario": 1,
        "cantidad_stock": 100,
        "unidad_medida": "kg",
        "fecha": "2025-01-15",
        "id_insumo": 10,
        "insumo": {
          "id_insumo": 10,
          "nombre_insumo": "Urea",
          "codigo": "N-UREA-001"
        }
      }
    ]
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Obtener por ID
Obtiene un item específico del inventario por ID. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /inventario/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_inventario": 1,
      "cantidad_stock": 100,
      "unidad_medida": "kg",
      "fecha": "2025-01-15",
      "id_insumo": 10,
      "insumo": {
        "id_insumo": 10,
        "nombre_insumo": "Urea",
        "codigo": "N-UREA-001"
      }
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Item no encontrado.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Actualizar Item
Actualiza un item del inventario. Requiere permisos de 'editar'.

* **Endpoint:**  
  `PATCH /inventario/:id`

* **Body:**
    ```json
    {
      "cantidad_stock": 85
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_inventario": 1,
      "cantidad_stock": 85,
      "unidad_medida": "kg",
      "fecha": "2025-01-15",
      "id_insumo": null,
      "insumo": null
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Item no encontrado.
  - **400 Bad Request:** Datos inválidos.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Eliminar Item
Elimina un item del inventario. Requiere permisos de 'eliminar'.

* **Endpoint:**  
  `DELETE /inventario/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Item eliminado correctamente"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Item no encontrado.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Reporte de Inventario
Proporciona un reporte con métricas y lista filtrada. Query opcional: stock_minimo. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /inventario/reporte`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "total_items": 5,
      "items_stock_bajo": 2,
      "cantidad_total_stock": 430,
      "inventario": [
        {
          "id_inventario": 1,
          "cantidad_stock": 15,
          "unidad_medida": "kg",
          "fecha": "2025-01-15",
          "id_insumo": 10,
          "insumo": {
            "id_insumo": 10,
            "nombre_insumo": "Urea",
            "codigo": "N-UREA-001"
          }
        }
      ]
    }
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Stock Bajo
Lista items con stock por debajo del límite. Query opcional: limite (default 10). Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /inventario/stock-bajo`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "items_stock_bajo": 3,
      "limite_configurado": 10,
      "items": [
        {
          "id_inventario": 7,
          "cantidad_stock": 5,
          "unidad_medida": "kg",
          "insumo": {
            "nombre_insumo": "Urea"
          }
        }
      ]
    }
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Estadísticas
Ofrece estadísticas agregadas del inventario. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /inventario/estadisticas`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "total_items": 5,
      "cantidad_total": 430,
      "stock_promedio": 86,
      "items_por_insumo": {
        "Urea": 115,
        "Herbicida": 210,
        "Guantes": 105
      }
    }
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Notas de Implementación
- El servicio incluye alertado automático vía `AlertasService` cuando la cantidad baja del umbral (50 por defecto) en reducciones internas.
- Las consultas utilizan `relations: ['insumo']` para incluir datos del insumo asociado.
