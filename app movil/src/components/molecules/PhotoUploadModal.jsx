import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { uploadActividadFoto } from '../../services/api';

export default function PhotoUploadModal({ visible, activity, onClose, onUploaded }) {
  const { token } = useAuth();
  const [image, setImage] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickFromLibrary = async () => {
    setError('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' });
    }
  };

  const pickFromCamera = async () => {
    setError('');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      setError('Permiso de cámara denegado');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.mimeType || 'image/jpeg' });
    }
  };

  const handleUpload = async () => {
    setError('');
    if (!image) {
      setError('Selecciona una imagen');
      return;
    }
    const id = activity?.id_actividad || activity?.id;
    if (!id) {
      setError('Actividad inválida');
      return;
    }
    setLoading(true);
    try {
      await uploadActividadFoto(id, image, token, descripcion);
      setImage(null);
      setDescripcion('');
      onUploaded && onUploaded();
    } catch (e) {
      const msg = e?.message || 'Error subiendo foto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderBar}>
            <Feather name="camera" size={18} color="#fff" />
            <Text style={styles.modalHeaderText}>Subir Foto de Actividad</Text>
          </View>
          <View style={{ padding: 12 }}>
            <View style={styles.actionsRow}>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={pickFromCamera}>
                <Feather name="camera" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}> Cámara</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={pickFromLibrary}>
                <Feather name="image" size={16} color="#334155" />
                <Text style={styles.btnSecondaryText}> Galería</Text>
              </Pressable>
            </View>
            {image ? (
              <View style={styles.previewBox}>
                <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
              </View>
            ) : (
              <Text style={styles.hint}>Selecciona una imagen desde cámara o galería</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChangeText={setDescripcion}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onClose} disabled={loading}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSuccess]} onPress={handleUpload} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Subir</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '92%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12 },
  modalHeaderBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalHeaderText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#22C55E' },
  btnSuccess: { backgroundColor: '#16A34A' },
  btnSecondary: { borderWidth: 1, borderColor: '#E4E7EC', backgroundColor: '#fff' },
  btnPrimaryText: { color: '#fff', fontSize: 13 },
  btnSecondaryText: { color: '#334155', fontSize: 13 },
  previewBox: { marginVertical: 8, borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, overflow: 'hidden' },
  preview: { width: '100%', height: 220 },
  input: { borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginTop: 8 },
  hint: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  error: { marginTop: 8, color: '#DC2626' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
});
