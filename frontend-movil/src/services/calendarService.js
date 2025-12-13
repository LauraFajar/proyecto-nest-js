import { baseUrl, listCultivos } from './api';
import { getToken } from './authToken';

const toISO = (d) => {
  if (!d) return null;
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch { return null; }
};

const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const s = new Date(start);
  const e = new Date(end);
  return d >= s && d <= e;
};

const calendarService = {
  getCalendarEvents: async (start, end, idCultivo) => {
    const token = getToken();
    const events = [];

    try {
      const actUrl = new URL(`${baseUrl}/actividades/reporte`);
      actUrl.searchParams.set('fecha_inicio', start);
      actUrl.searchParams.set('fecha_fin', end);
      if (idCultivo) actUrl.searchParams.set('id_cultivo', String(idCultivo));
      const actRes = await fetch(actUrl.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const actCt = actRes.headers.get('content-type') || '';
      const actData = actCt.includes('application/json') ? await actRes.json() : await actRes.text();
      const actItems = Array.isArray(actData) ? actData : Array.isArray(actData?.data) ? actData.data : Array.isArray(actData?.items) ? actData.items : [];
      actItems.forEach((a) => {
        const fecha = a.fecha || a.fecha_actividad || a.createdAt || null;
        events.push({
          id: `actividad-${(a.id ?? a.id_actividad)}`,
          titulo: a.tipo_actividad || a.nombre_actividad || a.descripcion || 'Actividad',
          descripcion: a.detalles || a.descripcion || '',
          tipo: 'actividad',
          fecha,
          id_cultivo: a.id_cultivo || null,
          estado: a.estado,
          responsable: a.responsable,
          tipo_actividad: a.tipo_actividad,
        });
      });
    } catch (e) {
      // ignore to avoid blocking calendar
    }

    try {
      const cultUrl = new URL(`${baseUrl}/cultivos/calendario`);
      cultUrl.searchParams.set('fecha_desde', start);
      cultUrl.searchParams.set('fecha_hasta', end);
      if (idCultivo) cultUrl.searchParams.set('id_cultivo', String(idCultivo));
      const cultRes = await fetch(cultUrl.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const cultCt = cultRes.headers.get('content-type') || '';
      const cultData = cultCt.includes('application/json') ? await cultRes.json() : await cultRes.text();
      const cultItems = Array.isArray(cultData) ? cultData : Array.isArray(cultData?.data) ? cultData.data : Array.isArray(cultData?.items) ? cultData.items : [];
      cultItems.forEach((ev) => {
        const tipo = (ev.estado === 'sembrado' ? 'siembra' : 'cosecha');
        events.push({
          id: `cultivo-${ev.id}`,
          titulo: `${ev.estado} - ${ev.tipo_cultivo}`,
          fecha: ev.fecha,
          tipo,
          id_cultivo: ev.id_cultivo,
          descripcion: `Evento de ${ev.estado} para el cultivo ${ev.tipo_cultivo}`,
          estado: ev.estado,
          tipo_cultivo: ev.tipo_cultivo
        });
      });
    } catch (e) {
      // ignore
    }

    // Ordenar por fecha
    events.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return events;
  },

  getEventDetails: async (id) => {
    try {
      const token = getToken();
      if (String(id).startsWith('cultivo-')) {
        const cultivoId = String(id).replace('cultivo-', '');
        const res = await fetch(`${baseUrl}/cultivos/${cultivoId}`, { headers: { Authorization: `Bearer ${token}` } });
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) throw new Error(data?.message || String(data));
        return data;
      } else if (String(id).startsWith('actividad-')) {
        const actividadId = String(id).replace('actividad-', '');
        const res = await fetch(`${baseUrl}/actividades/${actividadId}`, { headers: { Authorization: `Bearer ${token}` } });
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) throw new Error(data?.message || String(data));
        return data;
      } else {
        const res = await fetch(`${baseUrl}/actividades/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const ct = res.headers.get('content-type') || '';
        const data = ct.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) throw new Error(data?.message || String(data));
        return data;
      }
    } catch {
      return {};
    }
  }
};

export default calendarService;
