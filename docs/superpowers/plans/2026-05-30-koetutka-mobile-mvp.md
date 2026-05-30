# Koetutka Vaihe 1 — Mobiili-MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rakentaa iOS- ja Android-yhteensopiva Koetutka-mobiilisovellus Expo + React Native -pohjalla. MVP näyttää koelistan, mahdollistaa sijainnin valinnan + suodatuksen + kalenteriviennin, ja toimii Expo Go:ssa puhelimella. Käyttää `@koetutka/shared`-pakettia jaetun logiikan kautta.

**Architecture:** Uusi `mobile/`-paketti pnpm workspacessa. `expo-router` file-based routingilla, 3 tab (Selaa, Suosikit, Asetukset). `zustand`-state, `AsyncStorage`-persistointi. Tiedot ladataan tuotannon JSON-tiedostosta (`https://trotor.github.io/koetutka/koetutka_YYYY.json`). Karttapaikka jää placeholderiksi (Vaihe 2). Suosikit-tab placeholderiksi (Vaihe 4).

**Tech Stack:** Expo SDK 51+, React Native, TypeScript, expo-router, zustand, AsyncStorage, expo-location, expo-file-system, expo-sharing, vitest (pure logic), Expo Go (manuaalinen testaus).

---

## Repo-rakenne Vaihe 1:n jälkeen

```
koetutka/
├── shared/                       # olemassa, Vaihe 0
├── mobile/                       # UUSI
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── metro.config.js
│   ├── index.ts                  # Expo entry
│   ├── vitest.config.ts          # pure logic -testeille
│   ├── app/                      # expo-router
│   │   ├── _layout.tsx           # root
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # tab navigator
│   │   │   ├── index.tsx         # Selaa
│   │   │   ├── favorites.tsx     # Suosikit (placeholder)
│   │   │   └── settings.tsx      # Asetukset
│   │   └── event/[id].tsx        # detail sheet (modal route)
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── FilterChips.tsx
│   │   ├── LocationSection.tsx
│   │   ├── ListMapToggle.tsx
│   │   └── MapPlaceholder.tsx
│   ├── lib/
│   │   ├── data.ts               # fetch JSON + offline cache
│   │   ├── store.ts              # zustand store
│   │   ├── nominatim.ts          # paikkakuntahaku
│   │   ├── preferences.ts        # AsyncStorage wrapper
│   │   ├── ics-export.ts         # ICS save + share
│   │   └── tests/
│   │       ├── data.test.ts
│   │       ├── nominatim.test.ts
│   │       └── preferences.test.ts
│   └── assets/
│       ├── icon.png              # 1024×1024 (myöhemmin)
│       ├── splash.png            # myöhemmin
│       └── adaptive-icon.png     # myöhemmin
└── pnpm-workspace.yaml           # päivitetään: lisätään 'mobile'
```

## Vastuujako tiedostoittain

- **`mobile/app/_layout.tsx`** — Root layout, GestureHandlerRootView + StatusBar.
- **`mobile/app/(tabs)/_layout.tsx`** — Tab navigator (3 tab).
- **`mobile/app/(tabs)/index.tsx`** — Selaa-näkymä: lista/kartta-toggle, suodattimet, korttilista.
- **`mobile/app/(tabs)/favorites.tsx`** — Suosikit-placeholder.
- **`mobile/app/(tabs)/settings.tsx`** — Sijainti (haku + GPS), maksimietäisyys, lajisuodattimet.
- **`mobile/app/event/[id].tsx`** — Yksittäisen kokeen detail-näkymä modaaliroutena.
- **`mobile/components/EventCard.tsx`** — Yksi kortti listalla.
- **`mobile/components/FilterChips.tsx`** — Tyyppi/taso-chipit + max-etäisyys + piilota menneet.
- **`mobile/components/LocationSection.tsx`** — Tekstihaku + GPS-painike.
- **`mobile/components/ListMapToggle.tsx`** — Pilli-toggle "Lista" / "Kartta".
- **`mobile/components/MapPlaceholder.tsx`** — Vaihe 1:ssä pelkkä info-teksti "Karttanäkymä tulossa".
- **`mobile/lib/data.ts`** — `fetchEvents(year)` hae JSON, fallback edelliseen vuoteen, cache.
- **`mobile/lib/store.ts`** — Zustand-store: events, userLocation, filters, isLoading.
- **`mobile/lib/nominatim.ts`** — `searchLocation(query)` Nominatim-API:n kautta.
- **`mobile/lib/preferences.ts`** — `loadPrefs()` / `savePrefs()` AsyncStoragessa.
- **`mobile/lib/ics-export.ts`** — Tallenna ICS cachedir + avaa share sheet.

---

## Task 1: Pnpm workspace + Expo-projektin scaffold

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/metro.config.js`
- Create: `mobile/index.ts`
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/.gitignore`

- [ ] **Step 1: Lisää mobile workspaceen**

Modify `/Users/teroronkko/code/koetutka/pnpm-workspace.yaml`:

```yaml
packages:
  - 'shared'
  - 'mobile'
```

- [ ] **Step 2: Luo mobile/package.json**

Create file `/Users/teroronkko/code/koetutka/mobile/package.json`:

```json
{
  "name": "@koetutka/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@koetutka/shared": "workspace:*",
    "@react-native-async-storage/async-storage": "1.23.1",
    "expo": "~51.0.39",
    "expo-constants": "~16.0.2",
    "expo-file-system": "~17.0.1",
    "expo-linking": "~6.3.1",
    "expo-location": "~17.0.1",
    "expo-router": "~3.5.24",
    "expo-sharing": "~12.0.1",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/react": "~18.2.79",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

(Versiot lukittu Expo SDK 51 -yhteensopiviksi.)

- [ ] **Step 3: Luo mobile/app.json**

Create file `/Users/teroronkko/code/koetutka/mobile/app.json`:

```json
{
  "expo": {
    "name": "Koetutka",
    "slug": "koetutka",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "koetutka",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2d5a27"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.savonnuuskut.koetutka"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2d5a27"
      },
      "package": "com.savonnuuskut.koetutka"
    },
    "plugins": ["expo-router"],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 4: Luo mobile/tsconfig.json**

