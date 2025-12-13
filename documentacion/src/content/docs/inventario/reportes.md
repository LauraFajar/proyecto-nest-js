---
title: Reportes
description: Este modulo permite gestionar y consultar el inventario de insumos agrícolas, incluyendo reportes y estadísticas.
slug: inventario/Reportes
---
## Seguridad y Acceso
- Requiere autenticación JWT (`AuthGuard('jwt')`).
- Autorización por roles con `RolesGuard` y `@Roles` (generalmente `Admin`).
- Permisos de recurso con `@Permisos({ recurso: 'inventario', accion: 'ver' })`.

## Autenticación
- Headers: `Authorization: Bearer <token>` (si aplica según configuración de seguridad y permisos).

## Resumen de Endpoints
| Área | Propósito | Método | URL |
|---|---|---|---|
| IoT | Exportar por topic/métrica (PDF) | GET | `/sensores/export/pdf` |
| IoT | Exportar por topic/métrica (Excel) | GET | `/sensores/export/excel` |
| IoT | Reporte IoT completo (PDF) | GET | `/sensores/reporte-iot/pdf` |
| IoT | Reporte IoT completo (Excel) | GET | `/sensores/reporte-iot/excel` |
| IoT | Historial por topic | GET | `/sensores/historial` |
| IoT | Información IoT agregada | GET | `/sensores/iot/info` |
| Finanzas | Resumen por cultivo | GET | `/finanzas/resumen` |
| Finanzas | Margen por cultivo (comparativo) | GET | `/finanzas/margen` |
| Finanzas | Rentabilidad por cultivo | GET | `/finanzas/rentabilidad` |
| Finanzas | Exportar resumen (Excel) | GET | `/finanzas/resumen/excel` |
| Finanzas | Exportar resumen (PDF) | GET | `/finanzas/resumen/pdf` |

## IoT

