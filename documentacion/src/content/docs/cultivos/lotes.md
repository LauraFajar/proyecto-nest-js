---
title: Lotes
description: Documentación del módulo de lotes, que permite la gestión de los espacios o áreas donde se desarrollan los cultivos dentro del sistema.
---
## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo         | Tipo                  |
|---------------|-----------------------|
| `id_lote`     | number                |
| `nombre_lote` | string (obligatorio)  |
| `descripcion` | string (opcional)     |
| `activo`      | boolean               |

En los endpoints:
- `POST /lotes` requiere `nombre_lote` (string), puede incluir `descripcion` (string) y `activo` (boolean).
- `PATCH /lotes/:id` puede actualizar `descripcion` (string) y `activo` (boolean).

---
# Módulo Lotes

El módulo **Lotes** gestiona las áreas o terrenos donde se ubican los cultivos.  
Cada lote tiene un nombre, una descripción opcional y un estado (`activo`) que indica si está disponible para uso.

Este módulo está protegido por autenticación JWT y autorización basada en roles.  
Los permisos se distribuyen de la siguiente manera:

| Rol | Permisos |
|-----|-----------|
| **Administrador** | Crear, listar, consultar, actualizar y eliminar lotes |
| **Instructor** | Crear, listar, consultar, actualizar y eliminar lotes |
| **Aprendiz** | Listar y consultar lotes |
| **Pasante** | Listar y consultar lotes |

---


## Obtener todos los lotes

Devuelve la lista completa de lotes registrados en el sistema.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/lotes`

* **Respuesta esperada (200 OK):**
    ```json
    [
      {
        "id_lote": 1,
        "nombre_lote": "Lote Norte",
        "descripcion": "Área de cultivo de hortalizas",
        "activo": true
      },
      {
        "id_lote": 2,
        "nombre_lote": "Lote Sur",
        "descripcion": "Zona experimental para nuevos cultivos",
        "activo": false
      }
    ]
    ```

## Obtener un lote por ID

Permite consultar la información detallada de un lote específico.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/lotes/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/lotes/1`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_lote": 1,
      "nombre_lote": "Lote Norte",
      "descripcion": "Área de cultivo de hortalizas",
      "activo": true
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Lote no encontrado.

---

## Crear un nuevo lote

Permite registrar un nuevo lote en el sistema.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `POST http://localhost:3001/lotes`

* **Body:**
    ```json
    {
      "nombre_lote": "Lote Central",
      "descripcion": "Lote destinado al cultivo de maíz",
      "activo": true
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_lote": 3,
      "nombre_lote": "Lote Central",
      "descripcion": "Lote destinado al cultivo de maíz",
      "activo": true
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Campos inválidos o formato incorrecto.

---

## Actualizar un lote

Permite modificar los datos de un lote existente.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `PATCH http://localhost:3001/lotes/:id`

* **Body:**
    ```json
    {
      "descripcion": "Lote para prácticas de los aprendices",
      "activo": false
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_lote": 3,
      "nombre_lote": "Lote Central",
      "descripcion": "Lote para prácticas de los aprendices",
      "activo": false
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Lote no encontrado.  
  - **400 Bad Request:** Datos inválidos o malformados.

---

## Eliminar un lote

Permite eliminar un lote del sistema de forma permanente.  
Disponible solo para **Administrador** e **Instructor**.

* **Endpoint:**  
  `DELETE http://localhost:3001/lotes/:id`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Lote eliminado correctamente."
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Lote no encontrado.

---


## Notas adicionales

- Cada lote puede estar asociado a varios cultivos mediante la relación `@OneToMany(() => Cultivo, cultivo => cultivo.lote)`.  
- El campo `activo` permite controlar la disponibilidad del lote sin necesidad de eliminarlo.  
- Todos los endpoints devuelven respuestas en formato **JSON**.  
- Todos los endpoints requieren un token JWT válido y un rol autorizado según las políticas de acceso.  

---
