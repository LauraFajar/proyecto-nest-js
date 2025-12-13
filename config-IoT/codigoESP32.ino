#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- Configuración de Red y MQTT ---
const char* ssid = "iPhone de lui"; 
const char* password = "luisa123";
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;

// Topics
const char* mqtt_topic_data = "luixxa/dht11";
const char* mqtt_topic_control = "luixxa/control";

// --- Configuración de Pines ---
#define DHTPIN 4
#define SUELO_PIN 34
#define BOMBA_PIN 2
#define DHTTYPE DHT11
#define HUMEDAD_MINIMA 2500

// --- Estados de control ---
bool sistemaActivo = true;
bool bombaManual = false;

// --- Inicialización ---
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// --- WIFI ---
void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

// --- CALLBACK MQTT (RECIBIR COMANDOS) ---
void callback(char* topic, byte* payload, unsigned int length) {
  String mensaje;
  for (int i = 0; i < length; i++) {
    mensaje += (char)payload[i];
  }

  Serial.print("Mensaje recibido: ");
  Serial.println(mensaje);

  if (mensaje == "SISTEMA_ON") sistemaActivo = true;
  if (mensaje == "SISTEMA_OFF") sistemaActivo = false;

  if (mensaje == "BOMBA_ON") {
    bombaManual = true;
    digitalWrite(BOMBA_PIN, HIGH);
  }

  if (mensaje == "BOMBA_OFF") {
    bombaManual = false;
    digitalWrite(BOMBA_PIN, LOW);
  }
}

// --- RECONEXIÓN MQTT ---
void reconnect_mqtt() {
  while (!client.connected()) {
    if (client.connect("ESP32_AGROTIC")) {
      client.subscribe(mqtt_topic_control);
    } else {
      delay(5000);
    }
  }
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(BOMBA_PIN, OUTPUT);
  digitalWrite(BOMBA_PIN, LOW);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// --- LOOP PRINCIPAL ---
void loop() {
  if (!client.connected()) reconnect_mqtt();
  client.loop();

  delay(2000);

  // --- SI EL SISTEMA ESTÁ DESACTIVADO ---
  if (!sistemaActivo) {
    Serial.println("Sistema desactivado por Dashboard");
    return;
  }

  // --- LECTURA DE SENSORES ---
  float h_aire = dht.readHumidity();
  float t_aire = dht.readTemperature();
  int lectura_suelo = analogRead(SUELO_PIN);

  if (isnan(h_aire) || isnan(t_aire)) return;

  // --- CONTROL AUTOMÁTICO DE BOMBA (SI NO ESTÁ EN MANUAL) ---
  bool bomba_activa = false;

  if (!bombaManual) {
    if (lectura_suelo > HUMEDAD_MINIMA) {
      digitalWrite(BOMBA_PIN, HIGH);
      bomba_activa = true;
    } else {
      digitalWrite(BOMBA_PIN, LOW);
    }
  } else {
    bomba_activa = digitalRead(BOMBA_PIN);
  }

  // --- ENVÍO DE JSON ---
  String payload = "{";
  payload += "\"temperatura\":";
  payload += t_aire;
  payload += ",\"humedad_aire\":";
  payload += h_aire;
  payload += ",\"humedad_suelo_adc\":";
  payload += lectura_suelo;
  payload += ",\"bomba_estado\":\"";
  payload += (bomba_activa ? "ENCENDIDA" : "APAGADA");
  payload += "\",\"sistema\":\"";
  payload += (sistemaActivo ? "ACTIVO" : "INACTIVO");
  payload += "\"}";

  client.publish(mqtt_topic_data, payload.c_str());
}