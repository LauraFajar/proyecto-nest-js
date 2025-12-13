---
title: Almacenes
description: Este modulo permite gestionar y consultar el inventario de insumos agrícolas, incluyendo reportes y estadísticas.
slug: inventario/Almacenes
---

## Seguridad y Autorización
- Autenticación JWT vía `AuthGuard('jwt')`.
- Control de roles con `RolesGuard` y `@Roles` (Admin, Instructor, Learner, Intern según endpoint).
- Control de permisos con `@Permisos({ recurso: 'almacenes', accion })`.

## Entidad y Tabla

### Entidad `Almacen`
- Tabla: `almacenes`

### Tabla (Formato Markdown)

#### Tabla `almacenes`
| Columna         | Tipo       | Nulo | Default | PK/FK | Referencia | Notas               |
|-----------------|------------|------|---------|-------|------------|---------------------|
| `id_almacen`    | `serial`   | No   | —       | PK    | —          | Identificador único |
| `nombre_almacen`| `varchar`  | No   | —       | —     | —          | Nombre del almacén  |
| `descripcion`   | `varchar`  | No   | —       | —     | —          | Descripción         |

## Crear Almacén
Permite crear un nuevo almacén. Requiere permisos de 'crear'.

* **Endpoint:**  
  `POST /almacenes`

* **Body:**
    ```json
    {
      "nombre_almacen": "Principal",
      "descripcion": "Almacén central"
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_almacen": 1,
      "nombre_almacen": "Principal",
      "descripcion": "Almacén central"
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Campos inválidos.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Listar Almacenes
Lista todos los almacenes. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /almacenes`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_almacen": 1,
        "nombre_almacen": "Principal",
        "descripcion": "Almacén central"
      }
    ]
    ```

* **Errores comunes:**
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Obtener por ID
Obtiene un almacén específico por ID. Requiere permisos de 'ver'.

* **Endpoint:**  
  `GET /almacenes/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_almacen": 1,
      "nombre_almacen": "Principal",
      "descripcion": "Almacén central"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Almacén no encontrado.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Actualizar Almacén
Actualiza un almacén. Requiere permisos de 'editar'.

* **Endpoint:**  
  `PATCH /almacenes/:id`

* **Body:**
    ```json
    {
      "descripcion": "Almacén central actualizado"
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_almacen": 1,
      "nombre_almacen": "Principal",
      "descripcion": "Almacén central actualizado"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Almacén no encontrado.
  - **400 Bad Request:** Datos inválidos.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Eliminar Almacén
Elimina un almacén. Requiere permisos de 'eliminar'.

* **Endpoint:**  
  `DELETE /almacenes/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Almacén eliminado correctamente"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Almacén no encontrado.
  - **401 Unauthorized:** Token ausente o inválido.
  - **403 Forbidden:** Rol/permiso insuficiente.

## Notas de Implementación
- El servicio usa `Repository<Almacen>` y operaciones básicas `create`, `find`, `findOneBy`, `update`, `delete`.

