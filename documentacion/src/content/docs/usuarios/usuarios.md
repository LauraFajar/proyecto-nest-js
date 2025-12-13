---
title: Usuarios
description: Aquí se documentan los endpoints relacionados con la gestión de usuarios, incluyendo la creación, consulta, actualización y eliminación de registros.
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo              | Tipo               |
|--------------------|--------------------|
| `id_usuario`       | number             |
| `nombres`          | string             |
| `apellidos`        | string             |
| `email`            | string (email)     |
| `tipo_documento`   | string             |
| `numero_documento` | string             |
| `telefono`         | string             |
| `direccion`        | string             |
| `id_rol`           | number             |
| `estado`           | string             |

---
#  Usuarios

Este módulo permite gestionar la información de los usuarios del sistema, incluyendo su creación, actualización, eliminación y consulta.

---

##  Obtener todos los usuarios

Permite listar todos los usuarios registrados en el sistema.

* **Endpoint:**  
  `GET http://localhost:3001/usuarios`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_usuarios": 1,
        "nombres": "luisa campos ",
        "email": "luixaa@gmail.com",
        "tipo_documento": "CC",
        "numero_documento": "100200300",
        "id_rol": {
          "id_rol": 1,
          "nombre_rol": "Administrador"
        }
      },
      {
        "id_usuarios": 2,
        "nombres": "laura camila ",
        "email": "lauracamilafajardocalderon@gmail.com",
        "tipo_documento": "TI",
        "numero_documento": "200300400",
        "id_rol": {
          "id_rol": 2,
          "nombre_rol": "Usuario"
        }
      }
    ]
    ```

---

##  Obtener un usuario por ID

Permite consultar los datos de un usuario específico mediante su identificador único.

* **Endpoint:**  
  `GET http://localhost:3001/usuarios/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/usuarios/5`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_usuarios": 5,
      "nombres": "jhon palechor",
      "email": "jpalechor719@gmail.com",
      "tipo_documento": "CC",
      "numero_documento": "123456789",
      "id_rol": {
        "id_rol": 2,
        "nombre_rol": "Usuario"
      }
    }
    ```

* **Errores comunes:**
  -  **404 Not Found:** Usuario no encontrado.

---

##  Crear un usuario

Permite registrar un nuevo usuario en el sistema.  
Se requiere un cuerpo de solicitud con la información necesaria.

* **Endpoint:**  
  `POST http://localhost:3001/usuarios`

* **Body:**
    ```json
    {
      "nombres": "Ana María López",
      "email": "ana.lopez@gmail.com",
      "password": "unaContraseñaSegura123",
      "tipo_documento": "CC",
      "numero_documento": "100200300",
      "id_rol": 1
    }
    ```

* **Respuesta de Ejemplo (201 Created):**
    ```json
    {
      "id_usuarios": 21,
      "nombres": "Ana María López",
      "email": "ana.lopez@gmail.com",
      "tipo_documento": "CC",
      "numero_documento": "100200300",
      "id_rol": {
        "id_rol": 1,
        "nombre_rol": "Administrador"
      }
    }
    ```

* **Errores comunes:**
  -  **400 Bad Request:** Datos inválidos o campos faltantes.  
  -  **409 Conflict:** El correo o número de documento ya está registrado.

---

##  Actualizar un usuario

Permite modificar parcialmente los datos de un usuario existente.

* **Endpoint:**  
  `PATCH http://localhost:3001/usuarios/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/usuarios/21`

* **Body:**
    ```json
    {
      "nombres": "Ana M. López",
      "email": "ana.lopez@gmail.com",
      "id_rol": 2
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Usuario actualizado correctamente.",
      "usuario": {
        "id_usuarios": 21,
        "nombres": "Ana M. López",
        "email": "ana.lopez@gmail.com",
        "tipo_documento": "CC",
        "numero_documento": "100200300",
        "id_rol": {
          "id_rol": 2,
          "nombre_rol": "Usuario"
        }
      }
    }
    ```

* **Errores comunes:**
  -  **404 Not Found:** Usuario no encontrado.  
  -  **400 Bad Request:** Campos inválidos.

---

##  Eliminar un usuario

Permite eliminar un usuario existente del sistema.

* **Endpoint:**  
  `DELETE http://localhost:3001/usuarios/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/usuarios/21`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Usuario eliminado correctamente."
    }
    ```

* **Errores comunes:**
  -  **404 Not Found:** Usuario no encontrado.

---
