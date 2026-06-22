import { useMemo, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Pressable } from 'react-native';
import { addDistances, sortEvents } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { CollapsibleBanner } from '@/components/CollapsibleBanner';
import { SortSelector } from '@/components/SortSelector';
import { FavoritesAgenda } from '@/components/FavoritesAgenda';

export default function FavoritesScreen() {
  const events = useStore((s) => s.events);
  const favorites = useStore((s) => s.favorites);
  const userLocation = useStore((s) => s.userLocation);
  const sortBy = useStore((s) => s.sortBy);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const items = useMemo(() => {
    const list = events.filter((e) => favorites.has(e.id));
    const withDistance = userLocation ? addDistances(list, userLocation) : list;
    const effectiveSort = sortBy === 'distance' && !userLocation ? 'date' : sortBy;
    return sortEvents(withDistance, effectiveSort);
  }, [events, favorites, userLocation, sortBy]);

  if (items.length === 0) {
    return (
      <View style={styles.wrap}>
        <CollapsibleBanner scrollY={scrollY} />
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Ei suosikkeja vielä</Text>
          <Text style={styles.emptyBody}>
            Lisää suosikkeja painamalla tähteä kortin oikeassa yläkulmassa Selaa-näytössä.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CollapsibleBanner scrollY={scrollY} />
      <View style={styles.toggle}>
        <Pressable
          onPress={() => setView('list')}
          style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>📋 Lista</Text>
        </Pressable>
        <Pressable
          onPress={() => setView('calendar')}
          style={[styles.toggleBtn, view === 'calendar' && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleText, view === 'calendar' && styles.toggleTextActive]}>📅 Kalenteri</Text>
        </Pressable>
      </View>

      {view === 'list' ? (
        <>
          <SortSelector />
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
        </>
      ) : (
        <FavoritesAgenda />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  toggle: {
    flexDirection: 'row', backgroundColor: '#e8f0e6', borderRadius: 999,
    padding: 3, margin: 12, marginBottom: 0,
  },
  toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 999 },
  toggleBtnActive: { backgroundColor: '#2d5a27' },
  toggleText: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  toggleTextActive: { color: 'white' },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#f8f9fa',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
