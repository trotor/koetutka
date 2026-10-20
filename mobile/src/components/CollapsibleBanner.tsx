import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { newDataYear } from '@koetutka/shared';
import { useStore } from '@/lib/store';

const banner = require('../../assets/banner.jpg');
const BANNER_ASPECT = 1536 / 270;
const COLLAPSED_HEIGHT = 56;

interface Props {
  scrollY: Animated.Value;
  forceCollapsed?: boolean;
}

export function CollapsibleBanner({ scrollY, forceCollapsed = false }: Props) {
  const { width } = useWindowDimensions();
  const events = useStore((s) => s.events);
  const ribbonYear = useMemo(() => newDataYear(events), [events]);
  const fullHeight = Math.round(width / BANNER_ASPECT);
  const distance = fullHeight - COLLAPSED_HEIGHT;

  const forced = useRef(new Animated.Value(forceCollapsed ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(forced, {
      toValue: forceCollapsed ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [forceCollapsed, forced]);

  const scrollProgress = scrollY.interpolate({
    inputRange: [0, distance],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const progress = Animated.add(
    Animated.multiply(scrollProgress, Animated.subtract(1, forced)),
    forced,
  );

  const containerHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [fullHeight, COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = progress.interpolate({
    inputRange: [0, 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = progress.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { height: containerHeight }]}>
      <Animated.Image
        source={banner}
        style={[styles.banner, { height: fullHeight, opacity: imageOpacity }]}
        resizeMode="cover"
      />
      <Animated.View
        style={[styles.compactBar, { opacity: titleOpacity, height: COLLAPSED_HEIGHT }]}
        pointerEvents="none"
      >
        <Text style={styles.compactTitle}>Koetutka</Text>
      </Animated.View>
      {ribbonYear != null && (
        <View
          style={styles.ribbon}
          pointerEvents="none"
          accessibilityLabel={`Vuoden ${ribbonYear} kokeet julkaistu`}
        >
          <Text style={styles.ribbonText}>{ribbonYear}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d5a27',
    overflow: 'hidden',
    width: '100%',
  },
  banner: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  compactBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#2d5a27',
  },
  compactTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  // Vinottainen keltainen vuosinauha oikeassa yläkulmassa. Mahtuu myös
  // kutistettuun 56 px palkkiin, joten se näkyy koko ajan.
  ribbon: {
    position: 'absolute',
    top: 10,
    right: -30,
    width: 110,
    paddingVertical: 2,
    backgroundColor: '#f5c518',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  ribbonText: {
    color: '#1a3d16',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
