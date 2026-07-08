# Ilmoittautuminen auki -korostus & suosikkien jako — toteutussuunnitelma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Korosta auki oleva ilmoittautumisaika (web + mobiili) ja anna jakaa mobiilin suosikkilista tiiviinä tekstinä.

**Architecture:** Kaksi puhdasta funktiota lisätään/altistetaan jaetusta `@koetutka/shared`-paketista (`isPast`, `buildFavoritesShareText`); `isRegistrationOpen` on jo paketissa ja vain johdotetaan webiin. UI on ohut alusta­kohtainen kerros: web renderöi luokan + pillerin, mobiili näyttää tyylin + badgen ja saa suosikkinäyttöön menneet-kytkimen sekä jakonapin (`react-native-share`).

**Tech Stack:** TypeScript (shared, vitest), vanilla JS + CSS (web), React Native + zustand (mobiili), react-native-share.

## Global Constraints

- **Ei uusia riippuvuuksia.** `react-native-share` on jo asennettu ja käytössä (`mobile/src/lib/ics-export.ts`).
- **Versiot:** web `v1.10.0 → v1.11.0`; mobiili `1.4.0 → 1.5.0`; iOS `MARKETING_VERSION 1.5.0`, `CURRENT_PROJECT_VERSION 5 → 6`; Android `versionName "1.5.0"`, `versionCode 6 → 7`.
- **whatsnew.json:** jokaisella version­bumpilla lisätään merkintä (uusin ensin `releases`-listaan). Ships web-deployn kautta.
- **Käyttäjänäkyvä teksti suomeksi.**
- **Korostuksen vihreät sävyt** ovat samat kaikkialla: teksti `#15803d`, pillerin/badgen tausta `#dcf0e2` (samat kuin mobiilin nykyinen `fitFree`).
- **Jako on WYSIWYG:** `buildFavoritesShareText` formatoi sille annetun listan sellaisenaan — ei suodata eikä järjestä. Kutsuja (suosikkinäyttö) päättää sisällön ja järjestyksen.
- **Ilmo-auki-korostus ei näy menneille kokeille** (past-tila voittaa).
- Shared-testit: `shared/tests/**/*.test.ts`, import polulla `../src/<moduuli>.js`.

---

### Task 1: Shared — `isPast(event, today?)`

Jaettu menneisyys­tarkistus, jota mobiilin `EventCard` ja suosikkinäyttö käyttävät. Logiikka on identtinen mobiilin nykyisen `EventCard.isPast`:n kanssa (ISO-päivävertailu).

**Files:**
- Modify: `shared/src/filters.ts` (lisää export)
- Test: `shared/tests/filters.test.ts` (lisää describe-lohko)

**Interfaces:**
- Produces: `isPast(event: Event, today?: Date): boolean` — `true` jos `end_date_sort` (tai sen puuttuessa `date_sort`) on ISO-päivävertailussa ennen `today`-päivää.

- [ ] **Step 1: Write the failing test**

Lisää `shared/tests/filters.test.ts`:n loppuun (import-riville lisää `isPast`):

```typescript
describe('isPast', () => {
  const ev = (date_sort: string, end_date_sort: string | null = null): Event =>
    ({
      id: 'x', type: 'NOME-B', levels: 'VOI', date: '01.04.2026',
      date_sort, end_date_sort, entry_date: '01.03.-20.03.', location: 'Kuopio',
      coordinates: null, name: '', organizer: '', official: { name: '', phone: '', email: '' },
      secretary: { name: '', phone: '', email: '' }, judges: [], description: '',
      cost: 0, cost_member: '', classes: [], places: 0,
    }) as unknown as Event;

  test('mennyt koe on past', () => {
    expect(isPast(ev('2026-04-01T00:00:00+03:00'), new Date('2026-04-05'))).toBe(true);
  });
  test('tuleva koe ei ole past', () => {
    expect(isPast(ev('2026-04-10T00:00:00+03:00'), new Date('2026-04-05'))).toBe(false);
  });
  test('tämänpäiväinen koe ei ole past', () => {
    expect(isPast(ev('2026-04-05T00:00:00+03:00'), new Date('2026-04-05'))).toBe(false);
  });
  test('monipäiväinen: loppupäivä ratkaisee', () => {
    // Alkaa eilen, loppuu huomenna → ei past.
    expect(
      isPast(ev('2026-04-04T00:00:00+03:00', '2026-04-06T00:00:00+03:00'), new Date('2026-04-05')),
    ).toBe(false);
  });
});
```

