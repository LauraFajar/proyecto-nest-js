import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { getBaseUrl } from '../../services/api';

const styles = {
  wrap: { marginVertical: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0f172a', borderRadius: 6 },
  btnAlt: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#334155', borderRadius: 6 },
  text: { color: '#fff', fontSize: 13 },
};

export default function ComprehensiveReportExport({ topic, fromDate, toDate, metric }) {
  const baseUrl = getBaseUrl();
  const query = useMemo(() => {
    const d1 = fromDate instanceof Date ? fromDate.toISOString().split('T')[0] : String(fromDate || '').split('T')[0];
    const d2 = toDate instanceof Date ? toDate.toISOString().split('T')[0] : String(toDate || '').split('T')[0];
    const qp = new URLSearchParams();
    if (topic) qp.set('topic', topic);
    if (metric) qp.set('metric', metric);
    if (d1) qp.set('fecha_desde', d1);
    if (d2) qp.set('fecha_hasta', d2);
    return qp.toString();
  }, [topic, fromDate, toDate, metric]);

  const openUrl = (type) => {
    const url = `${baseUrl}/sensores/export/${type}?${query}`;
    console.log('Abra esta URL en un navegador para descargar:', url);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Exportación IoT</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => openUrl('pdf')}>
          <Text style={styles.text}>PDF</Text>
        </Pressable>
        <Pressable style={styles.btnAlt} onPress={() => openUrl('excel')}>
          <Text style={styles.text}>Excel</Text>
        </Pressable>
      </View>
    </View>
  );
}
