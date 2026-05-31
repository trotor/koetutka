import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

const DAY_CHOICES = [1, 3, 7, 14];

export function NotificationsSection() {
  const settings = useStore((s) => s.notifications);
  const setNotifications = useStore((s) => s.setNotifications);
  const favoritesCount = useStore((s) => s.favorites.size);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Muistutukset suosikeista</Text>

      <View style={styles.row}>
        <Text style={styles.text}>Lähetä muistutus ennen koetta</Text>
        <Pressable
          onPress={() => setNotifications({ enabled: !settings.enabled })}
          style={[styles.toggle, settings.enabled && styles.toggleOn]}
        >
          <Text style={[styles.toggleText, settings.enabled && styles.toggleTextOn]}>
            {settings.enabled ? 'Päällä' : 'Pois'}
          </Text>
        </Pressable>
      </View>

      {settings.enabled && (
        <>
          <Text style={styles.subLabel}>Päivää ennen</Text>
          <View style={styles.chipsRow}>
            {DAY_CHOICES.map((d) => (
              <Pressable
                key={d}
                onPress={() => setNotifications({ daysBefore: d })}
                style={[styles.chip, settings.daysBefore === d && styles.chipActive]}
              >
                <Text style={[styles.chipText, settings.daysBefore === d && styles.chipTextActive]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>
            {favoritesCount === 0
              ? 'Ei suosikkeja vielä. Lisää tähteä painamalla, niin muistutukset ajastetaan.'
              : `Ajastettu ${favoritesCount} suosikille klo ${settings.hourOfDay}:00.`}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { fontSize: 14, color: '#1a472a' },
  toggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  toggleOn: { backgroundColor: '#2d5a27' },
  toggleText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  toggleTextOn: { color: 'white' },
  subLabel: { fontSize: 12, color: '#888', marginTop: 12, marginBottom: 4, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e8f0e6' },
  chipActive: { backgroundColor: '#2d5a27' },
  chipText: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  hint: { fontSize: 12, color: '#666', marginTop: 12, lineHeight: 16 },
});
