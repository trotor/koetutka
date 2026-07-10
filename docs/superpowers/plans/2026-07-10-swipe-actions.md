# Swipe-toiminnot koekortteihin — toteutussuunnitelma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lisää mobiilin koekortteihin iOS-tyyliset pyyhkäisy­toiminnot (suosikki / piilota / poista suosikeista / lisää kalenteriin) + kevyt "olen jo lisännyt kalenteriin" -muisti.

**Architecture:** `EventCard` kääritään gesture-handlerin **legacy** `Swipeable`en; toiminnot ovat ruutukohtaisia (`swipeVariant`-propi). Pyyhkäisy kynnyksen yli laukaisee toiminnon ja sulkeutuu (fire-on-threshold). Kalenteri-toiminto avaa Koe/Ilmo-valikon; onnistuneet lisäykset persistoidaan storeen (`calendarAdded`) ja näkyvät ✓:na. Ei uusia riippuvuuksia.

**Tech Stack:** React Native, react-native-gesture-handler (asennettu), react-native-add-calendar-event (asennettu), zustand, AsyncStorage, vitest.

## Global Constraints

- **Ei uusia riippuvuuksia.** gesture-handler + `GestureHandlerRootView` (`App.tsx`) ovat jo paikallaan; `react-native-reanimated` EI ole asennettu → käytä **legacy** `Swipeable`a (`import { Swipeable } from 'react-native-gesture-handler'`).
- **Ei uutta "tilaa" kokeelle** paitsi kalenterimuisti: swipe kartoitetaan `toggleFavorite` / `toggleHidden` / `addEventToCalendar`iin.
- **Swipe-layout (napin reuna; vetosuunta päinvastainen):** Selaa → vasen reuna `★ Suosikki` (vihreä), oikea reuna `Piilota` (harmaa). Suosikit → vasen reuna `📅 Kalenteri` (sininen, → Koe/Ilmo-valikko), oikea reuna `Poista suosikeista` (punainen).
- **Värit:** vihreä `#2d5a27`, harmaa `#9ca3af`, sininen `#1565c0`, punainen `#b91c1c` (tekstit/ikonit valkoisia paneelin päällä).
- **Kalenterimuisti (taso A) on vihje, ei totuus.** Avain `` `${eventId}:${type}` `` (type = `'event'|'registration'`). iOS: merkitään vain kun dialogi tallennettiin (`action==='SAVED'`); Android/`DONE`: merkitään optimistisesti (ei-peruttu).
- **Ei haptiikkaa** MVP:ssä (ei uutta riippuvuutta; RN-Vibration on iOS:llä liian voimakas) — mahdollinen myöhempi lisä.
- **Versiot:** mobiili `1.5.0 → 1.6.0`; iOS `MARKETING_VERSION 1.6.0`, `CURRENT_PROJECT_VERSION 6 → 7`; Android `versionName 1.6.0`, `versionCode 7 → 8`. Web-versiota EI muuteta. whatsnew.json: uusi merkintä.
- Mobiilitestit: `mobile/src/lib/tests/**/*.test.ts` (vitest, `include` kattaa vain `src/lib/tests`). Typecheck: `cd mobile && npm run typecheck`.

---

### Task 1: Kalenterimuistin persistointi (key-apuri + preferences + store)

**Files:**
- Create: `mobile/src/lib/calendar-added.ts`
- Create: `mobile/src/lib/tests/calendar-added.test.ts`
- Modify: `mobile/src/lib/preferences.ts`
- Modify: `mobile/src/lib/tests/preferences.test.ts`
- Modify: `mobile/src/lib/store.ts`

**Interfaces:**
- Produces: `type CalendarType = 'event' | 'registration'`; `calendarAddedKey(eventId: string, type: CalendarType): string` → `` `${eventId}:${type}` ``.
- Produces (store): state `calendarAdded: Set<string>`; action `markCalendarAdded(eventId: string, type: CalendarType): void`.
- Produces (preferences): `StoredPrefs.calendarAdded: Set<string>` persistoidaan.

