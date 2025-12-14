import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { getBaseUrl } from '../../services/api';

const styles = {
  container: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#0f172a', borderRadius: 6 },
  btnAlt: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#334155', borderRadius: 6 },
  text: { color: '#fff', fontSize: 13 },
};

export default function ReportExportButtons({ topic, fromDate, toDate }) {
  const baseUrl = getBaseUrl();
  const buildParams = () => {
    const d1 = fromDate instanceof Date ? fromDate.toISOString().split('T')[0] : String(fromDate || '').split('T')[0];
    const d2 = toDate instanceof Date ? toDate.toISOString().split('T')[0] : String(toDate || '').split('T')[0];
    const qp = new URLSearchParams();
    if (topic) qp.set('topic', topic);
    if (d1) qp.set('desde', d1);
    if (d2) qp.set('hasta', d2);
    return qp.toString();
  };
  const openExport = (type) => {
    const endpoint = type === 'pdf' ? 'pdf' : 'excel';
    const url = `${baseUrl}/sensores/export/${endpoint}?${buildParams()}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return;
    }
    console.log('Abra esta URL en un navegador para descargar:', url);
  };
  return (
    <View style={styles.container}>
      <Pressable style={styles.btn} onPress={() => openExport('pdf')}>
        <Text style={styles.text}>Exportar PDF</Text>
      </Pressable>
      <Pressable style={styles.btnAlt} onPress={() => openExport('excel')}>
        <Text style={styles.text}>Exportar Excel</Text>
      </Pressable>
    </View>
  );
}
