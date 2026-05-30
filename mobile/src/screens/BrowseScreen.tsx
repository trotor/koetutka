import { useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useStore } from '@/lib/store';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d5a27" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Virhe: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title}>{item.type} · {item.levels}</Text>
          <Text style={styles.sub}>{item.location} — {item.date}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Ei kokeita vielä.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  row: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#2d5a27' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
});