Create file `/Users/teroronkko/code/koetutka/mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Luo mobile/babel.config.js**

Create file `/Users/teroronkko/code/koetutka/mobile/babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 6: Luo mobile/metro.config.js**

Create file `/Users/teroronkko/code/koetutka/mobile/metro.config.js`:

```javascript
// Metro config that allows resolving the @koetutka/shared workspace package
// outside of mobile/'s node_modules (workspace symlinks).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so changes in shared/ trigger reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from both mobile/ and workspace root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Prevent Metro from hoisting symlink-resolved modules.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

- [ ] **Step 7: Luo mobile/index.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/index.ts`:

```typescript
import 'expo-router/entry';
```

- [ ] **Step 8: Luo mobile/.gitignore**

Create file `/Users/teroronkko/code/koetutka/mobile/.gitignore`:

```
node_modules/
.expo/
dist/
web-build/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
npm-debug.*
yarn-debug.*
yarn-error.*
.DS_Store
```

- [ ] **Step 9: Luo mobile/app/_layout.tsx**

Create file `/Users/teroronkko/code/koetutka/mobile/app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Kokeen tiedot' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 10: Asenna riippuvuudet ja varmista että TS-käännös toimii**

Run:
```bash
pnpm install
pnpm --filter @koetutka/mobile typecheck
```

Expected: install onnistuu virheittä, typecheck onnistuu (`tsc --noEmit` ei tulosta virheitä). On normaalia että `(tabs)`-kansiota ei vielä ole — typecheck ei vielä viittaa siihen.

- [ ] **Step 11: Commit**

```bash
git add pnpm-workspace.yaml mobile/ pnpm-lock.yaml
git commit -m "Scaffold mobile/ Expo + React Native package"
```

---

## Task 2: Tab-navigaation pohja (3 tab)

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx`
- Create: `mobile/app/(tabs)/favorites.tsx`
- Create: `mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Luo mobile/app/(tabs)/_layout.tsx**

Create file `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';

const GREEN = '#2d5a27';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Selaa',
          tabBarLabel: 'Selaa',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Suosikit',
          tabBarLabel: 'Suosikit',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Asetukset',
          tabBarLabel: 'Asetukset',
        }}
      />
    </Tabs>
  );
}
```

Huom: emoji-ikonien sijaan tabBarIcon jää myöhempään polishiin — tekstitabbarit toimivat MVP:nä.

- [ ] **Step 2: Luo mobile/app/(tabs)/index.tsx (Selaa-placeholder)**

Create file `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/index.tsx`:

```typescript
import { Text, View, StyleSheet } from 'react-native';

export default function BrowseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Selaa kokeita</Text>
      <Text style={styles.body}>Data ladataan Task 3:ssa.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 16, color: '#666' },
});
```

- [ ] **Step 3: Luo mobile/app/(tabs)/favorites.tsx**

Create file `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/favorites.tsx`:

```typescript
import { Text, View, StyleSheet } from 'react-native';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Suosikit</Text>
      <Text style={styles.body}>Suosikkitoiminto tulossa Vaiheessa 4.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 16, color: '#666' },
});
```

- [ ] **Step 4: Luo mobile/app/(tabs)/settings.tsx**

Create file `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/settings.tsx`:

```typescript
import { Text, View, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Asetukset</Text>
      <Text style={styles.body}>Sijainti ja suodattimet tulevat Task 5:ssä.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 16, color: '#666' },
});
```

- [ ] **Step 5: Käynnistä Expo Go ja verifioi tabit**

Run:
```bash
pnpm --filter @koetutka/mobile typecheck
pnpm --filter @koetutka/mobile start
```

Avaa Expo Go puhelimellasi (lataa App Store / Play Store), skannaa QR-koodi terminaalista. Vaihtoehtoisesti `i` avaa iOS-simulaattorin (jos Xcode asennettu), `a` Android-emulaattorin.

Expected: appi käynnistyy, näet 3 tabia alaosassa (Selaa / Suosikit / Asetukset), jokainen tab näyttää placeholder-tekstin. Sammuta server `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/
git commit -m "Add tab navigation skeleton with placeholder screens"
```

---

## Task 3: Datan lataus + cache (TDD pure logiikalle)

**Files:**
- Create: `mobile/lib/data.ts`
- Create: `mobile/lib/tests/data.test.ts`
- Create: `mobile/vitest.config.ts`

- [ ] **Step 1: Luo mobile/vitest.config.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Kirjoita epäonnistuvat testit**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/tests/data.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchEvents, BASE_URL } from '../data';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchEvents', () => {
  test('hakee oikean URL:n nykyiselle vuodelle', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'X' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchEvents(2026);

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/koetutka_2026.json`);
  });

  test('palauttaa parsedin event-listan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify([{ id: 'a' }, { id: 'b' }]), { status: 200 }),
      ),
    );

    const events = await fetchEvents(2026);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('a');
  });

  test('kaataa virheen jos status ei OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Not found', { status: 404 })),
    );

    await expect(fetchEvents(2027)).rejects.toThrow();
  });

  test('toinen kerros fallbackaa edelliseen vuoteen 404:n jälkeen', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes('2027')) return new Response('', { status: 404 });
        return new Response(JSON.stringify([{ id: 'a' }]), { status: 200 });
      }),
    );

    // fetchEventsWithFallback yrittää 2027 → 404 → 2026 → ok
    const { fetchEventsWithFallback } = await import('../data');
    const events = await fetchEventsWithFallback(2027);
    expect(events).toHaveLength(1);
    expect(calls).toEqual([
      `${BASE_URL}/koetutka_2027.json`,
      `${BASE_URL}/koetutka_2026.json`,
    ]);
  });
});
```

- [ ] **Step 3: Aja testit varmistaaksesi että ne epäonnistuvat**

Run: `pnpm --filter @koetutka/mobile test`
Expected: FAIL — `../data` ei vielä määrittele `fetchEvents`/`BASE_URL`/`fetchEventsWithFallback`:ia.

- [ ] **Step 4: Toteuta mobile/lib/data.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/data.ts`:

