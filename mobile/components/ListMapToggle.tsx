import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  value: 'list' | 'map';
  onChange: (next: 'list' | 'map') => void;
}

export function ListMapToggle({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.btn, value === 'list' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'list' && styles.textActive]}>📋 Lista</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('map')}
        style={[styles.btn, value === 'map' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'map' && styles.textActive]}>🗺 Kartta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#e8f0e6',
    borderRadius: 999,
    padding: 3,
    margin: 12,
  },
  btn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 999 },
  btnActive: { backgroundColor: '#2d5a27' },
  text: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  textActive: { color: 'white' },
});
