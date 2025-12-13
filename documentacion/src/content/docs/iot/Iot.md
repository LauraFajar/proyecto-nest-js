---
title: Iot
description: Este modulo permite gestionar las alertas y notificaciones generadas por los sensores, permitiendo su consulta y seguimiento.
---

## Tablas de Base de Datos (IoT)

### sensores
| Columna | Tipo | Descripción |
|---|---|---|
| id_sensor | integer | Identificador único del sensor |
| tipo_sensor | varchar | Tipo de sensor (temperatura, humedad, suelo, etc.) |
| valor_minimo | decimal(10,2) | Valor mínimo esperado (opcional) |
| valor_maximo | decimal(10,2) | Valor máximo esperado (opcional) |
| valor_actual | decimal(10,2) | Último valor leído (opcional) |
| ultima_lectura | timestamp | Fecha/hora de la última lectura (opcional) |
| estado | varchar | Estado del sensor (por defecto: activo) |
| configuracion | text | Configuración adicional del sensor (opcional) |
| historial_lecturas | json | Historial interno de lecturas (opcional) |
| mqtt_host | varchar | Host MQTT (opcional) |
| mqtt_port | int | Puerto MQTT (opcional) |
| mqtt_topic | varchar | Topic MQTT del sensor (opcional) |
| mqtt_username | varchar | Usuario MQTT (opcional) |
| mqtt_password | varchar | Contraseña MQTT (opcional) |
| mqtt_enabled | boolean | Si está habilitado MQTT para el sensor |
| mqtt_client_id | varchar | Client ID MQTT (opcional) |
| https_url | varchar | URL HTTPS para lecturas (opcional) |
| https_method | varchar | Método HTTP (opcional) |
| https_headers | text | Encabezados en JSON (opcional) |
| https_enabled | boolean | Si está habilitado el modo HTTPS |
| https_auth_token | varchar | Token de autenticación HTTPS (opcional) |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |
| id_sublote | integer (FK) | Sublote asociado |
| cultivo_id | integer (FK) | Cultivo asociado (opcional) |

### lecturas
| Columna | Tipo | Descripción |
|---|---|---|
| id_lectura | integer | Identificador de la lectura |
| sensor_id | integer (FK) | Sensor asociado (opcional) |
| mqtt_topic | varchar | Topic de origen si no hay sensor (opcional) |
| fecha | timestamp | Fecha/hora de la lectura |
| valor | decimal(10,2) | Valor medido |
| unidad_medida | varchar | Unidad de medida (opcional) |
| observaciones | text | Observaciones (opcional) |
| created_at | timestamp | Fecha de creación del registro |

### sublotes
| Columna | Tipo | Descripción |
|---|---|---|
| id_sublote | integer | Identificador del sublote |
| descripcion | varchar(50) | Descripción del sublote |
| id_lote | integer (FK) | Lote padre |
| ubicacion | varchar(50) | Ubicación textual |
| coordenadas | geography(Polygon,4326) | Polígono geográfico (opcional) |

### cultivos
| Columna | Tipo | Descripción |
|---|---|---|
| id_cultivo | integer | Identificador del cultivo |
| nombre_cultivo | varchar(100) | Nombre del cultivo |
| tipo_cultivo | varchar(20) | Tipo de cultivo |
| fecha_siembra | date | Fecha de siembra (opcional) |
| fecha_cosecha_estimada | date | Fecha de cosecha estimada (opcional) |
| fecha_cosecha_real | date | Fecha de cosecha real (opcional) |
| estado_cultivo | varchar | Estado del cultivo (por defecto: sembrado) |
| observaciones | text | Observaciones (opcional) |
| id_lote | integer (FK) | Lote asociado (opcional) |
| id_insumo | integer (FK) | Insumo asociado (opcional) |

### alertas
| Columna | Tipo | Descripción |
|---|---|---|
| id_alerta | integer | Identificador de alerta |
| tipo_alerta | varchar | Tipo de alerta |
| descripcion | varchar | Descripción |
| fecha | date | Fecha del evento |
| hora | time | Hora del evento |
| created_at | timestamp | Fecha de creación del registro |
| id_sensor | integer (FK) | Sensor relacionado (opcional) |
| id_usuario | integer (FK) | Usuario que registra (opcional) |

## Endpoints y Solicitudes

### Obtener Sensores
- Método y URL: `GET /sensores`
- Headers: ninguno requerido
- Query: sin parámetros
- Solicitud (ejemplo cURL):
```
curl -X GET http://<host>/sensores
```
- Respuesta esperada (200 OK):
```json
[
  {
    "id_sensor": 1,
    "tipo_sensor": "Temperatura Ambiente",
    "valor_actual": 25.00,
    "ultima_lectura": "2025-12-10T14:00:00.000Z",
    "estado": "activo",
    "mqtt_topic": "luixxa/dht11",
    "created_at": "2025-12-01T12:00:00.000Z",
    "updated_at": "2025-12-10T14:00:00.000Z"
  }
]
```
- Errores comunes: 200 con `[]` si no hay datos disponibles