```typescript
import type { Event } from '@koetutka/shared';

export const BASE_URL = 'https://trotor.github.io/koetutka';

/**
 * Hakee tietyn vuoden eventit GitHub Pagesista. Heittää virheen
 * jos vastaus ei ole OK.
 */
export async function fetchEvents(year: number): Promise<Event[]> {
  const url = `${BASE_URL}/koetutka_${year}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Vuoden ${year} dataa ei löytynyt (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Yrittää ensin annetun vuoden, sitten edellisen vuoden. Tarpeellinen
 * vuoden alussa kun seuraavan vuoden tiedostoa ei vielä ole.
 */
export async function fetchEventsWithFallback(year: number): Promise<Event[]> {
  try {
    return await fetchEvents(year);
  } catch {
    return await fetchEvents(year - 1);
  }
}
```

- [ ] **Step 5: Aja testit varmistaaksesi että ne menevät läpi**

Run: `pnpm --filter @koetutka/mobile test`
Expected: PASS — kaikki 4 testiä vihreällä.

- [ ] **Step 6: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 7: Commit**

```bash
git add mobile/lib/data.ts mobile/lib/tests/data.test.ts mobile/vitest.config.ts
git commit -m "Add data fetching with year fallback"
```

---

## Task 4: Zustand-store + useEvents-koukku

**Files:**
- Create: `mobile/lib/store.ts`
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Luo mobile/lib/store.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/store.ts`:

```typescript
import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
}

interface Actions {
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: true,
};

export const useStore = create<State & Actions>((set) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => set({ userLocation }),

  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
```

- [ ] **Step 2: Päivitä Selaa-näkymä lataamaan data**

Modify `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/index.tsx` — korvaa koko sisältö:

```typescript
import { useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useStore } from '@/lib/store';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

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
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title}>
            {item.type} · {item.levels}
          </Text>
          <Text style={styles.sub}>
            {item.location} — {item.date}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>Ei kokeita vielä.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  row: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2d5a27',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
});
```

- [ ] **Step 3: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Käynnistä ja verifioi Expo Go:ssa**

Run: `pnpm --filter @koetutka/mobile start`
Avaa puhelimella. Selaa-tabissa pitäisi näkyä loading-spinner ja sitten lista kokeista (n. 195 vuoden 2026 osalta). Tarkista että tieto näkyy: tyyppi, taso, paikkakunta, päivämäärä.

Jos näkyy "Network request failed", se voi johtua simulaattorista — testaa oikealla puhelimella.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/store.ts mobile/app/(tabs)/index.tsx
git commit -m "Load events from production JSON into store"
```

---

## Task 5: Sijainnin asetukset (tekstihaku + GPS)

**Files:**
- Create: `mobile/lib/nominatim.ts`
- Create: `mobile/lib/tests/nominatim.test.ts`
- Create: `mobile/components/LocationSection.tsx`
- Modify: `mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Kirjoita testit Nominatim-haulle**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/tests/nominatim.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { searchLocation } from '../nominatim';

beforeEach(() => vi.restoreAllMocks());

describe('searchLocation', () => {
  test('palauttaa Nominatim-tulosten lat/lon ja nimen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify([
        { display_name: 'Helsinki, Suomi', lat: '60.1699', lon: '24.9384' },
        { display_name: 'Helsinki, Toinen', lat: '60.2', lon: '24.9' },
      ]), { status: 200 }),
    ));

    const results = await searchLocation('Helsinki');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: 'Helsinki, Suomi',
      lat: 60.1699,
      lng: 24.9384,
    });
  });

  test('tyhjä haku palauttaa tyhjän taulukon ilman API-kutsua', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchLocation('   ');
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('palauttaa tyhjän taulukon API-virheellä', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    const results = await searchLocation('Helsinki');
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Aja testit (epäonnistuu)**

Run: `pnpm --filter @koetutka/mobile test`
Expected: FAIL — `../nominatim` puuttuu.

- [ ] **Step 3: Toteuta mobile/lib/nominatim.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/nominatim.ts`:

```typescript
export interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Hae paikannimi-ehdotuksia Nominatim-API:sta. Palauttaa tyhjän
 * taulukon jos hakusana on tyhjä tai jos API epäonnistuu.
 */
export async function searchLocation(query: string): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed,
  )}&format=json&countrycodes=fi&limit=5`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Koetutka-Mobile/0.1 (https://github.com/trotor/koetutka)' },
    });
    if (!response.ok) return [];
    const items: NominatimItem[] = await response.json();
    return items.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Aja testit (läpäisee)**

Run: `pnpm --filter @koetutka/mobile test`
Expected: PASS — yhteensä 7 testiä (4 data + 3 nominatim).

- [ ] **Step 5: Luo LocationSection-komponentti**

Create file `/Users/teroronkko/code/koetutka/mobile/components/LocationSection.tsx`:

```typescript
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { searchLocation, type LocationResult } from '@/lib/nominatim';
import { useStore } from '@/lib/store';

