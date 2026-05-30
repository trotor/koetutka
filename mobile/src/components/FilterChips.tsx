import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

const TYPES = ['NOME-B', 'NOU', 'NOWT', 'NOME-A'];
const LEVELS = ['ALO', 'AVO', 'VOI'];
const DISTANCES: { label: string; value: number | null }[] = [
  { label: 'Mikä tahansa', value: null },
  { label: '100 km', value: 100 },
  { label: '200 km', value: 200 },
  { label: '500 km', value: 500 },
];

export function FilterChips() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const userLocation = useStore((s) => s.userLocation);

  function toggleType(type: string) {
    const next = new Set(filters.activeTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setFilters({ activeTypes: next });
  }

  function toggleLevel(level: string) {
    const next = new Set(filters.activeLevels);
    if (next.has(level)) next.delete(level); else next.add(level);
    setFilters({ activeLevels: next });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Laji</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => toggleType(t)}
            style={[styles.chip, filters.activeTypes?.has(t) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeTypes?.has(t) && styles.chipTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Taso</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => toggleLevel(l)}
            style={[styles.chip, filters.activeLevels?.has(l) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeLevels?.has(l) && styles.chipTextActive]}>
              {l}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {userLocation && (
        <>
          <Text style={styles.label}>Max etäisyys</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {DISTANCES.map((d) => (
              <Pressable
                key={d.label}
                onPress={() => setFilters({ maxDistanceKm: d.value })}
                style={[styles.chip, filters.maxDistanceKm === d.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, filters.maxDistanceKm === d.value && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Piilota menneet</Text>
        <Pressable
          onPress={() => setFilters({ hidePast: !filters.hidePast })}
          style={[styles.toggle, filters.hidePast && styles.toggleOn]}
        >
          <Text style={[styles.toggleText, filters.hidePast && styles.toggleTextOn]}>
            {filters.hidePast ? 'Päällä' : 'Pois'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white' },
  label: { fontSize: 12, color: '#888', marginTop: 8, marginBottom: 4, fontWeight: '600' },
  row: { gap: 6, paddingBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  chipActive: { backgroundColor: '#2d5a27' },
  chipText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  toggleOn: { backgroundColor: '#2d5a27' },
  toggleText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  toggleTextOn: { color: 'white' },
});
