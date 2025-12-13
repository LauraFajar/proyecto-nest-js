---
title: Categoria
description: Este modulo permite gestionar y consultar el inventario de insumos agrícolas, incluyendo reportes y estadísticas.
slug: inventario/Categoria
---

## Seguridad y Autorización
- Autenticación JWT vía `AuthGuard('jwt')`.
- Control de roles con `RolesGuard` y `@Roles` (Admin, Instructor, Learner, Intern según endpoint).
- Control de permisos con `@Permisos({ recurso: 'categorias', accion })`.

## Entidad y Tabla

### Entidad `Categoria`
- Tabla: `categorias`

### Tabla (Formato Markdown)

#### Tabla `categorias`
| Columna        | Tipo      | Nulo | Default | PK/FK | Referencia | Notas               |
|----------------|-----------|------|---------|-------|------------|---------------------|
| `id_categoria` | `serial`  | No   | —       | PK    | —          | Identificador único |
| `nombre`       | `varchar` | No   | —       | —     | —          | Nombre de categoría |
| `descripcion`  | `varchar` | No   | —       | —     | —          | Descripción         |

## Crear Categoría
Permite crear una nueva categoría. Requiere permisos de 'crear'.

* **Endpoint:**  
  `POST /categorias`

* **Body:**
    ```json
    {
      "nombre": "Fertilizantes",
      "descripcion": "Insumos fertilizantes"
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_categoria": 1,
      "nombre": "Fertilizantes",
      "descripcion": "Insumos fertilizantes"
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Campos inválidos.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Listar Categorías
Lista todas las categorías. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /categorias`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_categoria": 1,
        "nombre": "Fertilizantes",
        "descripcion": "Insumos fertilizantes"
      }
    ]
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Obtener por ID
Obtiene una categoría específica por ID. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /categorias/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_categoria": 1,
      "nombre": "Fertilizantes",
      "descripcion": "Insumos fertilizantes"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Categoría no encontrada.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Actualizar Categoría
Actualiza una categoría. Requiere permisos de 'editar'.

* **Endpoint:**  
  `PATCH /categorias/:id`

* **Body:**
    ```json
    {
      "descripcion": "Categoría actualizada"
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_categoria": 1,
      "nombre": "Fertilizantes",
      "descripcion": "Categoría actualizada"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Categoría no encontrada.
  - **400 Bad Request:** Datos inválidos.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Eliminar Categoría
Elimina una categoría. Requiere permisos de 'eliminar'.

* **Endpoint:**  
  `DELETE /categorias/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Categoría eliminada correctamente"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Categoría no encontrada.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Notas de Implementación
- El servicio usa `Repository<Categoria>` y operaciones básicas `create`, `find`, `findOneBy`, `update`, `delete`.
- `insumos` referencia categorías mediante `id_categoria`.

