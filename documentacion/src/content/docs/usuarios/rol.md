---
title: Rol
description: Documentación del módulo de roles del sistema. Incluye la creación, consulta, actualización y eliminación de roles como Administrador, Instructor, Pasante y Aprendiz.
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo         | Tipo                                 |
|---------------|--------------------------------------|
| `id_rol`      | number                               |
| `nombre_rol`  | string                               |
| `id_tipo_rol` | number (solicitudes) / object (respuestas) |

---
# Módulo Rol

Este módulo gestiona los **roles de usuario** dentro del sistema, tales como:
- **Administrador**
- **Instructor**
- **Pasante**
- **Aprendiz**

Los roles determinan el nivel de acceso y las operaciones que cada usuario puede realizar.  
Solo los usuarios con rol **Administrador** pueden crear, modificar o eliminar roles.  
El endpoint `GET /rol/disponibles` es público y permite obtener los roles disponibles.

---

## Obtener todos los roles

Permite listar todos los roles registrados en el sistema.  
Este endpoint **requiere autenticación JWT** y permisos de **Administrador**.

* **Endpoint:**  
  `GET http://localhost:3001/rol`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_rol": 1,
        "nombre_rol": "Administrador",
        "id_tipo_rol": {
          "id_tipo_rol": 1,
          "nombre_tipo_rol": "Interno"
        }
      },
      {
        "id_rol": 2,
        "nombre_rol": "Instructor",
        "id_tipo_rol": {
          "id_tipo_rol": 1,
          "nombre_tipo_rol": "Interno"
        }
      },
      {
        "id_rol": 3,
        "nombre_rol": "Pasante",
        "id_tipo_rol": {
          "id_tipo_rol": 2,
          "nombre_tipo_rol": "Externo"
        }
      },
      {
        "id_rol": 4,
        "nombre_rol": "Aprendiz",
        "id_tipo_rol": {
          "id_tipo_rol": 2,
          "nombre_tipo_rol": "Externo"
        }
      }
    ]
    ```

---

## Obtener roles disponibles (público)

Devuelve la lista de roles disponibles en el sistema.  
Este endpoint **no requiere autenticación** (`isPublic = true`).

* **Endpoint:**  
  `GET http://localhost:3001/rol/disponibles`

* **Respuesta esperada (200 OK):**
    ```json
    [
      { "id_rol": 1, "nombre_rol": "Administrador" },
      { "id_rol": 2, "nombre_rol": "Instructor" },
      { "id_rol": 3, "nombre_rol": "Pasante" },
      { "id_rol": 4, "nombre_rol": "Aprendiz" }
    ]
    ```

---

## Obtener un rol por ID

Permite consultar la información de un rol específico.  
Requiere autenticación y permisos de **Administrador**.

* **Endpoint:**  
  `GET http://localhost:3001/rol/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/rol/2`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_rol": 2,
      "nombre_rol": "Instructor",
      "id_tipo_rol": {
        "id_tipo_rol": 1,
        "nombre_tipo_rol": "Interno"
      }
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Rol no encontrado.

---

## Crear un rol

Permite registrar un nuevo rol dentro del sistema.  
Solo los usuarios con **rol Administrador** pueden acceder a este endpoint.

* **Endpoint:**  
  `POST http://localhost:3001/rol`

* **Body:**
    ```json
    {
      "nombre_rol": "Supervisor",
      "id_tipo_rol": 1
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_rol": 5,
      "nombre_rol": "Supervisor",
      "id_tipo_rol": {
        "id_tipo_rol": 1,
        "nombre_tipo_rol": "Interno"
      }
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Datos inválidos o faltantes.  
  - **404 Not Found:** Tipo de rol no encontrado.  
  - **409 Conflict:** Ya existe un rol con ese nombre.

---

## Actualizar un rol

Permite modificar parcialmente los datos de un rol existente.  
Solo los **Administradores** pueden ejecutar esta operación.

* **Endpoint:**  
  `PATCH http://localhost:3001/rol/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/rol/2`

* **Body:**
    ```json
    {
      "nombre_rol": "Instructor Líder",
      "id_tipo_rol": 1
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_rol": 2,
      "nombre_rol": "Instructor Líder",
      "id_tipo_rol": {
        "id_tipo_rol": 1,
        "nombre_tipo_rol": "Interno"
      }
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Rol o tipo de rol no encontrado.  
  - **400 Bad Request:** Campos inválidos.

---

## Eliminar un rol

Permite eliminar un rol existente del sistema.  
Solo los **Administradores** pueden ejecutar esta operación.

* **Endpoint:**  
  `DELETE http://localhost:3001/rol/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/rol/3`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Rol eliminado correctamente."
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Rol no encontrado.

---
