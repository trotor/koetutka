# Suosikkivärit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suosikille voi antaa värin kiinteästä paletista, nimetä värin omalla merkityksellä (esim. "Ilmoittauduttu"), ja suodattaa/ryhmitellä Suosikit-listan värin mukaan.

**Architecture:** Väri on ohut lisäkerros nykyisen `favorites: Set<string>` -jäsenyyden **päällä** — `favorites` ei muutu, joten kaikki nykyiset `favorites.has(id)` -kutsut toimivat koskematta. Kaikki värilogiikka eristetään puhtaaseen moduuliin `mobile/src/lib/favorite-colors.ts` (testattavissa node-ympäristössä), jota store, persistointi ja UI käyttävät. Storeen tulee kaksi uutta kenttää: `favoriteColors: Map<string, ColorKey>` ja `colorLabels: Record<string, string>`.

**Tech Stack:** React Native 0.77, TypeScript, zustand 4, AsyncStorage, vitest 2.

## Global Constraints

- **Vain `mobile/`.** Web-appissa (`app.js`, `index.html`) ei ole suosikkeja lainkaan — älä koske siihen. `shared/`-pakettiin **ei** tehdä muutoksia.
- **Ei komponenttitestejä.** `mobile/vitest.config.ts`: `include: ['src/lib/tests/**/*.test.ts']`, `environment: 'node'`; ei testing-libraryä eikä jsdomia. Kaikki testattava logiikka menee `mobile/src/lib/`-moduuleihin ja testit `mobile/src/lib/tests/`-hakemistoon. Storea **voi** testata nodessa mockaamalla `../notifications` ja `../preferences` (ks. Task 3). Komponentit (Taskit 4–6) varmistetaan `typecheck`illä, `lint`illä ja manuaalisella ajolla.
- **Ei `Alert.prompt`** — se on iOS-only, appi on myös Androidilla. Tekstisyöte aina `TextInput`illa modaalissa.
- **Persistointiavain `koetutka:prefs:v1` ei muutu.** Vanhat tallennetut prefsit on latauduttava ilman virhettä (uudet kentät → tyhjät defaultit).
- **Oletusväri on nykyinen `#d97706`.** Käyttäjälle joka ei värejä käytä ulkoasu ei saa muuttua.
- **UI-tekstit suomeksi.**
- Komennot ajetaan `mobile/`-hakemistossa: `npm test`, `npm run typecheck`.

---

### Task 1: Väripaletti ja puhtaat helperit

**Files:**
- Create: `mobile/src/lib/favorite-colors.ts`
- Test: `mobile/src/lib/tests/favorite-colors.test.ts`

**Interfaces:**
- Consumes: ei mitään (moduuli on riippumaton — se tarvitsee kokeesta vain `id`:n,
  joten se tyypitetään rakenteellisesti `{ id: string }`, ei `Event`iin sidottuna).
- Produces:
  - `type ColorKey = 'default' | 'red' | 'blue' | 'green' | 'purple'`
  - `type FavoriteColors = ReadonlyMap<string, ColorKey>`
  - `type ColorLabels = Readonly<Record<string, string>>`
  - `FAVORITE_COLORS: readonly { key: ColorKey; color: string; name: string }[]`
  - `DEFAULT_COLOR_KEY: ColorKey`
  - `isColorKey(value: unknown): value is ColorKey`
  - `resolveColor(key: string | undefined): string`
  - `colorKeyFor(colors: FavoriteColors, id: string): ColorKey`
  - `setColorFor(colors: FavoriteColors, id: string, key: ColorKey): Map<string, ColorKey>`
  - `removeColorFor(colors: FavoriteColors, id: string): Map<string, ColorKey>`
  - `setLabelFor(labels: ColorLabels, key: ColorKey, label: string): Record<string, string>`
  - `labelFor(labels: ColorLabels, key: ColorKey): string` — käyttäjän nimi tai `''`
  - `colorName(key: ColorKey): string` — paletin oletusnimi (a11y + placeholder)
  - `countByColor(events: readonly { id: string }[], colors: FavoriteColors): Map<ColorKey, number>`
  - `groupByColor<T extends { id: string }>(events: readonly T[], colors: FavoriteColors): { key: ColorKey; data: T[] }[]` — geneerinen, joten `Event[]`-syöte palauttaa `Event[]`-ryhmät

- [ ] **Step 1: Write the failing test**

