import { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LocationSection } from '@/components/LocationSection';
import { CollapsibleBanner } from '@/components/CollapsibleBanner';
import { NotificationsSection } from '@/components/NotificationsSection';
import { HelpSection } from '@/components/HelpSection';
import { AboutSection } from '@/components/AboutSection';

export default function SettingsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  return (
    <View style={styles.wrap}>
      <CollapsibleBanner scrollY={scrollY} />
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <LocationSection />
        <NotificationsSection />
        <HelpSection />
        <AboutSection />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 12, backgroundColor: '#f8f9fa', flexGrow: 1 },
});
