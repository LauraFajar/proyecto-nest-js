import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Input from '../atoms/Input';
import Button from '../atoms/Button';

const TYPES = [
  { value: 'Entrada', label: 'Entrada' },
  { value: 'Salida', label: 'Salida' },
];

export default function InventoryMovementModal({ visible, onClose, onSubmit, insumos = [], cultivos = [], preset }) {
  const [values, setValues] = useState({ tipo_movimiento: 'Entrada', id_insumo: '', cantidad: '', unidad_medida: '', fecha_movimiento: '', id_cultivo: '', valor_unidad: '' });
  const [openTipo, setOpenTipo] = useState(false);
  const [openInsumo, setOpenInsumo] = useState(false);
  const [openCultivo, setOpenCultivo] = useState(false);
  const [error, setError] = useState('');
  const isQuick = !!(preset?.id_insumo) && !!preset?.tipo_movimiento;

  useEffect(() => {
    if (preset) setValues((p) => ({ ...p, id_insumo: preset.id_insumo || preset.id || '' }));
    setError('');
  }, [preset, visible]);

  const handleSave = async () => {
    const len = (s) => (s || '').trim().length;
    const errs = [];
    if (!isQuick) {
      if (!values.id_insumo) errs.push('id_insumo');
    }
    if (!len(values.cantidad)) errs.push('cantidad');
    if (!isQuick) {
      if (!len(values.unidad_medida)) errs.push('unidad_medida');
      if (!len(values.fecha_movimiento)) errs.push('fecha_movimiento');
      if (!len(values.tipo_movimiento)) errs.push('tipo_movimiento');
    }
    const isSalida = String(preset?.tipo_movimiento || values.tipo_movimiento || '').toLowerCase() === 'salida';
    if (isSalida) {
      if (!len(values.id_cultivo)) errs.push('id_cultivo');
      if (!String(values.valor_unidad).length) errs.push('valor_unidad');
    }
    if (errs.length) { setError('Completa todos los campos'); return; }
    try {
      const todayStr = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      })();
      if (isQuick) {
        const unidad = (() => {
          const ins = insumos.find(i => String(i.id_insumo || i.id) === String(preset.id_insumo));
          return ins?.unidad_medida || ins?.unidad || values.unidad_medida || '';
        })();
        const payload = {
          id_insumo: Number(preset.id_insumo),
          tipo_movimiento: String(preset.tipo_movimiento).toLowerCase(),
          cantidad: Number(values.cantidad),
          unidad_medida: unidad,
          fecha_movimiento: values.fecha_movimiento || todayStr,
          id_cultivo: isSalida && len(values.id_cultivo) ? Number(values.id_cultivo) : undefined,
          valor_unidad: isSalida && String(values.valor_unidad).length ? Number(values.valor_unidad) : undefined,
        };
        await onSubmit(payload);
      } else {
        await onSubmit({
          ...values,
          id_insumo: Number(values.id_insumo),
          cantidad: Number(values.cantidad),
          id_cultivo: len(values.id_cultivo) ? Number(values.id_cultivo) : undefined,
          valor_unidad: String(values.valor_unidad).length ? Number(values.valor_unidad) : undefined,
        });
      }
      onClose();
    } catch (e) {
      setError(e?.message || 'Error guardando');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Registrar Movimiento</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!isQuick && (
            <>
              <Text style={styles.label}>Tipo</Text>
              <Pressable style={styles.select} onPress={() => setOpenTipo(!openTipo)}>
                <Text style={styles.selectText}>{TYPES.find(t => t.value === values.tipo_movimiento)?.label || 'Selecciona tipo'}</Text>
              </Pressable>
              {openTipo ? (
                <View style={styles.selectMenu}>
                  {TYPES.map((t) => (
                    <Pressable key={t.value} style={styles.selectItem} onPress={() => { setValues((p) => ({ ...p, tipo_movimiento: t.value })); setOpenTipo(false); }}>
                      <Text style={styles.selectItemText}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.label}>Insumo</Text>
              <Pressable style={styles.select} onPress={() => setOpenInsumo(!openInsumo)}>
                <Text style={styles.selectText}>{(() => {
                  const found = insumos.find((i) => String(i.id_insumo || i.id) === String(values.id_insumo));
                  return found?.nombre_insumo || 'Selecciona insumo';
                })()}</Text>
              </Pressable>
              {openInsumo ? (
                <View style={styles.selectMenu}>
                  {insumos.map((i, idx) => (
                    <Pressable key={String(i.id_insumo || i.id || idx)} style={styles.selectItem} onPress={() => { setValues((p) => ({ ...p, id_insumo: i.id_insumo || i.id })); setOpenInsumo(false); }}>
                      <Text style={styles.selectItemText}>{i.nombre_insumo || i.nombre || `Insumo ${i.id_insumo || i.id}`}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}
          <Input label="Cantidad" value={String(values.cantidad)} onChangeText={(v) => setValues((p) => ({ ...p, cantidad: v }))} placeholder="Ej: 10" />
          {!isQuick && (
            <>
              <Input label="Unidad de medida" value={values.unidad_medida} onChangeText={(v) => setValues((p) => ({ ...p, unidad_medida: v }))} placeholder="Ej: kg, L, und" />
              <Input label="Fecha de movimiento (YYYY-MM-DD)" value={values.fecha_movimiento} onChangeText={(v) => setValues((p) => ({ ...p, fecha_movimiento: v }))} placeholder="YYYY-MM-DD" />
            </>
          )}
          {(isQuick ? String(preset?.tipo_movimiento || '').toLowerCase() === 'salida' : String(values.tipo_movimiento || '').toLowerCase() === 'salida') && (
            <>
              <Text style={styles.label}>Cultivo</Text>
              <Pressable style={styles.select} onPress={() => setOpenCultivo(!openCultivo)}>
                <Text style={styles.selectText}>{(() => {
                  const found = cultivos.find((c) => String(c.id_cultivo || c.id) === String(values.id_cultivo));
                  return found?.nombre_cultivo || found?.displayName || found?.tipo_cultivo || 'Selecciona cultivo';
                })()}</Text>
              </Pressable>
              {openCultivo ? (
                <View style={styles.selectMenu}>
                  {cultivos.map((c, idx) => (
                    <Pressable key={String(c.id_cultivo || c.id || idx)} style={styles.selectItem} onPress={() => { setValues((p) => ({ ...p, id_cultivo: c.id_cultivo || c.id })); setOpenCultivo(false); }}>
                      <Text style={styles.selectItemText}>{c.nombre_cultivo || c.displayName || c.tipo_cultivo || `Cultivo ${c.id_cultivo || c.id}`}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Input label="Valor unitario" value={String(values.valor_unidad)} onChangeText={(v) => setValues((p) => ({ ...p, valor_unidad: v }))} placeholder="Ej: 5000" />
            </>
          )}
          <View style={styles.actions}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
            <View style={{ width: 12 }} />
            <Button title="Guardar" onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: '#1E88E5' },
  label: { fontSize: 12, color: '#333', marginTop: 8 },
  select: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 },
  selectText: { fontSize: 14, color: '#0f172a' },
  selectMenu: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, marginTop: 6 },
  selectItem: { paddingHorizontal: 12, paddingVertical: 10 },
  selectItemText: { fontSize: 14, color: '#334155' },
  actions: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
  error: { marginTop: 8, fontSize: 12, color: '#DC2626', textAlign: 'center' },
});
