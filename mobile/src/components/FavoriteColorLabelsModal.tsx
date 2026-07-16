import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '@/lib/store';
import { FAVORITE_COLORS, labelFor, colorName } from '@/lib/favorite-colors';

export function FavoriteColorLabelsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colorLabels = useStore((s) => s.colorLabels);
  const setColorLabel = useStore((s) => s.setColorLabel);

  // Palautetaan null suljettuna, jotta kentät remounttaavat auetessa ja
  // defaultValue on aina tuore.
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Nimeä värit</Text>
          <Text style={styles.help}>
            Anna värille oma merkitys, esim. "Ilmoittauduttu". Nimi näkyy suosikkien
            selitteessä. Tyhjä kenttä poistaa nimen.
          </Text>
          {FAVORITE_COLORS.map((c) => (
            <View key={c.key} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <TextInput
                style={styles.input}
                defaultValue={labelFor(colorLabels, c.key)}
                placeholder={colorName(c.key)}
                placeholderTextColor="#aaa"
                maxLength={24}
                returnKeyType="done"
                accessibilityLabel={`Nimi värille ${colorName(c.key)}`}
                // Tallennus joka merkillä on tarkoituksellista: onEndEditing ei laukea
                // jos modaali suljetaan taustaa painamalla → syöte katoaisi. Prefs-JSON
                // on pieni ja savePrefs on fire-and-forget, joten kustannus on olematon.
                onChangeText={(text) => setColorLabel(c.key, text)}
              />
            </View>
          ))}
          <Pressable onPress={onClose} style={styles.doneBtn} accessibilityRole="button">
            <Text style={styles.doneText}>Valmis</Text>
          </Pressable>
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
  title: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 6 },
  help: { fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 20, height: 20, borderRadius: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  doneBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#2d5a27',
  },
  doneText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
