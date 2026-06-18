# Mobile Sort + "What's New" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-selectable list sorting (distance / date) and a remote-fetched "What's new" notification to the Koetutka mobile app (iOS + Android, one shared codebase).

**Architecture:** Sorting becomes a pure `sortEvents(events, sortBy)` in the shared package, driven by a persisted `sortBy` store field and a new `SortSelector` pill UI on the Browse screen. "What's new" content is fetched from a GitHub Pages JSON (`whatsnew.json`), cached in AsyncStorage; a pure `resolveWhatsNew()` decides what to show (welcome on first install, the installed version's release notes on update), rendered by a `WhatsNewModal` at app root and re-openable from Settings.

**Tech Stack:** React Native 0.77, TypeScript, Zustand, AsyncStorage, vitest, pnpm workspace (`@koetutka/shared`).

## Global Constraints

- Platform-agnostic only — no new `Platform.OS` branches; one implementation serves iOS + Android.
- Shared package imports use explicit `.js` extensions (e.g. `from './distance.js'`). Mobile imports use the `@/` alias or relative paths without extension.
- Shared tests live in `shared/tests/*.test.ts` and import from `../src/*.js`. Mobile vitest only runs `mobile/src/lib/tests/**/*.test.ts` — pure logic goes there; UI components are verified by `npm run typecheck` + manual check, not vitest.
- Do not unit-test AsyncStorage/fetch I/O wrappers (matches existing `preferences.ts`/`data.ts` convention); test the pure functions they call.
- After changing `shared/src`, rebuild with `pnpm --filter @koetutka/shared build` so mobile (which resolves `@koetutka/shared` to `dist/`) sees new exports. Do not commit `shared/dist` if it is gitignored.
- Target version: `1.2.0` everywhere (mobile `package.json`, iOS `MARKETING_VERSION`, Android `versionName`). Build numbers increment: iOS `CURRENT_PROJECT_VERSION` 1→2, Android `versionCode` 3→4.
- Every commit message ends with the repo's trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01XmkVEFYhz2vETDxLTAG1m8
  ```
- Work happens on the short-lived branch `feat/mobile-sort-whatsnew` (trunk-based; integrate to `master` fast). Do not push without the user asking.

---

### Task 1: Shared `sortEvents`

**Files:**
- Create: `shared/src/sort.ts`
- Create: `shared/tests/sort.test.ts`
- Modify: `shared/src/index.ts`

**Interfaces:**
- Produces: `export type SortBy = 'distance' | 'date'` and `export function sortEvents(events: Event[], sortBy: SortBy): Event[]` (pure; returns a new array; never mutates input).

- [ ] **Step 1: Write the failing test**

Create `shared/tests/sort.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { sortEvents } from '../src/sort.js';
import type { Event } from '../src/types.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'X',
    type: 'NOME-B',
    levels: 'ALO',
    date: '24.05.2026',
    date_sort: '2026-05-24T00:00:00+03:00',
    end_date_sort: null,
    entry_date: '01.04.-14.04.',
    location: 'Lahti',
    coordinates: [60.9827, 25.6612],
    name: '',
    organizer: 'Test ry',
    official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' },
    judges: [],
    description: '',
    cost: 45,
    cost_member: 35,
    classes: [],
    ...overrides,
  };
}