- [ ] **Step 1: Write the failing test (key helper)**

Luo `mobile/src/lib/tests/calendar-added.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { calendarAddedKey } from '../calendar-added';

describe('calendarAddedKey', () => {
  test('yhdistää id:n ja tyypin', () => {
    expect(calendarAddedKey('abc', 'event')).toBe('abc:event');
    expect(calendarAddedKey('abc', 'registration')).toBe('abc:registration');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/calendar-added.test.ts`
Expected: FAIL — moduulia `../calendar-added` ei löydy.

- [ ] **Step 3: Implement key helper**

Luo `mobile/src/lib/calendar-added.ts`:

```typescript
export type CalendarType = 'event' | 'registration';

/** Persistointiavain "olen lisännyt kalenteriin" -muistille. */
export function calendarAddedKey(eventId: string, type: CalendarType): string {
  return `${eventId}:${type}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/calendar-added.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `calendarAdded` to preferences (with round-trip test first)**

Lisää `mobile/src/lib/tests/preferences.test.ts`:ään uusi testi (tuo `serializePrefs`, `deserializePrefs` jos ei jo tuotu):

```typescript
import { serializePrefs, deserializePrefs } from '../preferences';
// (jos importit jo olemassa, älä tuplaa)

test('calendarAdded säilyy serialize→deserialize-kierroksessa', () => {
  const base = deserializePrefs(''); // DEFAULTS
  const prefs = { ...base, calendarAdded: new Set(['e1:event', 'e2:registration']) };
  const round = deserializePrefs(serializePrefs(prefs));
  expect(Array.from(round.calendarAdded).sort()).toEqual(['e1:event', 'e2:registration']);
});

test('vanha data ilman calendarAdded-kenttää → tyhjä set', () => {
  const round = deserializePrefs('{"userLocation":null,"filters":{}}');
  expect(round.calendarAdded).toEqual(new Set());
});
```

Run (näytä että uusi testi failaa): `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/preferences.test.ts`
Expected: FAIL (`calendarAdded` undefined).

- [ ] **Step 6: Implement preferences changes**

`mobile/src/lib/preferences.ts` — lisää `calendarAdded` viiteen kohtaan:

`StoredPrefs`-interfaceen (esim. `hidden`-rivin jälkeen):
```typescript
  calendarAdded: Set<string>;
```
`DEFAULTS`-objektiin:
```typescript
  calendarAdded: new Set(),
```
`JsonShape`-interfaceen:
```typescript
  calendarAdded?: string[];
```
`serializePrefs`in `json`-objektiin (esim. `hidden`-rivin jälkeen):
```typescript
    calendarAdded: Array.from(prefs.calendarAdded ?? []),
```
`deserializePrefs`in return-objektiin:
```typescript
      calendarAdded: new Set(parsed.calendarAdded ?? []),
```

- [ ] **Step 7: Wire store**

`mobile/src/lib/store.ts`:

Tuo helper (muiden importtien joukkoon):
```typescript
import { calendarAddedKey, type CalendarType } from './calendar-added';
```
`State`-interfaceen (esim. `hidden`-rivin lähelle):
```typescript
  calendarAdded: Set<string>;
```
`Actions`-interfaceen:
```typescript
  markCalendarAdded: (eventId: string, type: CalendarType) => void;
```
Alkutilaan (esim. `hidden: new Set(),`-rivin jälkeen):
```typescript
  calendarAdded: new Set(),
```
`persist`-funktion `savePrefs({...})`-objektiin lisää:
```typescript
    calendarAdded: state.calendarAdded,
```
`initFromStorage`in `set({...})`-objektiin lisää:
```typescript
      calendarAdded: prefs.calendarAdded,
```
Action-toteutus (peilaa `toggleHidden`-kaavaa; lisää `toggleHidden`in jälkeen):
```typescript
  markCalendarAdded: (eventId, type) => {
    const key = calendarAddedKey(eventId, type);
    if (get().calendarAdded.has(key)) return;
    const calendarAdded = new Set(get().calendarAdded);
    calendarAdded.add(key);
    set({ calendarAdded });
    persist(get());
  },
```

