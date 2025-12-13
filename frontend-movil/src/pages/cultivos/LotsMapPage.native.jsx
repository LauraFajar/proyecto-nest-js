import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, ScrollView, Dimensions, Modal, Switch, TextInput } from 'react-native';
import { MapView, Polygon, Polyline, Marker, PROVIDER_GOOGLE } from '../../components/MapViewComponent';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import lotService from '../../services/lotService';
import sublotService from '../../services/sublotService';
import cropService from '../../services/cropService';
import LotFormModal from '../../components/molecules/LotFormModal';
import SublotFormModal from '../../components/molecules/SublotFormModal';

const toLatLng = (input) => {
  if (!input) return [];
  try {
    const coords = input?.coordinates ? input.coordinates : input;
    if (typeof coords === 'string') {
      const wkt = String(coords).toUpperCase();
      if (wkt.includes('POLYGON')) {
        const inner = wkt.split('((')[1]?.split('))')[0] || '';
        return inner
          .split(',')
          .map((pair) => pair.trim().split(/\s+/))
          .map(([lngStr, latStr]) => ({ latitude: parseFloat(latStr), longitude: parseFloat(lngStr) }))
          .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
      }
      return [];
    }
    if (Array.isArray(coords)) {
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        const outerRing = coords[0];
        return outerRing.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      }
      if (Array.isArray(coords[0])) {
        return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
      }
    }
  } catch {}
  return [];
};