Create `mobile/src/lib/tests/favorite-colors.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import {
  FAVORITE_COLORS,
  DEFAULT_COLOR_KEY,
  isColorKey,
  resolveColor,
  colorKeyFor,
  setColorFor,
  removeColorFor,
  setLabelFor,
  labelFor,
  colorName,
  countByColor,
  groupByColor,
  type ColorKey,
} from '../favorite-colors';

// Moduuli tarvitsee kokeesta vain id:n → ei tarvetta rakentaa koko Event-oliota.
function evt(id: string) {
  return { id };
}

describe('paletti', () => {
  test('oletusväri on nykyinen keltainen eikä ulkoasu muutu', () => {
    expect(resolveColor(DEFAULT_COLOR_KEY)).toBe('#d97706');
  });

  test('paletissa on 5 uniikkia avainta ja uniikit värit', () => {
    const keys = FAVORITE_COLORS.map((c) => c.key);
    const colors = FAVORITE_COLORS.map((c) => c.color);
    expect(keys).toEqual(['default', 'red', 'blue', 'green', 'purple']);
    expect(new Set(colors).size).toBe(5);
  });

  test('isColorKey tunnistaa paletin avaimet ja hylkää muut', () => {
    expect(isColorKey('red')).toBe(true);
    expect(isColorKey('magenta')).toBe(false);
    expect(isColorKey(undefined)).toBe(false);
    expect(isColorKey(7)).toBe(false);
  });

  test('resolveColor palauttaa oletusvärin tuntemattomalle ja puuttuvalle avaimelle', () => {
    expect(resolveColor('magenta')).toBe('#d97706');
    expect(resolveColor(undefined)).toBe('#d97706');
    expect(resolveColor('blue')).toBe('#2563eb');
  });

  test('colorName palauttaa paletin oletusnimen', () => {
    expect(colorName('red')).toBe('Punainen');
  });
});

describe('colorKeyFor', () => {
  test('puuttuva merkintä tarkoittaa oletusväriä', () => {
    expect(colorKeyFor(new Map(), 'e1')).toBe('default');
  });

  test('palauttaa asetetun värin', () => {
    expect(colorKeyFor(new Map<string, ColorKey>([['e1', 'blue']]), 'e1')).toBe('blue');
  });
});

describe('setColorFor / removeColorFor', () => {
  test('asettaa värin eikä mutatoi alkuperäistä', () => {
    const before = new Map<string, ColorKey>();
    const after = setColorFor(before, 'e1', 'red');
    expect(after.get('e1')).toBe('red');
    expect(before.size).toBe(0);
  });

  test('oletusväri poistaa merkinnän (oletus ei vie tilaa)', () => {
    const before = new Map<string, ColorKey>([['e1', 'red']]);
    const after = setColorFor(before, 'e1', 'default');
    expect(after.has('e1')).toBe(false);
  });

  test('removeColorFor poistaa merkinnän eikä mutatoi alkuperäistä', () => {
    const before = new Map<string, ColorKey>([['e1', 'red'], ['e2', 'blue']]);
    const after = removeColorFor(before, 'e1');
    expect(after.has('e1')).toBe(false);
    expect(after.get('e2')).toBe('blue');
    expect(before.has('e1')).toBe(true);
  });
});

describe('setLabelFor / labelFor', () => {
  test('asettaa trimmatun nimen eikä mutatoi alkuperäistä', () => {
    const before = {};
    const after = setLabelFor(before, 'red', '  Ilmoittauduttu  ');
    expect(after.red).toBe('Ilmoittauduttu');
    expect(before).toEqual({});
  });

  test('tyhjä tai pelkkiä välilyöntejä poistaa nimen', () => {
    const after = setLabelFor({ red: 'Ilmoittauduttu' }, 'red', '   ');
    expect(after.red).toBeUndefined();
  });

  test('labelFor palauttaa tyhjän merkkijonon kun nimeä ei ole', () => {
    expect(labelFor({}, 'red')).toBe('');
    expect(labelFor({ red: 'Menossa' }, 'red')).toBe('Menossa');
  });
});

describe('countByColor', () => {
  test('laskee värittömät oletusväriin', () => {
    const colors = new Map<string, ColorKey>([['e2', 'red']]);
    const counts = countByColor([evt('e1'), evt('e2'), evt('e3')], colors);
    expect(counts.get('default')).toBe(2);
    expect(counts.get('red')).toBe(1);
    expect(counts.get('blue')).toBeUndefined();
  });
});

describe('groupByColor', () => {
  test('ryhmittelee paletin järjestyksessä ja jättää tyhjät ryhmät pois', () => {
    const colors = new Map<string, ColorKey>([['e2', 'purple'], ['e3', 'red']]);
    const groups = groupByColor([evt('e1'), evt('e2'), evt('e3')], colors);
    expect(groups.map((g) => g.key)).toEqual(['default', 'red', 'purple']);
    expect(groups[0].data.map((e) => e.id)).toEqual(['e1']);
    expect(groups[2].data.map((e) => e.id)).toEqual(['e2']);
  });

  test('säilyttää annetun järjestyksen ryhmän sisällä', () => {
    const colors = new Map<string, ColorKey>([['b', 'red'], ['a', 'red']]);
    const groups = groupByColor([evt('b'), evt('a')], colors);
    expect(groups[0].data.map((e) => e.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx vitest run src/lib/tests/favorite-colors.test.ts`
Expected: FAIL — `Failed to resolve import "../favorite-colors"` (moduulia ei ole vielä).

- [ ] **Step 3: Write minimal implementation**

Create `mobile/src/lib/favorite-colors.ts`:

```ts
export type ColorKey = 'default' | 'red' | 'blue' | 'green' | 'purple';

export interface FavoriteColor {
  key: ColorKey;
  color: string;
  /** Paletin oletusnimi. Käytetään a11y-labeleissa ja placeholderina — ei näytetä
   *  selitteessä, jossa näkyy vain käyttäjän itse antama nimi. */
  name: string;
}

export const FAVORITE_COLORS: readonly FavoriteColor[] = [
  { key: 'default', color: '#d97706', name: 'Keltainen' },
  { key: 'red', color: '#dc2626', name: 'Punainen' },
  { key: 'blue', color: '#2563eb', name: 'Sininen' },
  { key: 'green', color: '#15803d', name: 'Vihreä' },
  { key: 'purple', color: '#7c3aed', name: 'Violetti' },
];

export const DEFAULT_COLOR_KEY: ColorKey = 'default';

export type FavoriteColors = ReadonlyMap<string, ColorKey>;
export type ColorLabels = Readonly<Record<string, string>>;

const BY_KEY = new Map<ColorKey, FavoriteColor>(FAVORITE_COLORS.map((c) => [c.key, c]));
const DEFAULT_ENTRY = BY_KEY.get(DEFAULT_COLOR_KEY) as FavoriteColor;

export function isColorKey(value: unknown): value is ColorKey {
  return typeof value === 'string' && BY_KEY.has(value as ColorKey);
}

/** Tuntematon tai puuttuva avain → oletusväri (suojaa vanhalta/tulevalta datalta). */
export function resolveColor(key: string | undefined): string {
  return (isColorKey(key) ? (BY_KEY.get(key) as FavoriteColor) : DEFAULT_ENTRY).color;
}

export function colorName(key: ColorKey): string {
  return (isColorKey(key) ? (BY_KEY.get(key) as FavoriteColor) : DEFAULT_ENTRY).name;
}

/** Puuttuva merkintä = oletusväri. */
export function colorKeyFor(colors: FavoriteColors, id: string): ColorKey {
  const key = colors.get(id);
  return isColorKey(key) ? key : DEFAULT_COLOR_KEY;
}

export function removeColorFor(colors: FavoriteColors, id: string): Map<string, ColorKey> {
  const next = new Map(colors);
  next.delete(id);
  return next;
}

/** Oletusväriä ei talleteta — se on puuttuvan merkinnän merkitys. */
export function setColorFor(colors: FavoriteColors, id: string, key: ColorKey): Map<string, ColorKey> {
  if (key === DEFAULT_COLOR_KEY) return removeColorFor(colors, id);
  const next = new Map(colors);
  next.set(id, key);
  return next;
}

export function setLabelFor(labels: ColorLabels, key: ColorKey, label: string): Record<string, string> {
  const next = { ...labels };
  const trimmed = label.trim();
  if (trimmed) next[key] = trimmed;
  else delete next[key];
  return next;
}

/** Käyttäjän antama nimi, tai '' jos nimeä ei ole. */
export function labelFor(labels: ColorLabels, key: ColorKey): string {
  return labels[key]?.trim() ?? '';
}

export function countByColor(
  events: readonly { id: string }[],
  colors: FavoriteColors,
): Map<ColorKey, number> {
  const counts = new Map<ColorKey, number>();
  for (const e of events) {
    const key = colorKeyFor(colors, e.id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Paletin järjestyksessä, tyhjät ryhmät pois. Järjestys ryhmän sisällä säilyy. */
export function groupByColor<T extends { id: string }>(
  events: readonly T[],
  colors: FavoriteColors,
): { key: ColorKey; data: T[] }[] {
  return FAVORITE_COLORS.map((c) => ({
    key: c.key,
    data: events.filter((e) => colorKeyFor(colors, e.id) === c.key),
  })).filter((g) => g.data.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx vitest run src/lib/tests/favorite-colors.test.ts`
Expected: PASS — kaikki testit vihreinä.

- [ ] **Step 5: Typecheck**

