import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const banner = require('../../assets/banner.jpg');
const BANNER_ASPECT = 1536 / 270;
const COLLAPSED_HEIGHT = 56;

interface Props {
  scrollY: Animated.Value;
}

export function CollapsibleBanner({ scrollY }: Props) {
  const { width } = useWindowDimensions();
  const fullHeight = Math.round(width / BANNER_ASPECT);
  const distance = fullHeight - COLLAPSED_HEIGHT;

  const containerHeight = scrollY.interpolate({
    inputRange: [0, distance],
    outputRange: [fullHeight, COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, distance * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [distance * 0.6, distance],
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
});
