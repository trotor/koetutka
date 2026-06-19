import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';
import { formatWhatsNewDate } from '@/lib/whatsnew';

export function WhatsNewModal() {
  const whatsNew = useStore((s) => s.whatsNew);
  const dismiss = useStore((s) => s.dismissWhatsNew);
  const { visible, content } = whatsNew;
  if (!content) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {content.title}
          </Text>
          {content.kind === 'release' && (
            <Text style={styles.version}>
              Versio {content.version}
              {formatWhatsNewDate(content.date) ? ` · ${formatWhatsNewDate(content.date)}` : ''}
            </Text>
          )}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {content.kind === 'welcome' ? (
              <Text style={styles.body}>{content.body}</Text>
            ) : (
              content.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable
            style={styles.btn}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Sulje"
          >
            <Text style={styles.btnText}>Selvä</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a472a' },
  version: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 4 },
  scroll: { marginTop: 10 },
  scrollContent: { paddingBottom: 4 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#2d5a27', marginRight: 8, lineHeight: 20 },
  itemText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  btn: {
    marginTop: 16,
    backgroundColor: '#2d5a27',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
