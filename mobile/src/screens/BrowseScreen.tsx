import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { addDistances, filterEvents, sortEvents, fitAgainstFavorites } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { FilterChips } from '@/components/FilterChips';
import { SortSelector } from '@/components/SortSelector';
import { ListMapToggle } from '@/components/ListMapToggle';
import { EventMap } from '@/components/EventMap';
import { CollapsibleBanner } from '@/components/CollapsibleBanner';
import { SearchBar } from '@/components/SearchBar';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);
  const userLocation = useStore((s) => s.userLocation);
  const filters = useStore((s) => s.filters);
  const sortBy = useStore((s) => s.sortBy);
  const favorites = useStore((s) => s.favorites);
  const hidden = useStore((s) => s.hidden);
  const showHidden = useStore((s) => s.showHidden);

  const [view, setView] = useState<'list' | 'map'>('list');
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    const afterHidden = showHidden ? filtered : filtered.filter((e) => !hidden.has(e.id));
    const effectiveSort = sortBy === 'distance' && !userLocation ? 'date' : sortBy;
    return sortEvents(afterHidden, effectiveSort);
  }, [events, userLocation, filters, sortBy, hidden, showHidden]);

  const favoriteEvents = useMemo(
    () => events.filter((e) => favorites.has(e.id)),
    [events, favorites],
  );

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d5a27" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Virhe: {error}</Text>
        <Text style={styles.retryHint} onPress={() => loadEvents(new Date().getFullYear())}>
          Yritä uudelleen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CollapsibleBanner scrollY={scrollY} forceCollapsed={view === 'map'} />
      <ListMapToggle value={view} onChange={setView} />
      <SearchBar />
      <FilterChips />
      <SortSelector />
      {view === 'list' ? (
        <Animated.FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              fit={
                favoriteEvents.length > 0 && !favorites.has(item.id)
                  ? fitAgainstFavorites(item, favoriteEvents)
                  : undefined
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
              <Text style={styles.emptyHint}>Kokeile suuremman etäisyyden tai vähemmän rajauksia.</Text>
            </View>
          }
          ListHeaderComponent={<Text style={styles.count}>{visible.length} koetta</Text>}
          onRefresh={() => loadEvents(new Date().getFullYear())}
          refreshing={isLoading}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <EventMap events={visible} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12 },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: '#666', textAlign: 'center' },
  emptyHint: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
  retryHint: { color: '#2d5a27', fontSize: 14, marginTop: 12, textDecorationLine: 'underline' },
});