describe('sortEvents', () => {
  test('distance: lähin ensin, etäisyydettömät loppuun', () => {
    const a = makeEvent({ id: 'a', distance: 100 });
    const b = makeEvent({ id: 'b', distance: 10 });
    const c = makeEvent({ id: 'c', distance: null });
    const result = sortEvents([a, b, c], 'distance');
    expect(result.map((e) => e.id)).toEqual(['b', 'a', 'c']);
  });

  test('distance: etäisyydettömät keskenään päivämäärän mukaan', () => {
    const a = makeEvent({ id: 'a', distance: null, date_sort: '2026-06-01T00:00:00+03:00' });
    const b = makeEvent({ id: 'b', distance: null, date_sort: '2026-03-01T00:00:00+02:00' });
    const result = sortEvents([a, b], 'distance');
    expect(result.map((e) => e.id)).toEqual(['b', 'a']);
  });

  test('date: vanhin (aikajärjestys) ensin', () => {
    const a = makeEvent({ id: 'a', date_sort: '2026-06-01T00:00:00+03:00' });
    const b = makeEvent({ id: 'b', date_sort: '2026-03-01T00:00:00+02:00' });
    const result = sortEvents([a, b], 'date');
    expect(result.map((e) => e.id)).toEqual(['b', 'a']);
  });

  test('ei mutatoi alkuperäistä taulukkoa', () => {
    const a = makeEvent({ id: 'a', distance: 100 });
    const b = makeEvent({ id: 'b', distance: 10 });
    const input = [a, b];
    sortEvents(input, 'distance');
    expect(input.map((e) => e.id)).toEqual(['a', 'b']);
  });

  test('tyhjä lista palauttaa tyhjän', () => {
    expect(sortEvents([], 'distance')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared exec vitest run tests/sort.test.ts`
Expected: FAIL — cannot resolve `../src/sort.js` / `sortEvents is not a function`.

- [ ] **Step 3: Write minimal implementation**

Create `shared/src/sort.ts`:

```ts
import type { Event } from './types.js';

export type SortBy = 'distance' | 'date';

/**
 * Palauttaa uuden lajitellun taulukon. Ei mutatoi syötettä.
 * - 'distance': lähimmät ensin; etäisyydettömät (null/undefined) loppuun,
 *   keskenään aikajärjestyksessä; etäisyydellisten kesken toissijaisesti aika.
 * - 'date': aikajärjestys (date_sort nouseva).
 */
export function sortEvents(events: Event[], sortBy: SortBy): Event[] {
  const copy = [...events];
  if (sortBy === 'date') {
    return copy.sort((a, b) => a.date_sort.localeCompare(b.date_sort));
  }
  return copy.sort((a, b) => {
    const aHas = a.distance !== undefined && a.distance !== null;
    const bHas = b.distance !== undefined && b.distance !== null;
    if (aHas && bHas) {
      const diff = (a.distance as number) - (b.distance as number);
      return diff !== 0 ? diff : a.date_sort.localeCompare(b.date_sort);
    }
    if (aHas) return -1;
    if (bHas) return 1;
    return a.date_sort.localeCompare(b.date_sort);
  });
}
```

Modify `shared/src/index.ts` — add after the existing exports:

```ts
export * from './sort.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared exec vitest run tests/sort.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Build shared so mobile sees the new export**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared build`
Expected: `tsc` completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add shared/src/sort.ts shared/tests/sort.test.ts shared/src/index.ts
git commit  # message: "Add shared sortEvents helper (distance/date)" + trailer
```
(If `shared/dist` is tracked, also `git add shared/dist`; if gitignored, skip it.)

---

### Task 2: Persist `sortBy` (preferences + store)

**Files:**
- Modify: `mobile/src/lib/preferences.ts`
- Modify: `mobile/src/lib/store.ts`
- Modify: `mobile/src/lib/tests/preferences.test.ts`

**Interfaces:**
- Consumes: `SortBy` from `@koetutka/shared` (Task 1).
- Produces: store field `sortBy: SortBy` + action `setSortBy(next: SortBy): void`; `StoredPrefs.sortBy: SortBy` (default `'distance'`).

- [ ] **Step 1: Write the failing test**

Add to `mobile/src/lib/tests/preferences.test.ts` inside the existing `describe` block:

```ts
  test('round-trippaa sortBy', () => {
    const prefs: StoredPrefs = {
      userLocation: null,
      filters: {
        searchTerm: '',
        activeTypes: new Set(),
        activeLevels: new Set(),
        maxDistanceKm: null,
        hidePast: true,
        onlyRegistrationOpen: false,
      },
      favorites: new Set(),
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      sortBy: 'date',
      whatsNewLastSeenVersion: null,
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.sortBy).toBe('date');
  });

  test('deserializePrefs antaa sortBy-defaultin (distance) vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: [],
    });
    expect(deserializePrefs(oldJson).sortBy).toBe('distance');
  });
```

(The `whatsNewLastSeenVersion` field above is added in this same task's Step 3 so `StoredPrefs` already includes it; its own behavior is tested in Task 6.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/preferences.test.ts`
Expected: FAIL — `sortBy` missing on `StoredPrefs` type / `back.sortBy` is `undefined`.

- [ ] **Step 3: Add `sortBy` (and `whatsNewLastSeenVersion`) to preferences**

Modify `mobile/src/lib/preferences.ts`:

Add import at top:
```ts
import type { FilterOptions, UserLocation, SortBy } from '@koetutka/shared';
```

Extend `StoredPrefs`:
```ts
export interface StoredPrefs {
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  notifications: NotificationSettings;
  sortBy: SortBy;
  whatsNewLastSeenVersion: string | null;
}
```

Extend `DEFAULTS` (add the two fields):
```ts
  favorites: new Set(),
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  sortBy: 'distance',
  whatsNewLastSeenVersion: null,
};
```

Extend `JsonShape`:
```ts
  favorites?: string[];
  notifications?: NotificationSettings;
  sortBy?: SortBy;
  whatsNewLastSeenVersion?: string | null;
}
```

Extend `serializePrefs` json object (add after `notifications`):
```ts
    notifications: prefs.notifications,
    sortBy: prefs.sortBy,
    whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,
  };
```

Extend `deserializePrefs` return object (add after `notifications`):
```ts
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(parsed.notifications ?? {}),
      },
      sortBy: parsed.sortBy ?? 'distance',
      whatsNewLastSeenVersion: parsed.whatsNewLastSeenVersion ?? null,
    };
```

- [ ] **Step 4: Wire `sortBy` into the store**

Modify `mobile/src/lib/store.ts`:

Add `SortBy` to the shared import:
```ts
import type { Event, UserLocation, FilterOptions, SortBy } from '@koetutka/shared';
```

Add to `interface State`:
```ts
  sortBy: SortBy;
```

Add to `interface Actions`:
```ts
  setSortBy: (next: SortBy) => void;
```

Update `persist()` to include the new fields:
```ts
function persist(state: State) {
  void savePrefs({
    userLocation: state.userLocation,
    filters: state.filters,
    favorites: state.favorites,
    notifications: state.notifications,
    sortBy: state.sortBy,
    whatsNewLastSeenVersion: state.whatsNewLastSeenVersion,
  });
}
```

Add initial state (near `filters: defaultFilters,`):
```ts
  sortBy: 'distance',
```

Add `whatsNewLastSeenVersion` initial state too (used by persist; full whats-new wiring is Task 6):
```ts
  whatsNewLastSeenVersion: null,
```
and add it to `interface State`:
```ts
  whatsNewLastSeenVersion: string | null;
```

Set both from prefs in `initFromStorage` (add to the `set({...})` call):
```ts
      notifications: prefs.notifications,
      sortBy: prefs.sortBy,
      whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,
      prefsLoaded: true,
```

Add the action (after `resetFilters`):
```ts
  setSortBy: (sortBy) => {
    set({ sortBy });
    persist(get());
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/preferences.test.ts`
Expected: PASS (existing + 2 new tests).

- [ ] **Step 6: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/lib/preferences.ts mobile/src/lib/store.ts mobile/src/lib/tests/preferences.test.ts
git commit  # message: "Persist sortBy preference in store" + trailer
```

---

### Task 3: `SortSelector` UI + Browse wiring

**Files:**
- Create: `mobile/src/components/SortSelector.tsx`
- Modify: `mobile/src/screens/BrowseScreen.tsx`

**Interfaces:**
- Consumes: `sortBy` + `setSortBy` from the store (Task 2); `sortEvents`, `SortBy` from `@koetutka/shared` (Task 1).

- [ ] **Step 1: Create the SortSelector component**

Create `mobile/src/components/SortSelector.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

export function SortSelector() {
  const sortBy = useStore((s) => s.sortBy);
  const setSortBy = useStore((s) => s.setSortBy);
  const userLocation = useStore((s) => s.userLocation);
  const distanceDisabled = !userLocation;
  // Ilman sijaintia etäisyyslajittelu putoaa aikaan → näytä aika aktiivisena.
  const dateActive = sortBy === 'date' || distanceDisabled;
  const distanceActive = sortBy === 'distance' && !distanceDisabled;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Järjestä</Text>
      <View style={styles.pills}>
        <Pressable
          onPress={() => setSortBy('distance')}
          disabled={distanceDisabled}
          style={[
            styles.pill,
            distanceActive && styles.pillActive,
            distanceDisabled && styles.pillDisabled,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              distanceActive && styles.pillTextActive,
              distanceDisabled && styles.pillTextDisabled,
            ]}
          >
            📍 Etäisyys
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSortBy('date')}
          style={[styles.pill, dateActive && styles.pillActive]}
        >
          <Text style={[styles.pillText, dateActive && styles.pillTextActive]}>
            📅 Ajankohta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  label: { fontSize: 12, color: '#888', fontWeight: '600' },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#e8f0e6' },
  pillActive: { backgroundColor: '#2d5a27' },
  pillDisabled: { backgroundColor: '#f0f0f0' },
  pillText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  pillTextActive: { color: 'white' },
  pillTextDisabled: { color: '#bbb' },
});
```

- [ ] **Step 2: Wire sorting + selector into BrowseScreen**

Modify `mobile/src/screens/BrowseScreen.tsx`:

Change the shared import to add `sortEvents`:
```ts
import { addDistances, filterEvents, sortEvents } from '@koetutka/shared';
```

Add the SortSelector import (next to FilterChips):
```ts
import { SortSelector } from '@/components/SortSelector';
```

Add the `sortBy` selector (after the `filters` selector):
```ts
  const sortBy = useStore((s) => s.sortBy);
