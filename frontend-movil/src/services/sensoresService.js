import { getBaseUrl } from './api';
import { getToken } from './authToken';
import { subscribeTopic, unsubscribeTopic, getTopics as getTopicsRaw, getHistorialByTopic as getHistorialByTopicRaw } from './sensores';
import iotService from './iotService';

const authHeader = () => ({
  Authorization: `Bearer ${getToken() || ''}`,
});

const toDateOnly = (d) => {
  if (!d) return undefined;
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().split('T')[0];
};

const buildReportParams = (params = {}) => {
  const dateOnly = (d) => {
    if (!d) return undefined;
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    return String(d);
  };
  const desde = params.fecha_desde || params.desde || params.fecha_inicio || params.start_date || params.date_from;
  const hasta = params.fecha_hasta || params.hasta || params.fecha_fin || params.end_date || params.date_to;
  const normalized = {};
  if (desde) {
    const v = dateOnly(desde);
    normalized.fecha_desde = v;
    normalized.desde = v;
    normalized.fecha_inicio = v;
  }
  if (hasta) {
    const v = dateOnly(hasta);
    normalized.fecha_hasta = v;
    normalized.hasta = v;
    normalized.fecha_fin = v;
  }
  if (params.topic) {
    normalized.topic = params.topic;
  }
  if (params.metric) normalized.metric = params.metric;
  if (params.periodo) normalized.periodo = params.periodo;
  if (params.order) normalized.order = params.order;
  if (params.limit) normalized.limit = params.limit;
  return normalized;
};

export const getSensores = async () => {
  const res = await fetch(`${getBaseUrl()}/sensores`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const getSensor = async (id) => {
  const res = await fetch(`${getBaseUrl()}/sensores/${id}`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const getHistorial = async (id, params = {}) => {
  const qp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) qp.set(k, String(v));
  });
  const url = `${getBaseUrl()}/sensores/${id}/historial?${qp.toString()}`;
  const res = await fetch(url, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return arr;
};

export const getRecomendaciones = async (id) => {
  const res = await fetch(`${getBaseUrl()}/sensores/${id}/recomendaciones`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const exportIotPdf = async (params = {}) => {
  const qp = new URLSearchParams(buildReportParams(params));
  const res = await fetch(`${getBaseUrl()}/sensores/export/pdf?${qp.toString()}`, { headers: authHeader() });
  if (!res.ok) throw new Error('Error exportando PDF');
  return res;
};

export const exportIotExcel = async (params = {}) => {
  const qp = new URLSearchParams(buildReportParams(params));
  const res = await fetch(`${getBaseUrl()}/sensores/export/excel?${qp.toString()}`, { headers: authHeader() });
  if (!res.ok) throw new Error('Error exportando Excel');
  return res;
};

export const getHistorialByTopic = async (topic, params = {}, { signal } = {}) => {
  const token = getToken();
  const fecha_desde = toDateOnly(params.fecha_desde);
  const fecha_hasta = toDateOnly(params.fecha_hasta);
  if (!token || !topic) return [];
  try {
    const data = await getHistorialByTopicRaw(
      topic,
      { fecha_desde, fecha_hasta, order: 'DESC', limit: 200 },
      { token, signal }
    );
    const arr =
      Array.isArray(data?.lecturas) ? data.lecturas :
      Array.isArray(data?.items) ? data.items :
      Array.isArray(data) ? data :
      [];
    return arr;
  } catch {
    return [];
  }
};

export const getTiempoReal = async () => {
  const res = await fetch(`${getBaseUrl()}/sensores/tiempo-real`, { headers: authHeader() });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) return [];
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
};

export const getTopics = async () => {
  return getTopicsRaw();
};

export const makeRequest = async (endpoint, method = 'GET', params = {}, body = null) => {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${getBaseUrl()}${endpoint}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    method,
    headers: body ? { 'Content-Type': 'application/json', ...authHeader() } : authHeader(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const createSensor = async (payload) => {
  const res = await fetch(`${getBaseUrl()}/sensores`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const updateSensor = async (id, payload) => {
  const res = await fetch(`${getBaseUrl()}/sensores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.message || String(data));
  return data;
};

export const deleteSensor = async (id) => {
  const res = await fetch(`${getBaseUrl()}/sensores/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    throw new Error(data?.message || String(data));
  }
  return true;
};

const service = {
  getSensores,
  getSensor,
  getHistorial,
  getRecomendaciones,
  exportIotPdf,
  exportIotExcel,
  subscribeTopic,
  unsubscribeTopic,
  getHistorialByTopic,
  getTiempoReal,
  getTopics,
  makeRequest,
  createSensor,
  updateSensor,
  deleteSensor,
  iotService,
};

export default service;
