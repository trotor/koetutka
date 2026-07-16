import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { FAVORITE_COLORS, labelFor, colorName, type ColorKey } from '@/lib/favorite-colors';

export function FavoriteColorLegend({
  counts,
  selected,
  onSelect,
  grouped,
  onToggleGrouped,
  onOpenLabels,
}: {
  counts: Map<ColorKey, number>;
  selected: ColorKey | null;
  onSelect: (key: ColorKey | null) => void;
  grouped: boolean;
  onToggleGrouped: () => void;
  onOpenLabels: () => void;
}) {
  const colorLabels = useStore((s) => s.colorLabels);
  const used = FAVORITE_COLORS.filter((c) => (counts.get(c.key) ?? 0) > 0);

  // Vain yksi väri käytössä → käyttäjä ei käytä värejä, selite olisi kohinaa.
  if (used.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {used.map((c) => {
          const label = labelFor(colorLabels, c.key);
          const count = counts.get(c.key) ?? 0;
          const active = selected === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => onSelect(active ? null : c.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label || colorName(c.key)}, ${count} kpl`}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              {!!label && (
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              )}
              <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onToggleGrouped}
          style={[styles.btn, grouped && styles.btnActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: grouped }}
        >
          <Text style={[styles.btnText, grouped && styles.btnTextActive]}>Ryhmittele</Text>
        </Pressable>
        <Pressable onPress={onOpenLabels} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Nimeä värit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eee',
  },
  chipActive: { backgroundColor: '#2d5a27' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontSize: 12, color: '#333', fontWeight: '600', maxWidth: 110 },
  chipCount: { fontSize: 11, color: '#777', fontWeight: '700' },
  chipTextActive: { color: 'white' },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  btnActive: { backgroundColor: '#2d5a27' },
  btnText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  btnTextActive: { color: 'white' },
});