```

Replace the `visible` useMemo body:
```ts
  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    const effectiveSort = sortBy === 'distance' && !userLocation ? 'date' : sortBy;
    return sortEvents(filtered, effectiveSort);
  }, [events, userLocation, filters, sortBy]);
```

Render `<SortSelector />` right after `<FilterChips />` in the returned JSX:
```tsx
      <FilterChips />
      <SortSelector />
```

- [ ] **Step 3: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/SortSelector.tsx mobile/src/screens/BrowseScreen.tsx
git commit  # message: "Add sort selector (distance/date) to Browse screen" + trailer
```

---

### Task 4: `whatsnew.ts` types + pure resolvers

**Files:**
- Create: `mobile/src/lib/whatsnew.ts`
- Create: `mobile/src/lib/tests/whatsnew.test.ts`

**Interfaces:**
- Produces:
  - Types `WelcomeNote`, `ReleaseNote`, `WhatsNewData`, `WhatsNewContent`.
  - `FALLBACK_WELCOME: WelcomeNote`.
  - `resolveWhatsNew(params: { current: string; lastSeen: string | null; data: WhatsNewData | null }): WhatsNewContent | null`.
  - `pickManualContent(current: string, data: WhatsNewData | null): WhatsNewContent`.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/lib/tests/whatsnew.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import {
  resolveWhatsNew,
  pickManualContent,
  FALLBACK_WELCOME,
  type WhatsNewData,
} from '../whatsnew';

