import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import { useRoute, useNavigation } from '@react-navigation/native';
import { resetPassword } from '../../services/api';

export default function ResetPasswordPage() {
  const route = useRoute();
  const nav = useNavigation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = route?.params?.token;
    if (!t) {
      nav.replace('Login', {
        alert: {
          type: 'error',
          title: 'Enlace inválido',
          text: 'Solicita un nuevo enlace para restablecer tu contraseña.',
        },
      });
      return;
    }
    setToken(String(t));
  }, [route?.params, nav]);

  const handleSubmit = async () => {
    if ((password || '').length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, password);
      nav.replace('Login', {
        alert: {
          type: 'success',
          title: 'Contraseña actualizada',
          text: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
        },
      });
    } catch (e) {
      setError(e?.message || 'Ocurrió un error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <Text style={styles.title}>Restablecer contraseña</Text>
        <Text style={styles.message}>Ingresa tu nueva contraseña y confírmala.</Text>
        {error ? (
          <View style={styles.alertError}><Text style={styles.alertTitle}>Error</Text><Text style={styles.alertText}>{error}</Text></View>
        ) : null}
        <Input label="Nueva contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" secureTextEntry />
        <Input label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} placeholder="Repite tu contraseña" secureTextEntry />
        <View style={{ marginTop: 12 }}>
          <Button title={loading ? '' : 'Restablecer contraseña'} onPress={handleSubmit} disabled={loading} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f4f5f7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  logo: { width: 140, height: 70, marginBottom: 12 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  title: { fontSize: 20, fontWeight: '700', color: '#16A34A', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 13, color: '#334155', marginBottom: 8, textAlign: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  alertText: { fontSize: 12, color: '#334155' },
  alertError: { borderLeftWidth: 4, borderLeftColor: '#DC2626', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginBottom: 8 },
})

