import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { getCostValue, getOptionalCosts } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { exportEventICS } from '@/lib/ics-export';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useStore((s) => s.events.find((e) => e.id === id));

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Koetta ei löytynyt.</Text>
      </View>
    );
  }

  const cost = getCostValue(event.cost);
  const costMember = getCostValue(event.cost_member);
  const optionalCosts = getOptionalCosts(event.cost);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        {event.type} · {event.levels}
      </Text>
      <Text style={styles.location}>📍 {event.location}</Text>
      <Text style={styles.date}>📅 {event.date}</Text>
      {typeof event.distance === 'number' && (
        <Text style={styles.distance}>🚗 {event.distance} km</Text>
      )}

      <InfoRow label="Ilmoittautuminen" value={event.entry_date} />
      {event.organizer && <InfoRow label="Järjestäjä" value={event.organizer} />}
      {event.judges.length > 0 && (
        <InfoRow label="Tuomarit" value={event.judges.join(', ')} />
      )}
      {event.secretary.name && (
        <InfoRow label="Sihteeri" value={`${event.secretary.name}${event.secretary.phone ? `\n${event.secretary.phone}` : ''}${event.secretary.email ? `\n${event.secretary.email}` : ''}`} />
      )}
      {event.official.name && (
        <InfoRow label="Yhteyshenkilö" value={`${event.official.name}${event.official.phone ? `\n${event.official.phone}` : ''}${event.official.email ? `\n${event.official.email}` : ''}`} />
      )}
      {cost !== null && <InfoRow label="Maksu" value={`${cost} €`} />}
      {costMember !== null && <InfoRow label="Jäsenmaksu" value={`${costMember} €`} />}
      {optionalCosts.length > 0 && (
        <InfoRow
          label="Lisämaksut"
          value={optionalCosts
            .map((c) => `${c.name || c.description || 'lisämaksu'}: ${c.cost ?? '?'} €`)
            .join('\n')}
        />
      )}
      {event.description && <InfoRow label="Kuvaus" value={event.description} />}

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() => exportEventICS(event, 'event', useStore.getState().userLocation?.name)}
        >
          <Text style={styles.buttonText}>📅 Lisää kalenteriin</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => exportEventICS(event, 'registration', useStore.getState().userLocation?.name)}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>🔔 Ilmoittautumismuistutus</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  location: { fontSize: 16, color: '#333', marginBottom: 4 },
  date: { fontSize: 14, color: '#555', marginBottom: 4 },
  distance: { fontSize: 14, color: '#555', marginBottom: 12 },
  row: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 6 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 14, color: '#333' },
  buttonRow: { marginTop: 12, gap: 8 },
  button: {
    backgroundColor: '#2d5a27',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2d5a27',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  buttonTextSecondary: { color: '#2d5a27' },
});