const data: WhatsNewData = {
  welcome: { title: 'Tervetuloa', body: 'Esittely' },
  releases: [
    { version: '1.2.0', date: '2026-06-18', title: 'Lajittelu', items: ['Lajittelu', 'Mitä uutta'] },
    { version: '1.1.0', title: 'Vanha', items: ['Vanha juttu'] },
  ],
};

describe('resolveWhatsNew', () => {
  test('ensiasennus (lastSeen null) → welcome remotesta', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: null, data });
    expect(r).toEqual({ kind: 'welcome', title: 'Tervetuloa', body: 'Esittely' });
  });

  test('ensiasennus ilman remotea → varateksti', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: null, data: null });
    expect(r).toEqual({ kind: 'welcome', title: FALLBACK_WELCOME.title, body: FALLBACK_WELCOME.body });
  });

  test('päivitys → asennetun version release', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: '1.1.0', data });
    expect(r).toEqual({
      kind: 'release',
      version: '1.2.0',
      date: '2026-06-18',
      title: 'Lajittelu',
      items: ['Lajittelu', 'Mitä uutta'],
    });
  });

  test('päivitys mutta remotessa ei vielä tätä versiota → null', () => {
    const r = resolveWhatsNew({ current: '1.3.0', lastSeen: '1.2.0', data });
    expect(r).toBeNull();
  });

  test('sama versio jo nähty → null', () => {
    expect(resolveWhatsNew({ current: '1.2.0', lastSeen: '1.2.0', data })).toBeNull();
  });
});