- [ ] **Step 8: Run tests + typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/calendar-added.test.ts src/lib/tests/preferences.test.ts && npm run typecheck`
Expected: kaikki PASS, typecheck exit 0.

- [ ] **Step 9: Commit**

```bash
git add mobile/src/lib/calendar-added.ts mobile/src/lib/tests/calendar-added.test.ts mobile/src/lib/preferences.ts mobile/src/lib/tests/preferences.test.ts mobile/src/lib/store.ts
git commit -m "feat(mobile): persist calendar-added memory in store"
```

---

### Task 2: `addEventToCalendar` palauttaa boolean + detaljinäyttö merkitsee lisäyksen

**Files:**
- Modify: `mobile/src/lib/calendar-add.ts`
- Modify: `mobile/src/screens/EventDetailScreen.tsx`

**Interfaces:**
- Consumes: `markCalendarAdded` (Task 1).
- Produces: `addEventToCalendar(event, type, userLocationName?): Promise<boolean>` — `true` jos lisättiin (ei peruttu).

- [ ] **Step 1: Muuta `addEventToCalendar` palauttamaan boolean**

`mobile/src/lib/calendar-add.ts` — muuta allekirjoitus ja käsittele paluu:

Allekirjoitus:
```typescript
export async function addEventToCalendar(
  event: Event,
  type: Type,
  userLocationName?: string,
): Promise<boolean> {
```
`try`-lohko: ota talteen paluu ja tulkitse (iOS `SAVED`/`CANCELED`; Android käytännössä `DONE` → tulkitaan lisätyksi):
```typescript
  const input = buildCalendarEventInput(event, { type, userLocationName });
  try {
    const result = await AddCalendarEvent.presentEventCreatingDialog({
      title: input.title,
      startDate: input.allDay ? toISO(input.startDate, 9) : toISO(input.startDate, 9),
      endDate: input.allDay ? endOfDayExclusiveISO(input.endDate) : toISO(input.endDate, 17),
      location: input.location,
      notes: input.description,
      allDay: input.allDay,
    });
    // iOS: { action: 'SAVED' | 'CANCELED' }; Android: yleensä { action: 'DONE' }.
    return (result as { action?: string })?.action !== 'CANCELED';
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.toLowerCase().includes('cancel')) return false;
    if (Platform.OS === 'android') {
      Alert.alert(
        'Kalenterin avaaminen epäonnistui',
        'Tarkista että puhelimessa on kalenterisovellus asennettuna.',
      );
    } else {
      Alert.alert('Virhe', 'Tapahtuman lisäys epäonnistui.');
    }
    return false;
  }
```

- [ ] **Step 2: Merkitse lisäys detaljinäytössä**

`mobile/src/screens/EventDetailScreen.tsx` — muuta kaksi kalenteri­napin `onPress`ia (Koe + Ilmoittautumismuistutus) merkitsemään lisäys. Nykyinen:
```tsx
          onPress={() => addEventToCalendar(event, 'event', useStore.getState().userLocation?.name)}
```
→
```tsx
          onPress={async () => {
            const ok = await addEventToCalendar(event, 'event', useStore.getState().userLocation?.name);
            if (ok) useStore.getState().markCalendarAdded(event.id, 'event');
          }}
```
Ja `'registration'`-nappi vastaavasti (`'registration'` molemmissa kohdissa). Älä muuta `exportEventICS`-nappia.

- [ ] **Step 3: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/lib/calendar-add.ts mobile/src/screens/EventDetailScreen.tsx
git commit -m "feat(mobile): addEventToCalendar returns added-state, detail records it"
```

---

### Task 3: Kalenterivalikko (Koe/Ilmo ✓)

**Files:**
- Create: `mobile/src/lib/calendar-menu.ts`

**Interfaces:**
- Consumes: `addEventToCalendar` (Task 2), `calendarAddedKey`/`CalendarType` (Task 1).
- Produces: `presentCalendarMenu(event, isAdded, markAdded, locationName?): void`.

