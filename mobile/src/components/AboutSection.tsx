import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import pkg from '../../package.json';
import { useStore } from '@/lib/store';

export function AboutSection() {
  const openWhatsNew = useStore((s) => s.openWhatsNew);
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Tietoja</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Versio</Text>
        <Text style={styles.value}>v{pkg.version}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Lisenssi</Text>
        <Text style={styles.value}>MIT</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tekijä</Text>
        <Text style={styles.value}>Tero Rönkkö</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Julkaisija</Text>
        <Text style={styles.value}>Inetor Oy</Text>
      </View>
      <Pressable
        onPress={() => void openWhatsNew()}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Mitä uutta"
      >
        <Text style={styles.link}>Mitä uutta</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL('https://github.com/trotor/koetutka')}
        hitSlop={6}
      >
        <Text style={styles.link}>github.com/trotor/koetutka</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL('https://trotor.github.io/koetutka/privacy.html')}
        hitSlop={6}
      >
        <Text style={styles.link}>Tietosuojaseloste</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  heading: { fontSize: 15, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  link: { fontSize: 13, color: '#1565c0', marginTop: 6, textDecorationLine: 'underline' },
});
