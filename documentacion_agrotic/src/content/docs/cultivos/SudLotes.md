---
title: Sublotes
description: Documentación del módulo de sublotes, encargado de gestionar las divisiones internas de un lote dentro del sistema.
---
## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo        | Tipo                                        |
|--------------|---------------------------------------------|
| `id_sublote` | number                                      |
| `descripcion`| string (obligatorio)                         |
| `ubicacion`  | string (obligatorio)                         |
| `id_lote`    | number (solicitudes) / object (respuestas)   |
En los endpoints:
- `POST /sublotes` requiere `descripcion` (string), `ubicacion` (string) y `id_lote` (number).
- `PATCH /sublotes/:id` puede actualizar `descripcion` (string), `ubicacion` (string) y `id_lote` (number).

---
# Módulo Sublotes

El módulo **Sublotes** administra las subdivisiones dentro de un lote.  
Cada sublote pertenece a un **lote principal** y contiene información sobre su descripción y ubicación.

Este módulo requiere autenticación JWT y usa control de acceso basado en roles.  
Los permisos están distribuidos de la siguiente manera:

| Rol | Permisos |
|-----|-----------|
| **Administrador** | Crear, listar, consultar, actualizar y eliminar sublotes |
| **Instructor** | Crear, listar, consultar, actualizar y eliminar sublotes |
| **Aprendiz** | Listar y consultar sublotes |
| **Pasante** | Listar y consultar sublotes |

---




## Obtener todos los sublotes

Devuelve la lista completa de sublotes registrados, incluyendo el lote al que pertenecen.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/sublotes`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_sublote": 1,
        "descripcion": "Zona de cultivo de tomates",
        "ubicacion": "Sector A",
        "id_lote": {
          "id_lote": 1,
          "nombre_lote": "Lote Norte"
        }
      },
      {
        "id_sublote": 2,
        "descripcion": "Área de siembra experimental",
        "ubicacion": "Sector B",
        "id_lote": {
          "id_lote": 2,
          "nombre_lote": "Lote Sur"
        }
      }
    ]
    ```

---

## Obtener un sublote por ID

Permite consultar los detalles de un sublote específico, incluyendo su relación con el lote principal.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/sublotes/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/sublotes/1`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_sublote": 1,
      "descripcion": "Zona de cultivo de tomates",
      "ubicacion": "Sector A",
      "id_lote": {
        "id_lote": 1,
        "nombre_lote": "Lote Norte"
      }
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Sublote no encontrado.

---

## Crear un nuevo sublote

Permite registrar un nuevo sublote asociado a un lote existente.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `POST http://localhost:3001/sublotes`

* **Body:**
    ```json
    {
      "descripcion": "Área de riego controlado",
      "ubicacion": "Sector C",
      "id_lote": 1
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_sublote": 3,
      "descripcion": "Área de riego controlado",
      "ubicacion": "Sector C",
      "id_lote": {
        "id_lote": 1,
        "nombre_lote": "Lote Norte"
      }
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** El ID del lote no existe o los datos son inválidos.  
  - **401 Unauthorized:** Token JWT inválido o ausente.

---

## Actualizar un sublote

Permite modificar los datos de un sublote, incluyendo la posibilidad de reasignarlo a otro lote.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `PATCH http://localhost:3001/sublotes/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/sublotes/3`

* **Body:**
    ```json
    {
      "descripcion": "Área experimental de hidroponía",
      "ubicacion": "Sector D",
      "id_lote": 2
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_sublote": 3,
      "descripcion": "Área fertil para silantro",
      "ubicacion": "Sector D",
      "id_lote": {
        "id_lote": 2,
        "nombre_lote": "Lote Sur"
      }
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Sublote no encontrado.  
  - **400 Bad Request:** El ID del lote especificado no existe.

---

## Eliminar un sublote

Permite eliminar un sublote existente del sistema.  
Disponible solo para **Administrador** e **Instructor**.

* **Endpoint:**  
  `DELETE http://localhost:3001/sublotes/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/sublotes/3`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Sublote eliminado correctamente."
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Sublote no encontrado.

---

## Notas adicionales

- Cada **sublote** debe pertenecer a un **lote** existente mediante el campo `id_lote`.  
- No se puede crear un sublote si el lote especificado no existe.  
- Los sublotes pueden usarse para asignar cultivos específicos dentro de un lote.  
- Todos los endpoints devuelven respuestas en formato **JSON**.  
- Todos los endpoints requieren un **token JWT válido** y un rol autorizado.  

---
