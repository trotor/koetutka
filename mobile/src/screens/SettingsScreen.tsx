import { ScrollView, StyleSheet } from 'react-native';
import { LocationSection } from '@/components/LocationSection';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LocationSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#f8f9fa', flexGrow: 1 },
});
