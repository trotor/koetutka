import { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Event } from '@koetutka/shared';
import type { RootStackParamList } from '@/navigation';
import { useStore } from '@/lib/store';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  events: Event[];
}

function buildHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #f8f9fa; }
  .past-marker { filter: grayscale(1) opacity(0.6); }
  .leaflet-popup-content { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; }
  .popup-title { font-weight: 600; color: #1a472a; margin-bottom: 4px; }
  .popup-meta { color: #666; font-size: 12px; margin-bottom: 6px; }
  .popup-btn { display: inline-block; background: #2d5a27; color: white; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600; }
  .map-legend { position: absolute; bottom: 22px; left: 10px; z-index: 1000; background: rgba(255,255,255,0.95); border-radius: 6px; padding: 6px 8px; font: 11px system-ui, -apple-system, sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .legend-item { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
  .legend-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; color: white; font: bold 8px system-ui; }
</style>
</head>
<body>
<div id="map"></div>
<div class="map-legend">
  <div class="legend-item"><span class="legend-dot" style="background:#1565c0">B</span><span>NOME-B</span></div>
  <div class="legend-item"><span class="legend-dot" style="background:#2e7d32">U</span><span>NOU</span></div>
  <div class="legend-item"><span class="legend-dot" style="background:#6a1b9a">W</span><span>NOWT</span></div>
  <div class="legend-item"><span class="legend-dot" style="background:#ef6c00">A</span><span>NOME-A</span></div>
  <div class="legend-item"><span class="legend-dot" style="background:#999">·</span><span>Mennyt</span></div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  var map = L.map('map', { zoomControl: true, attributionControl: true })
    .setView([64.5, 26.0], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  var markersLayer = L.layerGroup().addTo(map);
  var userMarker = null;

  var TYPE_STYLES = {
    'NOME-B': { color: '#1565c0', letter: 'B' },
    'NOME-A': { color: '#ef6c00', letter: 'A' },
    'NOU':    { color: '#2e7d32', letter: 'U' },
    'NOWT':   { color: '#6a1b9a', letter: 'W' }
  };

  function styleForType(type) {
    return TYPE_STYLES[type] || { color: '#555', letter: '?' };
  }

  function buildIcon(type, isPast) {
    var s = styleForType(type);
    var bg = isPast ? '#999' : s.color;
    var html = '<div style="display:flex;align-items:center;justify-content:center;background:' + bg + ';color:white;width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);font:bold 11px system-ui;' + (isPast ? 'opacity:0.55;' : '') + '">' + s.letter + '</div>';
    return L.divIcon({ html: html, iconSize: [26,26], iconAnchor: [13,13], className: '' });
  }

  function validCoord(c) {
    if (!c || c.length !== 2) return false;
    var lat = c[0], lng = c[1];
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat === 0 && lng === 0) return false;
    // Finland sanity check (roughly)
    if (lat < 55 || lat > 75) return false;
    if (lng < 15 || lng > 35) return false;
    return true;
  }

  window.renderEvents = function (events, user) {
    markersLayer.clearLayers();
    var bounds = [];
    var todayISO = new Date().toISOString().split('T')[0];
    events.forEach(function (e) {
      if (!validCoord(e.coordinates)) return;
      var lat = e.coordinates[0];
      var lng = e.coordinates[1];
      var isPast = (e.end_date_sort || e.date_sort).split('T')[0] < todayISO;
      var icon = buildIcon(e.type, isPast);
      var distance = (e.distance != null) ? '<div class="popup-meta">' + e.distance + ' km</div>' : '';
      var html = '<div class="popup-title">' + (e.name || e.location) + '</div>'
        + '<div class="popup-meta">' + e.date + ' · ' + e.type + ' ' + e.levels + '</div>'
        + distance
        + '<a class="popup-btn" href="#" onclick="post({type:\\'open\\',id:\\'' + e.id + '\\'});return false;">Tiedot</a>';
      var m = L.marker([lat, lng], { icon: icon }).bindPopup(html);
      markersLayer.addLayer(m);
      bounds.push([lat, lng]);
    });
    if (user && typeof user.lat === 'number' && typeof user.lng === 'number'
        && isFinite(user.lat) && isFinite(user.lng)) {
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([user.lat, user.lng], {
        radius: 8, color: '#1976d2', weight: 3, fillColor: '#fff', fillOpacity: 1
      }).bindTooltip(user.name || 'Sijaintisi').addTo(map);
      bounds.push([user.lat, user.lng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
    } else {
      map.setView([64.5, 26.0], 5);
    }
  };

  post({ type: 'ready' });
</script>
</body>
</html>`;
}

export function EventMap({ events }: Props) {
  const userLocation = useStore((s) => s.userLocation);
  const navigation = useNavigation<Nav>();
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const html = useMemo(buildHtml, []);

  const payload = useMemo(() => {
    const slim = events.map((e) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      coordinates: e.coordinates,
      type: e.type,
      levels: e.levels,
      date: e.date,
      date_sort: e.date_sort,
      end_date_sort: e.end_date_sort,
      distance: e.distance ?? null,
    }));
    return JSON.stringify({ events: slim, user: userLocation });
  }, [events, userLocation]);

  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(
      `try { var p = ${payload}; window.renderEvents(p.events, p.user); } catch(e){} true;`,
    );
  }, [payload, ready]);

  function onMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setReady(true);
      } else if (msg.type === 'open' && typeof msg.id === 'string') {
        navigation.navigate('EventDetail', { id: msg.id });
      }
    } catch {
      // ignore
    }
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2d5a27" />
          </View>
        )}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  web: { flex: 1, backgroundColor: '#f8f9fa' },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa',
  },
});