export function LocationSection() {
  const userLocation = useStore((s) => s.userLocation);
  const setUserLocation = useStore((s) => s.setUserLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const found = await searchLocation(text);
    setResults(found);
    setIsSearching(false);
  }

  function selectResult(loc: LocationResult) {
    setUserLocation(loc);
    setQuery('');
    setResults([]);
  }

  async function useGps() {
    setIsGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lupa evätty', 'Sijainnin käyttöä ei sallittu.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: 'Nykyinen sijainti',
      });
    } catch (e) {
      Alert.alert('Virhe', 'Sijaintia ei voitu hakea.');
    } finally {
      setIsGpsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sijaintisi</Text>
      {userLocation && (
        <View style={styles.currentRow}>
          <Text style={styles.currentText}>📍 {userLocation.name}</Text>
          <Pressable onPress={() => setUserLocation(null)}>
            <Text style={styles.clear}>Poista</Text>
          </Pressable>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Kirjoita paikkakunta..."
        value={query}
        onChangeText={handleSearch}
      />
      {isSearching && <Text style={styles.hint}>Haetaan…</Text>}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.lat}-${item.lng}-${idx}`}
          style={styles.suggestions}
          renderItem={({ item }) => (
            <Pressable onPress={() => selectResult(item)} style={styles.suggestion}>
              <Text>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable onPress={useGps} style={styles.gps} disabled={isGpsLoading}>
        <Text style={styles.gpsText}>{isGpsLoading ? '⏳ Haetaan…' : '📍 Käytä sijaintiani'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e8f0e6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  currentText: { fontSize: 14, color: '#1a472a' },
  clear: { fontSize: 13, color: '#b91c1c' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  suggestions: { maxHeight: 200, marginTop: 4 },
  suggestion: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gps: { marginTop: 12, padding: 12, backgroundColor: '#2d5a27', borderRadius: 6, alignItems: 'center' },
  gpsText: { color: 'white', fontWeight: '600' },
});
```

- [ ] **Step 6: Päivitä Settings-näkymä**

Modify `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/settings.tsx` — korvaa koko sisältö:

```typescript
import { ScrollView, StyleSheet } from 'react-native';
import { LocationSection } from '@/components/LocationSection';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LocationSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#f8f9fa', flexGrow: 1 },
});
```

- [ ] **Step 7: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 8: Manuaalitestaus Expo Go:ssa**

Run: `pnpm --filter @koetutka/mobile start`

Asetukset-tabissa:
1. Kirjoita "Helsinki" → ehdotukset näkyvät → klikkaa → sijainti vaihtuu
2. Klikkaa "Käytä sijaintiani" → lupakysely → sijainti vaihtuu GPS-pohjaiseksi
3. Klikkaa "Poista" → sijainti tyhjenee

- [ ] **Step 9: Commit**

```bash
git add mobile/lib/nominatim.ts mobile/lib/tests/nominatim.test.ts mobile/components/LocationSection.tsx mobile/app/(tabs)/settings.tsx
git commit -m "Add location picker with Nominatim search and GPS"
```

---

## Task 6: Etäisyydet + filtterit Selaa-näkymässä

**Files:**
- Create: `mobile/components/FilterChips.tsx`
- Create: `mobile/components/EventCard.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Luo EventCard-komponentti**

Create file `/Users/teroronkko/code/koetutka/mobile/components/EventCard.tsx`:

```typescript
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import type { Event } from '@koetutka/shared';

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {event.type} · {event.levels}
          </Text>
          {typeof event.distance === 'number' && (
            <Text style={styles.distance}>{event.distance} km</Text>
          )}
        </View>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.date}>
          {event.date} · ilm. {event.entry_date}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2d5a27',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1 },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
});
```

- [ ] **Step 2: Luo FilterChips-komponentti**

Create file `/Users/teroronkko/code/koetutka/mobile/components/FilterChips.tsx`:

```typescript
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

const TYPES = ['NOME-B', 'NOU', 'NOWT', 'NOME-A'];
const LEVELS = ['ALO', 'AVO', 'VOI'];
const DISTANCES: { label: string; value: number | null }[] = [
  { label: 'Mikä tahansa', value: null },
  { label: '100 km', value: 100 },
  { label: '200 km', value: 200 },
  { label: '500 km', value: 500 },
];