Muuta myös tiedoston yläreunan import:

```typescript
import { addDistances, filterEvents, isRegistrationOpen, isPast } from '../src/filters.js';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka/shared && npx vitest run tests/filters.test.ts`
Expected: FAIL — `isPast is not a function` / import error.

- [ ] **Step 3: Add the implementation**

Lisää `shared/src/filters.ts`:ään (esim. `isRegistrationOpen`-funktion jälkeen):

```typescript
/**
 * Palauttaa true, jos koe on jo mennyt: kokeen loppupäivä
 * (`end_date_sort` tai sen puuttuessa `date_sort`) on ennen `today`-päivää.
 * Vertailu tehdään ISO-päiväosalla (YYYY-MM-DD).
 */
export function isPast(event: Event, today: Date = new Date()): boolean {
  const todayISO = today.toISOString().split('T')[0];
  const end = (event.end_date_sort || event.date_sort).split('T')[0];
  return end < todayISO;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/teroronkko/code/koetutka/shared && npx vitest run tests/filters.test.ts`
Expected: PASS (kaikki isPast- ja aiemmat testit).

- [ ] **Step 5: Commit**

```bash
git add shared/src/filters.ts shared/tests/filters.test.ts
git commit -m "feat(shared): add isPast helper"
```

---

### Task 2: Shared — `buildFavoritesShareText(events)`

Puhdas funktio joka rakentaa jaettavan tekstin. Ei suodata/järjestä.

**Files:**
- Create: `shared/src/favorites-share.ts`
- Modify: `shared/src/index.ts` (lisää re-export)
- Test: `shared/tests/favorites-share.test.ts`

**Interfaces:**
- Consumes: `Event`-tyyppi (`type` sisältää `date`, `type`, `levels`, `location`).
- Produces: `buildFavoritesShareText(events: Event[]): string` — otsikko `"Suosikkikokeet – Koetutka"`, tyhjä rivi, sitten rivi per koe muodossa `"{date} · {type}[ · {levels}] · {location}"`. `levels` jätetään pois jos tyhjä tai (case-insensitive) `"N/A"`. Rivit annetussa järjestyksessä.

- [ ] **Step 1: Write the failing test**

Luo `shared/tests/favorites-share.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { buildFavoritesShareText } from '../src/favorites-share.js';
import type { Event } from '../src/types.js';

const ev = (over: Partial<Event>): Event =>
  ({
    id: 'x', type: 'NOME-B', levels: 'VOI', date: '24.01.2026',
    date_sort: '2026-01-24T00:00:00+02:00', end_date_sort: null,
    entry_date: '01.01.-14.01.', location: 'Kuopio', coordinates: null,
    name: '', organizer: '', official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' }, judges: [], description: '',
    cost: 0, cost_member: '', classes: [], places: 0, ...over,
  }) as unknown as Event;

describe('buildFavoritesShareText', () => {
  test('perusmuoto: otsikko, tyhjä rivi, rivi per koe', () => {
    const text = buildFavoritesShareText([
      ev({ date: '24.01.2026', type: 'NOME-B', levels: 'VOI', location: 'Kuopio' }),
      ev({ date: '07.03.2026', type: 'WT', levels: 'AVO', location: 'Oulu' }),
    ]);
    expect(text).toBe(
      'Suosikkikokeet – Koetutka\n\n' +
        '24.01.2026 · NOME-B · VOI · Kuopio\n' +
        '07.03.2026 · WT · AVO · Oulu',
    );
  });

  test('levels jätetään pois kun N/A', () => {
    const text = buildFavoritesShareText([
      ev({ date: '14.02.2026', type: 'NOME-A SM', levels: 'N/A', location: 'Salo' }),
    ]);
    expect(text).toBe('Suosikkikokeet – Koetutka\n\n14.02.2026 · NOME-A SM · Salo');
  });

  test('levels jätetään pois kun tyhjä', () => {
    const text = buildFavoritesShareText([
      ev({ date: '14.02.2026', type: 'NOME-A SM', levels: '', location: 'Salo' }),
    ]);
    expect(text).toBe('Suosikkikokeet – Koetutka\n\n14.02.2026 · NOME-A SM · Salo');
  });

  test('järjestys säilyy annettuna (ei uudelleenjärjestystä)', () => {
    const text = buildFavoritesShareText([
      ev({ date: '07.03.2026', type: 'WT', levels: 'AVO', location: 'Oulu' }),
      ev({ date: '24.01.2026', type: 'NOME-B', levels: 'VOI', location: 'Kuopio' }),
    ]);
    const lines = text.split('\n');
    expect(lines[2]).toContain('Oulu');
    expect(lines[3]).toContain('Kuopio');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka/shared && npx vitest run tests/favorites-share.test.ts`
