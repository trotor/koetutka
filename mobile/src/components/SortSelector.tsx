import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

export function SortSelector() {
  const sortBy = useStore((s) => s.sortBy);
  const setSortBy = useStore((s) => s.setSortBy);
  const userLocation = useStore((s) => s.userLocation);
  const noLocation = !userLocation;
  // Ilman sijaintia etäisyyslajittelu putoaa aikaan → näytä aika aktiivisena.
  const dateActive = sortBy === 'date' || noLocation;
  const distanceActive = sortBy === 'distance' && !noLocation;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Järjestä</Text>
        <View style={styles.pills}>
          <Pressable
            onPress={() => {
              // Ilman sijaintia ei vaihdeta etäisyyteen (lajittelu jäisi aikaan);
              // alla näkyvä vihje kertoo, miksi.
              if (!noLocation) setSortBy('distance');
            }}
            accessibilityRole="button"
            accessibilityLabel="Lajittele etäisyyden mukaan"
            accessibilityHint={noLocation ? 'Valitse ensin sijainti' : undefined}
            accessibilityState={{ selected: distanceActive }}
            style={[styles.pill, distanceActive && styles.pillActive]}
          >
            <Text style={[styles.pillText, distanceActive && styles.pillTextActive]}>
              📍 Etäisyys
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('date')}
            accessibilityRole="button"
            accessibilityLabel="Lajittele ajankohdan mukaan"
            accessibilityState={{ selected: dateActive }}
            style={[styles.pill, dateActive && styles.pillActive]}
          >
            <Text style={[styles.pillText, dateActive && styles.pillTextActive]}>
              📅 Ajankohta
            </Text>
          </Pressable>
        </View>
      </View>
      {noLocation && (
        <Text style={styles.hint}>Valitse sijainti lajitellaksesi etäisyyden mukaan.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, color: '#888', fontWeight: '600' },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e8f0e6' },
  pillActive: { backgroundColor: '#2d5a27' },
  pillText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  pillTextActive: { color: 'white' },
  hint: { fontSize: 11, color: '#a16207', marginTop: 6, marginLeft: 2 },
});