- [ ] **Step 1: Luo valikko-apuri**

Luo `mobile/src/lib/calendar-menu.ts`:

```typescript
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import type { Event } from '@koetutka/shared';
import { addEventToCalendar } from './calendar-add';
import type { CalendarType } from './calendar-added';

/**
 * Näyttää "Lisää kalenteriin" -valikon (Koe / Ilmoittautuminen). ✓ näkyy tyypin
 * edessä jos se on jo lisätty appin kautta. Onnistuneen lisäyksen jälkeen
 * kutsuu markAdded(type).
 */
export function presentCalendarMenu(
  event: Event,
  isAdded: (type: CalendarType) => boolean,
  markAdded: (type: CalendarType) => void,
  locationName?: string,
): void {
  const label = (type: CalendarType, base: string) => (isAdded(type) ? `✓ ${base}` : base);
  const run = async (type: CalendarType) => {
    const ok = await addEventToCalendar(event, type, locationName);
    if (ok) markAdded(type);
  };
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Lisää kalenteriin',
        options: [label('event', 'Koe'), label('registration', 'Ilmoittautuminen'), 'Peruuta'],
        cancelButtonIndex: 2,
      },
      (i) => {
        if (i === 0) void run('event');
        else if (i === 1) void run('registration');
      },
    );
  } else {
    Alert.alert('Lisää kalenteriin', undefined, [
      { text: label('event', 'Koe'), onPress: () => void run('event') },
      { text: label('registration', 'Ilmoittautuminen'), onPress: () => void run('registration') },
      { text: 'Peruuta', style: 'cancel' },
    ]);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/lib/calendar-menu.ts
git commit -m "feat(mobile): calendar add menu (Koe/Ilmo with added-check)"
```

---

### Task 4: Swipeable `EventCard` + ruutukohtaiset toiminnot

**Files:**
- Modify: `mobile/src/components/EventCard.tsx`
- Modify: `mobile/src/screens/FavoritesScreen.tsx` (anna `swipeVariant="favorites"`)

**Interfaces:**
- Consumes: `Swipeable` (gesture-handler), `presentCalendarMenu` (Task 3), store `calendarAdded`/`markCalendarAdded` (Task 1), `calendarAddedKey`/`CalendarType`.
- Produces: `EventCard` propi `swipeVariant?: 'browse' | 'favorites'` (oletus `'browse'`).

Malli: **fire-on-threshold** — pyyhkäisy kynnyksen yli laukaisee toiminnon ja sulkee rivin (`onSwipeableOpen`). Paneeli (ikoni + teksti värillisellä pohjalla) on visuaalinen palaute. (Ei erillistä napautusta / ei "yksi auki kerrallaan" -logiikkaa, koska rivi ei jää auki.)

- [ ] **Step 1: Lisää importit ja propi EventCardiin**

`mobile/src/components/EventCard.tsx` — lisää importit:
```typescript
import { Swipeable } from 'react-native-gesture-handler';
import { presentCalendarMenu } from '@/lib/calendar-menu';
import { calendarAddedKey, type CalendarType } from '@/lib/calendar-added';
```
Muuta komponentin allekirjoitus:
```typescript
export function EventCard({
  event,
  fit,
  swipeVariant = 'browse',
}: {
  event: Event;
  fit?: 'free' | 'conflict';
  swipeVariant?: 'browse' | 'favorites';
}) {
```

- [ ] **Step 2: Lue tarvittava store-tila ja rakenna toiminnot**