Run: `cd mobile && npm run typecheck`
Expected: ei virheitä.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/favorite-colors.ts mobile/src/lib/tests/favorite-colors.test.ts
git commit -m "feat(mobile): suosikkivärien paletti ja puhtaat helperit"
```

---

### Task 2: Persistointi

**Files:**
- Modify: `mobile/src/lib/preferences.ts`
- Test: `mobile/src/lib/tests/preferences.test.ts` (laajennus)

**Interfaces:**
- Consumes: `isColorKey`, `type ColorKey` (Task 1).
- Produces: `StoredPrefs` saa kaksi uutta **pakollista** kenttää:
  - `favoriteColors: Map<string, ColorKey>`
  - `colorLabels: Record<string, string>`

  Huom: kentät ovat pakollisia `StoredPrefs`issä → jokainen olemassa oleva
  `StoredPrefs`-literaali `preferences.test.ts`:ssä on täydennettävä, muuten
  `npm run typecheck` hajoaa.

- [ ] **Step 1: Write the failing test**

Lisää ensin `ColorKey`-tyyppi-importti `mobile/src/lib/tests/preferences.test.ts`:n
alkuun (rivin 3 jälkeen):

```ts
import type { ColorKey } from '../favorite-colors';
```

Lisää sitten testit `describe`-lohkon **sisään** (ennen viimeistä `});`).
Huom: `new Map<string, ColorKey>(...)` on kirjoitettava eksplisiittisellä
tyyppiargumentilla — ilman sitä TS päättelee `Map<string, string>`, joka ei ole
sijoituskelpoinen `Map<string, ColorKey>`iin.

```ts
  test('round-trippaa favoriteColors ja colorLabels', () => {
    const base = deserializePrefs(''); // DEFAULTS
    const prefs: StoredPrefs = {
      ...base,
      favorites: new Set(['e1', 'e2']),
      favoriteColors: new Map<string, ColorKey>([['e1', 'red'], ['e2', 'purple']]),
      colorLabels: { red: 'Ilmoittauduttu' },
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.favoriteColors.get('e1')).toBe('red');
    expect(back.favoriteColors.get('e2')).toBe('purple');
    expect(back.colorLabels).toEqual({ red: 'Ilmoittauduttu' });
  });

  test('vanha JSON ilman värikenttiä → tyhjät defaultit (migraatio)', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: ['e1'],
    });
    const back = deserializePrefs(oldJson);
    expect(back.favorites).toEqual(new Set(['e1']));
    expect(back.favoriteColors).toEqual(new Map());
    expect(back.colorLabels).toEqual({});
  });

  test('tuntematon väriavain pudotetaan latauksessa', () => {
    const json = JSON.stringify({
      userLocation: null,
      filters: {},
      favorites: ['e1', 'e2'],
      favoriteColors: { e1: 'magenta', e2: 'blue' },
      colorLabels: { magenta: 'Roska', blue: 'Menossa' },
    });
    const back = deserializePrefs(json);
    expect(back.favoriteColors.has('e1')).toBe(false);
    expect(back.favoriteColors.get('e2')).toBe('blue');
    expect(back.colorLabels).toEqual({ blue: 'Menossa' });
  });

  test('tyhjä nimi ei päädy talteen', () => {
    const json = JSON.stringify({
      userLocation: null,
      filters: {},
      favorites: [],
      colorLabels: { red: '   ' },
    });
    expect(deserializePrefs(json).colorLabels).toEqual({});
  });

  test('viallinen JSON → tyhjät värikentät', () => {
    const back = deserializePrefs('{not json');
    expect(back.favoriteColors).toEqual(new Map());
    expect(back.colorLabels).toEqual({});
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx vitest run src/lib/tests/preferences.test.ts`
Expected: FAIL — `back.favoriteColors` on `undefined` (`TypeError: Cannot read properties of undefined (reading 'get')`).

- [ ] **Step 3: Write minimal implementation**

`mobile/src/lib/preferences.ts` — lisää import tiedoston alkuun (muiden importtien perään):

```ts
import { isColorKey, type ColorKey } from './favorite-colors';
```

Lisää `StoredPrefs`-interfaceen (`whatsNewLastSeenVersion`-rivin jälkeen):

```ts
  favoriteColors: Map<string, ColorKey>;
  colorLabels: Record<string, string>;
```

Lisää `DEFAULTS`-objektiin (`whatsNewLastSeenVersion: null,` -rivin jälkeen):

```ts
  favoriteColors: new Map(),
  colorLabels: {},
```

Lisää `JsonShape`-interfaceen (`whatsNewLastSeenVersion?: string | null;` -rivin jälkeen):

```ts
  favoriteColors?: Record<string, string>;
  colorLabels?: Record<string, string>;
```

Lisää `serializePrefs`in `json`-objektiin (`whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,` -rivin jälkeen):

```ts
    favoriteColors: Object.fromEntries(prefs.favoriteColors ?? new Map()),
    colorLabels: prefs.colorLabels ?? {},
```

Lisää `deserializePrefs`in palautusobjektiin (`whatsNewLastSeenVersion: parsed.whatsNewLastSeenVersion ?? null,` -rivin jälkeen):

```ts
      favoriteColors: parseFavoriteColors(parsed.favoriteColors),
      colorLabels: parseColorLabels(parsed.colorLabels),
```

Lisää `deserializePrefs`-funktion **jälkeen** tiedoston loppuun:

```ts
/** Pudottaa merkinnät joiden väriavain ei ole paletissa. */
function parseFavoriteColors(raw: Record<string, string> | undefined): Map<string, ColorKey> {
  const map = new Map<string, ColorKey>();
  for (const [id, key] of Object.entries(raw ?? {})) {
    if (isColorKey(key)) map.set(id, key);
  }
  return map;
}

/** Pudottaa tuntemattomat avaimet ja tyhjät nimet. */
function parseColorLabels(raw: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, label] of Object.entries(raw ?? {})) {
    if (isColorKey(key) && typeof label === 'string' && label.trim()) out[key] = label.trim();
  }
  return out;
}
```

- [ ] **Step 4: Korjaa olemassa olevat StoredPrefs-literaalit testeissä**

`favoriteColors` ja `colorLabels` ovat pakollisia → `preferences.test.ts`:n vanhat
`const prefs: StoredPrefs = { ... }` -literaalit eivät enää typecheckaa.
Lisää **jokaiseen** niistä (rivit joilla on `whatsNewLastSeenVersion:`) kentät:

```ts
      favoriteColors: new Map(),
      colorLabels: {},
```

Koskee testejä: `round-trippaa userLocation, filtterit ja suosikit`, `round-trippaa sortBy`,
`round-trippaa whatsNewLastSeenVersion`, `round-trippaa hidden ja showHidden`.

- [ ] **Step 5: Run tests and typecheck to verify they pass**

Run: `cd mobile && npx vitest run src/lib/tests/preferences.test.ts && npm run typecheck`
Expected: PASS, ei tyyppivirheitä.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/lib/preferences.ts mobile/src/lib/tests/preferences.test.ts
git commit -m "feat(mobile): persistoi suosikkivärit ja värien nimet"
```

---

### Task 3: Store — tila ja actionit

**Files:**
- Modify: `mobile/src/lib/store.ts`
- Test: `mobile/src/lib/tests/store.test.ts` (uusi)

**Interfaces:**
- Consumes: `setColorFor`, `removeColorFor`, `setLabelFor`, `type ColorKey` (Task 1); `StoredPrefs`-kentät `favoriteColors`, `colorLabels` (Task 2).
- Produces: store-kentät `favoriteColors: Map<string, ColorKey>`, `colorLabels: Record<string, string>` ja actionit `setFavoriteColor(id: string, key: ColorKey): void`, `setColorLabel(key: ColorKey, label: string): void`.

Tämä on repon **ensimmäinen store-testi**. Store on testattavissa node-ympäristössä
kahdella mockilla: `../notifications` (importoi notifeen → natiivimoduuli) ja
`../preferences` (välttää oikeat AsyncStorage-kirjoitukset). Muut storen importit
(`../data`, `../whatsnew`, `../calendar-added`) latautuvat nodessa sellaisenaan.
`vi.mock` hoistataan importtien yläpuolelle, joten staattinen `import { useStore }`
toimii. **Tämä on varmistettu kokeellisesti** ennen suunnitelman kirjoittamista.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/lib/tests/store.test.ts`:

```ts
import { describe, test, expect, beforeEach, vi } from 'vitest';