export function FilterChips() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const userLocation = useStore((s) => s.userLocation);

  function toggleType(type: string) {
    const next = new Set(filters.activeTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setFilters({ activeTypes: next });
  }

  function toggleLevel(level: string) {
    const next = new Set(filters.activeLevels);
    if (next.has(level)) next.delete(level);
    else next.add(level);
    setFilters({ activeLevels: next });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Laji</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => toggleType(t)}
            style={[styles.chip, filters.activeTypes?.has(t) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeTypes?.has(t) && styles.chipTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Taso</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => toggleLevel(l)}
            style={[styles.chip, filters.activeLevels?.has(l) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeLevels?.has(l) && styles.chipTextActive]}>
              {l}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {userLocation && (
        <>
          <Text style={styles.label}>Max etäisyys</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {DISTANCES.map((d) => (
              <Pressable
                key={d.label}
                onPress={() => setFilters({ maxDistanceKm: d.value })}
                style={[styles.chip, filters.maxDistanceKm === d.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, filters.maxDistanceKm === d.value && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Piilota menneet</Text>
        <Pressable
          onPress={() => setFilters({ hidePast: !filters.hidePast })}
          style={[styles.toggle, filters.hidePast && styles.toggleOn]}
        >
          <Text style={[styles.toggleText, filters.hidePast && styles.toggleTextOn]}>
            {filters.hidePast ? 'Päällä' : 'Pois'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white' },
  label: { fontSize: 12, color: '#888', marginTop: 8, marginBottom: 4, fontWeight: '600' },
  row: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#e8f0e6',
  },
  chipActive: { backgroundColor: '#2d5a27' },
  chipText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  toggleOn: { backgroundColor: '#2d5a27' },
  toggleText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  toggleTextOn: { color: 'white' },
});
```

- [ ] **Step 3: Päivitä Selaa-näkymä käyttämään shared/-suodatusta + etäisyyksiä**

Modify `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/index.tsx` — korvaa koko sisältö:

```typescript
import { useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { addDistances, filterEvents } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { FilterChips } from '@/components/FilterChips';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);
  const userLocation = useStore((s) => s.userLocation);
  const filters = useStore((s) => s.filters);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    // sort by distance if available, else by date
    return [...filtered].sort((a, b) => {
      if (a.distance !== undefined && a.distance !== null && b.distance !== undefined && b.distance !== null) {
        return a.distance - b.distance;
      }
      return a.date_sort.localeCompare(b.date_sort);
    });
  }, [events, userLocation, filters]);

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
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FilterChips />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
        }
        ListHeaderComponent={
          <Text style={styles.count}>{visible.length} koetta</Text>
        }
        onRefresh={() => loadEvents(new Date().getFullYear())}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12 },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
});
```

- [ ] **Step 4: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 5: Manuaalitestaus**

Run: `pnpm --filter @koetutka/mobile start`

Selaa-tabissa:
1. Suodatinpilleistä klikkaa NOME-B → lista suppenee NOME-B-kokeisiin
2. Aseta sijainti Asetuksissa → palaa Selaaan → kortit järjestyvät etäisyyden mukaan
3. Klikkaa "100 km" → vain lähellä olevat
4. Pull-to-refresh latailee uudelleen
5. Piilota menneet -toggle vaihtaa näkymää

- [ ] **Step 6: Commit**

```bash
git add mobile/components/EventCard.tsx mobile/components/FilterChips.tsx mobile/app/(tabs)/index.tsx
git commit -m "Add filter chips and distance-aware sorted browse list"
```

---

## Task 7: Detail-näkymä (modal route)

**Files:**
- Create: `mobile/app/event/[id].tsx`

- [ ] **Step 1: Luo event/[id].tsx**

Create file `/Users/teroronkko/code/koetutka/mobile/app/event/[id].tsx`:

```typescript
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { getCostValue, getOptionalCosts } from '@koetutka/shared';
import { useStore } from '@/lib/store';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useStore((s) => s.events.find((e) => e.id === id));

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Koetta ei löytynyt.</Text>
      </View>
    );
  }

  const cost = getCostValue(event.cost);
  const costMember = getCostValue(event.cost_member);
  const optionalCosts = getOptionalCosts(event.cost);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        {event.type} · {event.levels}
      </Text>
      <Text style={styles.location}>📍 {event.location}</Text>
      <Text style={styles.date}>📅 {event.date}</Text>
      {typeof event.distance === 'number' && (
        <Text style={styles.distance}>🚗 {event.distance} km</Text>
      )}

      <InfoRow label="Ilmoittautuminen" value={event.entry_date} />
      {event.organizer && <InfoRow label="Järjestäjä" value={event.organizer} />}
      {event.judges.length > 0 && (
        <InfoRow label="Tuomarit" value={event.judges.join(', ')} />
      )}
      {event.secretary.name && (
        <InfoRow label="Sihteeri" value={`${event.secretary.name}${event.secretary.phone ? `\n${event.secretary.phone}` : ''}${event.secretary.email ? `\n${event.secretary.email}` : ''}`} />
      )}
      {event.official.name && (
        <InfoRow label="Yhteyshenkilö" value={`${event.official.name}${event.official.phone ? `\n${event.official.phone}` : ''}${event.official.email ? `\n${event.official.email}` : ''}`} />
      )}
      {cost !== null && <InfoRow label="Maksu" value={`${cost} €`} />}
      {costMember !== null && <InfoRow label="Jäsenmaksu" value={`${costMember} €`} />}
      {optionalCosts.length > 0 && (
        <InfoRow
          label="Lisämaksut"
          value={optionalCosts
            .map((c) => `${c.name || c.description || 'lisämaksu'}: ${c.cost ?? '?'} €`)
            .join('\n')}
        />
      )}
      {event.description && <InfoRow label="Kuvaus" value={event.description} />}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  location: { fontSize: 16, color: '#333', marginBottom: 4 },
  date: { fontSize: 14, color: '#555', marginBottom: 4 },
  distance: { fontSize: 14, color: '#555', marginBottom: 12 },
  row: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 6 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 14, color: '#333' },
});
```

Huom: tämä avautuu modaalina koska `_layout.tsx` määrittelee sen `presentation: 'modal'`. Liu'uta alas sulkeaksesi.

- [ ] **Step 2: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 3: Manuaalitestaus**

Run: `pnpm --filter @koetutka/mobile start`

Selaa-tabissa klikkaa korttia → detail-modal avautuu liukuen ylös. Tarkista että tieto näkyy (paikkakunta, päivämäärä, etäisyys jos sijainti asetettu, ilmoittautumisaika, hinnat, tuomarit, järjestäjä). Liu'uta alas sulkeaksesi.

- [ ] **Step 4: Commit**

```bash
git add mobile/app/event/
git commit -m "Add event detail modal screen"
```

---

## Task 8: Kalenterivienti (.ics → laite)

**Files:**
- Create: `mobile/lib/ics-export.ts`
- Modify: `mobile/app/event/[id].tsx`

- [ ] **Step 1: Toteuta ICS-vienti**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/ics-export.ts`:

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateICS, type Event } from '@koetutka/shared';

type EventType = 'event' | 'registration';

/**
 * Tuottaa ICS-tiedoston cachedirectoryyn ja avaa share-sheetin.
 * Käyttäjä voi valita "Lisää kalenteriin" -toiminnon.
 */