export default function LotsMapPage() {
  const { token } = useAuth();
  const alert = useAlert();
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [region, setRegion] = useState(null);
  const [showLotes, setShowLotes] = useState(true);
  const [showSublotes, setShowSublotes] = useState(true);
  const [openLotForm, setOpenLotForm] = useState(false);
  const [openSublotForm, setOpenSublotForm] = useState(false);
  const [openLotsModal, setOpenLotsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [drawMode, setDrawMode] = useState('off');
  const [drawPoints, setDrawPoints] = useState([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mapType, setMapType] = useState('callejero');
  const [lotFilter, setLotFilter] = useState('todos');
  const [crops, setCrops] = useState([]);
  const [enabledLots, setEnabledLots] = useState({});
  const [expandedLots, setExpandedLots] = useState({});
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const mapRef = useRef(null);
  const MAP_HEIGHT = Math.round(Dimensions.get('window').height * 0.55);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await lotService.getMapData(token);
        setMapData(data);
        const firstValid = (Array.isArray(data) ? data : []).find((l) => toLatLng(l?.coordenadas).length > 0);
        const positions = firstValid ? toLatLng(firstValid.coordenadas) : [];
        if (positions.length > 0) {
          const lats = positions.map((p) => p.latitude);
          const lngs = positions.map((p) => p.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const padding = 0.02;
          setRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(0.01, (maxLat - minLat) + padding),
            longitudeDelta: Math.max(0.01, (maxLng - minLng) + padding),
          });
        }
      } catch (e) {
        setError(e?.message || 'Error cargando datos del mapa');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, alert]);

  useEffect(() => {
    const next = { ...enabledLots };
    (Array.isArray(mapData) ? mapData : []).forEach((l) => {
      const id = Number(l.id_lote || l.id);
      if (Number.isFinite(id) && !(id in next)) next[id] = true;
    });
    setEnabledLots(next);
  }, [mapData]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        let page = 1;
        const acc = [];
        for (let i = 0; i < 20; i++) {
          const res = await cropService.getCrops(token, page, 100);
          const items = res?.items || [];
          acc.push(...items);
          const totalPages = Number(res?.meta?.totalPages) || 1;
          if (page >= totalPages || items.length === 0) break;
          page += 1;
        }
        if (active) setCrops(acc);
      } catch {}
    };
    run();
    return () => { active = false; };
  }, [token]);

  const locateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert.error('Permisos', 'Permiso de ubicación denegado');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords || {};
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        setUserPos({ latitude, longitude });
        setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        alert.success('Ubicación', 'Centrado en tu posición');
      }
    } catch (e) {
      alert.error('Ubicación', e?.message || 'Error obteniendo ubicación');
    }
  };

  const handleMapPress = (e) => {
    if (drawMode === 'off') return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;
    setDrawPoints((pts) => [...pts, coord]);
  };

  const clearDrawing = () => setDrawPoints([]);
  const stopDrawing = () => { setDrawMode('off'); setToolsOpen(false); };
  const toGeometry = (pts) => {
    const ring = (Array.isArray(pts) ? pts : []).map((p) => [p.longitude, p.latitude]);
    if (ring.length >= 3) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
      return { type: 'Polygon', coordinates: [ring] };
    }
    return null;
  };
  const fitToPositions = (positions) => {
    if (!Array.isArray(positions) || positions.length === 0) return;
    const lats = positions.map((p) => p.latitude);
    const lngs = positions.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const padding = 0.02;
    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) + padding),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) + padding),
    });
  };
  const fitToAll = () => {
    const pos = [];
    (Array.isArray(mapData) ? mapData : []).forEach((l) => {
      pos.push(...toLatLng(l.coordenadas));
      (Array.isArray(l.sublotes) ? l.sublotes : []).forEach((s) => pos.push(...toLatLng(s.coordenadas)));
    });
    fitToPositions(pos);
  };
  const [openSearch, setOpenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const getCropLotId = (c) => {
    const rel = c?.id_lote;
    if (rel == null) return null;
    if (typeof rel === 'object') {
      const id = rel.id_lote ?? rel.id ?? rel.idLote;
      return id != null ? Number(id) : null;
    }
    const n = Number(rel);
    return Number.isFinite(n) ? n : null;
  };
  const lotPassesFilter = (lote) => {
    const lid = Number(lote.id_lote || lote.id);
    if (!Number.isFinite(lid)) return false;
    if (lotFilter === 'todos') return true;
    const rel = crops.filter((c) => getCropLotId(c) === lid);
    if (lotFilter === 'cultivo') return rel.length > 0;
    const norm = (s) => String(s || '').toLowerCase();
    if (lotFilter === 'sembrado') return rel.some((c) => norm(c.estado_cultivo).includes('sembr'));
    if (lotFilter === 'cosechado') return rel.some((c) => norm(c.estado_cultivo).includes('cosech') || !!c.fecha_cosecha || !!c.fecha_cosecha_real);
    return true;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const MapViewCmp = MapView || (({ style }) => <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}><Text>Mapa no disponible</Text></View>);
  const PolygonCmp = Polygon || (() => null);
  const PolylineCmp = Polyline || (() => null);
  const MarkerCmp = Marker || (() => null);
  const saveDrawing = async () => {
    if (drawMode === 'polygon' && drawPoints.length >= 3) {
      const geometry = toGeometry(drawPoints);
      if (!geometry) { stopDrawing(); return; }
      if (!assignTarget) { setOpenAssignModal(true); return; }
      setSaving(true);
      try {
        if (assignTarget.type === 'lote') {
          await lotService.updateCoordinates(token, assignTarget.id, geometry);
        } else {
          await sublotService.updateCoordinates(token, assignTarget.id, geometry);
        }
        const data = await lotService.getMapData(token);
        setMapData(data);
        setDrawPoints([]);
        setDrawMode('off');
        setToolsOpen(false);
        setAssignTarget(null);
        alert.success('Mapa', 'Coordenadas actualizadas');
      } catch (e) {
        alert.error('Error', e?.message || 'Error asignando coordenadas');
      } finally {
        setSaving(false);
      }
    } else {
      stopDrawing();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Mapa de Lotes</Text>
      <View style={styles.topBar}>
        <View style={styles.cardsRow}>
          <View style={styles.card}><Text style={styles.cardTitle}>Lotes</Text><Text style={styles.cardNumber}>{Array.isArray(mapData) ? mapData.length : 0}</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>Sublotes</Text><Text style={styles.cardNumber}>{Array.isArray(mapData) ? mapData.reduce((s,l)=>s + (Array.isArray(l.sublotes)?l.sublotes.length:0),0) : 0}</Text></View>
        </View>
        <View style={styles.actionsRow}>
          <Pressable style={[styles.actionBtn, styles.primary]} onPress={() => setOpenLotForm(true)}><Text style={styles.actionBtnText}>Nuevo Lote</Text></Pressable>
          <Pressable style={[styles.actionBtn, styles.secondary]} onPress={() => setOpenSublotForm(true)}><Text style={styles.secondaryText}>Nuevo Sublote</Text></Pressable>
          <Pressable style={[styles.actionBtn, styles.secondary]} onPress={() => setOpenLotsModal(true)}><Text style={styles.secondaryText}>Ver Lotes</Text></Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        <View style={styles.toggleRowOneLine}>
          <Pressable style={[styles.toggleChip, showLotes ? styles.toggleActive : styles.toggleInactive]} onPress={() => setShowLotes((v)=>!v)}>
            <Text style={showLotes ? styles.toggleTextActive : styles.toggleTextInactive}>Lotes</Text>
          </Pressable>
          <Pressable style={[styles.toggleChip, showSublotes ? styles.toggleActive : styles.toggleInactive]} onPress={() => setShowSublotes((v)=>!v)}>
            <Text style={showSublotes ? styles.toggleTextActive : styles.toggleTextInactive}>Sublotes</Text>
          </Pressable>
          <Pressable style={[styles.toggleChip, mapType === 'callejero' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setMapType('callejero')}>
            <Text style={mapType === 'callejero' ? styles.toggleTextActive : styles.toggleTextInactive}>Callejero</Text>
          </Pressable>
          <Pressable style={[styles.toggleChip, mapType === 'satelite' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setMapType('satelite')}>
            <Text style={mapType === 'satelite' ? styles.toggleTextActive : styles.toggleTextInactive}>Satélite</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggleChip, lotFilter === 'todos' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setLotFilter('todos')}>
          <Text style={lotFilter === 'todos' ? styles.toggleTextActive : styles.toggleTextInactive}>Todos</Text>
        </Pressable>
        <Pressable style={[styles.toggleChip, lotFilter === 'sembrado' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setLotFilter('sembrado')}>
          <Text style={lotFilter === 'sembrado' ? styles.toggleTextActive : styles.toggleTextInactive}>Sembrado</Text>
        </Pressable>
        <Pressable style={[styles.toggleChip, lotFilter === 'cosechado' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setLotFilter('cosechado')}>
          <Text style={lotFilter === 'cosechado' ? styles.toggleTextActive : styles.toggleTextInactive}>Cosechado</Text>
        </Pressable>
        <Pressable style={[styles.toggleChip, lotFilter === 'cultivo' ? styles.toggleActive : styles.toggleInactive]} onPress={() => setLotFilter('cultivo')}>
          <Text style={lotFilter === 'cultivo' ? styles.toggleTextActive : styles.toggleTextInactive}>Cultivo</Text>
        </Pressable>
      </View>
      <MapViewCmp
        style={[styles.map, { height: MAP_HEIGHT }]}
        initialRegion={{
          latitude: 1.89,
          longitude: -76.09,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        {...(region ? { region } : {})}
        onPress={handleMapPress}
        {...(PROVIDER_GOOGLE ? { provider: PROVIDER_GOOGLE } : {})}
        showsUserLocation={true}
        mapType={mapType === 'satelite' ? 'satellite' : 'standard'}
        ref={mapRef}
      >
        {mapData.map((lote) => {
          const lotePositions = toLatLng(lote.coordenadas);
          return (
            <React.Fragment key={`lote-${lote.id_lote || lote.id}`}>
              {showLotes && lotePositions.length >= 3 && (enabledLots[Number(lote.id_lote || lote.id)] ?? true) && (
                <PolygonCmp
                  coordinates={lotePositions}
                  strokeColor={(selectedEntity?.type === 'lote' && (selectedEntity?.id === (lote.id_lote || lote.id))) ? '#F59E0B' : '#4CAF50'}
                  fillColor={(selectedEntity?.type === 'lote' && (selectedEntity?.id === (lote.id_lote || lote.id))) ? 'rgba(245, 158, 11, 0.25)' : 'rgba(76, 175, 80, 0.3)'}
                  strokeWidth={(selectedEntity?.type === 'lote' && (selectedEntity?.id === (lote.id_lote || lote.id))) ? 4 : 3}
                  tappable={true}
                  onPress={() => setSelectedEntity({ type: 'lote', id: (lote.id_lote || lote.id), nombre: lote.nombre_lote || lote.nombre })}
                />
              )}
              {Array.isArray(lote.sublotes) && lote.sublotes.map((sublote) => {
                const subPositions = toLatLng(sublote.coordenadas);
                return (
                  showSublotes && subPositions.length >= 3 ? (
                    <PolygonCmp
                      key={`sub-${sublote.id_sublote || sublote.id}`}
                      coordinates={subPositions}
                      strokeColor={(selectedEntity?.type === 'sublote' && (selectedEntity?.id === (sublote.id_sublote || sublote.id))) ? '#2196F3' : '#2196F3'}
                      fillColor={(selectedEntity?.type === 'sublote' && (selectedEntity?.id === (sublote.id_sublote || sublote.id))) ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.3)'}
                      strokeWidth={(selectedEntity?.type === 'sublote' && (selectedEntity?.id === (sublote.id_sublote || sublote.id))) ? 4 : 3}
                      tappable={true}
                      onPress={() => setSelectedEntity({ type: 'sublote', id: (sublote.id_sublote || sublote.id), nombre: sublote.nombre_sublote || sublote.nombre })}
                    />
                  ) : null
                );
              })}
            </React.Fragment>
          );
        })}
        {userPos ? <MarkerCmp coordinate={userPos} title="Tu posición" /> : null}
        {drawMode !== 'off' && drawPoints.length >= 2 ? (
          drawMode === 'polygon' && drawPoints.length >= 3 ? (
            <PolygonCmp
              coordinates={[...drawPoints, drawPoints[0]]}
              strokeColor="#FF9800"
              fillColor="rgba(255,152,0,0.2)"
              strokeWidth={3}
            />
          ) : (
            <PolylineCmp
              coordinates={drawPoints}
              strokeColor="#FF9800"
              strokeWidth={3}
            />
          )
        ) : null}
      </MapViewCmp>
      <View style={styles.overlayTopRight}>
        <Text style={styles.badge}>{Array.isArray(mapData) ? mapData.length : 0}</Text>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch,{backgroundColor:'rgba(76, 175, 80, 0.6)'}]} />
          <Text style={styles.legendText}>Lote</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch,{backgroundColor:'rgba(33, 150, 243, 0.6)'}]} />
          <Text style={styles.legendText}>Sublote</Text>
        </View>
      </View>
      <View style={styles.fabContainer}>
        <Pressable style={styles.fab} onPress={locateMe}><Feather name="navigation" size={18} color="#fff" /></Pressable>
        <Pressable style={[styles.fab, styles.fabSecondary]} onPress={() => { setToolsOpen(true); setDrawMode((d)=> d==='off' ? 'polygon' : d); }}><Feather name="edit-2" size={18} color="#0f172a" /></Pressable>
        <Pressable style={[styles.fab, styles.fabSecondary]} onPress={fitToAll}><Feather name="maximize-2" size={18} color="#0f172a" /></Pressable>
        <Pressable style={[styles.fab, styles.fabSecondary]} onPress={() => setOpenSearch(true)}><Feather name="search" size={18} color="#0f172a" /></Pressable>
      </View>
      {toolsOpen && (
        <View style={styles.toolsPanel}>
          <Text style={styles.toolsTitle}>Herramientas</Text>
          <View style={styles.toolsRow}>
            <Pressable style={[styles.toolBtn, styles.toolSecondary]} onPress={() => setOpenAssignModal(true)}>
              <Text style={styles.toolSecondaryText}>Seleccionar Lote/Sublote</Text>
            </Pressable>
          </View>
          {assignTarget ? (
            <Text style={styles.selectedInfo}>{assignTarget.type === 'lote' ? 'Lote' : 'Sublote'}: {assignTarget.nombre}</Text>
          ) : (
            <Text style={styles.selectedInfoMuted}>Sin selección</Text>
          )}
          <View style={styles.toolsRow}>
            <Pressable style={[styles.toolChip, drawMode === 'line' ? styles.toolActive : styles.toolInactive]} onPress={() => setDrawMode('line')}>
              <Text style={drawMode === 'line' ? styles.toolTextActive : styles.toolTextInactive}>Línea</Text>
            </Pressable>
            <Pressable style={[styles.toolChip, drawMode === 'polygon' ? styles.toolActive : styles.toolInactive]} onPress={() => setDrawMode('polygon')}>
              <Text style={drawMode === 'polygon' ? styles.toolTextActive : styles.toolTextInactive}>Polígono</Text>
            </Pressable>
          </View>
          <View style={styles.toolsRow}>
            <Pressable style={[styles.toolBtn, styles.toolPrimary]} onPress={saveDrawing}><Text style={styles.toolPrimaryText}>Guardar</Text></Pressable>
            <Pressable style={[styles.toolBtn, styles.toolSecondary]} onPress={clearDrawing}><Text style={styles.toolSecondaryText}>Limpiar</Text></Pressable>
            <Pressable style={[styles.toolBtn, styles.toolSecondary]} onPress={() => { setToolsOpen(false); stopDrawing(); }}><Text style={styles.toolSecondaryText}>Cerrar</Text></Pressable>
          </View>
          <Text style={styles.toolsHint}>Toca el mapa para agregar puntos</Text>
        </View>
      )}
      <LotFormModal
        visible={openLotForm}
        loading={saving}
        onClose={() => setOpenLotForm(false)}
        onSubmit={async (payload) => {
          setSaving(true);
          try {
            const newLot = await lotService.createLot(token, payload);
            const geometry = toGeometry(drawPoints);
            if (newLot?.id && geometry) {
              await lotService.updateCoordinates(token, newLot.id, geometry);
            }
            setOpenLotForm(false);
            const data = await lotService.getMapData(token);
            setMapData(data);
            setDrawPoints([]);
            setDrawMode('off');
            setToolsOpen(false);
            alert.success('Lotes', 'Lote creado correctamente');
          } catch (e) {
            alert.error('Error', e?.message || 'Error creando lote');
          } finally {
            setSaving(false);
          }
        }}
      />
      <Modal visible={openLotsModal} transparent animationType="fade" onRequestClose={() => setOpenLotsModal(false)}>
        <View style={styles.listOverlay}>
          <View style={styles.listCard}>
            <View style={styles.listHeader}><Text style={styles.listHeaderText}>Listado de Lotes</Text></View>
            <ScrollView contentContainerStyle={styles.listContent}>
              {(Array.isArray(mapData) ? mapData : []).map((lote) => {
                const id = Number(lote.id_lote || lote.id);
                const name = lote.nombre_lote || lote.nombre || `Lote ${id}`;
                const desc = lote.descripcion || '—';
                const val = enabledLots[id] ?? true;
                return (
                  <View key={`lot-row-${id}`} style={styles.listRow}>
                    <Pressable style={{ flex: 1, paddingRight: 10 }} onPress={() => setExpandedLots((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))}>
                      <Text style={styles.listName}>{name}</Text>
                      {(expandedLots[id] ?? true) ? <Text style={styles.listDesc}>{desc}</Text> : null}
                    </Pressable>
                    <Switch value={val} onValueChange={(v) => setEnabledLots((prev) => ({ ...prev, [id]: v }))} />
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.listFooter}>
              <Pressable style={styles.listCloseBtn} onPress={() => setOpenLotsModal(false)}>
                <Text style={styles.listCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={openAssignModal} transparent animationType="fade" onRequestClose={() => setOpenAssignModal(false)}>
        <View style={styles.assignOverlay}>
          <View style={styles.assignCard}>
            <Text style={styles.assignTitle}>Asignar a</Text>
            <ScrollView>
              {(Array.isArray(mapData) ? mapData : []).map((lote) => {
                const lid = Number(lote.id_lote || lote.id);
                const lname = lote.nombre_lote || lote.nombre || `Lote ${lid}`;
                return (
                  <Pressable key={`assign-l-${lid}`} style={styles.assignItem} onPress={() => { setAssignTarget({ type: 'lote', id: lid, nombre: lname }); setOpenAssignModal(false); }}>
                    <Text style={styles.assignItemText}>Lote: {lname}</Text>
                  </Pressable>
                );
              })}
              {(Array.isArray(mapData) ? mapData : []).flatMap((l) => Array.isArray(l.sublotes) ? l.sublotes.map((s) => ({ s, l })) : []).map(({ s, l }) => {
                const sid = Number(s.id_sublote || s.id);
                const sname = s.nombre_sublote || s.nombre || `Sublote ${sid}`;
                return (
                  <Pressable key={`assign-s-${sid}`} style={styles.assignItem} onPress={() => { setAssignTarget({ type: 'sublote', id: sid, nombre: sname }); setOpenAssignModal(false); }}>
                    <Text style={styles.assignItemText}>Sublote: {sname}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={openSearch} transparent animationType="fade" onRequestClose={() => setOpenSearch(false)}>
        <View style={styles.listOverlay}>
          <View style={styles.listCard}>
            <View style={styles.listHeader}><Text style={styles.listHeaderText}>Buscar Lote</Text></View>
            <View style={{ padding: 12 }}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nombre de lote"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}
              />
              <ScrollView style={{ maxHeight: 280 }}>
                {(Array.isArray(mapData) ? mapData : [])
                  .filter((l) => String(l.nombre_lote || l.nombre || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()))
                  .map((l) => {
                    const id = Number(l.id_lote || l.id);
                    const name = l.nombre_lote || l.nombre || `Lote ${id}`;
                    const positions = toLatLng(l.coordenadas);
                    return (
                      <Pressable key={`sr-${id}`} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} onPress={() => { fitToPositions(positions); setOpenSearch(false); }}>
                        <Text style={{ fontWeight: '700', color: '#0f172a' }}>{name}</Text>
                        <Text style={{ color: '#334155', fontSize: 12 }}>{l.descripcion || ' '}</Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
              <View style={styles.listFooter}>
                <Pressable style={styles.listCloseBtn} onPress={() => setOpenSearch(false)}>
                  <Text style={styles.listCloseText}>Cerrar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <SublotFormModal
        visible={openSublotForm}
        onClose={() => setOpenSublotForm(false)}
        onSave={async (payload) => {
          try {
            await sublotService.createSublot(token, payload);
            setOpenSublotForm(false);
            const data = await lotService.getMapData(token);
            setMapData(data);
            alert.success('Sublotes', 'Sublote creado correctamente');
          } catch (e) {
            alert.error('Error', e?.message || 'Error creando sublote');
          }
        }}
        sublot={null}
      />
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#16A34A', padding: 12 },
  topBar: { paddingHorizontal: 12, paddingBottom: 8 },
  cardsRow: { flexDirection: 'row', marginBottom: 8 },
  card: { flexDirection: 'column', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 },
  cardTitle: { fontSize: 12, color: '#334155' },
  cardNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  actionsRow: { flexDirection: 'row', marginBottom: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  primary: { backgroundColor: '#16A34A' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: '#E4E7EC', backgroundColor: '#fff' },
  secondaryText: { color: '#334155', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  toggleRowOneLine: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
  toggleChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  toggleActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  toggleInactive: { backgroundColor: '#fff', borderColor: '#E4E7EC' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  toggleTextInactive: { color: '#334155', fontWeight: '700' },
  map: { width: '100%', borderRadius: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#DC2626', textAlign: 'center' },
  overlayTopRight: { position: 'absolute', top: 12, right: 12, backgroundColor: '#16A34A', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  badge: { color: '#fff', fontWeight: '700' },
  legend: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendSwatch: { width: 16, height: 10, marginRight: 6, borderRadius: 2 },
  legendText: { color: '#111' },
  selectedInfo: { marginTop: 4, color: '#0f172a', fontWeight: '600' },
  selectedInfoMuted: { marginTop: 4, color: '#64748b' },
  fabContainer: { position: 'absolute', right: 12, bottom: 80, alignItems: 'flex-end' },
  fab: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 10, elevation: 3 },
  fabSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7EC' },
  toolsPanel: { position: 'absolute', right: 12, bottom: 140, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, width: 220, borderWidth: 1, borderColor: '#E4E7EC' },
  toolsTitle: { color: '#0f172a', fontWeight: '700', marginBottom: 6 },
  toolsRow: { flexDirection: 'row', marginBottom: 8 },
  toolChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, backgroundColor: '#fff' },
  toolActive: { borderColor: '#16A34A' },
  toolInactive: { borderColor: '#E4E7EC' },
  toolTextActive: { color: '#16A34A', fontWeight: '700' },
  toolTextInactive: { color: '#334155', fontWeight: '700' },
  toolBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8 },
  toolPrimary: { backgroundColor: '#16A34A' },
  toolPrimaryText: { color: '#fff', fontWeight: '700' },
  toolSecondary: { borderWidth: 1, borderColor: '#E4E7EC', backgroundColor: '#fff' },
  toolSecondaryText: { color: '#334155', fontWeight: '700' },
  toolsHint: { color: '#64748b', fontSize: 12 }
  ,
  listOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  listCard: { width: '92%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#14b8a6' },
  listHeader: { backgroundColor: '#16A34A', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  listHeaderText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listContent: { padding: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  listName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  listDesc: { fontSize: 12, color: '#334155', marginTop: 4 },
  listFooter: { padding: 12, alignItems: 'flex-end' },
  listCloseBtn: { backgroundColor: '#16A34A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  listCloseText: { color: '#fff', fontWeight: '700' },
  assignOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-start', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 8 },
  assignCard: { width: '92%', maxWidth: 420, maxHeight: '60%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  assignTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  assignItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  assignItemText: { fontSize: 14, color: '#0f172a', fontWeight: '700' }
});