describe('pickManualContent', () => {
  test('palauttaa asennetun version releasen', () => {
    const r = pickManualContent('1.2.0', data);
    expect(r).toMatchObject({ kind: 'release', version: '1.2.0' });
  });

  test('jos versiota ei löydy, palauttaa uusimman releasen', () => {
    const r = pickManualContent('9.9.9', data);
    expect(r).toMatchObject({ kind: 'release', version: '1.2.0' });
  });

  test('ilman releaseja palauttaa welcomen (varateksti jos remotea ei ole)', () => {
    const r = pickManualContent('1.2.0', null);
    expect(r).toEqual({ kind: 'welcome', title: FALLBACK_WELCOME.title, body: FALLBACK_WELCOME.body });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/whatsnew.test.ts`
Expected: FAIL — cannot resolve `../whatsnew`.

- [ ] **Step 3: Write the implementation**

Create `mobile/src/lib/whatsnew.ts`:

```ts
export interface WelcomeNote {
  title: string;
  body: string;
}

export interface ReleaseNote {
  version: string;
  date?: string;
  title: string;
  items: string[];
}

export interface WhatsNewData {
  welcome?: WelcomeNote;
  releases?: ReleaseNote[];
}

export type WhatsNewContent =
  | { kind: 'welcome'; title: string; body: string }
  | { kind: 'release'; version: string; date?: string; title: string; items: string[] };

/** Sovellukseen koodattu varateksti offline-ensiasennusta varten. */
export const FALLBACK_WELCOME: WelcomeNote = {
  title: 'Tervetuloa Koetutkaan',
  body:
    'Koetutka näyttää noutajien metsästyskokeet kartalla ja listana, lähimmät ensin. ' +
    'Valitse sijaintisi, selaa tulevia kokeita, tallenna suosikkeja ja vie ne kalenteriin.',
};

function welcomeContent(note: WelcomeNote): WhatsNewContent {
  return { kind: 'welcome', title: note.title, body: note.body };
}

function releaseContent(r: ReleaseNote): WhatsNewContent {
  return { kind: 'release', version: r.version, date: r.date, title: r.title, items: r.items };
}

/**
 * Päättää näytetäänkö "Mitä uutta" automaattisesti.
 * - lastSeen null → welcome (remote tai varateksti).
 * - lastSeen === current → null (jo nähty).
 * - muuten → asennetun version release jos remotessa, muuten null.
 */
export function resolveWhatsNew(params: {
  current: string;
  lastSeen: string | null;
  data: WhatsNewData | null;
}): WhatsNewContent | null {
  const { current, lastSeen, data } = params;
  if (lastSeen == null) {
    return welcomeContent(data?.welcome ?? FALLBACK_WELCOME);
  }
  if (lastSeen === current) return null;
  const release = data?.releases?.find((r) => r.version === current);
  return release ? releaseContent(release) : null;
}

/** Manuaaliseen avaukseen (Asetukset): aina jotain näytettävää. */
export function pickManualContent(current: string, data: WhatsNewData | null): WhatsNewContent {
  const release =
    data?.releases?.find((r) => r.version === current) ?? data?.releases?.[0];
  if (release) return releaseContent(release);
  return welcomeContent(data?.welcome ?? FALLBACK_WELCOME);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/whatsnew.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/whatsnew.ts mobile/src/lib/tests/whatsnew.test.ts
git commit  # message: "Add What's new resolver and types" + trailer
```

---

### Task 5: `fetchWhatsNew` (remote fetch + AsyncStorage cache)

**Files:**
- Modify: `mobile/src/lib/whatsnew.ts`

**Interfaces:**
- Consumes: `BASE_URL` from `./data`; `WhatsNewData` (Task 4).
- Produces: `fetchWhatsNew(): Promise<WhatsNewData | null>` — fetches `${BASE_URL}/whatsnew.json`, caches the last successful result in AsyncStorage, and falls back to that cache on failure.

> No unit test: this is an AsyncStorage + fetch I/O wrapper. Per repo convention (`preferences.ts`/`data.ts` leave their I/O wrappers untested) it is verified by typecheck + manual run. Its pure decision logic is already covered by Task 4.

- [ ] **Step 1: Add the fetch+cache function**

Append to `mobile/src/lib/whatsnew.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './data';

const CACHE_KEY = 'koetutka:whatsnew:v1';

/** Hakee whatsnew.json:n; välimuistittaa onnistuneen haun ja fallbackaa siihen. */
export async function fetchWhatsNew(): Promise<WhatsNewData | null> {
  try {
    const res = await fetch(`${BASE_URL}/whatsnew.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as WhatsNewData;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? (JSON.parse(cached) as WhatsNewData) : null;
    } catch {
      return null;
    }
  }
}
```

(Move the `import` lines to the top of the file with the other imports if preferred; functionally identical.)

- [ ] **Step 2: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Run mobile tests (no regressions)**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run`
Expected: PASS — existing + whatsnew + preferences tests green.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/lib/whatsnew.ts
git commit  # message: "Fetch and cache What's new from GitHub Pages" + trailer
```

---

### Task 6: What's-new store actions + persisted last-seen version

**Files:**
- Modify: `mobile/src/lib/store.ts`
- Modify: `mobile/src/lib/tests/preferences.test.ts`

**Interfaces:**
- Consumes: `fetchWhatsNew`, `resolveWhatsNew`, `pickManualContent`, `WhatsNewContent` (Tasks 4–5); `pkg.version`; `StoredPrefs.whatsNewLastSeenVersion` (added in Task 2).
- Produces: store state `whatsNew: { visible: boolean; content: WhatsNewContent | null; manual: boolean }`; actions `checkWhatsNew(): Promise<void>`, `openWhatsNew(): Promise<void>`, `dismissWhatsNew(): void`.

- [ ] **Step 1: Write the failing test (persistence of last-seen version)**

Add to `mobile/src/lib/tests/preferences.test.ts`:

```ts
  test('round-trippaa whatsNewLastSeenVersion', () => {
    const prefs: StoredPrefs = {
      userLocation: null,
      filters: {
        searchTerm: '',
        activeTypes: new Set(),
        activeLevels: new Set(),
        maxDistanceKm: null,
        hidePast: true,
        onlyRegistrationOpen: false,
      },
      favorites: new Set(),
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      sortBy: 'distance',
      whatsNewLastSeenVersion: '1.2.0',
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.whatsNewLastSeenVersion).toBe('1.2.0');
  });

  test('whatsNewLastSeenVersion default on null vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: [],
    });
    expect(deserializePrefs(oldJson).whatsNewLastSeenVersion).toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it passes already**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npx vitest run src/lib/tests/preferences.test.ts`
Expected: PASS — the serialization fields were added in Task 2, so these confirm the contract. (If they fail, Task 2's preferences edits are incomplete — fix there.)

- [ ] **Step 3: Add the what's-new state + actions to the store**

Modify `mobile/src/lib/store.ts`:

Add imports:
```ts
import pkg from '../../package.json';
import {
  fetchWhatsNew,
  resolveWhatsNew,
  pickManualContent,
  type WhatsNewContent,
} from './whatsnew';
```

Add a module constant (below the imports):
```ts
const APP_VERSION = pkg.version;
```

Add to `interface State`:
```ts
  whatsNew: { visible: boolean; content: WhatsNewContent | null; manual: boolean };
```

Add to `interface Actions`:
```ts
  checkWhatsNew: () => Promise<void>;
  openWhatsNew: () => Promise<void>;
  dismissWhatsNew: () => void;
```

Add initial state (near `whatsNewLastSeenVersion: null,`):
```ts
  whatsNew: { visible: false, content: null, manual: false },
```

Add the actions (after `setSortBy`):
```ts
  checkWhatsNew: async () => {
    const data = await fetchWhatsNew();
    const content = resolveWhatsNew({
      current: APP_VERSION,
      lastSeen: get().whatsNewLastSeenVersion,
      data,
    });
    if (content) {
      set({ whatsNew: { visible: true, content, manual: false } });
    }
  },

  openWhatsNew: async () => {
    const data = await fetchWhatsNew();
    const content = pickManualContent(APP_VERSION, data);
    set({ whatsNew: { visible: true, content, manual: true } });
  },

  dismissWhatsNew: () => {
    const wasManual = get().whatsNew.manual;
    set({ whatsNew: { visible: false, content: null, manual: false } });
    if (!wasManual) {
      set({ whatsNewLastSeenVersion: APP_VERSION });
      persist(get());
    }
  },
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/store.ts mobile/src/lib/tests/preferences.test.ts
git commit  # message: "Add What's new store actions and last-seen tracking" + trailer
```

---

### Task 7: `WhatsNewModal` + app-root render + Settings link

**Files:**
- Create: `mobile/src/components/WhatsNewModal.tsx`
- Modify: `mobile/App.tsx`
- Modify: `mobile/src/components/AboutSection.tsx`

**Interfaces:**
- Consumes: store `whatsNew`, `dismissWhatsNew`, `openWhatsNew`, `checkWhatsNew`, `initFromStorage` (Task 6).

- [ ] **Step 1: Create the modal component**

Create `mobile/src/components/WhatsNewModal.tsx`:

```tsx
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

export function WhatsNewModal() {
  const whatsNew = useStore((s) => s.whatsNew);
  const dismiss = useStore((s) => s.dismissWhatsNew);
  const { visible, content } = whatsNew;
  if (!content) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{content.title}</Text>
          {content.kind === 'release' && (
            <Text style={styles.version}>Versio {content.version}</Text>
          )}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {content.kind === 'welcome' ? (
              <Text style={styles.body}>{content.body}</Text>
            ) : (
              content.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.btn} onPress={dismiss}>
            <Text style={styles.btnText}>Selvä</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a472a' },
  version: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 4 },
  scroll: { marginTop: 10 },
  scrollContent: { paddingBottom: 4 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#2d5a27', marginRight: 8, lineHeight: 20 },
  itemText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  btn: {
    marginTop: 16,
    backgroundColor: '#2d5a27',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
```

- [ ] **Step 2: Render the modal at app root + trigger the check**

Modify `mobile/App.tsx`:

Add imports:
```ts
import { WhatsNewModal } from './src/components/WhatsNewModal';
```

Replace the body so the check runs after prefs load and the modal renders above the navigator:
```tsx
export default function App() {
  const init = useStore((s) => s.initFromStorage);
  const checkWhatsNew = useStore((s) => s.checkWhatsNew);

  useEffect(() => {
    void init().then(() => checkWhatsNew());
  }, [init, checkWhatsNew]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor="#2d5a27" barStyle="light-content" />
        <RootNavigator />
        <WhatsNewModal />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Add the "Mitä uutta" link to AboutSection**

Modify `mobile/src/components/AboutSection.tsx`:

Add import:
```ts
import { useStore } from '@/lib/store';
```

Inside the component, before `return`:
```ts
  const openWhatsNew = useStore((s) => s.openWhatsNew);
```

Add a pressable row (place it just before the GitHub link `<Pressable>`):
```tsx
      <Pressable onPress={() => void openWhatsNew()} hitSlop={6}>
        <Text style={styles.link}>Mitä uutta</Text>
      </Pressable>
```

- [ ] **Step 4: Typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/WhatsNewModal.tsx mobile/App.tsx mobile/src/components/AboutSection.tsx
git commit  # message: "Show What's new modal at app root and from Settings" + trailer
```

---

### Task 8: `whatsnew.json` content + deploy

**Files:**
- Create: `whatsnew.json` (repo root)
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `whatsnew.json`**

Create `whatsnew.json` at the repo root:

```json
{
  "welcome": {
    "title": "Tervetuloa Koetutkaan",
    "body": "Koetutka näyttää noutajien metsästyskokeet kartalla ja listana, lähimmät ensin. Valitse sijaintisi, selaa tulevia kokeita, tallenna suosikkeja ja vie ne kalenteriin."
  },
  "releases": [
    {
      "version": "1.2.0",
      "date": "2026-06-18",
      "title": "Lajittelu ja Mitä uutta",
      "items": [
        "Listan voi nyt lajitella etäisyyden tai ajankohdan mukaan",
        "Uusi Mitä uutta -näkymä, joka kertoo tuoreimmat päivitykset"
      ]
    }
  ]
}
```

- [ ] **Step 2: Copy `whatsnew.json` in the Pages deploy**

Modify `.github/workflows/deploy.yml` — in the "Prepare deployment directory" step, add a copy line next to the other `cp` lines (e.g. after `cp app.js _site/`):

```yaml
          cp app.js _site/
          cp whatsnew.json _site/
```

- [ ] **Step 3: Validate JSON + verify the deploy edit**

Run: `cd /Users/teroronkko/code/koetutka && node -e "JSON.parse(require('fs').readFileSync('whatsnew.json','utf8')); console.log('valid json')" && grep -n "whatsnew.json" .github/workflows/deploy.yml`
Expected: prints `valid json` and shows the new `cp whatsnew.json _site/` line.

- [ ] **Step 4: Commit**

```bash
git add whatsnew.json .github/workflows/deploy.yml
git commit  # message: "Add whatsnew.json and deploy it to GitHub Pages" + trailer
```

---

### Task 9: Version bumps (1.2.0)

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/ios/Koetutka.xcodeproj/project.pbxproj`
- Modify: `mobile/android/app/build.gradle`

- [ ] **Step 1: Bump mobile package version**

Modify `mobile/package.json`: change `"version": "1.1.0"` → `"version": "1.2.0"`.

- [ ] **Step 2: Bump iOS versions**

Modify `mobile/ios/Koetutka.xcodeproj/project.pbxproj`:
- Both `MARKETING_VERSION = 1.1.0;` → `MARKETING_VERSION = 1.2.0;`
- Both `CURRENT_PROJECT_VERSION = 1;` → `CURRENT_PROJECT_VERSION = 2;`

Use sed to hit both occurrences each:
```bash
cd /Users/teroronkko/code/koetutka
sed -i '' 's/MARKETING_VERSION = 1\.1\.0;/MARKETING_VERSION = 1.2.0;/g; s/CURRENT_PROJECT_VERSION = 1;/CURRENT_PROJECT_VERSION = 2;/g' mobile/ios/Koetutka.xcodeproj/project.pbxproj
grep -n "MARKETING_VERSION\|CURRENT_PROJECT_VERSION" mobile/ios/Koetutka.xcodeproj/project.pbxproj
```
Expected: 2× `MARKETING_VERSION = 1.2.0;` and 2× `CURRENT_PROJECT_VERSION = 2;`.

- [ ] **Step 3: Bump Android versions**

Modify `mobile/android/app/build.gradle`:
- `versionCode 3` → `versionCode 4`
- `versionName "1.0.2"` → `versionName "1.2.0"`

- [ ] **Step 4: Verify**

Run: `cd /Users/teroronkko/code/koetutka && grep -n '"version"' mobile/package.json && grep -n 'versionCode\|versionName' mobile/android/app/build.gradle`
Expected: mobile `1.2.0`; Android `versionCode 4`, `versionName "1.2.0"`.

- [ ] **Step 5: Commit**

```bash
git add mobile/package.json mobile/ios/Koetutka.xcodeproj/project.pbxproj mobile/android/app/build.gradle
git commit  # message: "Bump mobile version to 1.2.0" + trailer
```

---

### Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Build shared (fresh dist for mobile)**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared build`
Expected: no errors.

- [ ] **Step 2: Run all shared tests + typecheck**

Run: `cd /Users/teroronkko/code/koetutka && pnpm --filter @koetutka/shared test && pnpm --filter @koetutka/shared typecheck`
Expected: all PASS, no type errors (includes new `sort.test.ts`).

- [ ] **Step 3: Run all mobile tests + typecheck**

Run: `cd /Users/teroronkko/code/koetutka/mobile && npm test && npm run typecheck`
Expected: all PASS, no type errors (includes `whatsnew.test.ts` + extended `preferences.test.ts`).

- [ ] **Step 4: Manual smoke (user, on simulator/device)**

- Browse: toggle "📍 Etäisyys" / "📅 Ajankohta"; with no location set, the distance pill is greyed and the list sorts by date; the choice survives an app restart.
- What's new: fresh install (clear app data) shows the welcome modal once; bump-to-1.2.0 update shows the 1.2.0 release notes once; Settings → Tietoja → "Mitä uutta" re-opens it any time without re-triggering on next launch.

- [ ] **Step 5: Finish the branch**

Use superpowers:finishing-a-development-branch to choose how to integrate `feat/mobile-sort-whatsnew` into `master` (trunk-based: integrate fast). Do not push/PR without the user's go-ahead.

---

## Self-Review

**Spec coverage:**
- Sort distance/date in shared → Task 1. Persist sort → Task 2. Sort UI + no-location fallback → Task 3. ✅
- What's new remote fetch + cache → Task 5. Pure resolve (welcome/first-install, latest-version-only, fallback welcome) → Task 4. Store actions + last-seen → Task 6. Modal + app-root render + Settings re-open → Task 7. Remote JSON + deploy → Task 8. ✅
- Versioning (mobile/iOS/Android) → Task 9. Verification → Task 10. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✅

**Type consistency:** `SortBy` (Task 1) used in Tasks 2–3. `WhatsNewData`/`WhatsNewContent`/`resolveWhatsNew`/`pickManualContent`/`FALLBACK_WELCOME` (Task 4) used in Tasks 5–7. `StoredPrefs.sortBy` + `whatsNewLastSeenVersion` defined together in Task 2, asserted in Tasks 2 & 6. Store `whatsNew` shape `{ visible, content, manual }` defined in Task 6, consumed in Task 7. ✅