export async function exportEventICS(
  event: Event,
  type: EventType,
  userLocationName?: string,
): Promise<void> {
  try {
    const ics = generateICS(event, { type, userLocationName, index: 0 });
    const prefix = type === 'registration' ? 'ilmoittautuminen' : 'koe';
    const safeLoc = event.location.replace(/[^\p{L}\d_-]/gu, '_');
    const filename = `koetutka-${prefix}-${safeLoc}-${event.date.replace(/\./g, '-')}.ics`;
    const uri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, ics, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Jakaminen ei käytössä',
        'Tiedosto tallennettiin laitteelle, mutta jakaminen ei ole tuettu tällä laitteella.',
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'text/calendar',
      dialogTitle: type === 'registration' ? 'Ilmoittautumismuistutus' : 'Lisää kalenteriin',
      UTI: 'public.calendar-event',
    });
  } catch (e) {
    Alert.alert('Virhe', 'Kalenteritiedoston luonti epäonnistui.');
  }
}
```

- [ ] **Step 2: Lisää painikkeet detail-näkymään**

Modify `/Users/teroronkko/code/koetutka/mobile/app/event/[id].tsx` — lisää importit ylös ja painikerivit `</ScrollView>`:n yläpuolelle. Muutos kohdistuu kahteen kohtaan:

**Lisää imports-osioon (toisten importtien viereen):**
```typescript
import { Pressable } from 'react-native';
import { exportEventICS } from '@/lib/ics-export';
```

**Korvaa rivi `      {event.description && <InfoRow label="Kuvaus" value={event.description} />}` ja sitä seuraava `</ScrollView>` näin:**

```typescript
      {event.description && <InfoRow label="Kuvaus" value={event.description} />}

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() => exportEventICS(event, 'event', useStore.getState().userLocation?.name)}
        >
          <Text style={styles.buttonText}>📅 Lisää kalenteriin</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => exportEventICS(event, 'registration', useStore.getState().userLocation?.name)}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>🔔 Ilmoittautumismuistutus</Text>
        </Pressable>
      </View>
    </ScrollView>
```

**Lisää tyylit `styles`-objektiin:**
```typescript
  buttonRow: { marginTop: 12, gap: 8 },
  button: {
    backgroundColor: '#2d5a27',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2d5a27',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  buttonTextSecondary: { color: '#2d5a27' },
```

- [ ] **Step 3: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Manuaalitestaus**

Run: `pnpm --filter @koetutka/mobile start`

Detail-näkymässä:
1. Klikkaa "Lisää kalenteriin" → share-sheet avautuu → valitse "Lisää kalenteriin" (iOS) tai vastaava (Android)
2. Tarkista kalenteriappista että tapahtuma ilmestyi oikealla nimellä, paikkakunnalla, päivämäärällä
3. Tee sama "Ilmoittautumismuistutus"-painikkeelle

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/ics-export.ts mobile/app/event/[id].tsx
git commit -m "Add ICS calendar export with share sheet"
```

---

## Task 9: Lista/kartta-toggle + kartta-placeholder

**Files:**
- Create: `mobile/components/ListMapToggle.tsx`
- Create: `mobile/components/MapPlaceholder.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Luo ListMapToggle**

Create file `/Users/teroronkko/code/koetutka/mobile/components/ListMapToggle.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  value: 'list' | 'map';
  onChange: (next: 'list' | 'map') => void;
}

export function ListMapToggle({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.btn, value === 'list' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'list' && styles.textActive]}>📋 Lista</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('map')}
        style={[styles.btn, value === 'map' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'map' && styles.textActive]}>🗺 Kartta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#e8f0e6',
    borderRadius: 999,
    padding: 3,
    margin: 12,
  },
  btn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 999 },
  btnActive: { backgroundColor: '#2d5a27' },
  text: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  textActive: { color: 'white' },
});
```

- [ ] **Step 2: Luo MapPlaceholder**

Create file `/Users/teroronkko/code/koetutka/mobile/components/MapPlaceholder.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export function MapPlaceholder({ eventCount }: { eventCount: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Karttanäkymä tulossa</Text>
      <Text style={styles.body}>
        {eventCount} koetta valittuihin suodattimiin sopivaa kohdetta. Kartta lisätään
        Vaiheessa 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
```

- [ ] **Step 3: Integroi togglet Selaa-näkymään**

Modify `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/index.tsx` — lisää useState ja toggle, valitse näkymä togglen mukaan. Korvaa koko sisältö:

```typescript
import { useEffect, useMemo, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { addDistances, filterEvents } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { FilterChips } from '@/components/FilterChips';
import { ListMapToggle } from '@/components/ListMapToggle';
import { MapPlaceholder } from '@/components/MapPlaceholder';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);
  const userLocation = useStore((s) => s.userLocation);
  const filters = useStore((s) => s.filters);

  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    return [...filtered].sort((a, b) => {
      if (a.distance !== undefined && a.distance !== null && b.distance !== undefined && b.distance !== null) {
        return a.distance - b.distance;
      }
      return a.date_sort.localeCompare(b.date_sort);
    });
  }, [events, userLocation, filters]);

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
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ListMapToggle value={view} onChange={setView} />
      <FilterChips />
      {view === 'list' ? (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <EventCard event={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
          }
          ListHeaderComponent={
            <Text style={styles.count}>{visible.length} koetta</Text>
          }
          onRefresh={() => loadEvents(new Date().getFullYear())}
          refreshing={isLoading}
        />
      ) : (
        <MapPlaceholder eventCount={visible.length} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12 },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
});
```

- [ ] **Step 4: Verifioi typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 5: Manuaalitestaus**

Run: `pnpm --filter @koetutka/mobile start`

Selaa-tabissa klikkaa "🗺 Kartta" → MapPlaceholder näkyy, lukumäärä näyttää suodatettujen kokeiden määrän. Klikkaa "📋 Lista" → palaa listanäkymään.

- [ ] **Step 6: Commit**

```bash
git add mobile/components/ListMapToggle.tsx mobile/components/MapPlaceholder.tsx mobile/app/(tabs)/index.tsx
git commit -m "Add list/map toggle with map placeholder"
```

---

## Task 10: Preferenssien persistointi (AsyncStorage)

**Files:**
- Create: `mobile/lib/preferences.ts`
- Create: `mobile/lib/tests/preferences.test.ts`
- Modify: `mobile/lib/store.ts`

- [ ] **Step 1: Kirjoita testit puhtaalle serialisoinnille**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/tests/preferences.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { serializePrefs, deserializePrefs, type StoredPrefs } from '../preferences';
import type { FilterOptions } from '@koetutka/shared';

describe('serializePrefs / deserializePrefs', () => {
  test('round-trippaa userLocation ja filtterit', () => {
    const prefs: StoredPrefs = {
      userLocation: { lat: 60.17, lng: 24.94, name: 'Helsinki' },
      filters: {
        searchTerm: 'nome',
        activeTypes: new Set(['NOME-B']),
        activeLevels: new Set(['ALO', 'AVO']),
        maxDistanceKm: 200,
        hidePast: true,
      },
    };
    const json = serializePrefs(prefs);
    const back = deserializePrefs(json);
    expect(back.userLocation).toEqual(prefs.userLocation);
    expect(back.filters.searchTerm).toBe('nome');
    expect(back.filters.activeTypes).toEqual(new Set(['NOME-B']));
    expect(back.filters.activeLevels).toEqual(new Set(['ALO', 'AVO']));
    expect(back.filters.maxDistanceKm).toBe(200);
    expect(back.filters.hidePast).toBe(true);
  });

  test('deserializePrefs palauttaa defaultit jos JSON on viallinen', () => {
    const back = deserializePrefs('{not json');
    expect(back.userLocation).toBe(null);
    expect(back.filters.activeTypes).toEqual(new Set());
  });

  test('deserializePrefs palauttaa defaultit tyhjälle stringille', () => {
    const back = deserializePrefs('');
    expect(back.userLocation).toBe(null);
  });
});
```

