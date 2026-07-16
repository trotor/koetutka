import { useRef, useState } from 'react';
import { Text, View, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Event } from '@koetutka/shared';
import { isRegistrationOpen, isPast } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { presentCalendarMenu } from '@/lib/calendar-menu';
import { calendarAddedKey, type CalendarType } from '@/lib/calendar-added';
import type { RootStackParamList } from '../navigation';
import { FavoriteColorPicker } from '@/components/FavoriteColorPicker';
import { FavoriteColorLabelsModal } from '@/components/FavoriteColorLabelsModal';
import { resolveColor, colorKeyFor } from '@/lib/favorite-colors';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function EventCard({
  event,
  fit,
  swipeVariant = 'browse',
}: {
  event: Event;
  fit?: 'free' | 'conflict';
  swipeVariant?: 'browse' | 'favorites';
}) {
  const navigation = useNavigation<Navigation>();
  const isFavorite = useStore((s) => s.favorites.has(event.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isHidden = useStore((s) => s.hidden.has(event.id));
  const toggleHidden = useStore((s) => s.toggleHidden);
  const swipeRef = useRef<Swipeable>(null);
  const colorKey = useStore((s) => colorKeyFor(s.favoriteColors, event.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const past = isPast(event);
  const regOpen = !past && !isHidden && isRegistrationOpen(event);

  const openCalendarMenu = () => {
    const { calendarAdded, markCalendarAdded, userLocation } = useStore.getState();
    presentCalendarMenu(
      event,
      (type: CalendarType) => calendarAdded.has(calendarAddedKey(event.id, type)),
      (type: CalendarType) => markCalendarAdded(event.id, type),
      userLocation?.name,
    );
  };

  // Veto vasemmalle (oikea reuna) = positiivinen; veto oikealle (vasen reuna) = poistava.
  const positiveAction = () => {
    if (swipeVariant === 'favorites') openCalendarMenu();
    else toggleFavorite(event.id);
  };
  const negativeAction = () => {
    if (swipeVariant === 'favorites') toggleFavorite(event.id); // poista suosikeista
    else toggleHidden(event.id);
  };

  const promptHide = () => {
    if (isHidden) {
      Alert.alert('Palauta koe näkyviin?', undefined, [
        { text: 'Peruuta', style: 'cancel' },
        { text: 'Palauta', onPress: () => toggleHidden(event.id) },
      ]);
    } else {
      Alert.alert(
        'Piilota koe?',
        'Koe piilotetaan listalta. Saat sen takaisin Filtterit → "Näytä piilotetut".',
        [
          { text: 'Peruuta', style: 'cancel' },
          { text: 'Piilota', style: 'destructive', onPress: () => toggleHidden(event.id) },
        ],
      );
    }
  };

  // Vasen reuna (näkyy vedettäessä oikealle) = poistava, vasempaan reunaan tasattu.
  const negativePanel = () => (
    <View style={[styles.action, swipeVariant === 'favorites' ? styles.actionRemove : styles.actionHide]}>
      <Text style={styles.actionText}>
        {swipeVariant === 'favorites' ? 'Poista suosikeista' : isHidden ? 'Palauta' : 'Piilota'}
      </Text>
    </View>
  );
  // Oikea reuna (näkyy vedettäessä vasemmalle) = positiivinen, oikeaan reunaan tasattu.
  const positivePanel = () => (
    <View style={[styles.action, styles.actionRight, swipeVariant === 'favorites' ? styles.actionCalendar : styles.actionFav]}>
      <Text style={styles.actionText}>{swipeVariant === 'favorites' ? '📅 Kalenteri' : '★ Suosikki'}</Text>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={120}
      rightThreshold={120}
      renderLeftActions={negativePanel}
      renderRightActions={positivePanel}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') negativeAction();
        else positiveAction();
        swipeRef.current?.close();
      }}
    >
      <View style={[styles.card, past && styles.cardPast, isHidden && styles.cardHidden]}>
        <Pressable
          style={styles.body}
          onPress={() => navigation.navigate('EventDetail', { id: event.id })}
          onLongPress={promptHide}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, past && styles.titlePast]} numberOfLines={1}>
              {event.type} · {event.levels}
            </Text>
            {typeof event.distance === 'number' && (
              <Text style={[styles.distance, past && styles.distancePast]}>
                {event.distance} km
              </Text>
            )}
          </View>
          <Text style={[styles.location, past && styles.locationPast]}>{event.location}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.dateLine} numberOfLines={1}>
              <Text style={[styles.date, past && styles.datePast]}>{event.date}</Text>
              <Text style={[styles.entry, past && styles.entryPast, regOpen && styles.entryOpen]}>  ·  ilm. {event.entry_date}</Text>
            </Text>
            <View style={styles.badges}>
              {isHidden && <Text style={styles.hiddenBadge}>Piilotettu</Text>}
              {regOpen && <Text style={styles.regOpenBadge}>Ilmo auki</Text>}
              {!isHidden && fit === 'free' && <Text style={styles.fitFree}>Sopii</Text>}
              {!isHidden && fit === 'conflict' && <Text style={styles.fitConflict}>Päällekkäin</Text>}
              {past && <Text style={styles.pastBadge}>Mennyt</Text>}
            </View>
          </View>
        </Pressable>

        <Pressable
          style={styles.starOverlay}
          hitSlop={12}
          onPress={() => toggleFavorite(event.id)}
          onLongPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
          accessibilityHint="Pitkä painallus valitsee suosikin värin"
        >
          <Text style={[styles.star, isFavorite && { color: resolveColor(colorKey) }]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>

        <FavoriteColorPicker
          eventId={event.id}
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onRequestLabels={() => {
            // Suljetaan ensin — sisäkkäiset modaalit ovat iOS:llä epäluotettavia.
            setPickerOpen(false);
            setLabelsOpen(true);
          }}
        />
        <FavoriteColorLabelsModal visible={labelsOpen} onClose={() => setLabelsOpen(false)} />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2d5a27',
    position: 'relative',
  },
  cardPast: {
    backgroundColor: '#f1f1f0',
    borderLeftColor: '#bbb',
  },
  cardHidden: {
    opacity: 0.55,
    borderLeftColor: '#bbb',
  },
  body: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 44,
  },
  starOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  star: { fontSize: 24, color: '#bbb' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1, marginRight: 8 },
  titlePast: { color: '#777' },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  distancePast: { color: '#999' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  locationPast: { color: '#888' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dateLine: { flexShrink: 1 },
  date: { fontSize: 13, fontWeight: '700', color: '#333' },
  datePast: { color: '#999', fontWeight: '600' },
  entry: { fontSize: 12, color: '#999' },
  entryPast: { color: '#bbb' },
  entryOpen: { color: '#15803d', fontWeight: '700' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  regOpenBadge: {
    fontSize: 11, color: '#15803d', backgroundColor: '#dcf0e2',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  fitFree: {
    fontSize: 11, color: '#15803d', backgroundColor: '#dcf0e2',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  fitConflict: {
    fontSize: 11, color: '#9a3412', backgroundColor: '#fce8d5',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  pastBadge: {
    fontSize: 11,
    color: '#777',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hiddenBadge: {
    fontSize: 11,
    color: '#555',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  action: { justifyContent: 'center', paddingHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  actionRight: { alignItems: 'flex-end' },
  actionText: { color: 'white', fontWeight: '700', fontSize: 13 },
  actionFav: { backgroundColor: '#2d5a27' },
  actionHide: { backgroundColor: '#9ca3af' },
  actionCalendar: { backgroundColor: '#1565c0' },
  actionRemove: { backgroundColor: '#b91c1c' },
});
