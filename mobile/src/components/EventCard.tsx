import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Event } from '@koetutka/shared';
import type { RootStackParamList } from '../navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function EventCard({ event }: { event: Event }) {
  const navigation = useNavigation<Navigation>();
  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { id: event.id })}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.type} · {event.levels}</Text>
        {typeof event.distance === 'number' && (
          <Text style={styles.distance}>{event.distance} km</Text>
        )}
      </View>
      <Text style={styles.location}>{event.location}</Text>
      <Text style={styles.date}>{event.date} · ilm. {event.entry_date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: '#2d5a27',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1 },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
});
