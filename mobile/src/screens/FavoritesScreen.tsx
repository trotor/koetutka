import { useMemo, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { addDistances } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { CollapsibleBanner } from '@/components/CollapsibleBanner';

export default function FavoritesScreen() {
  const events = useStore((s) => s.events);
  const favorites = useStore((s) => s.favorites);
  const userLocation = useStore((s) => s.userLocation);
  const scrollY = useRef(new Animated.Value(0)).current;

  const items = useMemo(() => {
    const list = events.filter((e) => favorites.has(e.id));
    const withDistance = userLocation ? addDistances(list, userLocation) : list;
    return [...withDistance].sort((a, b) =>
      a.date_sort.localeCompare(b.date_sort),
    );
  }, [events, favorites, userLocation]);

  return (
    <View style={styles.wrap}>
      <CollapsibleBanner scrollY={scrollY} />
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Ei suosikkeja vielä</Text>
          <Text style={styles.emptyBody}>
            Lisää suosikkeja painamalla tähteä kortin oikeassa yläkulmassa Selaa-näytössä.
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <EventCard event={item} />}
          ListHeaderComponent={<Text style={styles.count}>{items.length} suosikkia</Text>}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#f8f9fa',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