Expected: FAIL — moduulia `../src/favorites-share.js` ei löydy.

- [ ] **Step 3: Write the implementation**

Luo `shared/src/favorites-share.ts`:

```typescript
import type { Event } from './types.js';

const SHARE_HEADER = 'Suosikkikokeet – Koetutka';

/**
 * Rakentaa jaettavan tiivistelmän suosikkikokeista. WYSIWYG: formatoi
 * annetun listan sellaisenaan annetussa järjestyksessä — ei suodata eikä
 * järjestä. Rivi per koe: "{date} · {type}[ · {levels}] · {location}".
 * `levels` jätetään pois jos tyhjä tai "N/A".
 */
export function buildFavoritesShareText(events: Event[]): string {
  const lines = events.map((e) => {
    const segments: string[] = [e.date, e.type];
    const levels = (e.levels ?? '').trim();
    if (levels && levels.toUpperCase() !== 'N/A') segments.push(levels);
    segments.push(e.location);
    return segments.join(' · ');
  });
  return [SHARE_HEADER, '', ...lines].join('\n');
}
```

Lisää `shared/src/index.ts`:ään muiden `export *`-rivien joukkoon:

```typescript
export * from './favorites-share.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/teroronkko/code/koetutka/shared && npx vitest run tests/favorites-share.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/src/favorites-share.ts shared/src/index.ts shared/tests/favorites-share.test.ts
git commit -m "feat(shared): add buildFavoritesShareText"
```

---

### Task 3: Web — käytä jaettua `isRegistrationOpen`, poista duplikaatti

Poistetaan `app.js`:n inline-kopio ja altistetaan jaettu funktio `window.koetutkaShared`:iin. Ei toiminnallista muutosta (suodatin toimii kuten ennenkin) — refaktorointi, jonka logiikan kattaa `shared`:n olemassa oleva `isRegistrationOpen`-testi.

**Files:**
- Modify: `index.html:176-195` (module-import + `window.koetutkaShared`)
- Modify: `app.js:102-116` (inline-funktio → wrapper)

**Interfaces:**
- Consumes: `window.koetutkaShared.isRegistrationOpen(event)` (jaetusta paketista).
- Produces: web-globaali `isRegistrationOpen(koe)` (wrapper) säilyy samalla nimellä; olemassa olevat kutsut `app.js:405` ja `app.js:601` toimivat ennallaan.

- [ ] **Step 1: Lisää `isRegistrationOpen` webin shared-johdotukseen**

`index.html`, muuta import-lohko ja `window.koetutkaShared`-objekti niin että molemmissa on `isRegistrationOpen`:

Import-lohko (rivit ~176-184) → lisää `isRegistrationOpen,` esim. `filterEvents,`-rivin jälkeen:

```javascript
        import {
            haversine,
            addDistances,
            filterEvents,
            isRegistrationOpen,
            getCostValue,
            getOptionalCosts,
            listClassPlaces,
            generateICS,
        } from './shared/dist/index.js';
```