// notifications importoi notifeen (natiivimoduuli) → pakko mockata.
vi.mock('../notifications', () => ({
  DEFAULT_NOTIFICATION_SETTINGS: { enabled: false, daysBefore: 7, hourOfDay: 9 },
  rescheduleAll: vi.fn(),
  requestPermission: vi.fn(),
  cancelAll: vi.fn(),
}));
// Estetään oikeat AsyncStorage-kirjoitukset persist():stä.
vi.mock('../preferences', () => ({
  loadPrefs: vi.fn(),
  savePrefs: vi.fn(),
}));

import { useStore } from '../store';

beforeEach(() => {
  useStore.setState({ favorites: new Set(), favoriteColors: new Map(), colorLabels: {} });
});

describe('setFavoriteColor', () => {
  test('värin valinta ei-suosikille lisää sen suosikkeihin', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.get('e1')).toBe('red');
  });

  test('värin vaihto säilyttää suosikkiuden', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    useStore.getState().setFavoriteColor('e1', 'blue');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.get('e1')).toBe('blue');
  });

  test('oletusväri poistaa merkinnän mutta säilyttää suosikin', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    useStore.getState().setFavoriteColor('e1', 'default');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });
});

describe('toggleFavorite siivoaa värin', () => {
  test('suosikin poisto poistaa myös värin', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().toggleFavorite('e1'); // poistaa suosikeista
    expect(useStore.getState().favorites.has('e1')).toBe(false);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });

  test('uudelleen lisätty suosikki saa oletusvärin', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().toggleFavorite('e1');
    useStore.getState().toggleFavorite('e1');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });

  test('ei kosketa muiden kokeiden värejä', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().setFavoriteColor('e2', 'red');
    useStore.getState().toggleFavorite('e1');
    expect(useStore.getState().favoriteColors.get('e2')).toBe('red');
  });
});

