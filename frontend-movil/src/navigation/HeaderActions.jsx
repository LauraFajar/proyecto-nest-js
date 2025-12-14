import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import ProfileModal from '../components/molecules/ProfileModal';
import { listRealizaMine, listRealiza, getActividadById, listActividades, listMisActividades } from '../services/api';

export default function HeaderActions() {
  const { user, token, logout } = useAuth();
  const nav = useNavigation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const deriveUserId = (u) => {
    if (!u) return null;
    const cands = [u.id_usuarios, u.id_usuario, u.id, u.userId];
    const id = cands.find((v) => v !== undefined && v !== null);
    return id || null;
  };
  const fetchNotifs = async () => {
    setLoadingNotifs(true);
    try {
      const uid = deriveUserId(user);
      if (!uid || !token) {
        setNotifications([]);
      } else {
        setAssignedLoading(true);
        const myId = Number(uid);
        const myDoc = String(user?.numero_documento || '').trim().toLowerCase();
        let activities = [];
        // Prefer listado directo de mis actividades desde backend
        try {
          const mine = await listMisActividades(token);
          activities = Array.isArray(mine) ? mine : [];
        } catch {}
        // Segundo prefer: relaciones (realiza)
        // Fallback: listar actividades y filtrar por responsable
        if (!Array.isArray(activities) || activities.length === 0) {
          try {
            const res = await listActividades(token, { page: 1, limit: 1000 });
            const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
            const uname = `${String(user?.nombres || '').trim().toLowerCase()} ${String(user?.apellidos || '').trim().toLowerCase()}`.trim();
            const isMine = (a) => {
              const rid = Number(a?.responsable_id ?? a?.id_usuario ?? a?.id_responsable);
              const rname = String(
                a?.responsable ??
                a?.responsable_nombre ??
                a?.encargado ??
                a?.usuario ??
                a?.user ??
                ''
              ).trim().toLowerCase();
              const rdoc = String(a?.numero_documento || '').trim().toLowerCase();
              const matchId = Number.isFinite(myId) && rid === myId;
              const matchDoc = myDoc && rdoc === myDoc;
              const matchName = uname && rname === uname;
              return matchId || matchDoc || matchName;
            };
            activities = items.filter(isMine);
          } catch {}
        }
        activities.sort((a, b) => String(b?.fecha || '').localeCompare(String(a?.fecha || '')));
        setNotifications(activities);
        setAssignedLoading(false);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.iconWrap}
        onPress={async () => {
          const next = !notifOpen;
          setNotifOpen(next);
          if (next) await fetchNotifs();
        }}
      >
        <Feather name="bell" size={20} color="#0f172a" />
        {notifications.length > 0 ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{notifications.length}</Text></View>
        ) : null}
      </Pressable>
      <Pressable style={styles.iconWrap} onPress={() => setOpen(!open)}>
        <Feather name="user" size={20} color="#0f172a" />
        <Feather name="chevron-down" size={16} color="#64748b" />
      </Pressable>
      {notifOpen ? (
        <View style={styles.notifDropdown}>
          <View style={styles.notifHeader}>
            <Feather name="activity" size={16} color="#fff" />
            <Text style={styles.notifHeaderText}>Tus actividades</Text>
          </View>
          <View style={{ maxHeight: 280 }}>
            {loadingNotifs ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : (
              <ScrollView>
                {notifications.map((a) => (
                  <Pressable key={String(a.id_actividad || a.id)} style={styles.notifItem} onPress={() => { setNotifOpen(false); nav.navigate('Actividades', { focusActivityId: a.id_actividad || a.id }); }}>
                    <View style={styles.notifIcon}>
                      <Feather name="activity" size={16} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{a.tipo_actividad || 'Actividad'}</Text>
                      <Text style={styles.notifText} numberOfLines={2}>{a.detalles || ''}</Text>
                      <Text style={styles.notifTime}>{(String(a.fecha || '')).slice(0,10)} {(String(a.estado || '').toLowerCase())}</Text>
                    </View>
                  </Pressable>
                ))}
                {notifications.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Sin actividades asignadas</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}
      {open ? (
        <View style={styles.dropdown}>
          <Text style={styles.name}>{user?.nombres || user?.numero_documento || 'Usuario'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          {user?.rol ? <Text style={styles.role}>{String(user.rol).toUpperCase()}</Text> : null}
          <Pressable style={styles.item} onPress={() => { setOpen(false); setProfileOpen(true); }}>
            <Feather name="external-link" size={16} color="#0f172a" />
            <Text style={styles.itemText}>Ver Perfil</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={[styles.item, styles.logout]} onPress={() => { setOpen(false); logout(); nav.replace('Login'); }}>
            <Feather name="log-out" size={16} color="#fff" />
            <Text style={[styles.itemText, { color: '#fff' }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : null}
      <ProfileModal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onLogout={() => { setProfileOpen(false); logout(); nav.replace('Login'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  iconWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 4, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  dropdown: { position: 'absolute', top: 30, right: 0, width: 240, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  notifDropdown: { position: 'absolute', top: 30, right: 60, width: 320, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  notifHeader: { backgroundColor: '#23A047', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifHeaderText: { color: '#fff', fontWeight: '700' },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifIcon: { width: 28, alignItems: 'center' },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  notifText: { fontSize: 12, color: '#334155', marginTop: 2 },
  notifTime: { fontSize: 11, color: '#64748b', marginTop: 4 },
  emptyBox: { paddingHorizontal: 12, paddingVertical: 16 },
  emptyText: { color: '#334155' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12 },
  loadingText: { color: '#334155' },
  name: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 12, color: '#64748b', marginTop: 2 },
  role: { fontSize: 12, color: '#16A34A', marginTop: 2, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  itemText: { marginLeft: 8, fontSize: 13, color: '#0f172a' },
  separator: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  logout: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' },
});
