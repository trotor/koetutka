import { useMemo, useRef } from 'react';
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
</style>
</head>
<body>
<div id="map"></div>
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

  window.renderEvents = function (events, user) {
    markersLayer.clearLayers();
    var bounds = [];
    var todayISO = new Date().toISOString().split('T')[0];
    events.forEach(function (e) {
      if (!e.coordinates || e.coordinates.length !== 2) return;
      var lat = e.coordinates[0];
      var lng = e.coordinates[1];
      var isPast = (e.end_date_sort || e.date_sort).split('T')[0] < todayISO;
      var icon = isPast
        ? L.divIcon({ className: 'past-marker', html: '<div style="background:#888;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>', iconSize: [18,18], iconAnchor: [9,9] })
        : L.divIcon({ html: '<div style="background:#2d5a27;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>', iconSize: [18,18], iconAnchor: [9,9] });
      var distance = (e.distance != null) ? '<div class="popup-meta">' + e.distance + ' km</div>' : '';
      var html = '<div class="popup-title">' + (e.name || e.location) + '</div>'
        + '<div class="popup-meta">' + e.date + ' · ' + e.type + ' ' + e.levels + '</div>'
        + distance
        + '<a class="popup-btn" href="#" onclick="post({type:\\'open\\',id:\\'' + e.id + '\\'});return false;">Tiedot</a>';
      var m = L.marker([lat, lng], { icon: icon }).bindPopup(html);
      markersLayer.addLayer(m);
      bounds.push([lat, lng]);
    });
    if (user && typeof user.lat === 'number' && typeof user.lng === 'number') {
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([user.lat, user.lng], {
        radius: 8, color: '#1976d2', weight: 3, fillColor: '#fff', fillOpacity: 1
      }).bindTooltip(user.name || 'Sijaintisi').addTo(map);
      bounds.push([user.lat, user.lng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
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

  function onMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        webRef.current?.injectJavaScript(
          `try { var p = ${payload}; window.renderEvents(p.events, p.user); } catch(e){} true;`,
        );
      } else if (msg.type === 'open' && typeof msg.id === 'string') {
        navigation.navigate('EventDetail', { id: msg.id });
      }
    } catch {
      // ignore
    }
  }

  // Re-render on data change
  const injectOnUpdate = `try { var p = ${payload}; window.renderEvents(p.events, p.user); } catch(e){} true;`;

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        injectedJavaScript={injectOnUpdate}
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
