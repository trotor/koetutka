import { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Event, MonthDay } from '@koetutka/shared';
import {
  addDistances,
  buildMonthGrid,
  initialMonthKey,
  shiftMonthKey,
  monthKeyOf,
  isCancelled,
  isPast,
  FINNISH_WEEKDAYS_SHORT,
} from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { resolveColor, colorKeyFor, labelFor, FAVORITE_COLORS } from '@/lib/favorite-colors';

const MAX_CHIPS = 3;

function formatDayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
  const weekday = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'][new Date(y, m - 1, d).getDay()];
  return `${weekday} ${d}.${m}.${y}`;
}

/**
 * Suosikit seinäkalenterina: koko kuukauden päivät kerralla ja kokeet
 * merkittyinä suosikkivärein. Päivän napautus näyttää sen kokeet ruudukon alla;
 * koekortin napautus avaa kokeen tiedot.
 */
export function FavoritesMonth({ scrollY }: { scrollY?: Animated.Value }) {
  const events = useStore((s) => s.events);
  const favorites = useStore((s) => s.favorites);
  const favoriteColors = useStore((s) => s.favoriteColors);
  const userLocation = useStore((s) => s.userLocation);
  const colorLabels = useStore((s) => s.colorLabels);

  const favoriteEvents = useMemo(() => {
    const list = events.filter((e) => favorites.has(e.id));
    return userLocation ? addDistances(list, userLocation) : list;
  }, [events, favorites, userLocation]);

  const [monthKey, setMonthKey] = useState(() => initialMonthKey(favoriteEvents));
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(monthKey, favoriteEvents), [monthKey, favoriteEvents]);

  const selectedDay = useMemo(
    () => (selected ? grid.weeks.flat().find((d) => d.iso === selected) ?? null : null),
    [grid, selected],
  );
  const listed: Event[] = selectedDay ? selectedDay.events : grid.monthEvents;

  const goMonth = (key: string) => {
    setMonthKey(key);
    setSelected(null);
  };

  const onDayPress = (day: MonthDay) => {
    if (!day.inMonth) {
      goMonth(day.iso.slice(0, 7));
      if (day.events.length) setSelected(day.iso);
      return;
    }
    setSelected((cur) => (cur === day.iso || day.events.length === 0 ? null : day.iso));
  };

  const currentKey = monthKeyOf(new Date());

  // Selite: kuukaudessa käytetyt värit, joille käyttäjä on antanut nimen.
  const legend = useMemo(() => {
    const used = new Set(grid.monthEvents.map((e) => colorKeyFor(favoriteColors, e.id)));
    return FAVORITE_COLORS.filter((c) => used.has(c.key) && labelFor(colorLabels, c.key));
  }, [grid, favoriteColors, colorLabels]);

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.wrap}
      onScroll={
        scrollY
          ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false,
            })
          : undefined
      }
      scrollEventThrottle={16}
    >
      <View style={styles.nav}>
        <Pressable
          onPress={() => goMonth(shiftMonthKey(monthKey, -1))}
          accessibilityRole="button"
          accessibilityLabel="Edellinen kuukausi"
          hitSlop={8}
          style={styles.navBtn}
        >
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.monthLabel} accessibilityRole="header">{grid.label}</Text>
          {monthKey !== currentKey && (
            <Pressable onPress={() => goMonth(currentKey)} accessibilityRole="button" hitSlop={6}>
              <Text style={styles.todayLink}>Tämä kuukausi</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => goMonth(shiftMonthKey(monthKey, 1))}
          accessibilityRole="button"
          accessibilityLabel="Seuraava kuukausi"
          hitSlop={8}
          style={styles.navBtn}
        >
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekRow}>
          {FINNISH_WEEKDAYS_SHORT.map((wd, i) => (
            <Text key={wd} style={[styles.weekday, i >= 5 && styles.weekend]}>
              {wd}
            </Text>
          ))}
        </View>
        {grid.weeks.map((week) => (
          <View key={week[0].iso} style={styles.weekRow}>
            {week.map((day) => {
              const isSelected = day.iso === selected;
              const extra = day.events.length - MAX_CHIPS;
              return (
                <Pressable
                  key={day.iso}
                  onPress={() => onDayPress(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDayHeading(day.iso)}${
                    day.events.length ? `, ${day.events.length} koetta` : ''
                  }`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.cell,
                    !day.inMonth && styles.cellOut,
                    isSelected && styles.cellSelected,
                  ]}
                >
                  <View style={[styles.dayNumWrap, day.isToday && styles.todayWrap]}>
                    <Text
                      style={[
                        styles.dayNum,
                        !day.inMonth && styles.dayNumOut,
                        day.isToday && styles.todayNum,
                      ]}
                    >
                      {day.day}
                    </Text>
                  </View>
                  {day.events.slice(0, MAX_CHIPS).map((e) => {
                    const faded = isPast(e) || isCancelled(e);
                    return (
                      <View
                        key={e.id}
                        style={[
                          styles.chip,
                          { backgroundColor: resolveColor(colorKeyFor(favoriteColors, e.id)) },
                          (faded || !day.inMonth) && styles.chipFaded,
                        ]}
                      >
                        <Text
                          style={[styles.chipText, isCancelled(e) && styles.chipCancelled]}
                          numberOfLines={1}
                        >
                          {e.type}
                        </Text>
                      </View>
                    );
                  })}
                  {extra > 0 && <Text style={styles.more}>+{extra}</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((c) => (
            <View key={c.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.color }]} />
              <Text style={styles.legendText}>{labelFor(colorLabels, c.key)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.listHeading}>
        {selectedDay
          ? formatDayHeading(selectedDay.iso)
          : grid.monthEvents.length
            ? `${grid.label}: ${grid.monthEvents.length} ${grid.monthEvents.length === 1 ? 'suosikki' : 'suosikkia'}`
            : `Ei suosikkeja kuukaudessa ${grid.label.toLowerCase()}`}
      </Text>
      {selectedDay && (
        <Pressable onPress={() => setSelected(null)} hitSlop={6}>
          <Text style={styles.showAll}>Näytä koko kuukausi</Text>
        </Pressable>
      )}
      {listed.map((e) => (
        <EventCard key={e.id} event={e} swipeVariant="favorites" />
      ))}
    </Animated.ScrollView>
  );
}

const GREEN = '#2d5a27';
const DARK = '#1a472a';

const styles = StyleSheet.create({
  wrap: { padding: 12, paddingBottom: 32, backgroundColor: '#f8f9fa' },
  nav: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e8f0e6',
  },
  navArrow: { fontSize: 26, lineHeight: 28, color: DARK, fontWeight: '600' },
  navCenter: { flex: 1, alignItems: 'center' },
  monthLabel: { fontSize: 17, fontWeight: '700', color: DARK },
  todayLink: { fontSize: 12, color: GREEN, textDecorationLine: 'underline', marginTop: 2 },
  calendar: {
    backgroundColor: 'white', borderRadius: 12, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#d6dfd3',
  },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1, textAlign: 'center', paddingVertical: 6, fontSize: 11, fontWeight: '700',
    color: '#5f6f5c', textTransform: 'uppercase', backgroundColor: '#eef3ec',
  },
  weekend: { color: '#a04a3a' },
  cell: {
    flex: 1, minHeight: 72, paddingHorizontal: 2, paddingTop: 3, paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: '#e3e9e1', gap: 2,
  },
  cellOut: { backgroundColor: '#f6f7f6' },
  cellSelected: { backgroundColor: '#e3efe0' },
  dayNumWrap: {
    alignSelf: 'center', minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginBottom: 1,
  },
  todayWrap: { backgroundColor: GREEN },
  dayNum: { fontSize: 12, fontWeight: '600', color: '#2b3a29' },
  dayNumOut: { color: '#b0b8ae' },
  todayNum: { color: 'white' },
  chip: { borderRadius: 4, paddingHorizontal: 2, paddingVertical: 1 },
  chipFaded: { opacity: 0.45 },
  chipText: { fontSize: 9, fontWeight: '700', color: 'white', textAlign: 'center' },
  chipCancelled: { textDecorationLine: 'line-through' },
  more: { fontSize: 9, fontWeight: '700', color: '#5f6f5c', textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, color: '#3d4b3a', fontWeight: '600' },
  listHeading: { fontSize: 13, fontWeight: '700', color: DARK, marginTop: 16, marginBottom: 4 },
  showAll: { fontSize: 12, color: GREEN, textDecorationLine: 'underline', marginBottom: 8 },
});
