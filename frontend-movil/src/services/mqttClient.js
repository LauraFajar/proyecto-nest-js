import { getMqttTopic } from './api';
import mqtt from 'mqtt';

export function connectMqtt({
  url = 'wss://broker.hivemq.com:8884/mqtt',
  topic,
  qos = 0,
  clientId = `mobile-${Math.random().toString(16).slice(2)}`,
  keepalive = 30,
  onMessage,
  token,
  onConnect,
  onDisconnect,
  controlKey,
}) {
  const t = topic || getMqttTopic();
  const key = String(controlKey || process.env.EXPO_PUBLIC_MQTT_CONTROL_KEY || process.env.EXPO_PUBLIC_CONTROL_KEY || process.env.EXPO_PUBLIC_MQTT_KEY || '').trim();
  const client = mqtt.connect(url || 'wss://broker.hivemq.com:8884/mqtt', {
    clientId,
    keepalive,
    reconnectPeriod: 2000,
  });
  client.on('connect', () => {
    try {
      if (typeof onConnect === 'function') onConnect();
    } catch {}
    if (t) {
      try {
        client.subscribe(t, { qos });
      } catch {}
    }
    const controlTopic = 'luixxa/control';
    if (controlTopic && controlTopic !== t) {
      try {
        client.subscribe(controlTopic, { qos });
      } catch {}
    }
    if (key) {
      try {
        client.subscribe(`${controlTopic}/${key}`, { qos });
      } catch {}
    }
  });
  client.on('close', () => {
    try {
      if (typeof onDisconnect === 'function') onDisconnect();
    } catch {}
  });
  client.on('offline', () => {
    try {
      if (typeof onDisconnect === 'function') onDisconnect();
    } catch {}
  });
  client.on('message', (top, payload) => {
    let parsed;
    try {
      parsed = JSON.parse(payload.toString());
    } catch {
      parsed = { raw: payload.toString() };
    }
    if (typeof onMessage === 'function') {
      onMessage({ topic: top, data: parsed });
    }
  });
  const publishControl = (data) => {
    try {
      const controlTopic = 'luixxa/control';
      const target = key ? `${controlTopic}/${key}` : controlTopic;
      const body = typeof data === 'string' ? data : JSON.stringify(key ? { ...data, key } : data);
      client.publish(target, body, { qos });
    } catch {}
  };
  const disconnect = () => {
    try {
      client.end(true);
    } catch {}
  };
  return { client, disconnect, publishControl };
}