`window.koetutkaShared` (rivit ~187-195) → lisää sama:

```javascript
        window.koetutkaShared = {
            haversine,
            addDistances,
            filterEvents,
            isRegistrationOpen,
            getCostValue,
            getOptionalCosts,
            listClassPlaces,
            generateICS,
        };
```

- [ ] **Step 2: Korvaa `app.js`:n inline-funktio wrapperilla**

`app.js`, korvaa rivit 102-116 (kommentti + koko `isRegistrationOpen`-funktio) tällä:

```javascript
        // isRegistrationOpen siirretty shared/-moduuliin (filters.ts). Wrapper,
        // koska window.koetutkaShared asetetaan vasta deferred module-scriptissä
        // tämän classic-scriptin suorituksen jälkeen.
        function isRegistrationOpen(koe) {
            return window.koetutkaShared.isRegistrationOpen(koe);
        }
```

- [ ] **Step 3: Build shared ja tarkista käännös**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared build`
Expected: tsc kääntyy ilman virheitä; `shared/dist/index.js` sisältää `isRegistrationOpen`-exportin.

Varmista: `grep -c "isRegistrationOpen" shared/dist/index.js` → ≥ 1.

- [ ] **Step 4: Manuaalinen savutesti (valinnainen mutta suositeltu)**

Run: `cd /Users/teroronkko/code/koetutka && python3 -m http.server 8080`
Avaa `http://localhost:8080/`, klikkaa "vain ne joiden ilmoittautuminen on auki" -pilleriä. Odotettu: lista suodattuu kuten ennenkin (ei JS-virheitä konsolissa). Sammuta palvelin.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js
git commit -m "refactor(web): use shared isRegistrationOpen, drop inline copy"
```

---

### Task 4: Web — ilmo-auki-korostus (taulukko + kortit + tyylit)

Kun `isRegistrationOpen(koe)` on tosi, ilmoittautumisaika vihreänä + lihavoituna ja perään "Ilmo auki" -pilleri. Kolme renderöintikohtaa: taulukkosolu, kortin desktop-subtitle, kortin mobiili-meta.

**Files:**
- Modify: `app.js:716-742` (taulukko-map), `app.js:745-793` (kortti-map)
- Modify: `styles.css` (uudet luokat `.registration-open`, `.reg-open-badge`)

**Interfaces:**
- Consumes: web-globaali `isRegistrationOpen(koe)` (Task 3).

- [ ] **Step 1: Taulukkosolun korostus**

`app.js`, taulukko-mapin callbackissa lisää `const typeClass = …`-rivin jälkeen (n. rivi 717):

```javascript
                const regOpen = isRegistrationOpen(koe);
```

Muuta `entry-date`-solu (nykyinen `app.js:734`):

```javascript
                        <td class="entry-date${regOpen ? ' registration-open' : ''}">${koe.entry_date}${regOpen ? ' <span class="reg-open-badge">Ilmo auki</span>' : ''}</td>
```

- [ ] **Step 2: Korttien korostus (desktop + mobiili)**

`app.js`, kortti-mapin callbackissa lisää `const typeClass = …`-rivin jälkeen (n. rivi 746):

```javascript
                const regOpen = isRegistrationOpen(koe);
```

Muuta desktop-subtitlen ilmoittautumiskohta (nykyiset rivit 765-767):

```javascript
                                <span class="card-subtitle-item${regOpen ? ' registration-open' : ''}" onclick="event.stopPropagation(); downloadICS(${index}, 'registration')" title="Lisää ilmoittautumismuistutus kalenteriin">
                                    <span class="card-calendar-link">✏️ Ilmo: ${koe.entry_date}</span>${regOpen ? '<span class="reg-open-badge">Ilmo auki</span>' : ''}
                                </span>
```

Muuta mobiilin meta-kohta (nykyiset rivit 786-788):

```javascript
                            <div class="card-meta-item${regOpen ? ' registration-open' : ''}" onclick="event.stopPropagation(); downloadICS(${index}, 'registration')" title="Lisää ilmoittautumismuistutus kalenteriin">
                                <span class="card-calendar-link">✏️ Ilmo: ${koe.entry_date}</span>${regOpen ? '<span class="reg-open-badge">Ilmo auki</span>' : ''}
                            </div>