### Obtener un Sensor
- Método y URL: `GET /sensores/:id`
- Path params: `id` (integer, requerido)
- Headers: ninguno requerido
- Solicitud (ejemplo cURL):
```
curl -X GET http://<host>/sensores/1
```
- Respuesta esperada (200 OK):
```json
{
  "id_sensor": 1,
  "tipo_sensor": "Humedad del Suelo",
  "valor_actual": 45.00,
  "estado": "activo",
  "mqtt_topic": "luixxa/dht11"
}
```
- Errores comunes: 200 con `null` si el ID no existe

### Actualizar Sensor
- Método y URL: `PUT /sensores/:id`
- Path params: `id` (integer, requerido)
- Headers: `Content-Type: application/json`
- Body (ejemplo):
```json
{ "estado": "inactivo", "mqtt_enabled": false }
```
- Solicitud (ejemplo cURL):
```
curl -X PUT http://<host>/sensores/1 \
  -H "Content-Type: application/json" \
  -d '{ "estado": "inactivo", "mqtt_enabled": false }'
```
- Respuesta esperada (200 OK): objeto del sensor actualizado
- Errores comunes: 200 sin cambios si el ID no existe

### Lecturas de un Sensor
- Método y URL: `GET /sensores/:id/lecturas`
- Path params: `id` (integer, requerido)
- Headers: ninguno requerido
- Solicitud (ejemplo cURL):
```
curl -X GET http://<host>/sensores/1/lecturas
```
- Respuesta esperada (200 OK):
```json
[
  {
    "id_lectura": 100,
    "fecha": "2025-12-12T09:35:00.000Z",
    "valor": 24.50,
    "unidad_medida": "°C",
    "observaciones": null,
    "created_at": "2025-12-12T09:35:00.000Z",
    "sensor": { "id_sensor": 1 }
  }
]
```
- Errores comunes: 200 con `[]` si no hay lecturas

### Inicializar Conexiones MQTT
- Método y URL: `POST /sensores/mqtt/init`
- Headers: ninguno requerido
- Body: vacío
- Solicitud (ejemplo cURL):
```
curl -X POST http://<host>/sensores/mqtt/init
```
- Respuesta esperada (200 OK):
```json
{ "message": "MQTT inicializado correctamente." }
```
- Errores comunes: 200 sin detalle si algún sensor falla al inicializar

### Listar Topics MQTT
- Método y URL: `GET /sensores/topics`
- Headers: ninguno requerido
- Solicitud (ejemplo cURL):
```
curl -X GET http://<host>/sensores/topics
```
- Respuesta esperada (200 OK):
```json
{ "topics": ["luixxa/dht11"] }
```
- Errores comunes: 200 con `{ "error": "...", "message": "..." }` si falla la consulta

### Suscribirse a Topic Genérico
- Método y URL: `POST /sensores/subscribe`
- Headers: `Content-Type: application/json`
- Body:
```json
{ "topic": "luixxa/dht11" }
```
- Solicitud (ejemplo cURL):
```
curl -X POST http://<host>/sensores/subscribe \
  -H "Content-Type: application/json" \
  -d '{ "topic": "luixxa/dht11" }'
```
- Respuesta esperada (200 OK):
```json
{ "message": "Suscrito al topic luixxa/dht11" }
```
- Errores comunes: 400 falta `topic`; 501 función no disponible; 500 error del cliente MQTT

### Desuscribirse de Topic Genérico
- Método y URL: `POST /sensores/unsubscribe`
- Headers: `Content-Type: application/json`
- Body:
```json
{ "topic": "luixxa/dht11" }
```
- Solicitud (ejemplo cURL):
```
curl -X POST http://<host>/sensores/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{ "topic": "luixxa/dht11" }'
```
- Respuesta esperada (200 OK):
```json
{ "message": "Desuscrito del topic luixxa/dht11" }
```
- Errores comunes: 400 falta `topic`; 501 función no disponible; 500 error del cliente MQTT

### Historial por Topic
- Método y URL: `GET /sensores/historial`
- Headers: ninguno requerido
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

### Exportar PDF (por topic/métrica)
- Método y URL: `GET /sensores/export/pdf`
- Headers: ninguno requerido
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

### Exportar Excel (por topic/métrica)
- Método y URL: `GET /sensores/export/excel`
- Headers: ninguno requerido
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
- Headers: ninguno requerido
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
- Headers: ninguno requerido
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

### Información IoT para Frontend
- Método y URL: `GET /sensores/iot/info`
- Headers: ninguno requerido
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


