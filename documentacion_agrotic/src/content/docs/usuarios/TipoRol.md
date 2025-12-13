---
title: TipoRol
description: Documentación del módulo de tipos de roles del sistema. Gestiona las categorías de rol utilizadas para clasificar los distintos niveles de acceso (por ejemplo, Interno o Externo).
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo          | Tipo   |
|----------------|--------|
| `id_tipo_rol`  | number |
| `descripcion`  | string |

---
# Módulo TipoRol

El módulo **TipoRol** permite administrar las categorías base de los roles del sistema.  
Estas categorías determinan el tipo general al que pertenece cada rol, por ejemplo:

- **Interno:** Roles que pertenecen al personal del sistema (Administrador, Instructor).  
- **Externo:** Roles asignados a usuarios externos o de apoyo (Pasante, Aprendiz).

Este módulo está protegido por autenticación JWT y autorización basada en roles.  
Solo los usuarios con **rol Administrador** tienen acceso a sus endpoints.

---

## Obtener todos los tipos de rol

Devuelve la lista completa de tipos de rol disponibles en el sistema.  
Requiere autenticación y permisos de **Administrador**.

* **Endpoint:**  
  `GET http://localhost:3001/tiporol`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_tipo_rol": 1,
        "descripcion": "Interno"
      },
      {
        "id_tipo_rol": 2,
        "descripcion": "Externo"
      }
    ]
    ```

---

## Obtener un tipo de rol por ID

Permite consultar la información de un tipo de rol específico.  
Solo accesible para **Administradores**.

* **Endpoint:**  
  `GET http://localhost:3001/tiporol/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/tiporol/1`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_tipo_rol": 1,
      "descripcion": "Interno"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Tipo de rol no encontrado.

---

## Crear un tipo de rol

Permite registrar un nuevo tipo de rol en el sistema.  
Solo disponible para usuarios con **rol Administrador**.

* **Endpoint:**  
  `POST http://localhost:3001/tiporol`

* **Body:**
    ```json
    {
      "descripcion": "Temporal"
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_tipo_rol": 3,
      "descripcion": "Temporal"
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Campos inválidos o faltantes.
  - **409 Conflict:** Ya existe un tipo de rol con esa descripción.

---

## Actualizar un tipo de rol

Permite modificar parcialmente la descripción de un tipo de rol existente.  
Requiere autenticación y permisos de **Administrador**.

* **Endpoint:**  
  `PATCH http://localhost:3001/tiporol/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/tiporol/2`

* **Body:**
    ```json
    {
      "descripcion": "Externo asociado"
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_tipo_rol": 2,
      "descripcion": "Externo asociado"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Tipo de rol no encontrado.  
  - **400 Bad Request:** Campos inválidos.

---

## Eliminar un tipo de rol

Elimina un tipo de rol existente del sistema.  
Solo los usuarios con rol **Administrador** pueden realizar esta acción.

* **Endpoint:**  
  `DELETE http://localhost:3001/tiporol/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/tiporol/3`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Tipo de rol eliminado correctamente."
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Tipo de rol no encontrado.

---

## Notas adicionales

- Los tipos de rol son usados como referencia en la entidad `Rol`, para agrupar roles bajo una misma categoría.
- Los tipos de rol predeterminados del sistema son:
  - `Interno`
  - `Externo`
- Todos los endpoints devuelven respuestas en formato **JSON**.
- Todos los endpoints (excepto los públicos, si los hubiera) requieren un token JWT válido y rol de **Administrador**.

---
