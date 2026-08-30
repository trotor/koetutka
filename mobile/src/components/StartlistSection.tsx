import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { groupStartlist, formatStartlistDog } from '@koetutka/shared';
import type { StartlistEntry } from '@koetutka/shared';
import type { StartlistState } from '@/lib/startlist';

/**
 * Kokeen lähtölista: osallistujat ryhmiteltynä päivään, ryhmäaikaan ja
 * luokkaan. Piilotetaan kokonaan kun listaa ei ole (`none`).
 */
export function StartlistSection({ state }: { state: StartlistState }) {
  if (state.status === 'none') return null;

  if (state.status === 'loading') {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>Lähtölista</Text>
        <ActivityIndicator color="#2d5a27" style={styles.spinner} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>Lähtölista</Text>
        <Text style={styles.value}>Lähtölistaa ei voitu ladata.</Text>
      </View>
    );
  }

  const groups = groupStartlist(state.entries);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Lähtölista ({state.entries.length})</Text>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          {!!group.label && <Text style={styles.groupLabel}>{group.label}</Text>}
          {group.entries.map((entry, i) => (
            <Row key={`${entry.reg_no}-${entry.number ?? i}`} entry={entry} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Row({ entry }: { entry: StartlistEntry }) {
  return (
    <View style={styles.row}>
      <Text style={styles.number}>{entry.number === null ? '' : `${entry.number}.`}</Text>
      <View style={styles.dogColumn}>
        <Text style={styles.dog}>
          {formatStartlistDog(entry)}
          {!!entry.reg_no && <Text style={styles.regNo}> {entry.reg_no}</Text>}
        </Text>
        {!!entry.handler && <Text style={styles.handler}>ohj. {entry.handler}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 6 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 14, color: '#333' },
  spinner: { alignSelf: 'flex-start', marginTop: 6 },
  group: { marginTop: 10 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d5a27',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 90, 39, 0.2)',
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  number: { width: 26, textAlign: 'right', color: '#888', fontSize: 13 },
  dogColumn: { flex: 1 },
  dog: { fontSize: 13, fontWeight: '600', color: '#333' },
  regNo: { fontWeight: '400', color: '#666' },
  handler: { fontSize: 13, color: '#555' },
});
