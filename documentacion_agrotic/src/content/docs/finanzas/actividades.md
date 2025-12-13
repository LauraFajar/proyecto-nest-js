---
title: Finazas
description: Endpoints de la API de actividades.
---
# Módulo de Finanzas 
Este documento describe el módulo de finanzas del backend (NestJS), sus endpoints, cálculos y las tablas relacionadas que participan en los reportes y la rentabilidad por cultivo.

## Propósito y Alcance
- Consolida ingresos y egresos por cultivo en un rango de fechas.
- Calcula márgenes, series por periodo y categorías de gasto.
- Evalúa rentabilidad por cultivo con diferentes criterios.
- Exporta el resumen en formatos Excel y PDF.

## Tablas de Base de Datos

### ingresos
| Columna | Tipo | Descripción |
|---|---|---|
| id_ingreso | integer | Identificador del ingreso |
| fecha_ingreso | date | Fecha del ingreso |
| monto | numeric | Monto del ingreso |
| descripcion | varchar | Descripción del ingreso |
| id_insumo | integer (FK) | Insumo asociado |
| id_cultivo | integer (FK) | Cultivo asociado (opcional) |

### salidas
| Columna | Tipo | Descripción |
|---|---|---|
| id_salida | integer | Identificador de salida |
| nombre | varchar | Nombre de la salida |
| codigo | varchar | Código de referencia |
| cantidad | integer | Cantidad de unidades |
| id_categorias | integer (FK) | Categoría asociada |
| id_almacenes | integer (FK) | Almacén asociado |
| observacion | varchar | Observaciones |
| fecha_salida | date | Fecha de la salida |
| valor_unidad | decimal(10,2) | Valor por unidad (opcional) |
| unidad_medida | varchar(64) | Unidad de medida (opcional) |
| estado | varchar | Estado (por defecto: completado) |
| id_insumo | integer (FK) | Insumo asociado |
| id_cultivo | integer (FK) | Cultivo asociado (opcional) |

### actividades
| Columna | Tipo | Descripción |
|---|---|---|
| id_actividad | integer | Identificador de actividad |
| tipo_actividad | varchar(20) | Tipo de actividad |
| fecha | date | Fecha de ejecución |
| responsable | varchar(50) | Responsable |
| responsable_id | integer (FK) | Usuario responsable (opcional) |
| detalles | varchar(50) | Detalles |
| costo_mano_obra | numeric(12,2) | Costo de mano de obra (opcional) |
| horas_trabajadas | numeric(10,2) | Horas trabajadas (opcional) |
| tarifa_hora | numeric(10,2) | Tarifa por hora (opcional) |
| costo_maquinaria | numeric(12,2) | Costo de maquinaria (opcional) |
| estado | varchar(20) | Estado (por defecto: pendiente) |
| id_cultivo | integer (FK) | Cultivo asociado |

### cultivos (referencia)
| Columna | Tipo | Descripción |
|---|---|---|
| id_cultivo | integer | Identificador del cultivo |
| nombre_cultivo | varchar(100) | Nombre del cultivo |
| tipo_cultivo | varchar(20) | Tipo de cultivo |

## Endpoints y Solicitudes

Notas:
- Autenticación requerida: `Authorization: Bearer <token>` en todos los endpoints del módulo de finanzas.
- Algunos endpoints requieren permisos específicos (p. ej. `finanzas:export`).

### Resumen de Finanzas por Cultivo
- Método y URL: `GET /finanzas/resumen`
- Headers:
  - `Authorization: Bearer <token>`
- Query:
  - `cultivoId` (integer, requerido)
  - `from` (string ISO `YYYY-MM-DD`, requerido)
  - `to` (string ISO `YYYY-MM-DD`, requerido)
  - `groupBy` (`mes` | `semana` | `dia`, opcional, por defecto `mes`)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/finanzas/resumen \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "cultivoId=1" \
  --data-urlencode "from=2025-12-01" \
  --data-urlencode "to=2025-12-12" \
  --data-urlencode "groupBy=mes"