```

- [ ] **Step 3: Lisää tyylit**

Lisää `styles.css`:n loppuun:

```css
/* Ilmoittautuminen auki -korostus */
.registration-open,
.registration-open .card-calendar-link,
td.entry-date.registration-open {
    color: #15803d;
    font-weight: 700;
}
.reg-open-badge {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 700;
    color: #15803d;
    background: #dcf0e2;
    border-radius: 4px;
    white-space: nowrap;
    vertical-align: middle;
}
```

- [ ] **Step 4: Manuaalinen tarkistus**

Run: `cd /Users/teroronkko/code/koetutka && python3 -m http.server 8080`
Avaa `http://localhost:8080/`. Etsi koe jonka ilmoittautuminen on tänään (2026-07-08) auki — sen ilmoittautumisaika näkyy vihreänä + "Ilmo auki" -pilleri sekä taulukossa (leveä ikkuna) että korttinäkymässä (kapea ikkuna). Muilla kokeilla ei korostusta. Sammuta palvelin.

> Jos yksikään koe ei satu olemaan auki tänään, tarkista väliaikaisesti pakottamalla wrapper palauttamaan `true` ensimmäiselle koeelle, katso korostus, ja peru muutos.

- [ ] **Step 5: Commit**

```bash
git add app.js styles.css
git commit -m "feat(web): highlight open registration period"
```

---

### Task 5: Mobiili — `EventCard` ilmo-auki-korostus

`ilm. …` -teksti vihreäksi + lihavoiduksi ja "Ilmo auki" -badge kun ilmoittautuminen auki eikä koe ole mennyt. Samalla `EventCard`:n oma `isPast` korvataan jaetulla.

**Files:**
- Modify: `mobile/src/components/EventCard.tsx`

**Interfaces:**
- Consumes: `isRegistrationOpen(event)`, `isPast(event)` from `@koetutka/shared`.

- [ ] **Step 1: Vaihda importit ja poista paikallinen `isPast`**

`mobile/src/components/EventCard.tsx`, muuta tuontirivi:

```typescript
import type { Event } from '@koetutka/shared';
import { isRegistrationOpen, isPast } from '@koetutka/shared';
```

Poista paikallinen `isPast`-funktio (nykyiset rivit 10-14).

- [ ] **Step 2: Laske auki-tila ja renderöi korostus**

Komponentin rungossa `const past = isPast(event);`-rivin jälkeen lisää:

```typescript
  const regOpen = !past && isRegistrationOpen(event);
```

Muuta ilmoittautumis­teksti (nykyinen rivi 64) käyttämään korostustyyliä kun auki:

```tsx
            <Text style={[styles.entry, past && styles.entryPast, regOpen && styles.entryOpen]}>  ·  ilm. {event.entry_date}</Text>
```

Lisää badge `badges`-näkymään (nykyiset rivit 66-71), ennen `past`-badgea:

```tsx
          <View style={styles.badges}>
            {isHidden && <Text style={styles.hiddenBadge}>Piilotettu</Text>}
            {regOpen && <Text style={styles.regOpenBadge}>Ilmo auki</Text>}
            {!isHidden && fit === 'free' && <Text style={styles.fitFree}>Sopii</Text>}
            {!isHidden && fit === 'conflict' && <Text style={styles.fitConflict}>Päällekkäin</Text>}
            {past && <Text style={styles.pastBadge}>Mennyt</Text>}
          </View>
```

- [ ] **Step 3: Lisää tyylit**

`StyleSheet.create`-lohkoon lisää:

```typescript
  entryOpen: { color: '#15803d', fontWeight: '700' },
  regOpenBadge: {
    fontSize: 11, color: '#15803d', backgroundColor: '#dcf0e2',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: ei virheitä.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/EventCard.tsx
git commit -m "feat(mobile): highlight open registration on event card"
```