- [ ] **Step 2: Aja testit (epäonnistuu)**

Run: `pnpm --filter @koetutka/mobile test`
Expected: FAIL — `../preferences` puuttuu.

- [ ] **Step 3: Toteuta preferences.ts**

Create file `/Users/teroronkko/code/koetutka/mobile/lib/preferences.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterOptions, UserLocation } from '@koetutka/shared';

const KEY = 'koetutka:prefs:v1';

export interface StoredPrefs {
  userLocation: UserLocation | null;
  filters: FilterOptions;
}

const DEFAULTS: StoredPrefs = {
  userLocation: null,
  filters: {
    searchTerm: '',
    activeTypes: new Set(),
    activeLevels: new Set(),
    maxDistanceKm: null,
    hidePast: true,
  },
};

interface JsonShape {
  userLocation: UserLocation | null;
  filters: {
    searchTerm?: string;
    activeTypes?: string[];
    activeLevels?: string[];
    maxDistanceKm?: number | null;
    hidePast?: boolean;
  };
}

export function serializePrefs(prefs: StoredPrefs): string {
  const json: JsonShape = {
    userLocation: prefs.userLocation,
    filters: {
      searchTerm: prefs.filters.searchTerm,
      activeTypes: Array.from(prefs.filters.activeTypes ?? []),
      activeLevels: Array.from(prefs.filters.activeLevels ?? []),
      maxDistanceKm: prefs.filters.maxDistanceKm,
      hidePast: prefs.filters.hidePast,
    },
  };
  return JSON.stringify(json);
}

export function deserializePrefs(text: string): StoredPrefs {
  if (!text) return DEFAULTS;
  try {
    const parsed = JSON.parse(text) as JsonShape;
    return {
      userLocation: parsed.userLocation ?? null,
      filters: {
        searchTerm: parsed.filters?.searchTerm ?? '',
        activeTypes: new Set(parsed.filters?.activeTypes ?? []),
        activeLevels: new Set(parsed.filters?.activeLevels ?? []),
        maxDistanceKm: parsed.filters?.maxDistanceKm ?? null,
        hidePast: parsed.filters?.hidePast ?? true,
      },
    };
  } catch {
    return DEFAULTS;
  }
}

export async function loadPrefs(): Promise<StoredPrefs> {
  const text = await AsyncStorage.getItem(KEY);
  return deserializePrefs(text ?? '');
}

export async function savePrefs(prefs: StoredPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, serializePrefs(prefs));
}
```

- [ ] **Step 4: Aja testit (läpäisee)**

Run: `pnpm --filter @koetutka/mobile test`
Expected: PASS — yhteensä 10 testiä (4 data + 3 nominatim + 3 preferences).

- [ ] **Step 5: Lataa ja tallenna prefs storessa**

Modify `/Users/teroronkko/code/koetutka/mobile/lib/store.ts` — korvaa koko sisältö (lisää init ja persistointi):

```typescript
import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { loadPrefs, savePrefs } from './preferences';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
  prefsLoaded: boolean;
}

interface Actions {
  initFromStorage: () => Promise<void>;
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: true,
};

export const useStore = create<State & Actions>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      prefsLoaded: true,
    });
  },

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => {
    set({ userLocation });
    void savePrefs({ userLocation, filters: get().filters });
  },

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters });
    void savePrefs({ userLocation: get().userLocation, filters });
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    void savePrefs({ userLocation: get().userLocation, filters: defaultFilters });
  },
}));
```

- [ ] **Step 6: Kutsu initFromStorage app-käynnistyksessä**

Modify `/Users/teroronkko/code/koetutka/mobile/app/_layout.tsx` — korvaa koko sisältö:

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  const init = useStore((s) => s.initFromStorage);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Kokeen tiedot' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 7: Verifioi typecheck ja testit**

Run: `pnpm --filter @koetutka/mobile typecheck && pnpm --filter @koetutka/mobile test`
Expected: typecheck clean, 10 testiä läpi.

- [ ] **Step 8: Manuaalitestaus**

Run: `pnpm --filter @koetutka/mobile start`

1. Aseta sijainti Asetuksissa
2. Klikkaa Selaa, valitse "NOME-B" -filtteri ja "100 km"
3. Sammuta server (`Ctrl+C`) ja käynnistä uudelleen
4. Avaa Expo Go uudelleen
5. **Sijainti ja filtterit pitäisi muistaa.**

- [ ] **Step 9: Commit**

```bash
git add mobile/lib/preferences.ts mobile/lib/tests/preferences.test.ts mobile/lib/store.ts mobile/app/_layout.tsx
git commit -m "Persist user location and filters to AsyncStorage"
```