```
- Respuesta esperada (200 OK):
```json
{
  "ingresosTotal": "10000.00",
  "egresosTotal": "6500.00",
  "margenTotal": "3500.00",
  "series": [
    { "periodo": "2025-12", "ingresos": "5000.00", "egresos": "3000.00", "margen": "2000.00" }
  ],
  "categoriasGasto": [
    { "nombre": "Insumos/Salidas", "total": "4000.00" },
    { "nombre": "Actividades", "total": "2500.00" }
  ]
}
```
- Errores comunes:
  - 400 `cultivoId es requerido`
  - 400 `from y to son requeridos (YYYY-MM-DD)`

### Margen por Cultivo (comparativo)
- Método y URL: `GET /finanzas/margen`
- Headers:
  - `Authorization: Bearer <token>`
- Query:
  - `from` (string ISO `YYYY-MM-DD`, requerido)
  - `to` (string ISO `YYYY-MM-DD`, requerido)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/finanzas/margen \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "from=2025-12-01" \
  --data-urlencode "to=2025-12-12"
```
- Respuesta esperada (200 OK):
```json
{
  "items": [
    { "id_cultivo": 1, "nombre_cultivo": "Tomate", "ingresos": "8000.00", "egresos": "5000.00", "margen": "3000.00" }
  ]
}
```
- Errores comunes:
  - 400 `from y to son requeridos (YYYY-MM-DD)`

### Rentabilidad por Cultivo
- Método y URL: `GET /finanzas/rentabilidad`
- Headers:
  - `Authorization: Bearer <token>`
- Query:
  - `cultivoId` (integer, requerido)
  - `from` (string ISO `YYYY-MM-DD`, requerido)
  - `to` (string ISO `YYYY-MM-DD`, requerido)
  - `criterio` (`margen` | `bc` | `porcentaje`, opcional, por defecto `margen`)
  - `umbral` (number, opcional; para `bc` por defecto `1`, para `margen` por defecto `0`)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/finanzas/rentabilidad \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "cultivoId=1" \
  --data-urlencode "from=2025-12-01" \
  --data-urlencode "to=2025-12-12" \
  --data-urlencode "criterio=bc" \
  --data-urlencode "umbral=1.2"
```
- Respuesta esperada (200 OK):
```json
{
  "ingresos": "10000.00",
  "egresos": "6500.00",
  "margen": "3500.00",
  "beneficioCosto": "1.54",
  "margenPorcentaje": "35.00",
  "rentable": true,
  "criterio": "bc",
  "umbral": 1.2
}
```
- Errores comunes:
  - 400 `cultivoId es requerido`
  - 400 `from y to son requeridos (YYYY-MM-DD)`

### Exportar Resumen (Excel)
- Método y URL: `GET /finanzas/resumen/excel`
- Requiere permiso: `finanzas:export`
- Headers:
  - `Authorization: Bearer <token>`
- Query:
  - `cultivoId` (integer, requerido)
  - `from` (string ISO `YYYY-MM-DD`, requerido)
  - `to` (string ISO `YYYY-MM-DD`, requerido)
  - `groupBy` (`mes` | `semana` | `dia`, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/finanzas/resumen/excel \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "cultivoId=1" \
  --data-urlencode "from=2025-12-01" \
  --data-urlencode "to=2025-12-12" \
  --data-urlencode "groupBy=mes" \
  -o resumen-finanzas.xlsx
```
- Respuesta esperada (200 OK): archivo `.xlsx` con `Content-Disposition`
- Errores comunes:
  - 400 `cultivoId es requerido`
  - 400 `from y to son requeridos (YYYY-MM-DD)`
  - 403 sin permiso de exportación

### Exportar Resumen (PDF)
- Método y URL: `GET /finanzas/resumen/pdf`
- Requiere permiso: `finanzas:export`
- Headers:
  - `Authorization: Bearer <token>`
- Query:
  - `cultivoId` (integer, requerido)
  - `from` (string ISO `YYYY-MM-DD`, requerido)
  - `to` (string ISO `YYYY-MM-DD`, requerido)
  - `groupBy` (`mes` | `semana` | `dia`, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/finanzas/resumen/pdf \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "cultivoId=1" \
  --data-urlencode "from=2025-12-01" \
  --data-urlencode "to=2025-12-12" \
  --data-urlencode "groupBy=semana" \
  -o resumen-finanzas.pdf
```
- Respuesta esperada (200 OK): archivo PDF con `Content-Disposition`
- Errores comunes:
  - 400 `cultivoId es requerido`
  - 400 `from y to son requeridos (YYYY-MM-DD)`
  - 403 sin permiso de exportación

