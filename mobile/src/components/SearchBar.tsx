import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

export function SearchBar() {
  const searchTerm = useStore((s) => s.filters.searchTerm) ?? '';
  const setFilters = useStore((s) => s.setFilters);

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder="Paikkakunta, tyyppi, taso, nimi…"
        placeholderTextColor="#999"
        value={searchTerm}
        onChangeText={(text) => setFilters({ searchTerm: text })}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {searchTerm.length > 0 && (
        <Pressable onPress={() => setFilters({ searchTerm: '' })} hitSlop={8}>
          <Text style={styles.clear}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: { fontSize: 14, marginRight: 6, color: '#888' },
  input: { flex: 1, fontSize: 14, padding: 0, color: '#1a472a' },
  clear: { fontSize: 16, color: '#888', paddingHorizontal: 4 },
});
