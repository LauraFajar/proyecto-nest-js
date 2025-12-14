import { getBaseUrl } from './api';
import { getToken } from './authToken';

const authHeader = (token) => ({
  Authorization: `Bearer ${token || getToken() || ''}`,
  Accept: 'application/json',
});

const toDateOnly = (d) => {
  if (!d) return undefined;
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().split('T')[0];
};

export async function subscribeTopic(topic, token) {
  const res = await fetch(`${getBaseUrl()}/sensores/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ topic }),
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
}

export async function unsubscribeTopic(topic, token) {
  const res = await fetch(`${getBaseUrl()}/sensores/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ topic }),
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
}

export async function getTopics(token) {
  const res = await fetch(`${getBaseUrl()}/sensores/topics`, { headers: authHeader(token) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  const arr = Array.isArray(data?.topics) ? data.topics : Array.isArray(data) ? data : [];
  return arr;
}

export async function getHistorialByTopic(topic, params = {}, { token } = {}) {
  if (!token || !String(topic || '').trim()) {
    return { lecturas: [] };
  }
  const url = new URL(`${getBaseUrl()}/sensores/historial`);
  url.searchParams.set('topic', String(topic || '').trim());
  const fecha_desde = toDateOnly(params?.fecha_desde);
  const fecha_hasta = toDateOnly(params?.fecha_hasta);
  if (fecha_desde) url.searchParams.set('fecha_desde', fecha_desde);
  if (fecha_hasta) url.searchParams.set('fecha_hasta', fecha_hasta);
  const order = (params?.order || 'DESC').toUpperCase();
  const limit = params?.limit ?? 200;
  url.searchParams.set('order', order === 'ASC' ? 'ASC' : 'DESC');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { headers: authHeader(token) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    return { lecturas: [] };
  }
  const items =
    Array.isArray(data?.lecturas) ? data.lecturas :
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.data) ? data.data :
    Array.isArray(data) ? data :
    [];
  return { lecturas: items };
}

export async function getLastReading(topic, { token } = {}) {
  const data = await getHistorialByTopic(topic, {}, { token });
  const arr = Array.isArray(data?.lecturas) ? data.lecturas : [];
  if (!arr.length) return null;
  try {
    const sorted = [...arr].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return sorted[0] || arr[arr.length - 1];
  } catch {
    return arr[arr.length - 1];
  }
}

const sensoresService = {
  subscribeTopic,
  unsubscribeTopic,
  getTopics,
  getHistorialByTopic,
  getLastReading,
};

export default sensoresService;

