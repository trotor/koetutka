import { useMemo } from 'react';
import { SectionList, Text, View, StyleSheet } from 'react-native';
import { addDistances, filterEvents, fitAgainstFavorites, buildAgenda } from '@koetutka/shared';
import type { AgendaItem } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';

export function FavoritesAgenda() {
  const events = useStore((s) => s.events);
  const favorites = useStore((s) => s.favorites);
  const filters = useStore((s) => s.filters);
  const userLocation = useStore((s) => s.userLocation);

  const sections = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const favoriteEvents = withDistance.filter((e) => favorites.has(e.id));
    const candidates = filterEvents(withDistance, filters).filter(
      (e) => !favorites.has(e.id) && fitAgainstFavorites(e, favoriteEvents) === 'free',
    );
    return buildAgenda({ favorites: favoriteEvents, candidates }).map((m) => ({
      key: m.key,
      label: m.label,
      data: m.items,
    }));
  }, [events, favorites, filters, userLocation]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item: AgendaItem) => item.kind + item.event.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <Text style={styles.hint}>
          ★ suosikit ja niiden lomaan sopivat ehdotukset. Ehdotukset perustuvat Selaa-välilehden suodattimiin.
        </Text>
      }
      renderSectionHeader={({ section }) => <Text style={styles.month}>{section.label}</Text>}
      renderItem={({ item }) => (
        <View style={item.kind === 'candidate' ? styles.candidate : undefined}>
          <EventCard event={item.event} fit={item.kind === 'candidate' ? 'free' : undefined} />
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Ei tulevia suosikkeja tai ehdotuksia.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  hint: { fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 17 },
  month: {
    fontSize: 13, fontWeight: '700', color: '#1a472a',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 8, marginBottom: 6,
  },
  candidate: { marginLeft: 16 },
  empty: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 24 },
});
