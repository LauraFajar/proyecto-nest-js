---
title: EPA
description: Documentación del módulo de EPA (Evaluación de Problemas Agrícolas) fitosanitarios.
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo               | Tipo                                      |
|---------------------|-------------------------------------------|
| `id_epa`            | number                                    |
| `nombre_epa`        | string                                    |
| `descripcion`       | string                                    |
| `imagen_referencia` | string                                    |
| `tipo`              | string ("enfermedad" | "plaga" | "arvense") |
| `tratamientos`      | array                                     |

---

# Módulo EPA

El módulo **EPA (Evaluación de Problemas Agrícolas)** permite registrar, consultar, actualizar y eliminar reportes fitosanitarios relacionados con enfermedades o plagas detectadas en los cultivos.  
Cada registro incluye el **nombre del problema**, una **descripción detallada** y una **imagen de referencia** almacenada en el servidor.

Este módulo está protegido por autenticación JWT y control de acceso por roles.  
Los permisos se definen de la siguiente forma:

| Rol | Permisos |
|-----|-----------|
| **Administrador** | Crear, listar, consultar, actualizar y eliminar EPA |
| **Instructor** | Crear, listar, consultar, actualizar y eliminar EPA |
| **Aprendiz** | Listar y consultar EPA |
| **Pasante** | Listar y consultar EPA |

---

## Obtener todos los registros EPA

Devuelve la lista completa de EPAs registrados en el sistema.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/epa?page=1&limit=5`

* **Respuesta esperada (200 OK):**
    ```json
    {
  "items": [
    {
      "id_epa": 1,
      "nombre_epa": "Sigatoka negra",
      "descripcion": "Hongo que causa manchas oscuras en hojas de banano",
      "imagen_referencia": "/uploads/sigatoka.jpg",
      "tipo": "enfermedad",
      "tratamientos": []
    },
    {
      "id_epa": 2,
      "nombre_epa": "Trips del banano",
      "descripcion": "Pequeños insectos que succionan la savia",
      "imagen_referencia": "/uploads/trips.jpg",
      "tipo": "plaga",
      "tratamientos": []
    }
  ],
  "meta": {
    "totalItems": 2,
    "itemsPerPage": 5,
    "currentPage": 1,
    "totalPages": 1
  }
  }

    ```

---

## Obtener un registro EPA por ID

Permite consultar un registro EPA específico mediante su identificador único.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/epa/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/epa/1`

* **Respuesta esperada (200 OK):**
    ```json
   {
  "id_epa": 1,
  "nombre_epa": "Sigatoka negra",
  "descripcion": "Hongo que afecta las hojas del banano",
  "imagen_referencia": "/uploads/sigatoka.jpg",
  "tipo": "enfermedad",
  "tratamientos": [
    {
      "id_tratamiento": 3,
      "descripcion": "Aplicación de fungicida sistémico",
      "dosis": "100ml/20L de agua",
      "frecuencia": "Cada 7 días"
    }
  ]
  }

    ```

* **Errores comunes:**
  - **404 Not Found:** Registro EPA no encontrado.

---

## Crear un nuevo registro EPA

Permite registrar una nueva **EPA fitosanitaria** en la base de datos, incluyendo una imagen de referencia.  
La imagen se almacena en el servidor (`/uploads`) y su ruta queda guardada en la base de datos.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `POST http://localhost:3001/epa`

* **Body:**
    ```json
    {
      "nombre_epa": "Afidos en la hoja",
      "descripcion": "Pequeños insectos que chupan la savia...",
      "imagen_referencia": "/uploads/imagen_referencia-1789012345-5678.jpg"
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_epa": 1,
      "nombre_epa": "Afidos en la hoja",
      "descripcion": "Pequeños insectos que chupan la savia...",
      "imagen_referencia": "/uploads/imagen_referencia-1789012345-5678.jpg"
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Datos incompletos o inválidos.  
  - **401 Unauthorized:** Token JWT inválido o ausente.

---
## Obtener tipos de EPA disponibles

Devuelve los tipos válidos de registros EPA.
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `POST http://localhost:3001/epa/tipos`

* **Respuesta esperada:**
    ```json
    
      ["enfermedad", "plaga", "arvense"]

    
    ```

---
## Actualizar un registro EPA

Permite modificar los datos de un registro EPA existente, sin necesidad de cambiar la imagen de referencia.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `PATCH http://localhost:3001/epa/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/epa/1`

* **Body:**
    ```json
    {
      "descripcion": "Insectos chupadores. Controlar inmediatamente."
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
      "id_epa": 1,
      "nombre_epa": "Afidos en la hoja",
      "descripcion": "Insectos chupadores. Controlar inmediatamente.",
      "imagen_referencia": "/uploads/imagen_referencia-1789012345-5678.jpg"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Registro EPA no encontrado.  
  - **400 Bad Request:** Datos inválidos o malformados.

---

## Eliminar un registro EPA

Permite eliminar un registro EPA específico del sistema.  
Solo disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `DELETE http://localhost:3001/epa/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/epa/3`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Registro EPA eliminado correctamente"
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Registro EPA no encontrado.

---

## Notas adicionales

- El campo `imagen_referencia` almacena la ruta relativa del archivo en el servidor (`/uploads`).  
- El tamaño y formato de la imagen deben ser compatibles (por ejemplo: JPG, PNG).  
- Todos los endpoints devuelven respuestas en formato **JSON**.  
- Todos los endpoints requieren un **token JWT válido** y un rol autorizado.  

---