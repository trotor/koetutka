import { Text, View, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import type { Event } from '@koetutka/shared';

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {event.type} · {event.levels}
          </Text>
          {typeof event.distance === 'number' && (
            <Text style={styles.distance}>{event.distance} km</Text>
          )}
        </View>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.date}>
          {event.date} · ilm. {event.entry_date}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2d5a27',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1 },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
});
