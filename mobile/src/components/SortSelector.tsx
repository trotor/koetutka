import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

export function SortSelector() {
  const sortBy = useStore((s) => s.sortBy);
  const setSortBy = useStore((s) => s.setSortBy);
  const userLocation = useStore((s) => s.userLocation);
  const distanceDisabled = !userLocation;
  // Ilman sijaintia etäisyyslajittelu putoaa aikaan → näytä aika aktiivisena.
  const dateActive = sortBy === 'date' || distanceDisabled;
  const distanceActive = sortBy === 'distance' && !distanceDisabled;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Järjestä</Text>
      <View style={styles.pills}>
        <Pressable
          onPress={() => setSortBy('distance')}
          disabled={distanceDisabled}
          style={[
            styles.pill,
            distanceActive && styles.pillActive,
            distanceDisabled && styles.pillDisabled,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              distanceActive && styles.pillTextActive,
              distanceDisabled && styles.pillTextDisabled,
            ]}
          >
            📍 Etäisyys
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSortBy('date')}
          style={[styles.pill, dateActive && styles.pillActive]}
        >
          <Text style={[styles.pillText, dateActive && styles.pillTextActive]}>
            📅 Ajankohta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  label: { fontSize: 12, color: '#888', fontWeight: '600' },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e8f0e6' },
  pillActive: { backgroundColor: '#2d5a27' },
  pillDisabled: { backgroundColor: '#f0f0f0' },
  pillText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  pillTextActive: { color: 'white' },
  pillTextDisabled: { color: '#bbb' },
});
