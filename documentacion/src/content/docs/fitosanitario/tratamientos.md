---
title: Tratamientos
description: Documentación del módulo de tratamientos fitosanitarios.
---

## Tipos de datos

La siguiente tabla resume los campos y tipos utilizados en este módulo.

| Campo             | Tipo   |
|-------------------|--------|
| `id_tratamiento`  | number |
| `descripcion`     | string |
| `dosis`           | string |
| `frecuencia`      | string |
| `tipo`            | string |
| `id_epa`          | number |

---

# Módulo Tratamientos

El módulo **Tratamientos** permite registrar, consultar, actualizar y eliminar tratamientos fitosanitarios aplicados a cultivos afectados por enfermedades o plagas (EPA).  
Cada tratamiento contiene información sobre su descripción, dosis, frecuencia y el **EPA** al que está asociado.

Este módulo está protegido por autenticación JWT y control de acceso por roles.  
Los permisos se definen de la siguiente forma:

| Rol | Permisos |
|-----|-----------|
| **Administrador** | Crear, listar, consultar, actualizar y eliminar tratamientos |
| **Instructor** | Crear, listar, consultar, actualizar y eliminar tratamientos |
| **Aprendiz** | Listar y consultar tratamientos |
| **Pasante** | Listar y consultar tratamientos |

---

## Crear un tratamiento

Registra un nuevo tratamiento fitosanitario en la base de datos.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `POST http://localhost:3001/tratamientos`

* **Body:**
    ```json
    {
      "descripcion": "Aplicación de fungicida",
      "dosis": "100ml / 20 litros de agua",
      "frecuencia": "Cada 7 días",
      "id_epa": 5
    }
    ```

* **Respuesta esperada (201 Created):**
    ```json
    {
      "id_tratamiento": 3,
      "descripcion": "Aplicación de fungicida",
      "dosis": "100ml / 20 litros de agua",
      "frecuencia": "Cada 7 días",
      "id_epa": 5
    }
    ```

* **Errores comunes:**
  - **400 Bad Request:** Datos incompletos o EPA inexistente.  
  - **401 Unauthorized:** Token JWT inválido o ausente.

---

## Listar todos los tratamientos

Obtiene la lista completa de tratamientos registrados en el sistema.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/tratamientos`

* **Respuesta esperada (200 OK):**
    ```json
    [
  {
    "id_tratamiento": 1,
    "descripcion": "Tratamiento para la roya del café",
    "dosis": "43ml",
    "frecuencia": "Una vez a la semana",
    "tipo": "Biologico",
    "id_epa": 2
  },
  {
    "id_tratamiento": 2,
    "descripcion": "Aplicación de fungicida",
    "dosis": "100ml / 20 litros de agua",
    "frecuencia": "Cada 7 días",
    "tipo": "Quimico",
    "id_epa": 5
  }
  ]
    ```

---

## Obtener tratamiento por ID

Permite consultar un tratamiento específico mediante su identificador único.  
Disponible para roles **Administrador**, **Instructor**, **Aprendiz** y **Pasante**.

* **Endpoint:**  
  `GET http://localhost:3001/tratamientos/:id`

* **Ejemplo:**  
  `GET http://localhost:3001/tratamientos/1`

* **Respuesta esperada (200 OK):**
    ```json
    {
  "id_tratamiento": 1,
  "descripcion": "Tratamiento para la roya del café",
  "dosis": "43ml",
  "frecuencia": "Una vez a la semana",
  "tipo": "Biologico",
  "id_epa": 2
  }

    ```

* **Errores comunes:**
  - **404 Not Found:** Tratamiento no encontrado.

---

## Actualizar un tratamiento

Permite modificar los datos de un tratamiento existente, como su dosis o frecuencia.  
Disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `PATCH http://localhost:3001/tratamientos/:id`

* **Ejemplo:**  
  `PATCH http://localhost:3001/tratamientos/1`

* **Body:**
    ```json
    {
      "frecuencia": "Cada 14 días"
    }
    ```

* **Respuesta esperada (200 OK):**
    ```json
    {
  "id_tratamiento": 1,
  "descripcion": "Aplicación de fungicida",
  "dosis": "100ml / 20 litros de agua",
  "frecuencia": "Cada 14 días",
  "tipo": "Quimico",
  "id_epa": 5
  }

    ```

* **Errores comunes:**
  - **404 Not Found:** Tratamiento no encontrado.  
  - **400 Bad Request:** Datos inválidos o malformados.

---

## Eliminar un tratamiento

Permite eliminar un tratamiento específico del sistema.  
Solo disponible para roles **Administrador** e **Instructor**.

* **Endpoint:**  
  `DELETE http://localhost:3001/tratamientos/:id`

* **Ejemplo:**  
  `DELETE http://localhost:3001/tratamientos/3`

* **Respuesta esperada (200 OK):**
    ```json
    {
      "message": "Tratamiento eliminado exitosamente."
    }
    ```

* **Errores comunes:**
  - **404 Not Found:** Tratamiento no encontrado.

---

## Notas adicionales

- Todo tratamiento debe estar vinculado a un **EPA** existente (`id_epa`).  
- Los campos `dosis` y `frecuencia` son de texto libre pero deben mantener un formato legible.  
- Todos los endpoints devuelven respuestas en formato **JSON**.  
- Todos los endpoints requieren un **token JWT válido** y un rol autorizado.  

---