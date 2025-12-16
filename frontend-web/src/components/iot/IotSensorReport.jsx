import React from 'react';
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Stack, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const monthMap = { 0: 'ENE', 1: 'FEB', 2: 'MAR', 3: 'ABR', 4: 'MAY', 5: 'JUN', 6: 'JUL', 7: 'AGO', 8: 'SEP', 9: 'OCT', 10: 'NOV', 11: 'DIC' };

function formatDateLabel(d) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function toPercentFromAdc(adc, min = 0, max = 4095) {
  if (typeof adc !== 'number' || Number.isNaN(adc)) return NaN;
  if (max <= min) return NaN;
  const ratio = (adc - min) / (max - min);
  const pct = (1 - ratio) * 100;
  return Math.max(0, Math.min(100, Number(pct.toFixed(1))));
}

function normalizeItem(item) {
  const fecha = item.fecha || item.timestamp || item.ts || item.created_at || item.date;
  const tipoRaw = (item.tipo_sensor || item.tipo || item.metric || '').toLowerCase();
  let tipo = tipoRaw.includes('temperatura') ? 'temperatura' : tipoRaw.includes('humedad') ? 'humedad' : tipoRaw.includes('bomba') || tipoRaw.includes('estado') ? 'estado' : tipoRaw || 'sensor';
  let valor = item.valor;
  let unidad = item.unidad || item.unidad_medida || item.unit;
  if (valor === undefined || valor === null) {
    if (tipo === 'temperatura') valor = item.temperatura ?? item.temp;
    else if (tipo === 'humedad') valor = item.humedad_aire ?? item.humidity ?? toPercentFromAdc(item.humedad_suelo_adc);
    else if (tipo === 'estado') valor = item.estado ?? item.bomba_estado ?? item.value;
  }
  if (!unidad) {
    if (tipo === 'temperatura') unidad = '°C';
    else if (tipo === 'humedad') unidad = '%';
    else if (tipo === 'estado') unidad = '';
    else unidad = 'un';
  }
  if (tipo === 'estado') {
    const v = String(valor).toUpperCase();
    valor = v === 'ENCENDIDA' || v === 'ON' || v === '1' || v === 'TRUE' ? 1 : v === 'APAGADA' || v === 'OFF' || v === '0' || v === 'FALSE' ? 0 : Number(valor);
  }
  return {
    tipo_sensor: tipo,
    valor: Number(valor) || 0,
    fecha: fecha ? new Date(fecha) : new Date(),
    unidad
  };
}

function bucketTime(date, sizeMs = 1000) {
  return Math.floor(date.getTime() / sizeMs) * sizeMs;
}

function aggregateByTypeAndBucket(items) {
  const map = {};
  items.forEach((it) => {
    const b = bucketTime(it.fecha);
    const key = `${it.tipo_sensor}|${b}`;
    if (!map[key]) map[key] = { tipo_sensor: it.tipo_sensor, bucket: b, sum: 0, count: 0, unidad: it.unidad, anyDate: it.fecha };
    map[key].sum += it.valor;
    map[key].count += 1;
  });
  const perType = {};
  Object.values(map).forEach((val) => {
    const avg = val.sum / val.count;
    const fecha = new Date(val.bucket);
    const fechaLabel = formatDateLabel(fecha);
    if (!perType[val.tipo_sensor]) perType[val.tipo_sensor] = [];
    perType[val.tipo_sensor].push({ valor: Number(avg.toFixed(2)), fechaLabel, fecha });
  });
  Object.keys(perType).forEach((t) => {
    perType[t].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  });
  return perType;
}

function computeSummaries(items) {
  const byType = {};
  items.forEach((it) => {
    if (!byType[it.tipo_sensor]) byType[it.tipo_sensor] = [];
    byType[it.tipo_sensor].push(it.valor);
  });
  const res = {};
  Object.entries(byType).forEach(([tipo, valores]) => {
    const n = valores.length;
    const sum = valores.reduce((a, b) => a + b, 0);
    const avg = n ? sum / n : 0;
    const min = n ? Math.min(...valores) : 0;
    const max = n ? Math.max(...valores) : 0;
    res[tipo] = { promedio: Number(avg.toFixed(2)), minimo: Number(min.toFixed(2)), maximo: Number(max.toFixed(2)), total: n };
  });
  return res;
}

