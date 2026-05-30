import { View, Text, StyleSheet } from 'react-native';

export function MapPlaceholder({ eventCount }: { eventCount: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Karttanäkymä tulossa</Text>
      <Text style={styles.body}>
        {eventCount} koetta valittuihin suodattimiin sopivaa kohdetta. Kartta lisätään
        Vaiheessa 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
