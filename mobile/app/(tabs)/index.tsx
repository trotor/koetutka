import { useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { addDistances, filterEvents } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { FilterChips } from '@/components/FilterChips';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);
  const userLocation = useStore((s) => s.userLocation);
  const filters = useStore((s) => s.filters);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    return [...filtered].sort((a, b) => {
      if (a.distance !== undefined && a.distance !== null && b.distance !== undefined && b.distance !== null) {
        return a.distance - b.distance;
      }
      return a.date_sort.localeCompare(b.date_sort);
    });
  }, [events, userLocation, filters]);

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
    <View style={styles.wrap}>
      <FilterChips />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
        }
        ListHeaderComponent={
          <Text style={styles.count}>{visible.length} koetta</Text>
        }
        onRefresh={() => loadEvents(new Date().getFullYear())}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12 },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
});