---

### Task 6: Mobiili — suosikit: menneet-kytkin + jako

Suosikkinäytön listaan "Näytä menneet" -kytkin (oletus pois) ja "⤴ Jaa lista" -nappi. Jako = ruudulla näkyvät kokeet (`items`) sellaisenaan.

**Files:**
- Create: `mobile/src/lib/share-favorites.ts`
- Modify: `mobile/src/screens/FavoritesScreen.tsx`

**Interfaces:**
- Consumes: `buildFavoritesShareText(events)` (Task 2), `isPast(event)` (Task 1), `Share.open` (react-native-share).
- Produces: `shareFavoritesList(events: Event[]): Promise<void>`.

- [ ] **Step 1: Luo jako-apuri**

Luo `mobile/src/lib/share-favorites.ts` (peilaa `ics-export.ts`:n cancel-käsittelyä):

```typescript
import Share from 'react-native-share';
import { Alert } from 'react-native';
import { buildFavoritesShareText, type Event } from '@koetutka/shared';

/** Avaa järjestelmän jakovalikon suosikkilistan tiivistelmällä. */
export async function shareFavoritesList(events: Event[]): Promise<void> {
  if (events.length === 0) return;
  try {
    await Share.open({
      title: 'Suosikkikokeet',
      message: buildFavoritesShareText(events),
      failOnCancel: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (!message.toLowerCase().includes('cancel') && !message.includes('User did not share')) {
      Alert.alert('Virhe', 'Jakaminen epäonnistui.');
    }
  }
}
```

- [ ] **Step 2: Menneet-kytkin ja suodatus suosikkinäyttöön**

`mobile/src/screens/FavoritesScreen.tsx`:

Lisää importit:

```typescript
import { addDistances, sortEvents, isPast } from '@koetutka/shared';
import { shareFavoritesList } from '@/lib/share-favorites';
```

Lisää `view`-staten viereen:

```typescript
  const [showPast, setShowPast] = useState(false);
```

Muuta `items`-memo suodattamaan menneet pois kun `showPast` on false:

```typescript
  const items = useMemo(() => {
    let list = events.filter((e) => favorites.has(e.id));
    if (!showPast) list = list.filter((e) => !isPast(e));
    const withDistance = userLocation ? addDistances(list, userLocation) : list;
    const effectiveSort = sortBy === 'distance' && !userLocation ? 'date' : sortBy;
    return sortEvents(withDistance, effectiveSort);
  }, [events, favorites, userLocation, sortBy, showPast]);
```

- [ ] **Step 3: Kontrollirivi (count · Näytä menneet · Jaa lista)**

Korvaa listanäkymän `ListHeaderComponent={<Text style={styles.count}>…</Text>}` kontrollirivillä. Muuta `Animated.FlatList`:n `ListHeaderComponent`:

```tsx
            ListHeaderComponent={
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
            }
```

Lisää `Pressable` on jo importattu (`react-native`). Varmista että `View`, `Text`, `Pressable` ovat importissa (ovat jo).

- [ ] **Step 4: Lisää tyylit**

`StyleSheet.create`-lohkoon lisää (ja jätä olemassa oleva `count` ennalleen, mutta poista siitä `textAlign: 'center'` jos halutaan vasemmalle — jätä toistaiseksi, rivi keskittää flexillä):

```typescript
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
```

Muuta olemassa oleva `count`-tyyli poistamalla keskitys jotta se istuu riviin vasemmalle:

```typescript
  count: { fontSize: 12, color: '#888' },
```

