import { Text, View, StyleSheet } from 'react-native';

export default function BrowseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Selaa kokeita</Text>
      <Text style={styles.body}>Data ladataan Task 3:ssa.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 16, color: '#666' },
});