Komponentin rungossa (muiden `useStore`-kutsujen lähellä) lisää:
```typescript
  const calendarAdded = useStore((s) => s.calendarAdded);
  const markCalendarAdded = useStore((s) => s.markCalendarAdded);
  const userLocationName = useStore((s) => s.userLocation?.name);
  const swipeRef = useRef<Swipeable>(null);

  const openCalendarMenu = () =>
    presentCalendarMenu(
      event,
      (type: CalendarType) => calendarAdded.has(calendarAddedKey(event.id, type)),
      (type: CalendarType) => markCalendarAdded(event.id, type),
      userLocationName,
    );

  // Vasen reuna = positiivinen; oikea reuna = poistava. Ruutukohtainen.
  const onLeft = () => {
    if (swipeVariant === 'favorites') openCalendarMenu();
    else toggleFavorite(event.id);
  };
  const onRight = () => {
    if (swipeVariant === 'favorites') toggleFavorite(event.id); // poista suosikeista
    else toggleHidden(event.id);
  };
```
Lisää `useRef` importtiin `react`:sta jos ei jo:
```typescript
import { useRef } from 'react';
```
(Huom: `Alert`, `useStore`, `toggleFavorite`, `toggleHidden` ovat jo käytössä.)

- [ ] **Step 3: Renderöi action-paneelit ja kääri Swipeable**

Lisää paneeli-renderöijät ennen `return`ia:
```tsx
  const leftPanel = () => (
    <View style={[styles.action, swipeVariant === 'favorites' ? styles.actionCalendar : styles.actionFav]}>
      <Text style={styles.actionText}>{swipeVariant === 'favorites' ? '📅 Kalenteri' : '★ Suosikki'}</Text>
    </View>
  );
  const rightPanel = () => (
    <View style={[styles.action, styles.actionRight, swipeVariant === 'favorites' ? styles.actionRemove : styles.actionHide]}>
      <Text style={styles.actionText}>{swipeVariant === 'favorites' ? 'Poista suosikeista' : 'Piilota'}</Text>
    </View>
  );
```
Kääri nykyinen uloin `<View style={[styles.card, ...]}>…</View>` Swipeableen:
```tsx
  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={64}
      rightThreshold={64}
      renderLeftActions={leftPanel}
      renderRightActions={rightPanel}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') onLeft();
        else onRight();
        swipeRef.current?.close();
      }}
    >
      {/* nykyinen kortti-View sellaisenaan */}
      <View style={[styles.card, past && styles.cardPast, isHidden && styles.cardHidden]}>
        {/* …ennallaan… */}
      </View>
    </Swipeable>
  );
```

- [ ] **Step 4: Lisää action-tyylit**

`StyleSheet.create`-lohkoon lisää:
```typescript
  action: { justifyContent: 'center', paddingHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  actionRight: { alignItems: 'flex-end' },
  actionText: { color: 'white', fontWeight: '700', fontSize: 13 },
  actionFav: { backgroundColor: '#2d5a27' },
  actionHide: { backgroundColor: '#9ca3af' },
  actionCalendar: { backgroundColor: '#1565c0' },
  actionRemove: { backgroundColor: '#b91c1c' },
```

- [ ] **Step 5: Anna `swipeVariant` Suosikit-listalle**

`mobile/src/screens/FavoritesScreen.tsx` — muuta listan `renderItem`:
```tsx
            renderItem={({ item }) => <EventCard event={item} swipeVariant="favorites" />}
```
(BrowseScreen ja FavoritesAgenda käyttävät oletusta `'browse'` — ei muutosta.)

- [ ] **Step 6: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/components/EventCard.tsx mobile/src/screens/FavoritesScreen.tsx
git commit -m "feat(mobile): swipe actions on event cards"
```

---

### Task 5: Versiointi + whatsnew

**Files:**
- Modify: `mobile/package.json`, `mobile/ios/Koetutka.xcodeproj/project.pbxproj`, `mobile/android/app/build.gradle`, `whatsnew.json`

- [ ] **Step 1: Bump-versiot**

`mobile/package.json`: `"version": "1.5.0"` → `"1.6.0"`.
`mobile/ios/Koetutka.xcodeproj/project.pbxproj`: molemmat `MARKETING_VERSION = 1.5.0;` → `1.6.0;`, molemmat `CURRENT_PROJECT_VERSION = 6;` → `7;`.
`mobile/android/app/build.gradle`: `versionCode 7` → `8`, `versionName "1.5.0"` → `"1.6.0"`.

- [ ] **Step 2: whatsnew-merkintä**

Lisää `whatsnew.json`:n `releases`-listan **alkuun**:
```json
    {
      "version": "1.6.0",
      "date": "2026-07-10",
      "title": "Pyyhkäisytoiminnot",
      "items": [
        "Koekorttia voi nyt pyyhkäistä: Selaa-listalla oikealle = suosikki, vasemmalle = piilota",
        "Suosikit-listalla pyyhkäisy oikealle avaa kalenteriin lisäyksen (koe tai ilmoittautuminen), vasemmalle poistaa suosikeista",
        "Kalenteriin jo lisätyt näkyvät ✓-merkillä"
      ]
    },
