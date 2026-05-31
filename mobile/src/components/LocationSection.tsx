import { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check, request, PERMISSIONS, RESULTS, type Permission,
} from 'react-native-permissions';
import { searchLocation, type LocationResult } from '@/lib/nominatim';
import { useStore } from '@/lib/store';

const LOCATION_PERMISSION: Permission = Platform.OS === 'ios'
  ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export function LocationSection() {
  const userLocation = useStore((s) => s.userLocation);
  const setUserLocation = useStore((s) => s.setUserLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(text: string) {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const found = await searchLocation(text);
      setResults(found);
      setIsSearching(false);
    }, 400);
  }

  function selectResult(loc: LocationResult) {
    setUserLocation(loc);
    setQuery('');
    setResults([]);
  }

  async function useGps() {
    setIsGpsLoading(true);
    try {
      let status = await check(LOCATION_PERMISSION);
      if (status === RESULTS.DENIED) {
        status = await request(LOCATION_PERMISSION);
      }
      if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
        Alert.alert('Lupa evätty', 'Sijainnin käyttöä ei sallittu.');
        setIsGpsLoading(false);
        return;
      }
      Geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Nykyinen sijainti',
          });
          setIsGpsLoading(false);
        },
        () => {
          Alert.alert('Virhe', 'Sijaintia ei voitu hakea.');
          setIsGpsLoading(false);
        },
        { enableHighAccuracy: false, timeout: 15000 },
      );
    } catch {
      Alert.alert('Virhe', 'Sijaintia ei voitu hakea.');
      setIsGpsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sijaintisi</Text>
      {userLocation && (
        <View style={styles.currentRow}>
          <Text style={styles.currentText}>📍 {userLocation.name}</Text>
          <Pressable onPress={() => setUserLocation(null)}>
            <Text style={styles.clear}>Poista</Text>
          </Pressable>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Kirjoita paikkakunta..."
        value={query}
        onChangeText={handleSearch}
      />
      {isSearching && <Text style={styles.hint}>Haetaan…</Text>}
      {results.length > 0 && (
        <View style={styles.suggestions}>
          {results.map((item, idx) => (
            <Pressable
              key={`${item.lat}-${item.lng}-${idx}`}
              onPress={() => selectResult(item)}
              style={styles.suggestion}
            >
              <Text>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable onPress={useGps} style={styles.gps} disabled={isGpsLoading}>
        <Text style={styles.gpsText}>{isGpsLoading ? '⏳ Haetaan…' : '📍 Käytä sijaintiani'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  currentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#e8f0e6', padding: 8, borderRadius: 6, marginBottom: 8,
  },
  currentText: { fontSize: 14, color: '#1a472a' },
  clear: { fontSize: 13, color: '#b91c1c' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  suggestions: { maxHeight: 200, marginTop: 4 },
  suggestion: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gps: { marginTop: 12, padding: 12, backgroundColor: '#2d5a27', borderRadius: 6, alignItems: 'center' },
  gpsText: { color: 'white', fontWeight: '600' },
});