---

## Task 11: Polish + lopullinen verifiointi

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (empty state, etäisyysformaatti)
- Modify: `mobile/components/LocationSection.tsx` (tarkennus)
- Create: `mobile/README.md`

- [ ] **Step 1: Tarkista empty state ja virhetilat Selaa-näkymässä**

Tämä on jo perustasolla kunnossa, mutta varmistetaan että:
- "Ei kokeita näillä suodattimilla" -teksti ehdottaa filterien resetointia
- Verkkovirheessä on Retry-painike

Modify `/Users/teroronkko/code/koetutka/mobile/app/(tabs)/index.tsx` — etsi `ListEmptyComponent` ja korvaa Text-elementti:

```typescript
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
            <Text style={styles.emptyHint}>Kokeile suuremman etäisyyden tai vähemmän rajauksia.</Text>
          </View>
        }
```

Etsi `error`-näkymä ja vaihda näin:

```typescript
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
```

Lisää tyylit:

```typescript
  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyHint: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' },
  retryHint: { color: '#2d5a27', fontSize: 14, marginTop: 12, textDecorationLine: 'underline' },
```

- [ ] **Step 2: Luo mobile/README.md**

Create file `/Users/teroronkko/code/koetutka/mobile/README.md`:

```markdown
# Koetutka Mobile

Expo + React Native -mobiilisovellus, joka näyttää SNJ:n noutajakokeet käyttäjän sijainnista.

## Kehityskäyttö

```bash
# repo-juuressa:
pnpm install

# käynnistä Metro-bundler:
pnpm --filter @koetutka/mobile start

# Avaa Expo Go puhelimellasi ja skannaa QR-koodi.
# Tai paina 'i' (iOS-simulaattori) / 'a' (Android-emulaattori).
```

## Testit

```bash
pnpm --filter @koetutka/mobile test
pnpm --filter @koetutka/mobile typecheck
```

## Build (tulevaisuudessa, Vaihe 4)

Tällä hetkellä appi pyörii vain Expo Go:ssa. Production-build (App Store, Play Store)
asennetaan Vaiheessa 4 EAS Buildilla.

## Rakenne

- `app/` — expo-router file-based routes (näytöt + layout)
- `components/` — uudelleenkäytettävät React-komponentit
- `lib/` — puhdas TypeScript (datan haku, store, ICS, sijainti, persistointi)
- `lib/tests/` — vitest-testit puhtaalle logiikalle

Liiketoimintalogiikka (etäisyys, suodatus, ICS-generointi) tulee `@koetutka/shared`
-paketista, joka on jaettu web-sovelluksen kanssa.
```

- [ ] **Step 3: Aja kaikki testit ja typecheck**

Run:
```bash
pnpm --filter @koetutka/mobile typecheck
pnpm --filter @koetutka/mobile test
pnpm test  # ajaa myös sharedin testit
```
Expected: typecheck clean, mobile tests 10 läpi, shared tests 31 läpi.

- [ ] **Step 4: Käynnistä ja loppu-regression manuaalisesti**

Run: `pnpm --filter @koetutka/mobile start`

Käy läpi:
1. **Ensimmäinen käynnistys**: app avautuu Selaa-tabiin, lista latautuu
2. **Sijainti**: aseta sijainti tekstihaulla → kortit järjestyvät etäisyyden mukaan
3. **GPS**: testaa "Käytä sijaintiani" → lupakysely → sijainti vaihtuu
4. **Suodattimet**: NOME-B + 200 km → näkyy vain rajatut
5. **Detail-näkymä**: klikkaa kortti → modal avautuu, kaikki tieto näkyy
6. **Kalenteri**: "Lisää kalenteriin" → ICS jaetaan → kalenteriappi avautuu
7. **Kartta-toggle**: klikkaa "🗺 Kartta" → placeholder näkyy
8. **Suosikit-tab**: placeholder-teksti näkyy
9. **Persistointi**: sammuta + käynnistä uudelleen → sijainti ja suodattimet muistissa
10. **Pull-to-refresh**: liu'uta listaa alas → uudelleenlataus
11. **Virhetilanne**: ota lennätilatila päälle puhelimessa, käynnistä uudelleen → virheviesti + "Yritä uudelleen"

- [ ] **Step 5: Verifioi typecheck + testit kerran lopuksi**

Run: `pnpm --filter @koetutka/mobile typecheck && pnpm --filter @koetutka/mobile test`
Expected: kaikki vihreällä.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/(tabs)/index.tsx mobile/README.md
git commit -m "Polish empty/error states and document mobile package"
```

---

## Mitä Vaihe 1:n jälkeen

Kun tämä plan on suoritettu loppuun:

- `mobile/`-paketti pyörii Expo Go:ssa puhelimellasi
- Käyttäjä voi: ladata kokeet, valita sijainnin (haulla tai GPS:llä), suodattaa lajin/tason/etäisyyden mukaan, nähdä yksityiskohdat, viedä kalenteriin
- Tila persistoituu — sammutuksen jälkeenkin sijainti ja suodattimet muistissa
- Karttanäkymä ja suosikit ovat placeholdereinä
- 41 testiä yhteensä (31 shared + 10 mobile) ajetaan CI:ssä

Seuraavat plan-dokumentit:
- **Vaihe 2 plan**: oikea karttanäkymä (`react-native-maps`), suosikit, jako, "Aja" -reittiohjeet
- **Vaihe 3 plan**: background fetch + paikalliset ilmoitukset (uudet kokeet, ilmoittautumismuistutukset)
- **Vaihe 4 plan**: ikoni + splash + EAS Build → App Store + Google Play submission

Vaihe 2 voi alkaa heti kun Vaihe 1 on käyttöösi mieleinen — tai pidettäköön Vaihe 1 sellaisenaan joksikin aikaa että ehdit testata sitä tosielämässä ennen seuraavaa.
