import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AlertProvider } from './src/contexts/AlertContext';
import LoginPage from './src/pages/auth/LoginPage';
import ForgotPasswordPage from './src/pages/auth/ForgotPasswordPage';
import RegisterPage from './src/pages/auth/RegisterPage';
import ResetPasswordPage from './src/pages/auth/ResetPasswordPage';
import AppDrawer from './src/navigation/AppDrawer';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Stack = createNativeStackNavigator();

function GuestRestrictedScreen({ navigation }) {
  const { user, logout } = useAuth();
  const fullName = `${String(user?.nombre || '').trim()} ${String(user?.apellidos || '').trim()}`.trim() || (user?.nombre_usuario || user?.username || 'usuario');
  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };
  const doLogout = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };
  return (
    <View style={styles.restrictRoot}>
      <View style={styles.restrictCard}>
        <Text style={styles.restrictTitle}>Acceso restringido</Text>
        <Text style={styles.restrictText}>
          Hola {fullName}, tu cuenta se encuentra registrada como
        </Text>
        <Text style={styles.restrictRole}>Invitado.</Text>
        <Text style={styles.restrictText}>
          Un administrador debe actualizar tu rol para que puedas acceder a la plataforma. Mientras tanto, puedes volver al inicio o cerrar sesión.
        </Text>
        <View style={styles.restrictActions}>
          <Pressable onPress={goHome} style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnPrimaryText}>Volver al inicio</Text>
          </Pressable>
          <Pressable onPress={doLogout} style={[styles.btn, styles.btnSecondary]}>
            <Text style={styles.btnSecondaryText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AppGate({ navigation }) {
  const { token, user } = useAuth();
  const roleName = String(user?.id_rol?.nombre_rol || user?.nombre_rol || user?.rol || '').toLowerCase();
  const isGuest = Boolean(token) && roleName === 'invitado';
  if (isGuest) {
    return <GuestRestrictedScreen navigation={navigation} />;
  }
  return <AppDrawer />;
}

function RootNavigator() {
  const { token, user, hydrated } = useAuth();
  const initial = 'Login';
  const linking = {
    prefixes: ['agrotic://'],
    config: {
      screens: {
        Login: 'login',
        Forgot: 'forgot-password',
        Reset: 'reset-password',
        App: 'app',
      },
    },
  };
  if (!hydrated) {
    return (
      <NavigationContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Cargando…</Text>
        </View>
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={initial} key={initial}>
        <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
        <Stack.Screen name="Forgot" component={ForgotPasswordPage} options={{ title: 'Recuperar contraseña' }} />
        <Stack.Screen name="Reset" component={ResetPasswordPage} options={{ title: 'Restablecer contraseña' }} />
        <Stack.Screen name="Register" component={RegisterPage} options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="App" component={AppGate} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <View style={{flex:1}}>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AlertProvider>
      </QueryClientProvider>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  restrictRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 16 },
  restrictCard: { width: '92%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#e5e7eb' },
  restrictTitle: { fontSize: 22, fontWeight: '800', color: '#16A34A', textAlign: 'center', marginBottom: 12 },
  restrictText: { fontSize: 14, color: '#334155', textAlign: 'center', marginBottom: 8 },
  restrictRole: { fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  restrictActions: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
  btnPrimary: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  btnSecondary: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnSecondaryText: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
});