### Exportar por Topic/Métrica (PDF)
- Método y URL: `GET /sensores/export/pdf`
- Headers: `Authorization: Bearer <token>` (si aplica)
- Query:
  - `topic` (string, requerido)
  - `metric` (string, opcional)
  - `desde` (ISO date string, opcional)
  - `hasta` (ISO date string, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/sensores/export/pdf \
  --data-urlencode "topic=luixxa/dht11" \
  --data-urlencode "metric=temperatura" \
  --data-urlencode "desde=2025-12-01" \
  --data-urlencode "hasta=2025-12-12" \
  -o reporte.pdf
```
- Respuesta esperada (200 OK): archivo PDF
- Errores comunes: 400 falta `topic`; 400 fechas inválidas; 500 error al generar PDF

### Exportar por Topic/Métrica (Excel)
- Método y URL: `GET /sensores/export/excel`
- Headers: `Authorization: Bearer <token>` (si aplica)
- Query:
  - `topic` (string, requerido)
  - `metric` (string, opcional)
  - `desde` (ISO date string, opcional)
  - `hasta` (ISO date string, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/sensores/export/excel \
  --data-urlencode "topic=luixxa/dht11" \
  --data-urlencode "metric=temperatura" \
  --data-urlencode "desde=2025-12-01" \
  --data-urlencode "hasta=2025-12-12" \
  -o reporte.xlsx
```
- Respuesta esperada (200 OK): archivo `.xlsx`
- Errores comunes: 400 falta `topic`; 400 fechas inválidas; 500 error al generar Excel

### Reporte IoT Completo (PDF)
- Método y URL: `GET /sensores/reporte-iot/pdf`
- Headers: `Authorization: Bearer <token>` (si aplica)
- Query:
  - `fecha_desde` (ISO date string, opcional)
  - `fecha_hasta` (ISO date string, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/sensores/reporte-iot/pdf \
  --data-urlencode "fecha_desde=2025-12-01" \
  --data-urlencode "fecha_hasta=2025-12-12" \
  -o reporte-iot.pdf
```
- Respuesta esperada (200 OK): archivo PDF
- Errores comunes: 400 fechas inválidas; 500 error al generar reporte

### Reporte IoT Completo (Excel)
- Método y URL: `GET /sensores/reporte-iot/excel`
- Headers: `Authorization: Bearer <token>` (si aplica)
- Query:
  - `fecha_desde` (ISO date string, opcional)
  - `fecha_hasta` (ISO date string, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/sensores/reporte-iot/excel \
  --data-urlencode "fecha_desde=2025-12-01" \
  --data-urlencode "fecha_hasta=2025-12-12" \
  -o reporte-iot.xlsx
```
- Respuesta esperada (200 OK): archivo `.xlsx`
- Errores comunes: 400 fechas inválidas; 500 error al generar reporte

### Historial por Topic
- Método y URL: `GET /sensores/historial`
- Headers: `Authorization: Bearer <token)` (si aplica)
- Query:
  - `topic` (string, requerido)
  - `metric` (string, opcional)
  - `periodo` (string, opcional)
  - `order` (`ASC`|`DESC`, opcional)
  - `limit` (integer, opcional)
  - `fecha_desde` (ISO date string, opcional)
  - `fecha_hasta` (ISO date string, opcional)
- Solicitud (ejemplo cURL):
```
curl -G http://<host>/sensores/historial \
  --data-urlencode "topic=luixxa/dht11" \
  --data-urlencode "metric=temperatura" \
  --data-urlencode "order=DESC" \
  --data-urlencode "limit=100" \
  --data-urlencode "fecha_desde=2025-12-01" \
  --data-urlencode "fecha_hasta=2025-12-12"
```
- Respuesta esperada (200 OK):
```json
{
  "topic": "luixxa/dht11",
  "metric": "todas",
  "periodo": "general",
  "total_lecturas": 120,
  "fecha_desde": "2025-12-01",
  "fecha_hasta": "2025-12-12",
  "lecturas": [
    { "fecha": "2025-12-12T09:35:00.000Z", "valor": 24.5, "tipo": "temperatura", "unidad": "°C" }
  ]
}
```
- Errores comunes: 200 con `{ "error": "...", "message": "..." }`; 200 con `{ "error": "El parámetro \"topic\" es obligatorio." }`

### Información IoT Agregada
- Método y URL: `GET /sensores/iot/info`
- Headers: `Authorization: Bearer <token)` (si aplica)
- Query: sin parámetros
- Solicitud (ejemplo cURL):
```
curl -X GET http://<host>/sensores/iot/info
```
- Respuesta esperada (200 OK):
```json
{
  "sensores": [
    {
      "id_sensor": 1,
      "tipo_sensor": "temperatura",
      "estado": "activo",
      "mqtt_topic": "luixxa/dht11",
      "ultima_lectura": "2025-12-12T09:35:00.000Z",
      "valor_actual": 24.5,
      "cultivo": { "id_cultivo": 1, "nombre_cultivo": "Cultivo Demo", "tipo_cultivo": "Hortalizas" },
      "sublote": { "id_sublote": 1, "descripcion": "Sublote A1", "ubicacion": "Zona Norte", "coordenadas": "5.0705,-75.5138" }
    }
  ],
  "resumen_bomba": { "activaciones": 3, "periodo": "últimas 24h" },
  "timestamp": "2025-12-12T09:40:00.000Z"
}
```
- Errores comunes: 200 con `{ "message": "...", "error": "..." }` si falla la agregación

## Finanzas

### Resumen por Cultivo
- Método y URL: `GET /finanzas/resumen`
- Headers: `Authorization: Bearer <token>`
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
- Errores comunes: 400 `cultivoId es requerido`; 400 `from y to son requeridos (YYYY-MM-DD)`

### Margen por Cultivo (Comparativo)
- Método y URL: `GET /finanzas/margen`
- Headers: `Authorization: Bearer <token>`
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
- Errores comunes: 400 `from y to son requeridos (YYYY-MM-DD)`

### Rentabilidad por Cultivo
- Método y URL: `GET /finanzas/rentabilidad`
- Headers: `Authorization: Bearer <token>`
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
- Errores comunes: 400 `cultivoId es requerido`; 400 `from y to son requeridos (YYYY-MM-DD)`

### Exportar Resumen (Excel)
- Método y URL: `GET /finanzas/resumen/excel`
- Headers: `Authorization: Bearer <token>`
- Permisos: `finanzas:export`
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
- Errores comunes: 400 parámetros faltantes; 403 sin permiso de exportación

### Exportar Resumen (PDF)
- Método y URL: `GET /finanzas/resumen/pdf`
- Headers: `Authorization: Bearer <token>`
- Permisos: `finanzas:export`
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
- Errores comunes: 400 parámetros faltantes; 403 sin permiso de exportación

