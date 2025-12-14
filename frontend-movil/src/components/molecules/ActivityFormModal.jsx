import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { listActividadFotos, deleteActividadFoto } from '../../services/api';

const activityTypes = [
  { value: 'siembra', label: 'Siembra' },
  { value: 'riego', label: 'Riego' },
  { value: 'fertilizacion', label: 'Fertilización' },
  { value: 'poda', label: 'Poda' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'otro', label: 'Otro' }
];

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' }
];

export default function ActivityFormModal({ visible, onClose, onSubmit, activity, crops = [], users = [], loading }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    tipo_actividad: '',
    fecha: null,
    responsable: '',
    id_usuario: '',
    detalles: '',
    estado: 'pendiente',
    id_cultivo: '',
    costo_mano_obra: '',
    costo_maquinaria: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (activity) {
      const deriveUserId = (a) => {
        try {
          if (!a) return '';
          if (a.id_usuario) return String(a.id_usuario);
          if (a.id_responsable) return String(a.id_responsable);
          if (a.usuario && typeof a.usuario === 'object') {
            const idu = a.usuario.id_usuarios || a.usuario.id || a.usuario.id_usuario;
            return idu ? String(idu) : '';
          }
          return '';
        } catch { return ''; }
      };
      const formatUserName = (u) => {
        try {
          if (!u) return '';
          if (typeof u === 'object') {
            const nombres = u.nombres || u.nombre || '';
            const apellidos = u.apellidos || u.apellido || '';
            const full = `${String(nombres || '').trim()} ${String(apellidos || '').trim()}`.trim();
            return full || (u.username || u.user_name || u.name || '');
          }
          const s = String(u).trim();
          if (/^\d+$/.test(s)) {
            const found = users.find(us => String(us.id_usuarios || us.id || us.id_usuario) === s);
            if (found) {
              const nombres = found.nombres || found.nombre || '';
              const apellidos = found.apellidos || found.apellido || '';
              const full = `${String(nombres || '').trim()} ${String(apellidos || '').trim()}`.trim();
              return full || (found.username || found.user_name || found.name || `Usuario #${s}`);
            }
            return `Usuario #${s}`;
          }
          return s;
        } catch { return ''; }
      };
      setFormData({
        tipo_actividad: activity.tipo_actividad || '',
        fecha: activity.fecha ? new Date(activity.fecha) : new Date(),
        responsable: formatUserName(activity.responsable ?? activity.usuario ?? activity.user ?? ''),
        id_usuario: deriveUserId(activity),
        detalles: activity.detalles || '',
        estado: activity.estado || 'pendiente',
        id_cultivo: activity.id_cultivo || '',
        costo_mano_obra: (activity.costo_mano_obra ?? activity.costoManoObra ?? '') === '' ? '' : String(activity.costo_mano_obra ?? activity.costoManoObra),
        costo_maquinaria: (activity.costo_maquinaria ?? activity.costoMaquinaria ?? '') === '' ? '' : String(activity.costo_maquinaria ?? activity.costoMaquinaria)
      });
      (async () => {
        try {
          setPhotoError('');
          const id = activity.id_actividad || activity.id;
          if (id) {
            const arr = await listActividadFotos(id, token);
            setPhotos(arr.map((f) => ({ id: f.id, uri: f.url_imagen })));
          } else {
            setPhotos([]);
          }
        } catch (e) {
          setPhotos([]);
        }
      })();
    } else {
      setFormData({
        tipo_actividad: '',
        fecha: new Date(),
        responsable: '',
        id_usuario: '',
        detalles: '',
        estado: 'pendiente',
        id_cultivo: '',
        costo_mano_obra: '',
        costo_maquinaria: ''
      });
      setPhotos([]);
    }
  }, [activity, visible]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleChange('fecha', selectedDate);
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    const isCreate = !activity;
    const mano = formData.costo_mano_obra;
    const maq = formData.costo_maquinaria;
    const parseNum = (v) => {
      if (v === '' || v === null || v === undefined) return NaN;
      const s = String(v).replace(/[, ]/g, '');
      const n = Number(s);
      return n;
    };
    const manoNum = parseNum(mano);
    const maqNum = parseNum(maq);
    const MAX_COST = 9999999999.99;
    if (isCreate) {
      if (!formData.id_cultivo) {
        setFormError('Selecciona un cultivo');
        return;
      }
      if (!formData.id_usuario) {
        setFormError('Selecciona un responsable');
        return;
      }
      if (!Number.isFinite(manoNum) || manoNum <= 0) {
        setFormError('Ingresa costo de mano de obra');
        return;
      }
      if (manoNum > MAX_COST) {
        setFormError('El costo de mano de obra excede el máximo permitido');
        return;
      }
      if (!Number.isFinite(maqNum) || maqNum <= 0) {
        setFormError('Ingresa costo de maquinaria');
        return;
      }
      if (maqNum > MAX_COST) {
        setFormError('El costo de maquinaria excede el máximo permitido');
        return;
      }
    }
    const payload = {
      ...formData,
      fecha: formData.fecha ? formData.fecha.toISOString() : null,
      id_cultivo: formData.id_cultivo ? parseInt(formData.id_cultivo, 10) : null,
      id_usuario: formData.id_usuario ? parseInt(formData.id_usuario, 10) : null,
      costo_mano_obra: Number.isFinite(manoNum) ? manoNum : undefined,
      costo_maquinaria: Number.isFinite(maqNum) ? maqNum : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{activity ? 'Editar Actividad' : 'Nueva Actividad'}</Text>
          <ScrollView style={styles.scroll}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.tipo_actividad}
                onValueChange={(value) => handleChange('tipo_actividad', value)}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar tipo..." value="" />
                {activityTypes.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.id_cultivo}
                onValueChange={(value) => handleChange('id_cultivo', value)}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar cultivo..." value="" />
                {crops.map(crop => (
                  <Picker.Item key={crop.id_cultivo || crop.id} label={crop.nombre_cultivo || crop.displayName || crop.tipo_cultivo} value={crop.id_cultivo || crop.id} />
                ))}
              </Picker>
            </View>

            <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>
                Fecha: {formData.fecha ? formData.fecha.toLocaleDateString() : 'Seleccionar'}
              </Text>
            </Pressable>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.id_usuario}
                onValueChange={(value) => {
                  const val = String(value || '');
                  handleChange('id_usuario', val);
                  const found = users.find(us => String(us.id_usuarios || us.id || us.id_usuario) === val);
                  const nombre = found ? `${String(found.nombres || found.nombre || '').trim()} ${String(found.apellidos || found.apellido || '').trim()}`.trim() : '';
                  handleChange('responsable', nombre);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar responsable..." value="" />
                {(Array.isArray(users) ? users : []).map(u => {
                  const id = u.id_usuarios || u.id || u.id_usuario;
                  const nombre = `${String(u.nombres || u.nombre || '').trim()} ${String(u.apellidos || u.apellido || '').trim()}`.trim() || (u.username || u.user_name || u.name || '');
                  return <Picker.Item key={String(id)} label={nombre || `Usuario #${id}`} value={String(id)} />;
                })}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.estado}
                onValueChange={(value) => handleChange('estado', value)}
                style={styles.picker}
              >
                {statusOptions.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Costo Mano de Obra"
                keyboardType="numeric"
                value={String(formData.costo_mano_obra || '')}
                onChangeText={(value) => handleChange('costo_mano_obra', value)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Costo Maquinaria"
                keyboardType="numeric"
                value={String(formData.costo_maquinaria || '')}
                onChangeText={(value) => handleChange('costo_maquinaria', value)}
              />
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalles"
              value={formData.detalles}
              onChangeText={(value) => handleChange('detalles', value)}
              multiline
              numberOfLines={3}
            />
            {formError ? <Text style={[styles.detailsMuted, { color: '#d32f2f' }]}>{formError}</Text> : null}
            {activity ? (
              <>
                <Text style={styles.sectionTitle}>Imágenes</Text>
                {Array.isArray(photos) && photos.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {photos.map((p, idx) => (
                      <View key={idx} style={styles.photoWrap}>
                        <Image source={{ uri: p.uri }} style={styles.photoImg} />
                        {p.id ? (
                          <Pressable
                            style={styles.photoDel}
                            onPress={async () => {
                              try {
                                const id = activity?.id_actividad || activity?.id;
                                await deleteActividadFoto(p.id, token);
                                const arr = await listActividadFotos(id, token);
                                setPhotos(arr.map((f) => ({ id: f.id, uri: f.url_imagen })));
                              } catch (e) {
                                setPhotoError(e?.message || 'No se pudo eliminar la foto');
                              }
                            }}
                          >
                            <Feather name="trash-2" size={14} color="#fff" />
                          </Pressable>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.detailsMuted}>No hay fotos para esta actividad.</Text>
                )}
                {photoError ? <Text style={[styles.detailsMuted, { color: '#d32f2f' }]}>{photoError}</Text> : null}
              </>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>{activity ? 'Actualizar' : 'Crear'}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={formData.fecha || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  scroll: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, marginBottom: 12 },
  picker: { height: 50 },
  dateBtn: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#f9f9f9' },
  dateText: { fontSize: 14, color: '#0f172a' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  btnSecondary: { borderWidth: 1, borderColor: '#E4E7EC' },
  btnSecondaryText: { color: '#334155', fontSize: 14 },
  btnPrimary: { backgroundColor: '#16A34A' },
  btnPrimaryText: { color: '#fff', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  detailsMuted: { fontSize: 13, color: '#64748b' },
  photoWrap: { width: 96, height: 96, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  photoDel: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4 },
});
