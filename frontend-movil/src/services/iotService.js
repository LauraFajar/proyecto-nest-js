import { getBaseUrl } from './api';
import { getToken } from './authToken';

const authHeader = () => ({
  Authorization: `Bearer ${getToken() || ''}`,
});

export async function getAllSensors() {
  const res = await fetch(`${getBaseUrl()}/sensores`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return arr;
}

export async function getSensorById(id) {
  const res = await fetch(`${getBaseUrl()}/sensores/${id}`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
}

export async function getReadings(sensorId, limit = 100) {
  const res = await fetch(`${getBaseUrl()}/sensores/${sensorId}/lecturas`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  const arr = Array.isArray(data) ? data : [];
  return limit && Number.isFinite(limit) ? arr.slice(0, limit) : arr;
}

export async function getSensorsByTopic(topic) {
  const sensors = await getAllSensors();
  return sensors.filter((s) => String(s.mqtt_topic || '').trim() === String(topic).trim());
}

export async function getDashboardData() {
  const res = await fetch(`${getBaseUrl()}/sensores/iot/info`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
}

const iotService = {
  getAllSensors,
  getSensorById,
  getReadings,
  getSensorsByTopic,
  getDashboardData,
};

export default iotService;