```

- [ ] **Step 3: Verify**

Run:
```bash
cd /Users/teroronkko/code/koetutka && node -e "JSON.parse(require('fs').readFileSync('whatsnew.json','utf8')); console.log('whatsnew OK')"
grep -c "MARKETING_VERSION = 1.6.0" mobile/ios/Koetutka.xcodeproj/project.pbxproj  # expect 2
grep -c "CURRENT_PROJECT_VERSION = 7" mobile/ios/Koetutka.xcodeproj/project.pbxproj # expect 2
grep -nE 'versionCode 8|versionName "1.6.0"' mobile/android/app/build.gradle
grep '"version"' mobile/package.json
```
Expected: `whatsnew OK`, 2, 2, both android lines, `"1.6.0"`.

- [ ] **Step 4: Commit**

```bash
git add mobile/package.json mobile/ios/Koetutka.xcodeproj/project.pbxproj mobile/android/app/build.gradle whatsnew.json
git commit -m "chore: bump mobile to 1.6.0 + whatsnew (swipe actions)"
```

---

### Task 6: Kokonaistarkistus

- [ ] **Step 1: Aja mobiilin testit + typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm test && npm run typecheck`
Expected: kaikki vihreä, typecheck exit 0.

- [ ] **Step 2: Manuaalinen laite/simulaattori­tarkistus (kontrolleri/käyttäjä)**

Aja app simulaattorissa (`cd mobile && npm run ios`). Tarkista: Selaa-listalla pyyhkäisy oikealle suosikoi (★), vasemmalle piilottaa; Suosikit-listalla oikealle avaa kalenterivalikon (Koe/Ilmo; jo lisätyt ✓), vasemmalle poistaa suosikeista. Kortin tap (avaa) ja tähti-tap toimivat yhä.

---

## Self-Review (kirjoittajan tarkistus)

**Spec-kattavuus:**
- Osa 1 (swipe-layout) → Task 4.
- Osa 2 (kalenterivalikko Koe/Ilmo ✓) → Task 3 + Task 4 (openCalendarMenu).
- Osa 3 (taso A -muisti) → Task 1 (persistointi) + Task 2 (detalji merkitsee) + Task 3 (valikko merkitsee).
- Osa 4 (versiot + whatsnew) → Task 5.

**Placeholder-skannaus:** ei TBD/TODO; koodilohkot täydellisiä.

**Tyyppien/nimien johdonmukaisuus:** `CalendarType`, `calendarAddedKey`, `markCalendarAdded`, `calendarAdded`, `presentCalendarMenu`, `swipeVariant`, `addEventToCalendar(): Promise<boolean>` käytetään samoin kaikissa tehtävissä. Värit vakioitu Global Constraintsissa.

**Poikkeama speciin:** spec mainitsi "lyhyt liu'utus paljastaa napin + täysi liu'utus laukaisee" ja "yksi rivi auki kerrallaan" sekä haptiikan. Suunnitelma toteuttaa yksinkertaisemman **fire-on-threshold**-mallin (ei jäävää nappia, ei one-open-koordinaatiota) ja jättää haptiikan pois (ei uutta riippuvuutta). Nämä ovat tietoisia YAGNI-yksinkertaistuksia ("muutetaan tarvittaessa"); tappable-napit/haptiikka voi lisätä myöhemmin.
