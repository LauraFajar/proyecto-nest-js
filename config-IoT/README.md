# Configuración IoT con ESP32

Este documento describe cómo configurar el ESP32 para recolectar datos de sensores (temperatura, humedad del aire, humedad del suelo) y controlar una bomba, utilizando MQTT para la comunicación.

El código fuente se encuentra en `codigoESP32.ino`.

## Requisitos Previos

1.  **Arduino IDE:** Asegúrate de tener el entorno de desarrollo Arduino IDE instalado.
2.  **Librerías de Arduino:** Instala las siguientes librerías a través del Gestor de Librerías del Arduino IDE:
    *   `WiFi` (viene preinstalada con el soporte para ESP32)
    *   `PubSubClient` (por Nick O'Leary)
    *   `DHT sensor library` (por Adafruit)

## Configuración del Código (`codigoESP32.ino`)

Abre el archivo `codigoESP32.ino` en el Arduino IDE. Deberás modificar las siguientes secciones para adaptarlas a tu red y configuración de MQTT:

### 1. Configuración de Red y MQTT

Modifica las variables `ssid`, `password` y `mqtt_server` con los datos de tu red WiFi y el broker MQTT que vayas a utilizar.

```cpp
const char* ssid = "TU_SSID_WIFI";       
const char* password = "TU_PASSWORD_WIFI"; 
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883; 
```

### 2. Topics MQTT

Los topics MQTT están definidos para el envío de datos y la recepción de comandos.

*   `mqtt_topic_data`: Para enviar los datos de los sensores (`luixxa/dht11`).
*   `mqtt_topic_control`: Para recibir comandos de control (`luixxa/control`).

```cpp
const char* mqtt_topic_data = "luixxa/dht11";   
const char* mqtt_topic_control = "luixxa/control"; 
```

## Funcionamiento del ESP32

Una vez configurado y cargado el código, el ESP32 realizará las siguientes acciones:

1.  **Conexión WiFi:** Intentará conectarse a la red WiFi configurada.
2.  **Conexión MQTT:** Se conectará al broker MQTT especificado y se suscribirá al topic de control (`luixxa/control`).
3.  **Lectura de Sensores:** Cada 2 segundos (ajustable con `delay(2000)` en `loop()`), si el `sistemaActivo` está en `true`, leerá los valores de:
    *   Temperatura del aire
    *   Humedad del aire
    *   Lectura analógica del sensor de humedad del suelo
4.  **Control de Bomba:**
    *   **Automático:** Si `bombaManual` es `false` y la lectura del sensor de suelo es mayor a `HUMEDAD_MINIMA`, la bomba se activará. De lo contrario, se desactivará.
    *   **Manual:** Si `bombaManual` es `true`, la bomba se controlará directamente por los comandos MQTT (`BOMBA_ON`/`BOMBA_OFF`).
5.  **Publicación de Datos:** Los datos de los sensores y el estado de la bomba/sistema se publicarán en formato JSON en el topic `luixxa/dht11`. Ejemplo de payload:

    ```json
    {
      "temperatura": 25.5,
      "humedad_aire": 60.2,
      "humedad_suelo_adc": 2800,
      "bomba_estado": "ENCENDIDA",
      "sistema": "ACTIVO"
    }
    ```
6.  **Recepción de Comandos:** El ESP32 escuchará en el topic `luixxa/control` para los siguientes comandos:
    *   `SISTEMA_ON`: Activa el sistema de lectura y control.
    *   `SISTEMA_OFF`: Desactiva el sistema (no leerá sensores ni controlará la bomba).
    *   `BOMBA_ON`: Activa la bomba manualmente (establece `bombaManual = true`).
    *   `BOMBA_OFF`: Desactiva la bomba manualmente (establece `bombaManual = false`).

## Pasos para Ponerlo en Marcha

1.  **Modifica el `codigoESP32.ino`** con tus credenciales WiFi, servidor MQTT y cualquier ajuste de pines o valores.
2.  **Carga el código** en tu placa ESP32 desde el Arduino IDE.
3.  **Monitorea el Serial Monitor** en el Arduino IDE para ver mensajes de conexión y datos publicados.
4.  **Utiliza un cliente MQTT** (como MQTT Explorer o tu interfaz de usuario) para suscribirte a `luixxa/dht11` y ver los datos, y para publicar comandos en `luixxa/control`.