describe('setColorLabel', () => {
  test('trimmaa nimen', () => {
    useStore.getState().setColorLabel('red', '  Ilmoittauduttu  ');
    expect(useStore.getState().colorLabels.red).toBe('Ilmoittauduttu');
  });

  test('tyhjä nimi poistaa merkinnän', () => {
    useStore.getState().setColorLabel('red', 'Menossa');
    useStore.getState().setColorLabel('red', '   ');
    expect(useStore.getState().colorLabels.red).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx vitest run src/lib/tests/store.test.ts`
Expected: FAIL — `useStore.getState().setFavoriteColor is not a function` (actionia ei ole vielä).

> **HUOM — osa tästä taskista on jo tehty.** Task 2:n toteutus lisäsi `store.ts`:ään
> jo **tila-osuuden** typecheckin vuoksi (pakolliset `StoredPrefs`-kentät): State-kentät
> `favoriteColors`/`colorLabels`, alkutila, `persist()`-johdotus, `initFromStorage`-johdotus,
> sekä type-only importin `import type { ColorKey } from './favorite-colors';`.
> **Älä lisää näitä uudelleen** — Steps 3–5 ovat siksi enimmäkseen varmistuksia. Jäljellä
> oleva varsinainen työ on: laajenna importti (Step 3), lisää **Actions**-tyypit (Step 4),
> `toggleFavorite`-siivous (Step 6) ja uudet actionit (Step 7) + testi (Step 1).

- [ ] **Step 3: Laajenna olemassa oleva import**

`mobile/src/lib/store.ts`:ssä on jo Task 2:n lisäämä type-only importti:

```ts
import type { ColorKey } from './favorite-colors';
```

**Korvaa se** value+type-importilla (lisää kolme helperiä, jotka actionit tarvitsevat):

```ts
import {
  setColorFor,
  removeColorFor,
  setLabelFor,
  type ColorKey,
} from './favorite-colors';
```

- [ ] **Step 4: Lisää Actions-tyypit (State-kentät ovat jo olemassa)**

State-kentät `favoriteColors`/`colorLabels` ovat **jo `interface State`ssa** (Task 2) — älä
lisää niitä uudelleen. Lisää vain `interface Actions`iin, `toggleFavorite: (id: string) => void;`
-rivin jälkeen:

```ts
  setFavoriteColor: (id: string, key: ColorKey) => void;
  setColorLabel: (key: ColorKey, label: string) => void;
```

- [ ] **Step 5: Varmista tilajohdotus (jo tehty Task 2:ssa)**

Tarkista silmämääräisesti — **älä lisää uudelleen** — että nämä ovat jo `store.ts`:ssä:
alkutila `favoriteColors: new Map(), colorLabels: {}`; `persist()` välittää `state.favoriteColors`
ja `state.colorLabels`; `initFromStorage` asettaa `prefs.favoriteColors` ja `prefs.colorLabels`.
Jos jokin puuttuu, lisää se — muuten siirry Step 6:een.

- [ ] **Step 6: Siivoa väri kun suosikki poistetaan**

Korvaa koko `toggleFavorite`-action:

```ts
  toggleFavorite: (id: string) => {
    const favorites = new Set(get().favorites);
    let favoriteColors = get().favoriteColors;
    if (favorites.has(id)) {
      favorites.delete(id);
      favoriteColors = removeColorFor(favoriteColors, id); // ei orpoja värejä
    } else {
      favorites.add(id);
    }
    set({ favorites, favoriteColors });
    persist(get());
    void get().syncNotifications();
  },
```

- [ ] **Step 7: Lisää uudet actionit**

Lisää `toggleFavorite`-actionin **jälkeen**:

```ts
  setFavoriteColor: (id: string, key: ColorKey) => {
    const favorites = new Set(get().favorites);
    const wasFavorite = favorites.has(id);
    if (!wasFavorite) favorites.add(id); // värin valinta implikoi suosikoinnin
    set({ favorites, favoriteColors: setColorFor(get().favoriteColors, id, key) });
    persist(get());
    if (!wasFavorite) void get().syncNotifications();
  },

  setColorLabel: (key: ColorKey, label: string) => {
    set({ colorLabels: setLabelFor(get().colorLabels, key, label) });
    persist(get());
  },
```

- [ ] **Step 8: Run tests and typecheck to verify they pass**

Run: `cd mobile && npx vitest run src/lib/tests/store.test.ts && npm run typecheck && npm test`
Expected: store-testit PASS, ei tyyppivirheitä, kaikki testit vihreinä.

- [ ] **Step 9: Commit**

```bash
git add mobile/src/lib/store.ts mobile/src/lib/tests/store.test.ts
git commit -m "feat(mobile): store-tuki suosikkiväreille ja värien nimille"
```

---

### Task 4: Värivalitsin- ja nimeämismodaalit

**Files:**
- Create: `mobile/src/components/FavoriteColorPicker.tsx`
- Create: `mobile/src/components/FavoriteColorLabelsModal.tsx`

**Interfaces:**
- Consumes: `FAVORITE_COLORS`, `colorKeyFor`, `labelFor`, `colorName`, `type ColorKey` (Task 1); store-actionit `setFavoriteColor`, `setColorLabel` (Task 3).
- Produces:
  - `FavoriteColorPicker({ eventId: string; visible: boolean; onClose: () => void; onRequestLabels: () => void })`
  - `FavoriteColorLabelsModal({ visible: boolean; onClose: () => void })`

Ei komponenttitestejä (ks. Global Constraints). Varmistus: `npm run typecheck`.

- [ ] **Step 1: Luo värivalitsin**

Create `mobile/src/components/FavoriteColorPicker.tsx`:

```tsx
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import {
  FAVORITE_COLORS,
  colorKeyFor,
  labelFor,
  colorName,
  type ColorKey,
} from '@/lib/favorite-colors';

export function FavoriteColorPicker({
  eventId,
  visible,
  onClose,
  onRequestLabels,
}: {
  eventId: string;
  visible: boolean;
  onClose: () => void;
  onRequestLabels: () => void;
}) {
  const current = useStore((s) => colorKeyFor(s.favoriteColors, eventId));
  const colorLabels = useStore((s) => s.colorLabels);
  const setFavoriteColor = useStore((s) => s.setFavoriteColor);

  const pick = (key: ColorKey) => {
    setFavoriteColor(eventId, key);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Taustan painallus sulkee; sisemmän Pressablen tyhjä onPress nielee kosketuksen. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Suosikin väri</Text>
          <View style={styles.row}>
            {FAVORITE_COLORS.map((c) => {
              const label = labelFor(colorLabels, c.key);
              const selected = current === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => pick(c.key)}
                  style={styles.swatch}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={label || colorName(c.key)}
                >
                  <View
                    style={[styles.dot, { backgroundColor: c.color }, selected && styles.dotSelected]}
                  />
                  {!!label && (
                    <Text style={styles.swatchLabel} numberOfLines={1}>
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onRequestLabels} accessibilityRole="button" style={styles.linkBtn}>
            <Text style={styles.link}>Nimeä värit</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  swatch: { alignItems: 'center', flex: 1, gap: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  dotSelected: { borderColor: '#1a472a' },
  swatchLabel: { fontSize: 10, color: '#555', textAlign: 'center' },
  linkBtn: { marginTop: 16, alignSelf: 'flex-start' },
  link: { fontSize: 13, color: '#1565c0', fontWeight: '600' },
});
```

- [ ] **Step 2: Luo nimeämismodaali**

Create `mobile/src/components/FavoriteColorLabelsModal.tsx`:

```tsx
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '@/lib/store';
import { FAVORITE_COLORS, labelFor, colorName } from '@/lib/favorite-colors';

export function FavoriteColorLabelsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colorLabels = useStore((s) => s.colorLabels);
  const setColorLabel = useStore((s) => s.setColorLabel);

  // Palautetaan null suljettuna, jotta kentät remounttaavat auetessa ja
  // defaultValue on aina tuore.
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Nimeä värit</Text>
          <Text style={styles.help}>
            Anna värille oma merkitys, esim. "Ilmoittauduttu". Nimi näkyy suosikkien
            selitteessä. Tyhjä kenttä poistaa nimen.
          </Text>
          {FAVORITE_COLORS.map((c) => (
            <View key={c.key} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <TextInput
                style={styles.input}
                defaultValue={labelFor(colorLabels, c.key)}
                placeholder={colorName(c.key)}
                placeholderTextColor="#aaa"
                maxLength={24}
                returnKeyType="done"
                accessibilityLabel={`Nimi värille ${colorName(c.key)}`}
                // Tallennus joka merkillä on tarkoituksellista: onEndEditing ei laukea
                // jos modaali suljetaan taustaa painamalla → syöte katoaisi. Prefs-JSON
                // on pieni ja savePrefs on fire-and-forget, joten kustannus on olematon.
                onChangeText={(text) => setColorLabel(c.key, text)}
              />
            </View>
          ))}
          <Pressable onPress={onClose} style={styles.doneBtn} accessibilityRole="button">
            <Text style={styles.doneText}>Valmis</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a472a', marginBottom: 6 },
  help: { fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 20, height: 20, borderRadius: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  doneBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#2d5a27',
  },
  doneText: { color: 'white', fontWeight: '700', fontSize: 13 },
});
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd mobile && npm run typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/FavoriteColorPicker.tsx mobile/src/components/FavoriteColorLabelsModal.tsx
git commit -m "feat(mobile): värivalitsin- ja värien nimeämismodaalit"
```

---

### Task 5: EventCard — värillinen tähti ja pitkä painallus

**Files:**
- Modify: `mobile/src/components/EventCard.tsx`

**Interfaces:**
- Consumes: `resolveColor`, `colorKeyFor` (Task 1); `FavoriteColorPicker`, `FavoriteColorLabelsModal` (Task 4).
- Produces: ei uutta julkista rajapintaa — `EventCard`in propsit eivät muutu.

Ei komponenttitestejä (ks. Global Constraints). Varmistus: `npm run typecheck` + manuaalinen ajo.

- [ ] **Step 1: Lisää importit ja tila**

`mobile/src/components/EventCard.tsx` — korvaa rivin 1 import:

```tsx
import { useRef, useState } from 'react';
```

Lisää `import type { RootStackParamList } from '../navigation';` -rivin jälkeen:

```tsx
import { FavoriteColorPicker } from '@/components/FavoriteColorPicker';
import { FavoriteColorLabelsModal } from '@/components/FavoriteColorLabelsModal';
import { resolveColor, colorKeyFor } from '@/lib/favorite-colors';
```

Lisää `const swipeRef = useRef<Swipeable>(null);` -rivin jälkeen:

```tsx
  const colorKey = useStore((s) => colorKeyFor(s.favoriteColors, event.id));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
```

- [ ] **Step 2: Värjää tähti ja lisää pitkä painallus**

Korvaa tähden `Pressable` (nykyiset rivit 133–141) kokonaan:

```tsx
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
```

Huom: `styles.starActive` jää käyttämättömäksi → **poista** se `StyleSheet.create`sta
(nykyinen rivi 181, `starActive: { color: '#d97706' }`). Oletusväri tulee nyt
`resolveColor('default')`ista, joka on sama `#d97706`.

- [ ] **Step 3: Renderöi modaalit**

Lisää tähden `Pressable`n jälkeen, **ennen** `</View>`-riviä joka sulkee `styles.card`-Viewin:

```tsx
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
```

- [ ] **Step 4: Verify typecheck, lint and tests pass**

Run: `cd mobile && npm run typecheck && npm run lint && npm test`
Expected: ei tyyppivirheitä, ei lint-virheitä, testit vihreinä.

Varmista lisäksi että `starActive` on poistettu sekä viittauksesta että tyyleistä:
Run: `grep -c starActive mobile/src/components/EventCard.tsx`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/EventCard.tsx
git commit -m "feat(mobile): värillinen suosikkitähti ja värivalitsin pitkällä painalluksella"
```

---

### Task 6: Suosikit-näyttö — selite, suodatus ja ryhmittely

**Files:**
- Create: `mobile/src/components/FavoriteColorLegend.tsx`
- Modify: `mobile/src/screens/FavoritesScreen.tsx`

**Interfaces:**
- Consumes: `FAVORITE_COLORS`, `countByColor`, `groupByColor`, `colorKeyFor`, `resolveColor`, `labelFor`, `colorName`, `type ColorKey` (Task 1); `FavoriteColorLabelsModal` (Task 4).
- Produces: `FavoriteColorLegend({ counts, selected, onSelect, grouped, onToggleGrouped, onOpenLabels })`.

Ei komponenttitestejä (ks. Global Constraints). Ryhmittelyn ja laskurien logiikka on
Task 1:n testatuissa funktioissa. Varmistus: `npm run typecheck` + manuaalinen ajo.

- [ ] **Step 1: Luo selite/suodatuspalkki**

Create `mobile/src/components/FavoriteColorLegend.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '@/lib/store';
import { FAVORITE_COLORS, labelFor, colorName, type ColorKey } from '@/lib/favorite-colors';

export function FavoriteColorLegend({
  counts,
  selected,
  onSelect,
  grouped,
  onToggleGrouped,
  onOpenLabels,
}: {
  counts: Map<ColorKey, number>;
  selected: ColorKey | null;
  onSelect: (key: ColorKey | null) => void;
  grouped: boolean;
  onToggleGrouped: () => void;
  onOpenLabels: () => void;
}) {
  const colorLabels = useStore((s) => s.colorLabels);
  const used = FAVORITE_COLORS.filter((c) => (counts.get(c.key) ?? 0) > 0);

  // Vain yksi väri käytössä → käyttäjä ei käytä värejä, selite olisi kohinaa.
  if (used.length < 2) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {used.map((c) => {
          const label = labelFor(colorLabels, c.key);
          const count = counts.get(c.key) ?? 0;
          const active = selected === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => onSelect(active ? null : c.key)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label || colorName(c.key)}, ${count} kpl`}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              {!!label && (
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              )}
              <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onToggleGrouped}
          style={[styles.btn, grouped && styles.btnActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: grouped }}
        >
          <Text style={[styles.btnText, grouped && styles.btnTextActive]}>Ryhmittele</Text>
        </Pressable>
        <Pressable onPress={onOpenLabels} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Nimeä värit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8, gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eee',
  },
  chipActive: { backgroundColor: '#2d5a27' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontSize: 12, color: '#333', fontWeight: '600', maxWidth: 110 },
  chipCount: { fontSize: 11, color: '#777', fontWeight: '700' },
  chipTextActive: { color: 'white' },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  btnActive: { backgroundColor: '#2d5a27' },
  btnText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  btnTextActive: { color: 'white' },
});
```

- [ ] **Step 2: Lisää importit ja tila FavoritesScreeniin**

`mobile/src/screens/FavoritesScreen.tsx` — korvaa rivit 1–9 (importit):

```tsx
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
```

Lisää `const [showPast, setShowPast] = useState(false);` -rivin jälkeen:

```tsx
  const favoriteColors = useStore((s) => s.favoriteColors);
  const colorLabels = useStore((s) => s.colorLabels);
  const [colorFilter, setColorFilter] = useState<ColorKey | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
```

- [ ] **Step 3: Laske baseItems, laskurit, suodatettu lista ja sectionit**

Korvaa nykyinen `items`-useMemo (rivit 20–26) kokonaan:

```tsx
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
```

- [ ] **Step 4: Vaihda FlatList → SectionList ja lisää selite**

Korvaa `<Animated.FlatList ... />` -lohko (nykyiset rivit 68–110) kokonaan:

```tsx
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
```

- [ ] **Step 5: Renderöi nimeämismodaali ja lisää tyylit**

Lisää `<FavoritesAgenda />`-rivin jälkeen, **ennen** uloimman `</View>`-rivin sulkua:

```tsx
      <FavoriteColorLabelsModal visible={labelsOpen} onClose={() => setLabelsOpen(false)} />
```

Lisää `StyleSheet.create`-objektiin (`count`-rivin jälkeen):

```tsx
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
```

- [ ] **Step 6: Verify typecheck and tests pass**

Run: `cd mobile && npm run typecheck && npm test`
Expected: ei tyyppivirheitä, testit vihreinä.

- [ ] **Step 7: Aja sovellus ja varmista toiminta käsin**

Run: `cd mobile && npm run ios` (tai `npm run android`)

Tarkista:
1. Ilman värejä ulkoasu on ennallaan (keltainen tähti, ei selitettä).
2. Tähden pitkä painallus avaa värivalitsimen; värin valinta värjää tähden.
3. Värin valinta ei-suosikille lisää sen suosikkeihin.
4. "Nimeä värit" → nimi näkyy selitteen sirussa ja ryhmäotsikossa.
5. Sirun painallus suodattaa; uudelleen paino poistaa suodatuksen.
6. "Ryhmittele" ryhmittelee listan väreittäin.
7. Suosikin poisto (swipe) poistaa myös värin — lisää sama uudelleen → oletusväri.
8. Sovelluksen uudelleenkäynnistys säilyttää värit ja nimet.

- [ ] **Step 8: Commit**

```bash
git add mobile/src/components/FavoriteColorLegend.tsx mobile/src/screens/FavoritesScreen.tsx
git commit -m "feat(mobile): suosikkien väriselite, värisuodatus ja ryhmittely"
```

---

### Task 7: Versiointi ja whatsnew

**Files:**
- Modify: `mobile/package.json:3`
- Modify: `mobile/android/app/build.gradle:84-85`
- Modify: `mobile/ios/Koetutka.xcodeproj/project.pbxproj` (`CURRENT_PROJECT_VERSION` rivit 477 ja 506; `MARKETING_VERSION` rivit 485 ja 513)
- Modify: `whatsnew.json`

**Interfaces:**
- Consumes: ei mitään.
- Produces: versio `1.7.0` kaikissa neljässä paikassa + whatsnew-merkintä.

- [ ] **Step 1: Bump mobile/package.json**

`mobile/package.json` rivi 3: `"version": "1.6.0"` → `"version": "1.7.0"`

- [ ] **Step 2: Bump Android**

`mobile/android/app/build.gradle` rivit 84–85:

```gradle
        versionCode 10
        versionName "1.7.0"
```

- [ ] **Step 3: Bump iOS**

`mobile/ios/Koetutka.xcodeproj/project.pbxproj` — **molemmat** esiintymät (Debug + Release):
- `CURRENT_PROJECT_VERSION = 8;` → `CURRENT_PROJECT_VERSION = 9;` (rivit 477, 506)
- `MARKETING_VERSION = 1.6.0;` → `MARKETING_VERSION = 1.7.0;` (rivit 485, 513)

Varmista: `grep -c "MARKETING_VERSION = 1.7.0" mobile/ios/Koetutka.xcodeproj/project.pbxproj` → `2`

- [ ] **Step 4: Lisää whatsnew-merkintä**

`whatsnew.json` — lisää `"releases"`-taulukon **ensimmäiseksi** alkioksi (ennen `1.6.0`-merkintää):

```json
    {
      "version": "1.7.0",
      "date": "2026-07-16",
      "title": "Suosikkivärit",
      "items": [
        "Suosikille voi antaa värin: paina koekortin tähteä pitkään ja valitse väri",
        "Värille voi antaa oman merkityksen, esim. \"Ilmoittauduttu\" — nimi näkyy suosikkien selitteessä",
        "Suosikit-listan voi suodattaa ja ryhmitellä värin mukaan"
      ]
    },
```

- [ ] **Step 5: Verify versions match and JSON is valid**

Run:
```bash
cd mobile && npm run typecheck && npm test && cd .. && python3 -m json.tool whatsnew.json > /dev/null && echo "whatsnew.json OK" && grep -n '"version"' mobile/package.json | head -1 && grep -n 'versionName\|versionCode' mobile/android/app/build.gradle && grep -c "MARKETING_VERSION = 1.7.0" mobile/ios/Koetutka.xcodeproj/project.pbxproj
```
Expected: testit vihreinä, `whatsnew.json OK`, `"version": "1.7.0"`, `versionCode 10` / `versionName "1.7.0"`, ja `2`.

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/android/app/build.gradle mobile/ios/Koetutka.xcodeproj/project.pbxproj whatsnew.json
git commit -m "chore(mobile): bump 1.7.0 (suosikkivärit) + whatsnew"
```

---

## Muistilista lopuksi

- `whatsnew.json` ships **web-deployn** kautta (GitHub Pages) — se ei vaadi mobiilibuildia,
  mutta se on deployattava jotta "Mitä uutta" näkyy sovelluksessa.
- Webiin (`index.html`, `README.md`) ei tule versiomuutosta: tämä on mobiiliominaisuus.
