import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Event } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import type { RootStackParamList } from '../navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function isPast(event: Event): boolean {
  const todayISO = new Date().toISOString().split('T')[0];
  const eventEnd = (event.end_date_sort || event.date_sort).split('T')[0];
  return eventEnd < todayISO;
}

export function EventCard({ event }: { event: Event }) {
  const navigation = useNavigation<Navigation>();
  const isFavorite = useStore((s) => s.favorites.has(event.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const past = isPast(event);

  return (
    <View style={[styles.card, past && styles.cardPast]}>
      <Pressable
        style={styles.body}
        onPress={() => navigation.navigate('EventDetail', { id: event.id })}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, past && styles.titlePast]} numberOfLines={1}>
            {event.type} · {event.levels}
          </Text>
          {typeof event.distance === 'number' && (
            <Text style={[styles.distance, past && styles.distancePast]}>
              {event.distance} km
            </Text>
          )}
        </View>
        <Text style={[styles.location, past && styles.locationPast]}>{event.location}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.date, past && styles.datePast]}>
            {event.date} · ilm. {event.entry_date}
          </Text>
          {past && <Text style={styles.pastBadge}>Mennyt</Text>}
        </View>
      </Pressable>

      <Pressable
        style={styles.starOverlay}
        hitSlop={12}
        onPress={() => toggleFavorite(event.id)}
      >
        <Text style={[styles.star, isFavorite && styles.starActive]}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2d5a27',
    position: 'relative',
  },
  cardPast: {
    backgroundColor: '#f1f1f0',
    borderLeftColor: '#bbb',
  },
  body: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 44,
  },
  starOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  star: { fontSize: 24, color: '#bbb' },
  starActive: { color: '#d97706' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1, marginRight: 8 },
  titlePast: { color: '#777' },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  distancePast: { color: '#999' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  locationPast: { color: '#888' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  date: { fontSize: 12, color: '#888' },
  datePast: { color: '#aaa' },
  pastBadge: {
    fontSize: 11,
    color: '#777',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