function buildTicksX(max) {
  const ticks = [];
  for (let v = 0; v <= max; v += 5) ticks.push(v);
  if (ticks.length && ticks[ticks.length - 1] > max) ticks.pop();
  return ticks;
}

function isValidPhysical(it) {
  if (it.tipo_sensor === 'temperatura') {
    if (it.valor === 0 || it.valor === 1) return false;
    if (it.valor < -50 || it.valor > 80) return false;
    return true;
  }
  if (it.tipo_sensor === 'humedad') {
    if (it.valor < 0 || it.valor > 100) return false;
    return true;
  }
  if (it.tipo_sensor === 'estado') {
    if (it.valor !== 0 && it.valor !== 1) return false;
    return true;
  }
  return true;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const ts = bucketTime(it.fecha, 1000);
    const key = `${it.tipo_sensor}|${ts}|${it.unidad}|${String(it.valor)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

const IotSensorReport = ({ data = [], sensors = [], topic }) => {
  const normalized = React.useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    const base = arr.map(normalizeItem).filter((i) => !Number.isNaN(i.valor) && i.fecha instanceof Date && !Number.isNaN(i.fecha.getTime()));
    const filteredByType = base.filter((i) => {
      if (i.tipo_sensor === 'temperatura') return true;
      if (i.tipo_sensor === 'humedad') return true;
      if (i.tipo_sensor === 'estado') return true;
      return false;
    });
    const valid = filteredByType.filter(isValidPhysical);
    return dedupe(valid);
  }, [data]);

  const period = React.useMemo(() => {
    if (!normalized.length) return null;
    const dates = normalized.map((i) => i.fecha.getTime());
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return { from: min, to: max };
  }, [normalized]);

  const summaries = React.useMemo(() => computeSummaries(normalized), [normalized]);
  const seriesByType = React.useMemo(() => aggregateByTypeAndBucket(normalized), [normalized]);
  const chartRefs = React.useRef({});
  const ubicacionesPorTipo = React.useMemo(() => {
    const m = {};
    sensors.forEach((s) => {
      const key = String(s.tipo_sensor || '').toLowerCase();
      m[key] = s.ubicacion || '—';
    });
    return m;
  }, [sensors]);

  const onExportPdf = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const innerW = pageW - margin * 2;
    let y = margin;

    const drawHeader = () => {
      doc.setFontSize(16);
      doc.text('Reporte IoT', margin, y);
      doc.setFontSize(10);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const rightText = `Generado: ${dateStr}`;
      doc.text(rightText, pageW - margin - doc.getTextWidth(rightText), y);
      y += 8;
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    };

    const newPage = () => {
      doc.addPage();
      y = margin;
      drawHeader();
    };

    drawHeader();

    doc.setFontSize(12);
    const alcance = [
      `Métricas: ${Object.keys(summaries).length || 0}`,
      `Periodo: ${period ? `${formatDateLabel(period.from)} - ${formatDateLabel(period.to)}` : 'N/A'}`,
      `Origen: ${topic || 'Broker/Topic N/A'}`
    ];
    alcance.forEach((line) => {
      if (y + 6 > pageH - margin) newPage();
      doc.text(line, margin, y);
      y += 6;
    });

    autoTable(doc, {
      startY: y,
      head: [['Sensor', 'Promedio', 'Mínimo', 'Máximo', 'Registros']],
      body: Object.entries(summaries).map(([tipo, s]) => [tipo, String(s.promedio), String(s.minimo), String(s.maximo), String(s.total)]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 2, halign: 'left' },
      headStyles: { fillColor: [25, 118, 210], textColor: 255 },
      theme: 'grid'
    });
    y = doc.lastAutoTable.finalY + 6;

    const chartTypes = Object.keys(seriesByType);
    const chartImages = [];
    for (const tipo of chartTypes) {
      const el = chartRefs.current[tipo];
      if (!el) continue;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      chartImages.push({ tipo, imgData: canvas.toDataURL('image/png') });
    }

    if (chartImages.length) {
      doc.addPage('a4', 'landscape');
      const lPageW = doc.internal.pageSize.getWidth();
      const lPageH = doc.internal.pageSize.getHeight();
      const lMargin = margin;
      const lInnerW = lPageW - lMargin * 2;
      let ly = lMargin;

      doc.setFontSize(16);
      doc.text('Gráficas por sensor', lMargin, ly);
      ly += 8;
      doc.setDrawColor(200);
      doc.line(lMargin, ly, lPageW - lMargin, ly);
      ly += 8;

      const count = chartImages.length;
      const cols = count <= 4 ? 2 : 3;
      const gap = 5;
      const rows = Math.ceil(count / cols);
      const availableH = lPageH - lMargin - ly;
      const cellHRaw = (availableH - gap * (rows - 1)) / rows;
      const cellWRaw = (lInnerW - gap * (cols - 1)) / cols;
      const aspect = 400 / 500; // H/W original
      const cellH = Math.max(40, Math.min(cellHRaw, cellWRaw * aspect));
      const cellW = Math.max(60, cellH / aspect);

      let idx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (idx >= chartImages.length) break;
          const { tipo, imgData } = chartImages[idx++];
          const x = lMargin + c * (cellW + gap);
          const yTitle = ly + r * (cellH + gap);
          const yImg = yTitle + 6;
          doc.setFontSize(11);
          doc.text(tipo, x, yTitle);
          doc.addImage(imgData, 'PNG', x, yImg, cellW, cellH - 10);
        }
      }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pW = doc.internal.pageSize.getWidth();
      const pH = doc.internal.pageSize.getHeight();
      const footerY = pH - 10;
      doc.setFontSize(9);
      const footerText = `Página ${i} de ${pageCount}`;
      doc.text(footerText, pW - margin - doc.getTextWidth(footerText), footerY);
    }

    doc.save('reporte_iot.pdf');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Alcance del reporte</Typography>
          <Typography variant="body2">Métricas: {Object.keys(summaries).length || 0}</Typography>
          <Typography variant="body2">Periodo: {period ? `${formatDateLabel(period.from)} - ${formatDateLabel(period.to)}` : 'N/A'}</Typography>
          <Typography variant="body2">Origen: {topic || 'Broker/Topic N/A'}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Promedios por sensor</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sensor</TableCell>
                <TableCell>Promedio</TableCell>
                <TableCell>Mínimo</TableCell>
                <TableCell>Máximo</TableCell>
                <TableCell>Registros</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(summaries).map(([tipo, s]) => (
                <TableRow key={tipo}>
                  <TableCell>{tipo}</TableCell>
                  <TableCell>{s.promedio}</TableCell>
                  <TableCell>{s.minimo}</TableCell>
                  <TableCell>{s.maximo}</TableCell>
                  <TableCell>{s.total}</TableCell>
                </TableRow>
              ))}
              {Object.keys(summaries).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Sin datos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Gráficas por tipo de dato</Typography>
            <Button variant="contained" onClick={onExportPdf}>Exportar PDF</Button>
          </Stack>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1">Temperatura</Typography>
              <Box ref={(el) => (chartRefs.current['temperatura'] = el)} sx={{ width: '100%', height: 320, border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fff' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesByType['temperatura'] || []} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fechaLabel" tick={{ fill: '#555' }} />
                    <YAxis tick={{ fill: '#555' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="#1976d2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1">Humedad</Typography>
              <Box ref={(el) => (chartRefs.current['humedad'] = el)} sx={{ width: '100%', height: 320, border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fff' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesByType['humedad'] || []} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fechaLabel" tick={{ fill: '#555' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#555' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="#546E7A" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1">Estado de bomba</Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <Chip label={(normalized.find((i) => i.tipo_sensor === 'estado')?.valor ?? 0) === 1 ? 'ENCENDIDA' : 'APAGADA'} color={(normalized.find((i) => i.tipo_sensor === 'estado')?.valor ?? 0) === 1 ? 'success' : 'default'} />
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Historial de lecturas</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Unidad</TableCell>
                {Object.values(ubicacionesPorTipo).some((u) => u && u !== '—') && <TableCell>Ubicación</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {normalized.slice(0, 50).map((i, idx) => (
                <TableRow key={`${i.tipo_sensor}-${idx}-${i.fecha.getTime()}`}>
                  <TableCell>{formatDateLabel(i.fecha)}</TableCell>
                  <TableCell>{i.tipo_sensor}</TableCell>
                  <TableCell>{i.valor}</TableCell>
                  <TableCell>{i.unidad || ''}</TableCell>
                  {Object.values(ubicacionesPorTipo).some((u) => u && u !== '—') && (
                    <TableCell>{ubicacionesPorTipo[i.tipo_sensor] || '—'}</TableCell>
                  )}
                </TableRow>
              ))}
              {normalized.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Sin datos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IotSensorReport;