- [ ] **Step 5: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: ei virheitä.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/share-favorites.ts mobile/src/screens/FavoritesScreen.tsx
git commit -m "feat(mobile): favorites past toggle and share list"
```

---

### Task 7: Versiointi + whatsnew

**Files:**
- Modify: `index.html` (footer-versio), `README.md` (Version History)
- Modify: `mobile/package.json`, `mobile/ios/Koetutka.xcodeproj/project.pbxproj`, `mobile/android/app/build.gradle`
- Modify: `whatsnew.json`

- [ ] **Step 1: Web-versio**

`index.html:170`: `<span id="version">v1.10.0</span>` → `<span id="version">v1.11.0</span>`.

`README.md`: lisää Version History -osioon uusin ylimmäksi, esim.:

```markdown
- **v1.11.0** - Ilmoittautuminen auki -korostus (vihreä + "Ilmo auki" -merkki) listassa ja korteissa.
```

- [ ] **Step 2: Mobiiliversiot**

`mobile/package.json`: `"version": "1.4.0"` → `"1.5.0"`.

`mobile/ios/Koetutka.xcodeproj/project.pbxproj`: molemmat `MARKETING_VERSION = 1.4.0;` → `1.5.0;` ja molemmat `CURRENT_PROJECT_VERSION = 5;` → `6;`.

`mobile/android/app/build.gradle`: `versionCode 6` → `7`, `versionName "1.4.0"` → `"1.5.0"`.

- [ ] **Step 3: whatsnew.json**

Lisää `releases`-listan **alkuun** (uusin ensin) merkintä. Katso olemassa olevan merkinnän muoto ensin (`whatsnew.json`) ja noudata samaa skeemaa. Sisältö:

- version: `1.5.0`
- otsikko/kohdat suomeksi, esim:
  - "Ilmoittautuminen auki näkyy nyt korostettuna (vihreä ✅ Ilmo auki)."
  - "Suosikkilistan voi jakaa tiiviisti (päivä, koetyyppi, luokka, paikkakunta)."
  - "Suosikeissa uusi 'Näytä menneet' -kytkin."

- [ ] **Step 4: Verify**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck && node -e "JSON.parse(require('fs').readFileSync('../whatsnew.json','utf8')); console.log('whatsnew OK')"`
Expected: typecheck ok, `whatsnew OK` (validi JSON).

- [ ] **Step 5: Commit**

```bash
git add index.html README.md mobile/package.json mobile/ios/Koetutka.xcodeproj/project.pbxproj mobile/android/app/build.gradle whatsnew.json
git commit -m "chore: bump versions to web v1.11.0 / mobile 1.5.0 + whatsnew"
```

---

### Task 8: Kokonaistarkistus

- [ ] **Step 1: Aja kaikki jaetut testit ja mobiilin testit + typecheck**

Run:
```bash
cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared test && pnpm --filter @koetutka/shared build
cd /Users/teroronkko/code/koetutka/mobile && npm test && npm run typecheck
```
Expected: kaikki vihreä; shared/dist rakennettu.

- [ ] **Step 2: Web-savutesti**

`python3 -m http.server 8080`, tarkista ettei konsolissa virheitä ja korostus näkyy (ks. Task 4 Step 4).

---

## Self-Review (kirjoittajan tarkistus)

**Spec-kattavuus:**
- Osa 1a (`isRegistrationOpen` jaettuna + web käyttöön) → Task 3 (funktio oli jo `shared/src/filters.ts`:ssä; vain johdotus + duplikaatin poisto).
- Osa 1b (`isPast`) → Task 1.
- Osa 1c (`buildFavoritesShareText`) → Task 2.
- Osa 2 (korostus web) → Task 4; (korostus mobiili) → Task 5.
- Osa 3a (menneet-kytkin) → Task 6 Step 2-4.
- Osa 3b (jako-nappi) → Task 6 Step 1,3.
- Osa 4 (versiot + whatsnew) → Task 7.

**Placeholder-skannaus:** ei TBD/TODO; kaikki koodilohkot täydellisiä. whatsnew-merkinnän tarkka skeema todennetaan tiedostosta Task 7 Step 3:ssa (olemassa oleva muoto), koska skeemaa ei ole kopioitu tähän — muu sisältö on annettu.

**Tyyppien/nimien johdonmukaisuus:** `isPast`, `isRegistrationOpen`, `buildFavoritesShareText`, `shareFavoritesList` käytetään samoilla nimillä ja allekirjoituksilla kaikissa tehtävissä. Vihreät sävyt `#15803d`/`#dcf0e2` yhtenäiset web + mobiili.
