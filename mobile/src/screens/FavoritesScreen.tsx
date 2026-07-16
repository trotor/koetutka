import { useMemo, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Pressable } from 'react-native';
import type { Event } from '@koetutka/shared';
import { addDistances, sortEvents, isPast } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { CollapsibleBanner } from '@/components/CollapsibleBanner';
import { SortSelector } from '@/components/SortSelector';
import { FavoritesAgenda } from '@/components/FavoritesAgenda';
import { FavoriteColorLegend } from '@/components/FavoriteColorLegend';
import { FavoriteColorLabelsModal } from '@/components/FavoriteColorLabelsModal';
import {
  countByColor,
  groupByColor,
  colorKeyFor,
  resolveColor,
  labelFor,
  type ColorKey,
} from '@/lib/favorite-colors';
import { shareFavoritesList } from '@/lib/share-favorites';

export default function FavoritesScreen() {
  const events = useStore((s) => s.events);
  const favorites = useStore((s) => s.favorites);
  const userLocation = useStore((s) => s.userLocation);
  const sortBy = useStore((s) => s.sortBy);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showPast, setShowPast] = useState(false);
  const favoriteColors = useStore((s) => s.favoriteColors);
  const colorLabels = useStore((s) => s.colorLabels);
  const [colorFilter, setColorFilter] = useState<ColorKey | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  // Kaikki suosikit ilman värisuodatusta — selitteen laskurit lasketaan tästä,
  // jotta kaikki värit näkyvät myös suodatuksen ollessa päällä.
  const baseItems = useMemo(() => {
    let list = events.filter((e) => favorites.has(e.id));
    if (!showPast) list = list.filter((e) => !isPast(e));
    const withDistance = userLocation ? addDistances(list, userLocation) : list;
    const effectiveSort = sortBy === 'distance' && !userLocation ? 'date' : sortBy;
    return sortEvents(withDistance, effectiveSort);
  }, [events, favorites, userLocation, sortBy, showPast]);

  const counts = useMemo(() => countByColor(baseItems, favoriteColors), [baseItems, favoriteColors]);

  const items = useMemo(
    () =>
      colorFilter
        ? baseItems.filter((e) => colorKeyFor(favoriteColors, e.id) === colorFilter)
        : baseItems,
    [baseItems, colorFilter, favoriteColors],
  );

  const sections = useMemo<{ key: ColorKey | 'all'; data: Event[] }[]>(
    () => (grouped ? groupByColor(items, favoriteColors) : [{ key: 'all', data: items }]),
    [grouped, items, favoriteColors],
  );

  const hasAnyFavorites = useMemo(
    () => events.some((e) => favorites.has(e.id)),
    [events, favorites],
  );

  if (!hasAnyFavorites) {
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
          <Animated.SectionList
            sections={sections}
            keyExtractor={(item: Event) => item.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            renderItem={({ item }: { item: Event }) => (
              <EventCard event={item} swipeVariant="favorites" />
            )}
            renderSectionHeader={({ section }: { section: { key: ColorKey | 'all'; data: Event[] } }) =>
              section.key === 'all' ? null : (
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: resolveColor(section.key) }]} />
                  {!!labelFor(colorLabels, section.key) && (
                    <Text style={styles.sectionText}>{labelFor(colorLabels, section.key)}</Text>
                  )}
                  <Text style={styles.sectionCount}>{section.data.length}</Text>
                </View>
              )
            }
            ListHeaderComponent={
              <>
                <FavoriteColorLegend
                  counts={counts}
                  selected={colorFilter}
                  onSelect={setColorFilter}
                  grouped={grouped}
                  onToggleGrouped={() => setGrouped((v) => !v)}
                  onOpenLabels={() => setLabelsOpen(true)}
                />
                <View style={styles.headerRow}>
                  <Text style={styles.count}>{items.length} suosikkia</Text>
                  <View style={styles.headerActions}>
                    <Pressable
                      onPress={() => setShowPast((v) => !v)}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: showPast }}
                      style={[styles.headerBtn, showPast && styles.headerBtnActive]}
                    >
                      <Text style={[styles.headerBtnText, showPast && styles.headerBtnTextActive]}>
                        Näytä menneet
                      </Text>
                    </Pressable>
                    {items.length > 0 && (
                      <Pressable
                        onPress={() => shareFavoritesList(items)}
                        accessibilityRole="button"
                        accessibilityLabel="Jaa suosikkilista"
                        style={styles.headerBtn}
                      >
                        <Text style={styles.headerBtnText}>⤴ Jaa lista</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </>
            }
            ListEmptyComponent={
              <Text style={styles.emptyHint}>
                {colorFilter
                  ? 'Ei suosikkeja tällä värillä.'
                  : 'Ei tulevia suosikkeja. Laita "Näytä menneet" päälle nähdäksesi menneet kokeet.'}
              </Text>
            }
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
      <FavoriteColorLabelsModal visible={labelsOpen} onClose={() => setLabelsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  count: { fontSize: 12, color: '#888' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 4,
  },
  sectionDot: { width: 12, height: 12, borderRadius: 6 },
  sectionText: { fontSize: 13, fontWeight: '700', color: '#1a472a' },
  sectionCount: { fontSize: 11, color: '#888', fontWeight: '700' },
  emptyHint: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 24, lineHeight: 20 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, gap: 8, flexWrap: 'wrap',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6',
  },
  headerBtnActive: { backgroundColor: '#2d5a27' },
  headerBtnText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  headerBtnTextActive: { color: 'white' },
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
