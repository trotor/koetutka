import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import {
  FAVORITE_COLORS,
  colorKeyFor,
  labelFor,
  colorName,
  type ColorKey,
} from '@/lib/favorite-colors';

export function FavoriteColorPicker({
  eventId,
  visible,
  onClose,
  onRequestLabels,
}: {
  eventId: string;
  visible: boolean;
  onClose: () => void;
  onRequestLabels: () => void;
}) {
  const current = useStore((s) => colorKeyFor(s.favoriteColors, eventId));
  const colorLabels = useStore((s) => s.colorLabels);
  const setFavoriteColor = useStore((s) => s.setFavoriteColor);
  const isFavorite = useStore((s) => s.favorites.has(eventId));
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const pick = (key: ColorKey) => {
    setFavoriteColor(eventId, key);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Taustan painallus sulkee; sisemmän Pressablen tyhjä onPress nielee kosketuksen. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Suosikin väri</Text>
          <View style={styles.row}>
            {FAVORITE_COLORS.map((c) => {
              const label = labelFor(colorLabels, c.key);
              const selected = current === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => pick(c.key)}
                  style={styles.swatch}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={label || colorName(c.key)}
                >
                  <View
                    style={[styles.dot, { backgroundColor: c.color }, selected && styles.dotSelected]}
                  />
                  {!!label && (
                    <Text style={styles.swatchLabel} numberOfLines={1}>
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.footer}>
            <Pressable onPress={onRequestLabels} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>Nimeä värit</Text>
            </Pressable>
            {isFavorite && (
              <Pressable
                onPress={() => {
                  toggleFavorite(eventId);
                  onClose();
                }}
                accessibilityRole="button"
                style={styles.removeBtn}
                hitSlop={6}
              >
                <Text style={styles.removeText}>Poista suosikeista</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  swatch: { alignItems: 'center', flex: 1, gap: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  dotSelected: { borderColor: '#1a472a' },
  swatchLabel: { fontSize: 10, color: '#555', textAlign: 'center' },
  footer: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  removeBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: '#dc2626',
  },
  removeText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  link: { fontSize: 13, color: '#1565c0', fontWeight: '600' },
});
