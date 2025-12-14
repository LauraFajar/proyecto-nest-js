import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getBaseUrl, getMqttTopic } from '../../services/api';
import { connectMqtt } from '../../services/mqttClient';

const SENSOR_CONFIGS = {
  temperatura: { label: 'Temperatura Ambiente', unit: '°C', icon: 'thermometer', color: '#ff6b35' },
  humedad_aire: { label: 'Humedad Ambiente', unit: '%', icon: 'droplet', color: '#2196f3' },
  humedad_suelo: { label: 'Humedad del Suelo', unit: '%', icon: 'activity', color: '#4caf50' },
  bomba_estado: { label: 'Estado de la Bomba', unit: '', icon: 'power', color: '#9c27b0' },
};

export default function IotPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sensors, setSensors] = useState([]);
  const [lastReadings, setLastReadings] = useState({});
  const [activeTopic, setActiveTopic] = useState(getMqttTopic());
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState('');
  const [chartsData, setChartsData] = useState({
    temperatura: [],
    humedad_aire: [],
    humedad_suelo: [],
    bomba_estado: [],
  });
  const [sensorOnline, setSensorOnline] = useState(false);
  const [lastEventAt, setLastEventAt] = useState(0);
  const [mqttConn, setMqttConn] = useState(null);

  const safeParseNumber = useCallback((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      let s = v.trim();
      s = s.replace(',', '.');
      s = s.replace(/[^\d\.\-]/g, '');
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, []);

 

 

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getBaseUrl()}/sensores`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = typeof data === 'string' ? data.slice(0, 140) : (data?.message || 'Error cargando sensores');
        throw new Error(msg);
      }
      const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const filtered = (list || []).filter((s) => String(s.mqtt_topic || '').trim().toLowerCase() === getMqttTopic().toLowerCase());
      setSensors(filtered);
    } catch (e) {
      setSensors([]);
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('iot:lastReadings');
        const tsRaw = await AsyncStorage.getItem('iot:lastEventAt');
        if (!mounted) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') setLastReadings(parsed);
        }
        if (tsRaw) {
          const ts = Number(tsRaw);
          if (Number.isFinite(ts)) setLastEventAt(ts);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const loadCharts = useCallback(async (topic = activeTopic) => {
    setChartsLoading(true);
    setChartsError('');
    try {
      if (!token || !topic) {
        setChartsData({ temperatura: [], humedad_aire: [], humedad_suelo: [], bomba_estado: [] });
        setChartsLoading(false);
        setChartsError('');
        return;
      }
      const url = new URL(`${getBaseUrl()}/sensores/historial`);
      url.searchParams.set('topic', topic);
      const todayDate = new Date();
      const fromDate = new Date(todayDate);
      fromDate.setDate(fromDate.getDate() - 30);
      const today = todayDate.toISOString().split('T')[0];
      const from = fromDate.toISOString().split('T')[0];
      url.searchParams.set('fecha_desde', from);
      url.searchParams.set('fecha_hasta', today);
      url.searchParams.set('order', 'DESC');
      url.searchParams.set('limit', '200');
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = typeof data === 'string' ? data.slice(0, 140) : (data?.message || 'Error cargando historial');
        throw new Error(msg);
      }
      const lecturas = Array.isArray(data?.lecturas)
        ? data.lecturas
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      const temperatura = [];
      const humedad_aire = [];
      const humedad_suelo = [];
      const bomba_estado = [];
      const toNum = (v) => safeParseNumber(v);
      const convertAdcToPercent = (adc) => {
        const n = safeParseNumber(adc);
        if (n === null) return null;
        const adcMax = 4095;
        const percent = Math.max(0, Math.min(100, ((adcMax - n) / adcMax) * 100));
        return Math.round(percent * 100) / 100;
      };
      const asOnOffNum = (x) => {
        const s = String(x ?? '').toUpperCase();
        if (s === 'ENCENDIDA' || s === 'ON' || s === 'ACTIVA' || s === 'TRUE' || s === '1') return 1;
        if (s === 'APAGADA' || s === 'OFF' || s === 'INACTIVA' || s === 'FALSE' || s === '0') return 0;
        return toNum(x);
      };
      lecturas.forEach((l) => {
        const unit = String(l.unidad_medida || '').toLowerCase();
        const obs = String(l.observaciones || '').toLowerCase();
        const v = toNum(l.valor);
        if (unit.includes('temperatura')) {
          if (v !== null) temperatura.push({ v, ts: l.fecha });
          return;
        }
        if (unit.includes('humedad_aire') || unit.includes('humedad aire') || unit === 'humedad') {
          if (v !== null) humedad_aire.push({ v, ts: l.fecha });
          return;
        }
        if (unit.includes('humedad_suelo_porcentaje') || unit.includes('humedad suelo porcentaje') || unit.includes('humedad_suelo') || unit.includes('humedad suelo') || obs.includes('humedad_suelo') || obs.includes('humedad suelo')) {
          if (v !== null) humedad_suelo.push({ v, ts: l.fecha });
          return;
        }
        if (unit.includes('humedad_suelo_adc') || unit.includes('humedad suelo adc')) {
          const pct = convertAdcToPercent(v);
          if (pct !== null) humedad_suelo.push({ v: pct, ts: l.fecha });
          return;
        }
        if (unit.includes('bomba_estado') || unit.includes('bomba') || obs.includes('bomba')) {
          const onOff = asOnOffNum(l.valor);
          if (onOff !== null) bomba_estado.push({ v: onOff, ts: l.fecha });
          return;
        }
      });
      setChartsData({ temperatura, humedad_aire, humedad_suelo, bomba_estado });
      const now = new Date();
      const last = {
        temperatura: temperatura.length ? { value: temperatura[temperatura.length - 1].v, ts: now } : undefined,
        humedad_aire: humedad_aire.length ? { value: humedad_aire[humedad_aire.length - 1].v, ts: now } : undefined,
        humedad_suelo: humedad_suelo.length ? { value: humedad_suelo[humedad_suelo.length - 1].v, ts: now } : undefined,
        bomba_estado: bomba_estado.length ? { value: (bomba_estado[bomba_estado.length - 1].v === 1 ? 'ENCENDIDA' : 'APAGADA'), ts: now } : undefined,
      };
      const filtered = Object.fromEntries(Object.entries(last).filter(([_, v]) => v));
      if (Object.keys(filtered).length) setLastReadings(filtered);
    } catch (e) {
      const msg = String(e.message || e);
      if (!/Validation failed/i.test(msg)) {
        setChartsError(msg);
      } else {
        setChartsError('');
      }
    } finally {
      setChartsLoading(false);
    }
  }, [activeTopic, token]);

  useEffect(() => {
    loadCharts(activeTopic);
  }, [activeTopic, loadCharts]);

  // quitar datos simulados: usar solo lecturas reales (MQTT/Historial)

 

  useEffect(() => {
    if (!token || !activeTopic) return () => {};
    const handleMessage = ({ data }) => {
      const now = new Date();
      const temp = safeParseNumber(data?.temperatura ?? data?.temperature ?? data?.temp);
      const humAir = safeParseNumber(
        data?.humedad_aire ??
        data?.humedad ??
        data?.humidity ??
        data?.humedadAmbiente ??
        data?.humedad_ambiente
      );
      const soilPctDirect = safeParseNumber(
        data?.humedad_suelo_porcentaje ??
        data?.humedad_suelo_pct ??
        data?.soil_moisture_pct ??
        data?.moisture_pct ??
        data?.humedadSueloPorcentaje
      );
      const soilAdc = safeParseNumber(
        data?.humedad_suelo_adc ??
        data?.soil_moisture_adc ??
        data?.soil_adc ??
        data?.moisture_adc ??
        data?.humedadSueloADC ??
        data?.humedad_suelo ??
        data?.humedadSuelo
      );
      const bomba = String(data?.bomba_estado || '').toUpperCase();
      const soilPct = soilPctDirect !== null && soilPctDirect !== undefined
        ? soilPctDirect
        : soilAdc === null || soilAdc === undefined
        ? null
        : (() => {
            const adc = Number(soilAdc);
            let adcMax = 4095;
            if (adc > 4095) adcMax = 65535;
            else if (adc > 1023) adcMax = 4095;
            else adcMax = 1023;
            const pct = Math.max(0, Math.min(100, ((adcMax - adc) / adcMax) * 100));
            return Math.round(pct * 100) / 100;
          })();
      const next = {};
      if (temp !== null && temp !== undefined) next.temperatura = { value: temp, ts: now };
      if (humAir !== null && humAir !== undefined) next.humedad_aire = { value: humAir, ts: now };
      if (soilPct !== null && soilPct !== undefined) next.humedad_suelo = { value: soilPct, ts: now };
      if (bomba) next.bomba_estado = { value: bomba, ts: now };
      if (Object.keys(next).length) {
        setLastReadings((prev) => ({ ...prev, ...next }));
      }
      setChartsData((prev) => {
        const ts = now;
        const nextCharts = { ...prev };
        const addPoint = (key, val) => {
          const vNum = safeParseNumber(val);
          if (vNum === null) return;
          const arr = Array.isArray(nextCharts[key]) ? nextCharts[key] : [];
          nextCharts[key] = [...arr, { v: vNum, ts }].slice(-60);
        };
        if (temp !== null && temp !== undefined) addPoint('temperatura', temp);
        if (humAir !== null && humAir !== undefined) addPoint('humedad_aire', humAir);
        if (soilPct !== null && soilPct !== undefined) addPoint('humedad_suelo', soilPct);
        if (bomba) {
          const b = String(bomba).toUpperCase();
          const num = b === 'ENCENDIDA' || b === 'ON' || b === 'ACTIVA' ? 1 : 0;
          addPoint('bomba_estado', num);
        }
        return nextCharts;
      });
      setSensorOnline(true);
      setLastEventAt(now.getTime());
    };
    const conn = connectMqtt({
      topic: activeTopic,
      token,
      onMessage: handleMessage,
    });
    setMqttConn(conn);
    return () => { conn.disconnect(); setMqttConn(null); };
  }, [activeTopic, token]);

  useEffect(() => {
    let t = null;
    const check = () => {
      if (sensorOnline && lastEventAt) {
        const diff = Date.now() - lastEventAt;
        if (diff > 15000) {
          setSensorOnline(false);
        }
      }
    };
    t = setInterval(check, 5000);
    return () => { if (t) clearInterval(t); };
  }, [sensorOnline, lastEventAt]);
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('iot:lastReadings', JSON.stringify(lastReadings || {}));
        await AsyncStorage.setItem('iot:lastEventAt', String(lastEventAt || 0));
      } catch {}
    })();
  }, [lastReadings, lastEventAt]);
  const sendControl = useCallback((payload) => {
    try {
      if (mqttConn && typeof mqttConn.publishControl === 'function') {
        mqttConn.publishControl(payload);
      }
    } catch {}
  }, [mqttConn]);
  const pumpState = useMemo(() => {
    if (!sensorOnline) return 'APAGADA';
    const v = lastReadings?.bomba_estado?.value;
    if (typeof v === 'string') {
      const s = v.toUpperCase();
      if (s === 'ENCENDIDA' || s === 'APAGADA') return s;
      return s;
    }
    if (v === 1) return 'ENCENDIDA';
    if (v === 0) return 'APAGADA';
    if (typeof v === 'number') return v > 0 ? 'ENCENDIDA' : 'APAGADA';
    return 'APAGADA';
  }, [lastReadings, sensorOnline]);

  const renderBarChart = useCallback((data, { color = '#0f172a', maxHint }) => {
    const vals = (Array.isArray(data) ? data : []).map((d) => safeParseNumber(d.v)).filter((v) => v !== null);
    const max = Math.max(1, maxHint || (vals.length ? Math.max(...vals) : 1));
    const min = Math.min(0, vals.length ? Math.min(...vals) : 0);
    const range = Math.max(1, max - min || 1);
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBarsRow}>
          {(vals.length ? vals : new Array(20).fill(null)).map((v, idx) => {
            const hPct = v === null ? 0 : Math.max(4, Math.round(((v - min) / range) * 100));
            return (
              <View key={idx} style={[styles.chartBar, { height: `${hPct}%`, backgroundColor: color }]} />
            );
          })}
        </View>
      </View>
    );
  }, []);

  const LineChart = ({ data, color = '#0f172a', maxHint }) => {
    const [dim, setDim] = useState({ w: 0, h: 0 });
    const vals = (Array.isArray(data) ? data : []).map((d) => safeParseNumber(d.v)).filter((v) => v !== null);
    const max = Math.max(1, maxHint || (vals.length ? Math.max(...vals) : 1));
    const min = Math.min(0, vals.length ? Math.min(...vals) : 0);
    const range = Math.max(1, max - min || 1);
    const n = vals.length;
    return (
      <View
        style={styles.chartContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setDim({ w: width, h: height });
        }}
      >
        {dim.w > 0 && dim.h > 0 && (n ? vals : new Array(20).fill(null)).map((v, idx) => {
          const val = v === null ? min : v;
          const x = n > 1 ? (idx / Math.max(1, n - 1)) * dim.w : dim.w / 2;
          const y = dim.h - ((val - min) / range) * dim.h;
          return <View key={idx} style={[styles.dot, { left: x - 3, top: y - 3, backgroundColor: color }]} />;
        })}
      </View>
    );
  };

  const renderCarousel = useMemo(() => {
    const items = [
      { key: 'temperatura', label: 'Temperatura', color: '#ff6b35', unit: '°C', maxHint: undefined },
      { key: 'humedad_aire', label: 'Humedad Aire', color: '#2196f3', unit: '%', maxHint: 100 },
      { key: 'humedad_suelo', label: 'Humedad Suelo', color: '#4caf50', unit: '%', maxHint: 100 },
    ];
    return (
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {items.map((it) => (
          <View key={it.key} style={styles.carouselItem}>
            <View style={styles.carouselHeader}>
              <Feather name={SENSOR_CONFIGS[it.key]?.icon || 'activity'} size={18} color={it.color} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>{it.label}</Text>
              {chartsLoading ? <ActivityIndicator size="small" color={it.color} style={{ marginLeft: 8 }} /> : null}
            </View>
            <LineChart data={chartsData[it.key]} color={it.color} maxHint={it.maxHint} />
          </View>
        ))}
      </ScrollView>
    );
  }, [chartsData, chartsLoading, renderBarChart]);

  const cards = useMemo(() => {
    const byType = {};
    const canonicalizeType = (t) => {
      const s = String(t || '').toLowerCase();
      if (!s) return '';
      if (s.includes('temperatura') || s.includes('temp')) return 'temperatura';
      if ((s.includes('humedad') && s.includes('aire')) || s.includes('humedadambiente') || s.includes('humidity')) return 'humedad_aire';
      if ((s.includes('humedad') && s.includes('suelo')) || s.includes('soil') || s.includes('tierra')) return 'humedad_suelo';
      if (s.includes('bomba') || s.includes('pump')) return 'bomba_estado';
      return s.replace(/\s+/g, '_');
    };
    const convertSoil = (val, unit) => {
      const n = safeParseNumber(val);
      if (n === null) return null;
      const u = String(unit || '').toLowerCase();
      if (u.includes('adc') || n > 100) {
        const adcMax = 4095;
        const percent = Math.max(0, Math.min(100, ((adcMax - n) / adcMax) * 100));
        return Math.round(percent * 100) / 100;
      }
      return n;
    };
    const normalizePump = (val) => {
      const s = String(val ?? '').toUpperCase();
      if (s === 'ENCENDIDA' || s === 'ON' || s === 'ACTIVA' || s === 'TRUE' || s === '1') return 'ENCENDIDA';
      if (s === 'APAGADA' || s === 'OFF' || s === 'INACTIVA' || s === 'FALSE' || s === '0') return 'APAGADA';
      if (val === 1) return 'ENCENDIDA';
      if (val === 0) return 'APAGADA';
      return s || '';
    };
    sensors.forEach((s) => {
      const typeRaw = String(s.tipo_sensor || s.tipo || '').toLowerCase();
      const type = canonicalizeType(typeRaw);
      let value = s.valor_actual ?? s.valor ?? null;
      let unit = s.unidad_medida || '';
      if (type === 'humedad_suelo') {
        const converted = convertSoil(value, unit);
        if (converted !== null) {
          value = converted;
          unit = '%';
        }
      }
      if (type === 'bomba_estado') {
        value = normalizePump(value);
        unit = '';
      }
      if (type) {
        byType[type] = { value, unit, ts: s.updatedAt || s.timestamp || null };
      }
    });
    const source = { ...byType, ...lastReadings };
    return Object.entries(SENSOR_CONFIGS).map(([key, conf]) => {
      let display;
      const r = source[key] || null;
      display = r?.value;
      if (display === undefined || display === null) {
        const seq = chartsData[key] || [];
        if (Array.isArray(seq) && seq.length) {
          const last = seq[seq.length - 1]?.v;
          const vNum = safeParseNumber(last);
          if (key === 'bomba_estado') {
            display = vNum === 1 ? 'ENCENDIDA' : vNum === 0 ? 'APAGADA' : last;
          } else {
            display = vNum !== null ? vNum : last ?? null;
          }
        } else {
          display = key === 'bomba_estado' ? 'APAGADA' : null;
        }
      }
      if (key === 'bomba_estado' && typeof display === 'string') {
        display = display.toUpperCase();
      }
      return { key, label: conf.label, unit: conf.unit, icon: conf.icon, color: conf.color, value: display };
    });
  }, [sensors, lastReadings, chartsData, sensorOnline]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Módulo IoT</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusChip, sensorOnline ? styles.statusOk : styles.statusErr]}>
          <Feather name={sensorOnline ? 'wifi' : 'wifi-off'} size={16} color={sensorOnline ? '#16A34A' : '#DC2626'} />
          <Text style={[styles.statusText, sensorOnline ? styles.okText : styles.errText]}>{sensorOnline ? 'Conectado' : 'Desconectado'}</Text>
        </View>
      </View>

      

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {chartsError ? <Text style={styles.error}>{chartsError}</Text> : null}

      <View style={styles.cardsRow}>
        {cards.map((c) => (
          <View key={c.key} style={[styles.card, { borderLeftColor: c.color }]}>
            <View style={styles.cardHeader}>
              <Feather name={c.icon} size={18} color={c.color} style={styles.cardIcon} />
              <Text style={styles.cardTitle}>{c.label}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardValue}>
                {c.value !== null && c.value !== undefined ? String(c.value) : '--'}
              </Text>
              <Text style={styles.cardUnit}>{c.unit}</Text>
            </View>
          </View>
        ))}
      </View>

      

      <View style={[styles.sectionHeader, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>Historial por sensor</Text>
        <Text style={styles.sectionSubtitle}>Desliza en carrusel para ver cada gráfica</Text>
      </View>
      {renderCarousel}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusOk: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  statusErr: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 12, fontWeight: '600' },
  okText: { color: '#16A34A' },
  errText: { color: '#DC2626' },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineLoadingText: { fontSize: 12, color: '#475569' },
  error: { marginBottom: 8, color: '#DC2626' },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sectionSubtitle: { fontSize: 12, color: '#64748b' },
  carousel: { marginBottom: 16 },
  carouselItem: { width: 320, borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 12, padding: 12, marginRight: 12 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  chartContainer: { height: 140, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, backgroundColor: '#F9FAFB' },
  chartBarsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  chartBar: { width: 8, borderRadius: 4, backgroundColor: '#0f172a' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 999, backgroundColor: '#0f172a' },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexBasis: '48%', borderRadius: 12, borderWidth: 1, borderColor: '#E4E7EC', padding: 12, borderLeftWidth: 6, minHeight: 100 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardIcon: { marginRight: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardBody: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  cardValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  cardUnit: { fontSize: 12, color: '#64748b', marginBottom: 3 },
});
