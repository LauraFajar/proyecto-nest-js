---
title: cultivos
description: Documentación de uso y guía del módulo de cultivos.
slug: documentacion/cultivos
---
# Módulo de Cultivos
Este documento explica los botones y flujos de la interfaz del módulo de Cultivos en la aplicación web.

## Acceso
- Desde el menú lateral, abre **Cultivos** y selecciona:
  - **Gestión de Cultivos**: lista y administración de cultivos.
  - **Lotes** y **Sublotes**: gestión de ubicaciones.
  - **Mapa de Lotes**: visualización geográfica con un botón para centrar el mapa.
  - **Calendario**: vista por fechas (siembras/actividades relacionadas).
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/barra.cul.png)
## Gestión de Cultivos
Pantalla principal con título “Gestión de Cultivos” y acciones de búsqueda, creación, edición y eliminación.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/acciones.png)

### Encabezado
- Botón `Nuevo Cultivo`:
  - Visible para roles: **Administrador** e **Instructor**.
  - Abre un formulario para crear un cultivo.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/nuevo.cultivo.png)
### Búsqueda
- Campo de búsqueda con ícono de lupa:
  - Filtra por “Nombre del Cultivo” o “Estado” mientras escribes.
  - Texto sugerido: “Buscar por nombre o estado de cultivo...”.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/busqueda.png)
### Tabla de cultivos
- Columnas:
  - `Nombre del Cultivo`
  - `Tipo`
  - `Estado` (se muestra con una etiqueta de color)
  - `Fecha de Siembra`
  - `Fecha de Cosecha`
  - `Acciones` (solo si tienes permisos de edición o eliminación)
- Estado del cultivo con colores:
  - `sembrado` (azul), `en_crecimiento` (naranja), `cosechado` (verde), `perdido` (rojo).
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/tabla.png)
### Acciones por fila
- Botón `Editar` (lápiz):
  - Visible para **Administrador** e **Instructor**.
  - Abre el formulario con los datos del cultivo para actualizar.
- Botón `Eliminar` (papelera):
  - Visible solo para **Administrador**.
  - Abre una confirmación con título “Eliminar Cultivo”.
  - Botones de la confirmación:
    - `Eliminar` (acción peligrosa)
    - `Cancelar`
![usuar.acciones.png](../../../../assets/cultivos/usu.acciones.png)
### Paginación
- Controles de `Página` al final de la lista:
  - Usa las flechas o números para cambiar de página.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/paginas.png)
### Mensajes y estados
- `Cargando`: se muestra un círculo de progreso mientras se obtiene la lista.
- `Error`: aparece un mensaje en rojo si hubo problemas al cargar.
- `Éxito`: tras crear, actualizar o eliminar verás un aviso de confirmación.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/mensaje.png)



## Formulario: Nuevo/Editar Cultivo
Se abre como un diálogo con dos botones (`Cancelar` y `Crear Cultivo`/`Actualizar`).


### Campos del formulario
- `Nombre del Cultivo` (obligatorio)
- `Tipo de Cultivo` (lista): Transitorios, Perennes, Semiperennes
- `ID del Lote` (obligatorio, número mayor a 0)
- `ID del Insumo` (opcional, número mayor a 0)
- `Fecha de Siembra` (obligatorio)
- `Fecha de Cosecha Estimada` (opcional, no puede ser antes de la siembra)
- `Estado del Cultivo` (lista): Sembrado, En Crecimiento, Cosechado, Perdido
- `Observaciones` (opcional)
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/modal.nuevo.png)
### Botones del formulario
- `Cancelar`: cierra el diálogo sin cambios.
- `Crear Cultivo` o `Actualizar`:
  - Guarda los datos y regresa a la lista.
  - Muestra indicador de carga mientras se procesa.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/cultivo.acciones.png)
### Validaciones visibles
- Mensajes de ayuda bajo los campos cuando falta información o no es válida.
- En errores del servidor, se muestra un mensaje en la parte superior del diálogo.
![Pantalla de modal de usuario registrado – muestra su a su modal](../../../../assets/cultivos/validacion.png)

## video explicativo de app movil 

- modal de cultivos
<iframe
  style="width: 100%; max-width: 560px; height: auto; aspect-ratio: 16/9;"
  src="https://youtube.com/embed/DvYQ2BMwVMw?si=g2NpIuxC8-5HrZTz
  "
  title="YouTube video  de cultivos"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>
