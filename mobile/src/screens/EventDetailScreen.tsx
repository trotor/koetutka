import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ScrollView, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  getCostValue,
  getOptionalCosts,
  listClassPlaces,
  formatClassPlacesRow,
  stateBadge,
  snjLink,
} from '@koetutka/shared';
import type { EventState } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { useStartlist } from '@/lib/startlist';
import { StartlistSection } from '@/components/StartlistSection';
import { exportEventICS } from '@/lib/ics-export';
import { addEventToCalendar } from '@/lib/calendar-add';
import type { RootStackParamList } from '../navigation';

type Route = RouteProp<RootStackParamList, 'EventDetail'>;

const STATE_HINTS: Partial<Record<EventState, string>> = {
  tentative: 'Koe ei ole vielä varmistunut.',
  cancelled: 'Koe on peruttu.',
  picked: 'Ilmoittautuminen on päättynyt.',
  invited: 'Ilmoittautuminen on päättynyt.',
};

export default function EventDetailScreen() {
  const route = useRoute<Route>();
  const { id } = route.params;
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const isHidden = useStore((s) => s.hidden.has(id));
  const toggleHidden = useStore((s) => s.toggleHidden);
  const startlist = useStartlist(id);

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
  const classPlaces = listClassPlaces(event);
  const badge = stateBadge(event);
  const hint = event.state ? STATE_HINTS[event.state] : undefined;
  // Kun tiedämme lähtölistan olemassaolon varmasti, se ohittaa tilapäättelyn —
  // muuten "Lue lähtölista" voisi viedä SNJ:n virhesivulle. Latauksen aikana
  // (undefined) käytetään tilaan perustuvaa arvausta.
  const startlistAvailable =
    startlist.status === 'ready' ? true : startlist.status === 'none' ? false : undefined;
  const snj = snjLink(event, new Date(), { startlistAvailable });
  const SNJ_ICONS: Record<typeof snj.kind, string> = {
    register: '📝',
    startlist: '📋',
    calendar: '🔗',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{event.type} · {event.levels}</Text>
      <Text style={styles.location}>📍 {event.location}</Text>
      <Text style={styles.date}>📅 {event.date}</Text>
      {typeof event.distance === 'number' && (
        <Text style={styles.distance}>🚗 {event.distance} km</Text>
      )}

      {badge && (
        <InfoRow label="Tila" value={hint ? `${badge.label}\n${hint}` : badge.label} />
      )}
      <InfoRow label="Ilmoittautuminen" value={event.entry_date} />
      {classPlaces.length > 0 && (
        <InfoRow
          label="Luokat ja paikat"
          value={classPlaces
            .map((cp) => {
              const cls = cp.class || 'Yhteensä';
              const name = cp.day ? `${cls} · ${cp.day}` : cls;
              return `${name}: ${formatClassPlacesRow(cp)}`;
            })
            .join('\n')}
        />
      )}
      {event.organizer && <InfoRow label="Järjestäjä" value={event.organizer} />}
      {event.judges.length > 0 && (
        <InfoRow label="Tuomarit" value={event.judges.join(', ')} />
      )}
      {event.secretary.name && (
        <ContactRow label="Sihteeri" person={event.secretary} />
      )}
      {event.official.name && (
        <ContactRow label="Yhteyshenkilö" person={event.official} />
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
      <StartlistSection state={startlist} />

      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={() => Linking.openURL(snj.url)}>
          <Text style={styles.buttonText}>{SNJ_ICONS[snj.kind]} {snj.label}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={async () => {
            const ok = await addEventToCalendar(event, 'event', useStore.getState().userLocation?.name);
            if (ok) useStore.getState().markCalendarAdded(event.id, 'event');
          }}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>📅 Lisää kalenteriin</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={async () => {
            const ok = await addEventToCalendar(event, 'registration', useStore.getState().userLocation?.name);
            if (ok) useStore.getState().markCalendarAdded(event.id, 'registration');
          }}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>🔔 Ilmoittautumismuistutus</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonTertiary]}
          onPress={() => exportEventICS(event, 'event', useStore.getState().userLocation?.name)}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>📤 Jaa ICS-tiedostona</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonTertiary]}
          onPress={() => toggleHidden(id)}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {isHidden ? '↩︎ Palauta näkyviin' : '🚫 Piilota koe'}
          </Text>
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

function ContactRow({
  label,
  person,
}: {
  label: string;
  person: { name: string; phone: string; email: string };
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{person.name}</Text>
      {!!person.phone && (
        <Pressable
          onPress={() => Linking.openURL(`tel:${person.phone.replace(/\s/g, '')}`)}
          accessibilityRole="link"
        >
          <Text style={styles.link}>{person.phone}</Text>
        </Pressable>
      )}
      {!!person.email && (
        <Pressable
          onPress={() => Linking.openURL(`mailto:${person.email}`)}
          accessibilityRole="link"
        >
          <Text style={styles.link}>{person.email}</Text>
        </Pressable>
      )}
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
  link: { fontSize: 14, color: '#2d5a27', textDecorationLine: 'underline', marginTop: 4 },
  buttonRow: { marginTop: 12, gap: 8 },
  button: { backgroundColor: '#2d5a27', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#2d5a27' },
  buttonTertiary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#888' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  buttonTextSecondary: { color: '#2d5a27' },
});
