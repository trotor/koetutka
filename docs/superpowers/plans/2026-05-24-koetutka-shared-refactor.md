# Koetutka Vaihe 0 — `shared/`-refaktorointi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eriyttää `index.html`:n puhdas liiketoimintalogiikka uudeksi `shared/` TypeScript-moduuliksi, jonka tuleva mobiilisovellus voi importata. Web-versio pysyy toiminnallisesti identtisenä.

**Architecture:** Pnpm workspace -monorepo: root + `shared/`-paketti. `shared/` on TypeScript-paketti joka kääntyy ESM-JS:ksi `shared/dist/`-kansioon. `index.html` pysyy juuressa ja importtaa `<script type="module">` -tagilla `./shared/dist/*.js`-tiedostoja. GitHub Actions kääntää `shared/`:n ennen deploya.

**Tech Stack:** TypeScript 5.x, pnpm 9.x workspaces, vitest (testit), Node.js 20+.

---

## Repo-rakenne refaktorin jälkeen

```
koetutka/
├── package.json                 # workspace root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json           # jaettu TS-konfiguraatio
├── index.html                   # pysyy juuressa, modifioitu
├── banner.jpg, favicon*, apple-touch-icon.png
├── koetutka_YYYY.json           # ei muutoksia
├── snj_kokeet.py                # ei muutoksia
├── coordinates_cache.json       # ei muutoksia
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts             # re-export julkinen API
│   │   ├── types.ts             # Event, Cost, Person, ...
│   │   ├── distance.ts          # haversine
│   │   ├── formatters.ts        # cost, date, distance
│   │   ├── filters.ts           # event filtering
│   │   └── ics.ts               # ICS-generointi (pure)
│   ├── tests/
│   │   ├── distance.test.ts
│   │   ├── formatters.test.ts
│   │   ├── filters.test.ts
│   │   └── ics.test.ts
│   └── dist/                    # gitignored, tsc-output
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
└── .github/workflows/deploy.yml # päivitetään
```

## Vastuujako tiedostoittain

- **`shared/src/types.ts`** — `Event`, `Cost`, `Person`, `Class`, `Coordinates`, `UserLocation`, `FilterOptions`. Vain tyyppi-määrittelyt.
- **`shared/src/distance.ts`** — `haversine(lat1, lon1, lat2, lon2): number`. Yksi puhdas funktio.
- **`shared/src/formatters.ts`** — `getCostValue(cost): number | null`, `getOptionalCosts(cost): OptionalCost[]`. Pure funktiot.
- **`shared/src/filters.ts`** — `filterEvents(events, options): Event[]`, `addDistances(events, userLocation): Event[]`. Pure funktiot.
- **`shared/src/ics.ts`** — `generateICS(event, options): string`. Tuottaa ICS-tekstin; ei DOM-riippuvuutta (Blob/download jää index.html:ään).
- **`shared/src/index.ts`** — barrel-tiedosto, re-exporttaa kaikki yllä olevat.
- **`index.html`** — DOM-koodi, event-kuuntelijat, UI-rendaus ja `downloadICS`-wrapperi joka kutsuu `generateICS`:ä ja luo Blobin selaimessa.

---

## Task 1: Pnpm workspace -setup

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Modify: `.gitignore`

- [ ] **Step 1: Varmista että pnpm on asennettu**

Run: `pnpm --version`
Expected: `9.x` tai uudempi. Jos puuttuu, asenna: `npm install -g pnpm@9`

- [ ] **Step 2: Luo root package.json**

Create file `package.json` at repo root with content:

```json
{
  "name": "koetutka-monorepo",
  "private": true,
  "version": "0.0.0",
  "description": "Koetutka workspace root",
  "scripts": {
    "build": "pnpm --filter shared build",
    "test": "pnpm --filter shared test",
    "typecheck": "pnpm --filter shared typecheck"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 3: Luo pnpm-workspace.yaml**

Create file `pnpm-workspace.yaml` at repo root:

```yaml
packages:
  - 'shared'
```

(Phase 1 lisää tähän `'mobile'`.)

- [ ] **Step 4: Luo tsconfig.base.json**

Create file `tsconfig.base.json` at repo root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Päivitä .gitignore**

Modify `.gitignore` — add these lines under existing content (alphabetical order or append):

```
# Node
node_modules/

# Build output
shared/dist/
```

- [ ] **Step 6: Aja pnpm install (luo lockfilen)**

Run: `pnpm install`
Expected: luo `pnpm-lock.yaml`, asentaa TypeScriptin `node_modules/`:iin. Ei virheitä.

- [ ] **Step 7: Verify root setup**

Run: `pnpm --version && ls -la package.json pnpm-workspace.yaml tsconfig.base.json`
Expected: kaikki kolme tiedostoa olemassa.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json pnpm-lock.yaml .gitignore
git commit -m "Setup pnpm workspace at repo root"
```

---

## Task 2: Shared-paketin scaffold

**Files:**
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/vitest.config.ts`
- Create: `shared/src/index.ts`

- [ ] **Step 1: Luo shared/package.json**

Create file `shared/package.json`:

```json
{
  "name": "@koetutka/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./*": {
      "import": "./dist/*.js",
      "types": "./dist/*.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Luo shared/tsconfig.json**

Create file `shared/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["tests", "dist", "node_modules"]
}
```

- [ ] **Step 3: Luo shared/vitest.config.ts**

Create file `shared/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Luo shared/src/index.ts (tyhjä barrel)**

Create file `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
// Re-exports added in subsequent tasks.
export {};
```

- [ ] **Step 5: Asenna shared-paketin riippuvuudet**

Run: `pnpm install`
Expected: asentaa typescript ja vitest osana workspace-installia. `shared/node_modules/` linkitetty root-`node_modules/`:iin.

- [ ] **Step 6: Verify rakentaminen toimii (vaikka tyhjänä)**

Run: `pnpm --filter @koetutka/shared build`
Expected: tsc luo `shared/dist/index.js` ja `shared/dist/index.d.ts`. Ei virheitä.

- [ ] **Step 7: Verify vitest toimii (ei testejä, mutta exit 0)**

Run: `pnpm --filter @koetutka/shared test`
Expected: vitest ilmoittaa "No test files found" mutta exit code 0. (Tämä on OK — testit lisätään myöhemmin.)

- [ ] **Step 8: Commit**

```bash
git add shared/package.json shared/tsconfig.json shared/vitest.config.ts shared/src/index.ts pnpm-lock.yaml
git commit -m "Scaffold shared/ TypeScript package"
```

---

## Task 3: Tyypit (types.ts)

**Files:**
- Create: `shared/src/types.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Luo shared/src/types.ts**

Create file `shared/src/types.ts`:

```typescript
/**
 * Koordinaattipari: [lat, lon]. SNJ-skripti tuottaa tämän muodossa
 * koordinaatit löytyessä, tai null jos paikkakuntaa ei voitu geokoodata.
 */
export type Coordinates = [number, number];

/** Yhteyshenkilön tiedot (official, secretary). */
export interface Person {
  name: string;
  phone: string;
  email: string;
}

/** Yhden luokan tiedot tapahtuman classes-listassa. */
export interface Class {
  class: string;
  date: string;
  [key: string]: unknown;
}

/**
 * Hinta voi olla:
 * - number (yksinkertainen)
 * - string (esim. "" jos ei tiedossa)
 * - object jolla on `normal: number` ja mahdollisesti `optionalAdditionalCosts`
 */
export interface CostObject {
  normal?: number;
  optionalAdditionalCosts?: OptionalCost[];
  [key: string]: unknown;
}

export type Cost = number | string | CostObject | null | undefined;

export interface OptionalCost {
  name?: string;
  description?: string;
  amount?: number;
  [key: string]: unknown;
}

/** Yksittäinen koetapahtuma JSON-tiedostosta. */
export interface Event {
  id: string;
  type: string;
  levels: string;
  date: string;
  date_sort: string;
  end_date_sort: string | null;
  entry_date: string;
  location: string;
  coordinates: Coordinates | null;
  name: string;
  organizer: string;
  official: Person;
  secretary: Person;
  judges: string[];
  description: string;
  cost: Cost;
  cost_member: Cost;
  classes: Class[];
  /** Lasketaan ajoittain UI:ssa (addDistances). */
  distance?: number | null;
}

/** Käyttäjän valitsema sijainti. */
export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
}

/** Suodatusasetukset (filterEvents). */
export interface FilterOptions {
  searchTerm?: string;
  activeTypes?: Set<string>;
  activeLevels?: Set<string>;
  maxDistanceKm?: number | null;
  hidePast?: boolean;
  /** Päivämäärä jonka mukaan menneet määritellään (oletuksena tänään). */
  today?: Date;
}
```

- [ ] **Step 2: Re-exportoi types.ts barrelista**

Modify `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
export * from './types.js';
```

- [ ] **Step 3: Verify TypeScript-käännös**

Run: `pnpm --filter @koetutka/shared typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Verify build**

Run: `pnpm --filter @koetutka/shared build`
Expected: `shared/dist/types.js` ja `shared/dist/types.d.ts` luotu.

- [ ] **Step 5: Commit**

```bash
git add shared/src/types.ts shared/src/index.ts
git commit -m "Add type definitions to shared package"
```

---

## Task 4: Distance-moduuli (TDD)

**Files:**
- Create: `shared/tests/distance.test.ts`
- Create: `shared/src/distance.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Kirjoita epäonnistuva testi**

Create file `shared/tests/distance.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { haversine } from '../src/distance.js';

describe('haversine', () => {
  test('Helsinki–Tampere on noin 160 km', () => {
    // Helsinki: 60.1699, 24.9384
    // Tampere: 61.4978, 23.7610
    const distance = haversine(60.1699, 24.9384, 61.4978, 23.7610);
    expect(distance).toBeGreaterThan(155);
    expect(distance).toBeLessThan(165);
  });

  test('sama piste palauttaa 0', () => {
    expect(haversine(60, 25, 60, 25)).toBe(0);
  });

  test('symmetrinen — etäisyys A→B = B→A', () => {
    const ab = haversine(60.1699, 24.9384, 65.0121, 25.4651);
    const ba = haversine(65.0121, 25.4651, 60.1699, 24.9384);
    expect(ab).toBeCloseTo(ba, 5);
  });

  test('Helsinki–Oulu on noin 540 km', () => {
    // Oulu: 65.0121, 25.4651
    const distance = haversine(60.1699, 24.9384, 65.0121, 25.4651);
    expect(distance).toBeGreaterThan(530);
    expect(distance).toBeLessThan(550);
  });
});
```

- [ ] **Step 2: Aja testi varmistuaksesi että se epäonnistuu**

Run: `pnpm --filter @koetutka/shared test`
Expected: FAIL — vitest valittaa että `../src/distance.js` ei löydy (tai `haversine` ei ole määritelty).

- [ ] **Step 3: Toteuta minimaalinen distance.ts**

Create file `shared/src/distance.ts`:

```typescript
/**
 * Lasketaan kahden pisteen välinen linnuntie-etäisyys kilometreinä
 * Haversine-kaavalla. Identtinen index.html:n alkuperäisen
 * haversineDistance-funktion kanssa.
 */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Maapallon säde km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

- [ ] **Step 4: Aja testi varmistuaksesi että se menee läpi**

Run: `pnpm --filter @koetutka/shared test`
Expected: PASS — kaikki neljä testiä vihreällä.

- [ ] **Step 5: Re-exportoi index.ts:stä**

Modify `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
export * from './types.js';
export * from './distance.js';
```

- [ ] **Step 6: Verify typecheck + build**

Run: `pnpm --filter @koetutka/shared typecheck && pnpm --filter @koetutka/shared build`
Expected: ei virheitä, `dist/distance.js` ja `dist/distance.d.ts` luotu.

- [ ] **Step 7: Commit**

```bash
git add shared/src/distance.ts shared/src/index.ts shared/tests/distance.test.ts
git commit -m "Add haversine distance to shared package"
```

---

## Task 5: Formatters-moduuli (TDD)

**Files:**
- Create: `shared/tests/formatters.test.ts`
- Create: `shared/src/formatters.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Kirjoita epäonnistuvat testit**

Create file `shared/tests/formatters.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import {
  getCostValue,
  getOptionalCosts,
} from '../src/formatters.js';

describe('getCostValue', () => {
  test('null tai undefined tai tyhjä palauttaa null', () => {
    expect(getCostValue(null)).toBe(null);
    expect(getCostValue(undefined)).toBe(null);
    expect(getCostValue('')).toBe(null);
  });

  test('numero palautetaan sellaisenaan', () => {
    expect(getCostValue(45)).toBe(45);
    expect(getCostValue(0)).toBe(0);
  });

  test('objekti jolla on normal palauttaa normalin', () => {
    expect(getCostValue({ normal: 35 })).toBe(35);
  });

  test('objekti ilman normalia palauttaa null', () => {
    expect(getCostValue({ optionalAdditionalCosts: [] })).toBe(null);
  });
});

describe('getOptionalCosts', () => {
  test('objektista palautetaan optionalAdditionalCosts', () => {
    const costs = [{ name: 'Ruokailu', amount: 10 }];
    expect(getOptionalCosts({ normal: 35, optionalAdditionalCosts: costs })).toEqual(costs);
  });

  test('numero palautetaan tyhjänä', () => {
    expect(getOptionalCosts(45)).toEqual([]);
  });

  test('null palautetaan tyhjänä', () => {
    expect(getOptionalCosts(null)).toEqual([]);
  });
});

```

- [ ] **Step 2: Aja testit varmistuaksesi että ne epäonnistuvat**

Run: `pnpm --filter @koetutka/shared test`
Expected: FAIL — `../src/formatters.js` ei löydy.

- [ ] **Step 3: Toteuta formatters.ts**

Create file `shared/src/formatters.ts`:

```typescript
import type { Cost, CostObject, OptionalCost } from './types.js';

/**
 * Palauttaa kokeen perushinnan numerona, tai null jos ei tiedossa
 * tai vahingoittunutta dataa. Identtinen index.html:n alkuperäisen
 * getCostValue-funktion kanssa.
 */
export function getCostValue(cost: Cost): number | null {
  if (cost === null || cost === undefined || cost === '') return null;
  if (typeof cost === 'number') return cost;
  if (typeof cost === 'object' && typeof (cost as CostObject).normal === 'number') {
    return (cost as CostObject).normal as number;
  }
  return null;
}

/**
 * Palauttaa lisämaksulistan (esim. ruokailu) jos kustannusobjektissa
 * on optionalAdditionalCosts. Numero/null palauttaa tyhjän taulukon.
 */
export function getOptionalCosts(cost: Cost): OptionalCost[] {
  if (cost && typeof cost === 'object' && Array.isArray((cost as CostObject).optionalAdditionalCosts)) {
    return (cost as CostObject).optionalAdditionalCosts as OptionalCost[];
  }
  return [];
}
```

- [ ] **Step 4: Aja testit varmistuaksesi että ne menevät läpi**

Run: `pnpm --filter @koetutka/shared test`
Expected: PASS — kaikki formatters-testit vihreällä, distance-testit edelleen vihreällä.

- [ ] **Step 5: Re-exportoi index.ts:stä**

Modify `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
export * from './types.js';
export * from './distance.js';
export * from './formatters.js';
```

- [ ] **Step 6: Verify typecheck + build**

Run: `pnpm --filter @koetutka/shared typecheck && pnpm --filter @koetutka/shared build`
Expected: ei virheitä, `dist/formatters.js` ja `dist/formatters.d.ts` luotu.

- [ ] **Step 7: Commit**

```bash
git add shared/src/formatters.ts shared/src/index.ts shared/tests/formatters.test.ts
git commit -m "Add cost and distance formatters to shared package"
```

---

## Task 6: Filters-moduuli (TDD)

**Files:**
- Create: `shared/tests/filters.test.ts`
- Create: `shared/src/filters.ts`
- Modify: `shared/src/index.ts`

- [ ] **Step 1: Kirjoita epäonnistuvat testit**

Create file `shared/tests/filters.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { addDistances, filterEvents } from '../src/filters.js';
import type { Event, UserLocation } from '../src/types.js';

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

describe('addDistances', () => {
  const user: UserLocation = { lat: 60.1699, lng: 24.9384, name: 'Helsinki' };

  test('lisää distance-kentän kun koordinaatit löytyy', () => {
    const event = makeEvent({ coordinates: [60.9827, 25.6612] });
    const [result] = addDistances([event], user);
    expect(result.distance).toBeGreaterThan(80);
    expect(result.distance).toBeLessThan(110);
  });

  test('distance on null jos koordinaatit puuttuvat', () => {
    const event = makeEvent({ coordinates: null });
    const [result] = addDistances([event], user);
    expect(result.distance).toBeNull();
  });

  test('ei mutatoi alkuperäistä eventtiä', () => {
    const event = makeEvent();
    const original = { ...event };
    addDistances([event], user);
    expect(event).toEqual(original);
  });
});

describe('filterEvents', () => {
  const e1 = makeEvent({ id: 'a', type: 'NOME-B', location: 'Lahti', distance: 50, date_sort: '2030-01-01T00:00:00+02:00' });
  const e2 = makeEvent({ id: 'b', type: 'NOU', location: 'Oulu', distance: 500, date_sort: '2030-02-01T00:00:00+02:00' });
  const e3 = makeEvent({ id: 'c', type: 'NOME-B', location: 'Turku', distance: 250, date_sort: '2020-01-01T00:00:00+02:00' });

  test('palauttaa kaikki ilman suodattimia', () => {
    expect(filterEvents([e1, e2, e3], {})).toHaveLength(3);
  });

  test('hidePast piilottaa menneet kokeet', () => {
    const result = filterEvents([e1, e2, e3], {
      hidePast: true,
      today: new Date('2026-01-01'),
    });
    const ids = result.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['a', 'b']));
    expect(ids).not.toContain('c');
  });

  test('maxDistanceKm rajaa', () => {
    const result = filterEvents([e1, e2, e3], { maxDistanceKm: 300 });
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(['a', 'c']));
    expect(result.map((e) => e.id)).not.toContain('b');
  });

  test('activeTypes rajaa tyypin mukaan', () => {
    const result = filterEvents([e1, e2, e3], {
      activeTypes: new Set(['NOME-B']),
    });
    expect(result.map((e) => e.id).sort()).toEqual(['a', 'c']);
  });

  test('searchTerm matchaa locationiin (case-insensitive)', () => {
    const result = filterEvents([e1, e2, e3], { searchTerm: 'OULU' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  test('useat suodattimet yhdistetään AND-logiikalla', () => {
    const result = filterEvents([e1, e2, e3], {
      activeTypes: new Set(['NOME-B']),
      maxDistanceKm: 100,
    });
    expect(result.map((e) => e.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Aja testit varmistuaksesi että ne epäonnistuvat**

Run: `pnpm --filter @koetutka/shared test`
Expected: FAIL — `../src/filters.js` ei löydy.

- [ ] **Step 3: Toteuta filters.ts**

Create file `shared/src/filters.ts`:

```typescript
import { haversine } from './distance.js';
import type { Event, FilterOptions, UserLocation } from './types.js';

/**
 * Palauttaa uuden taulukon eventeistä, joihin on lisätty `distance`-kenttä
 * käyttäjän sijainnista. Ei mutatoi alkuperäisiä objekteja.
 */
export function addDistances(
  events: Event[],
  user: UserLocation,
): Event[] {
  return events.map((event) => {
    if (event.coordinates && event.coordinates.length === 2) {
      const km = haversine(
        user.lat,
        user.lng,
        event.coordinates[0],
        event.coordinates[1],
      );
      return { ...event, distance: Math.round(km) };
    }
    return { ...event, distance: null };
  });
}

/**
 * Suodattaa eventit annetuilla kriteereillä. Kaikki kriteerit ovat
 * valinnaisia; tyhjä optio-objekti palauttaa kaikki eventit.
 *
 * - searchTerm: case-insensitive match locationiin, typeen, levelsiin, organizeriin
 * - activeTypes: jos asetettu, vain mainitut tyypit
 * - activeLevels: jos asetettu, levels-merkkijonon pitää sisältää joku tasoista
 * - maxDistanceKm: jos asetettu ja eventillä on distance, pitää olla ≤ tämä
 * - hidePast: jos true, pudottaa eventit joiden end_date_sort (tai date_sort) on
 *   ennen `today`-päivää
 */
export function filterEvents(
  events: Event[],
  options: FilterOptions,
): Event[] {
  const today = options.today ?? new Date();
  const todayISO = today.toISOString().split('T')[0];
  const searchTerm = options.searchTerm?.toLowerCase().trim() ?? '';

  return events.filter((event) => {
    if (options.hidePast) {
      const eventDateISO = (event.end_date_sort || event.date_sort).split('T')[0];
      if (eventDateISO < todayISO) return false;
    }

    if (searchTerm) {
      const haystack = [
        event.location,
        event.type,
        event.levels,
        event.organizer,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }

    if (options.activeTypes && options.activeTypes.size > 0) {
      if (!options.activeTypes.has(event.type)) return false;
    }

    if (options.activeLevels && options.activeLevels.size > 0) {
      const hasAny = Array.from(options.activeLevels).some((lvl) =>
        event.levels.includes(lvl),
      );
      if (!hasAny) return false;
    }

    if (
      options.maxDistanceKm !== null &&
      options.maxDistanceKm !== undefined &&
      event.distance !== null &&
      event.distance !== undefined
    ) {
      if (event.distance > options.maxDistanceKm) return false;
    }

    return true;
  });
}
```

- [ ] **Step 4: Aja testit varmistuaksesi että ne menevät läpi**

Run: `pnpm --filter @koetutka/shared test`
Expected: PASS — kaikki filters-testit vihreällä.

- [ ] **Step 5: Re-exportoi index.ts:stä**

Modify `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
export * from './types.js';
export * from './distance.js';
export * from './formatters.js';
export * from './filters.js';
```

- [ ] **Step 6: Verify typecheck + build**

Run: `pnpm --filter @koetutka/shared typecheck && pnpm --filter @koetutka/shared build`
Expected: ei virheitä, `dist/filters.js` ja `dist/filters.d.ts` luotu.

- [ ] **Step 7: Commit**

```bash
git add shared/src/filters.ts shared/src/index.ts shared/tests/filters.test.ts
git commit -m "Add event filtering and distance enrichment to shared"
```

---

## Task 7: ICS-moduuli (TDD)

**Files:**
- Create: `shared/tests/ics.test.ts`
- Create: `shared/src/ics.ts`
- Modify: `shared/src/index.ts`

`generateICS` ottaa eventin ja konfiguraation, palauttaa ICS-tekstin merkkijonona.
Blob/download-logiikka jää index.html:ään selainspesifisenä.

- [ ] **Step 1: Kirjoita epäonnistuvat testit**

Create file `shared/tests/ics.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { generateICS } from '../src/ics.js';
import type { Event } from '../src/types.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    type: 'NOME-B',
    levels: 'ALO, AVO',
    date: '24.05.2026',
    date_sort: '2026-05-24T00:00:00+03:00',
    end_date_sort: null,
    entry_date: '01.04.-14.04.',
    location: 'Lahti',
    coordinates: [60.9827, 25.6612],
    name: '',
    organizer: 'Lahden noutajayhdistys',
    official: { name: '', phone: '', email: '' },
    secretary: { name: 'M. Virtanen', phone: '040-1234567', email: 'm@v.fi' },
    judges: ['P. Korhonen', 'J. Mäkinen'],
    description: '',
    cost: 45,
    cost_member: 35,
    classes: [],
    ...overrides,
  };
}

describe('generateICS', () => {
  test('palauttaa kelvollisen VCALENDAR-rakenteen', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Koetutka//FI');
    expect(ics).toContain('STATUS:CONFIRMED');
  });

  test('event-tyyppi luo SUMMARYn locationista, typesta ja levelseista', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('SUMMARY:Lahti - NOME-B - ALO, AVO');
  });

  test('registration-tyyppi luo "Ilmoittautuminen"-otsikon', () => {
    const ics = generateICS(makeEvent(), { type: 'registration' });
    expect(ics).toContain('SUMMARY:Ilmoittautuminen: Lahti - NOME-B');
  });

  test('DTSTART on YYYYMMDD-muodossa date-arvolla', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20260524/);
  });

  test('UID sisältää date_sort ja index', () => {
    const ics = generateICS(makeEvent({ date_sort: '2026-05-24T00:00:00+03:00' }), {
      type: 'event',
      index: 7,
    });
    expect(ics).toContain('UID:2026-05-24T00:00:00+03:00-7@koetutka.fi');
  });

  test('registration parsii entry_datesta ilmoittautumispäivän', () => {
    const ics = generateICS(
      makeEvent({
        entry_date: '03.01.-31.01.',
        date_sort: '2026-05-24T00:00:00+03:00',
      }),
      { type: 'registration' },
    );
    // Ilmoittautuminen alkaa 3.1.2026
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20260103/);
  });

  test('event-kuvauksessa on tuomarit ja sihteeri', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('P. Korhonen');
    expect(ics).toContain('J. Mäkinen');
    expect(ics).toContain('M. Virtanen');
  });

  test('LOCATION sisältää koordinaatit jos saatavilla', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toMatch(/LOCATION:Lahti \(60\.9827, 25\.6612\)/);
  });

  test('LOCATION on pelkkä paikkakunta jos ei koordinaatteja', () => {
    const ics = generateICS(makeEvent({ coordinates: null }), { type: 'event' });
    expect(ics).toMatch(/LOCATION:Lahti(\r|\n)/);
  });
});
```

- [ ] **Step 2: Aja testit varmistuaksesi että ne epäonnistuvat**

Run: `pnpm --filter @koetutka/shared test`
Expected: FAIL — `../src/ics.js` ei löydy.

- [ ] **Step 3: Toteuta ics.ts**

Create file `shared/src/ics.ts`:

```typescript
import { getCostValue } from './formatters.js';
import type { Event } from './types.js';

export interface ICSOptions {
  /** 'event' = itse koe, 'registration' = ilmoittautumismuistutus */
  type: 'event' | 'registration';
  /** Käyttäjälle näytettävä sijainti etäisyyden kuvauksessa */
  userLocationName?: string;
  /** Indeksi UID:ssa erottamaan saman kokeen eri kalenteripyynnöt */
  index?: number;
  /** Override "nyt"-aikaleima testauksen helpottamiseksi */
  now?: Date;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDateOnly(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function formatICSTimestamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function parseRegistrationDate(entryDate: string, dateSort: string): Date {
  const match = entryDate.match(/(\d{1,2})\.(\d{1,2})\./);
  if (match) {
    const year = new Date(dateSort).getFullYear();
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    return new Date(year, month - 1, day);
  }
  return new Date(dateSort);
}

function buildEventDescription(
  event: Event,
  userLocationName?: string,
): string {
  let description = '';
  if (event.description) {
    description += event.description;
    description += '\\n\\n--- Perustiedot ---\\n';
  }
  description += `Tyyppi: ${event.type}\\n`;

  if (event.classes && event.classes.length > 0) {
    description += '\\nLuokat ja päivät:\\n';
    const classesByDate: Record<string, { dateStr: string; dayName: string; classes: string[] }> = {};
    const weekdays = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

    for (const cls of event.classes) {
      if (cls.class && cls.date) {
        const clsDate = new Date(cls.date);
        const dateKey = formatDateOnly(clsDate);
        const dayName = weekdays[clsDate.getDay()];
        const dateStr = `${clsDate.getDate()}.${clsDate.getMonth() + 1}.`;
        if (!classesByDate[dateKey]) {
          classesByDate[dateKey] = { dateStr, dayName, classes: [] };
        }
        classesByDate[dateKey].classes.push(cls.class);
      }
    }
    for (const dateKey of Object.keys(classesByDate).sort()) {
      const info = classesByDate[dateKey];
      description += `  ${info.dayName} ${info.dateStr}: ${info.classes.join(', ')}\\n`;
    }
  } else {
    description += `Tasot: ${event.levels}\\n`;
  }

  if (event.organizer) description += `\\n\\nJärjestäjä: ${event.organizer}`;
  if (event.judges && event.judges.length > 0) {
    description += `\\n\\nTuomarit: ${event.judges.join(', ')}`;
  }
  if (event.secretary && event.secretary.name) {
    description += `\\n\\nSihteeri: ${event.secretary.name}`;
    if (event.secretary.phone) description += `, puh. ${event.secretary.phone}`;
    if (event.secretary.email) description += `, ${event.secretary.email}`;
  }
  if (event.official && event.official.name) {
    description += `\\n\\nYhteyshenkilö: ${event.official.name}`;
    if (event.official.phone) description += `, puh. ${event.official.phone}`;
    if (event.official.email) description += `, ${event.official.email}`;
  }
  if (event.distance !== null && event.distance !== undefined) {
    description += `\\n\\n--- Etäisyys (${userLocationName ?? 'oma sijainti'}) ---`;
    description += `\\nLinnuntie: ${event.distance} km`;
  }
  description += `\\n\\nIlmoittautumisaika: ${event.entry_date}`;

  const icsCost = getCostValue(event.cost);
  const icsCostMember = getCostValue(event.cost_member);
  if (icsCost !== null || icsCostMember !== null) {
    description += '\\n\\n--- Osallistumismaksut ---';
    if (icsCost !== null) description += `\\nMaksu: ${icsCost} €`;
    if (icsCostMember !== null) description += `\\nJäsenmaksu: ${icsCostMember} €`;
  }
  return description;
}

function buildRegistrationDescription(event: Event): string {
  let description = 'MUISTUTUS: Ilmoittautuminen kokeeseen alkaa\\n\\n';
  description += `Koe: ${event.date}\\n`;
  description += `Paikkakunta: ${event.location}\\n`;
  description += `Tyyppi: ${event.type}\\n`;
  description += `Tasot: ${event.levels}\\n`;
  description += `Ilmoittautumisaika: ${event.entry_date}\\n`;
  if (event.official && event.official.name) {
    description += `\\n\\nYhteyshenkilö: ${event.official.name}`;
    if (event.official.phone) description += `, puh. ${event.official.phone}`;
    if (event.official.email) description += `, ${event.official.email}`;
  }
  if (event.organizer) description += `\\n\\nJärjestäjä: ${event.organizer}`;
  return description;
}

/**
 * Tuottaa ICS-tekstin annetulle kokeelle tai ilmoittautumismuistutukselle.
 * Tekstin voi tallentaa selaimessa Blobina tai mobiilissa tiedostona.
 */
export function generateICS(event: Event, options: ICSOptions): string {
  const startDate =
    options.type === 'registration'
      ? parseRegistrationDate(event.entry_date, event.date_sort)
      : new Date(event.date_sort);

  const endDate = new Date(
    options.type === 'event' && event.end_date_sort
      ? event.end_date_sort
      : startDate,
  );
  endDate.setDate(endDate.getDate() + 1);

  const dtstart = formatDateOnly(startDate);
  const dtend = formatDateOnly(endDate);
  const dtstamp = formatICSTimestamp(options.now ?? new Date());

  let title: string;
  let description: string;
  if (options.type === 'registration') {
    title = `Ilmoittautuminen: ${event.location} - ${event.type}`;
    description = buildRegistrationDescription(event);
  } else {
    title = `${event.location} - ${event.type} - ${event.levels}`;
    description = buildEventDescription(event, options.userLocationName);
  }

  const location = event.coordinates
    ? `${event.location} (${event.coordinates[0]}, ${event.coordinates[1]})`
    : event.location;

  const uidIndex = options.index ?? 0;
  const uidPrefix = options.type === 'registration' ? 'reg-' : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Koetutka//FI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `DTSTAMP:${dtstamp}`,
    `UID:${uidPrefix}${event.date_sort}-${uidIndex}@koetutka.fi`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
```

- [ ] **Step 4: Aja testit varmistuaksesi että ne menevät läpi**

Run: `pnpm --filter @koetutka/shared test`
Expected: PASS — kaikki ics-testit vihreällä, edelliset testit edelleen vihreällä.

- [ ] **Step 5: Re-exportoi index.ts:stä**

Modify `shared/src/index.ts`:

```typescript
// Public API of @koetutka/shared
export * from './types.js';
export * from './distance.js';
export * from './formatters.js';
export * from './filters.js';
export * from './ics.js';
```

- [ ] **Step 6: Verify typecheck + build**

Run: `pnpm --filter @koetutka/shared typecheck && pnpm --filter @koetutka/shared build`
Expected: ei virheitä, `dist/ics.js` ja `dist/ics.d.ts` luotu.

- [ ] **Step 7: Commit**

```bash
git add shared/src/ics.ts shared/src/index.ts shared/tests/ics.test.ts
git commit -m "Add ICS calendar generation to shared package"
```

---

## Task 8: Päivitä index.html käyttämään shared/-moduulia

**Files:**
- Modify: `index.html` (script section ~ rivit 1394–2713)

Tämä tehtävä korvaa puhtaat funktiot index.html:ssä importeilla. DOM-koodi (event handlerit, rendaus) pysyy. Tee muutos pienissä paloissa ja testaa selaimessa jokaisen jälkeen.

- [ ] **Step 1: Lisää module-script ennen olemassa olevaa scriptiä**

Modify `index.html` — etsi rivi `<script>` n. rivillä 1394 ja lisää sen YLÄPUOLELLE:

```html
<script type="module">
    import {
        haversine,
        addDistances,
        filterEvents,
        getCostValue,
        getOptionalCosts,
        formatDistance,
        generateICS,
    } from './shared/dist/index.js';

    // Tehdään globaaleiksi, jotta vanhassa scriptissä olevat
    // funktiot voivat käyttää näitä siirtymäkauden aikana.
    window.koetutkaShared = {
        haversine,
        addDistances,
        filterEvents,
        getCostValue,
        getOptionalCosts,
        formatDistance,
        generateICS,
    };
</script>
```

- [ ] **Step 2: Korvaa haversineDistance**

Modify `index.html` rivit 1511–1521 — poista koko `haversineDistance`-funktion määrittely ja korvaa kommentilla:

```javascript
// haversineDistance siirretty shared/-moduuliin (haversine).
```

- [ ] **Step 3: Päivitä calculateDistances käyttämään importtia**

Modify `index.html` rivit 1523–1535 — vaihda `calculateDistances`-funktion sisältö:

```javascript
function calculateDistances() {
    if (!userLocation) return;
    const enriched = window.koetutkaShared.addDistances(kokeet, userLocation);
    // kirjoita distance kentät takaisin alkuperäisiin objekteihin
    kokeet.forEach((koe, i) => {
        koe.distance = enriched[i].distance;
    });
}
```

- [ ] **Step 4: Korvaa getCostValue ja getOptionalCosts**

Modify `index.html` rivit 1496–1509 — poista molempien funktioiden lokaalit määrittelyt ja korvaa kommentilla:

```javascript
// getCostValue, getOptionalCosts siirretty shared/-moduuliin.
const getCostValue = window.koetutkaShared.getCostValue;
const getOptionalCosts = window.koetutkaShared.getOptionalCosts;
```

- [ ] **Step 5: Päivitä downloadICS käyttämään generateICS**

Modify `index.html` — etsi `function downloadICS(index, eventType = 'event')` (n. rivi 2528) ja korvaa koko funktio:

```javascript
function downloadICS(index, eventType = 'event') {
    const koe = filteredKokeet[index];
    const icsContent = window.koetutkaShared.generateICS(koe, {
        type: eventType,
        userLocationName: userLocation?.name,
        index,
    });
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filePrefix = eventType === 'registration' ? 'ilmoittautuminen' : 'koe';
    link.download = `koetutka-${filePrefix}-${koe.location}-${koe.date.replace(/\./g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
```

Huom: tämän muutoksen jälkeen kaikki ICS-generointia tukenut koodi (rivit n. 2551–2710, mukaan lukien formatDateOnly, formatICSTimestamp, otsikon ja kuvauksen rakentaminen, VCALENDAR-rivien kokoaminen) on poistunut funktiosta ja siirtynyt `shared/src/ics.ts`:ään.

- [ ] **Step 6: Build shared ja tarkista paikallisesti**

Run:
```bash
pnpm --filter @koetutka/shared build
python3 -m http.server 8080
```

Avaa selaimessa `http://localhost:8080/`. Tarkista:

- Etusivu latautuu virheittä (avaa DevTools console, ei punaisia virheitä)
- Sijaintihaku toimii (haku + GPS)
- Etäisyydet näkyvät korteissa
- Suodattimet (tyyppi, taso, max-etäisyys, piilota menneet) toimivat
- Kalenterivienti (.ics) avaa ladattavan tiedoston
- Tiedoston sisällössä on oikea SUMMARY, LOCATION, DESCRIPTION ja UID
- Ilmoittautumismuistutus-versio luo eri tapahtuman
- Jako-painike (mobiilissa native share, desktopilla clipboard)

- [ ] **Step 7: Korjaa mahdolliset console-virheet**

Jos console näyttää virheitä, ne ovat yleensä joko:
- `Failed to fetch ./shared/dist/index.js` — `dist/` puuttuu, aja `pnpm --filter @koetutka/shared build`
- `window.koetutkaShared is undefined` — module-script ei ehdi ladata ennen vanhaa scriptiä; varmista että module-script on ENNEN ei-moduuli-scriptiä HTMLn lähdekoodissa
- `Cannot read properties of undefined` jossakin distance/filter-koodissa — kokeile suoraa importteja `<script type="module">`:ssa eikä globaalin `window.koetutkaShared`-objektin kautta. Tarvittaessa muuta `<script>`-tagia → `<script type="module">` koko vanhalle scriptille ja vaihda funktiokutsut suoriksi.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "Refactor index.html to use shared package"
```

---

## Task 9: Päivitä GitHub Actions building shared/

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Lisää pnpm + Node setup ja build-step**

Modify `.github/workflows/deploy.yml` — lisää uusi step `Setup Python`-stepin JÄLKEEN, ennen `Install dependencies`-steppiä:

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install Node dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared package
        run: pnpm --filter @koetutka/shared build
```

- [ ] **Step 2: Päivitä Prepare deployment directory kopioimaan shared/dist**

Modify `.github/workflows/deploy.yml` — etsi `Prepare deployment directory`-step ja muokkaa `run`-osio:

```yaml
      - name: Prepare deployment directory
        run: |
          mkdir -p _site/shared/dist
          cp index.html _site/
          cp banner.jpg _site/
          cp favicon.ico _site/
          cp favicon-192.png _site/
          cp apple-touch-icon.png _site/
          cp -r shared/dist/* _site/shared/dist/
          # Check if data files exist (should be committed to repo)
          if ls koetutka_*.json 1> /dev/null 2>&1; then
            cp koetutka_*.json _site/
            echo "Data files found and copied"
          else
            echo "Warning: No data files found. Make sure to run with update_data tag to generate them."
            exit 1
          fi
```

- [ ] **Step 3: Verify YAML-syntaksi**

Run: `cat .github/workflows/deploy.yml | head -100 | tail -60`
Expected: uudet stepit näkyvät oikealla sisennyksellä (6 välilyöntiä yläsisennyksenä, kuten muutkin stepit).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Build shared package in GitHub Actions before deploy"
```

---

## Task 10: Verifioi paikallisesti loppuun asti

**Files:** ei muutoksia

- [ ] **Step 1: Puhdas asennus**

Run:
```bash
rm -rf node_modules shared/node_modules shared/dist
pnpm install
```
Expected: asennus onnistuu virheittä.

- [ ] **Step 2: Aja kaikki testit**

Run: `pnpm test`
Expected: kaikki testit vihreällä (distance, formatters, filters, ics).

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: `shared/dist/` luotu, sisältää `index.js`, `types.js`, `distance.js`, `formatters.js`, `filters.js`, `ics.js` ja vastaavat `.d.ts`-tiedostot.

- [ ] **Step 4: Aja HTTP-serveri ja testaa selaimessa**

Run:
```bash
python3 -m http.server 8080
```
Avaa `http://localhost:8080/` selaimessa.

Tarkista regressio: tee jokainen näistä ja varmista että käyttäytyminen vastaa ennen refaktorointia:

1. Tee paikkakuntahaku (kirjoita "Helsinki") → ehdotukset ilmestyvät → klikkaa → kortit järjestyvät etäisyyden mukaan
2. Klikkaa "Käytä sijaintiani" → selain pyytää lupaa → kortit päivittyvät
3. Klikkaa tyyppipilliä (esim. "NOME-B") → vain kyseiset näkyvät
4. Säädä max-etäisyys 100 km → kaukana olevat piilotetaan
5. Toggle "Piilota menneet" → menneet katoavat (toukokuussa 2026 tämä piilottaa vain alkuvuoden kokeet)
6. Klikkaa info-kuvaketta kortilla → bottom sheet aukeaa
7. Klikkaa kalenteri-ikonia → .ics latautuu, avaa tiedosto kalenteriappilla, varmista että tapahtuma näkyy
8. Klikkaa ilmoittautumis-ikonia (jos olemassa) → erilainen .ics latautuu
9. Klikkaa jako-painiketta → mobiilissa native share, desktopilla "Linkki kopioitu!" -toast

- [ ] **Step 5: Verify ei console-virheitä**

DevTools Console pitäisi olla puhdas (ei punaisia virheitä, ei `404 Not Found` shared/dist-tiedostoille).

- [ ] **Step 6: Verify console-varoitusten määrä on sama tai vähemmän**

Vertaa varoituksia (keltaiset viestit) ennen ja jälkeen refaktorointia. Hyväksyttävää että varoituksia on saman verran.

---

## Task 11: Pushaa, anna Actionin deployata, verifioi tuotannossa

**Files:** ei muutoksia

- [ ] **Step 1: Tarkista paikalliset committit**

Run: `git log --oneline origin/master..HEAD`
Expected: lista commiteista jotka tehtiin tämän planin aikana (n. 9 committia).

- [ ] **Step 2: Pull rebase (Actions saattaa olla committannut datan välissä)**

Run: `git pull --rebase`
Expected: ei konflikteja (tai jos tulee, ne ovat vain `koetutka_*.json`:ssa joka voidaan jättää origin-versioon).

- [ ] **Step 3: Push**

Run: `git push`
Expected: kaikki committit menevät origin/masteriin.

- [ ] **Step 4: Seuraa Actions-ajoa**

Run: `gh run watch --exit-status $(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: ajo päättyy success-statukseen. Jos failaa, lue logit ja korjaa:
- `pnpm install` epäonnistuu → lockfile ja package.json eivät täsmää, aja `pnpm install` paikallisesti ja committoi `pnpm-lock.yaml`
- `pnpm build` epäonnistuu → TypeScript-virhe, aja `pnpm typecheck` paikallisesti ja korjaa
- `_site/shared/dist/...` ei löydy → tarkista että `Prepare deployment directory`-step kopioi `shared/dist/*` ennen `koetutka_*.json`:ja

- [ ] **Step 5: Avaa tuotanto ja verifioi**

Avaa selaimessa `https://trotor.github.io/koetutka/`. Aja sama regression-testilista kuin Task 10 Step 4. Erityisesti:

- Avaa DevTools Network-välilehti, paina F5 → varmista että `shared/dist/index.js` latautuu 200 OK -statuksella
- Console pitää olla puhdas
- Ei eroa toiminnallisuudessa verrattuna ennen refaktorointia

- [ ] **Step 6: Päivitä versionumero**

Modify `index.html` — etsi `<span id="version">` ja kasvata patch- tai minor-versio. Esim. v1.7.0 → v1.7.1 jos pelkkä refaktorointi, v1.8.0 jos haluat merkitä isompana virstanpylväänä.

Modify `README.md` — lisää uusi rivi `Versiohistoria`-osioon, esim:

```markdown
### v1.7.1 (2026-XX-XX)
- Refaktoroitu jaettu logiikka shared/ TypeScript-moduuliksi (haversine, ICS, filtterit, formatters)
- Pohjustaa tulevan mobiilisovelluksen koodinjaolle
- Ei näkyviä muutoksia käyttäjälle
```

- [ ] **Step 7: Commit + push versiopäivitys**

```bash
git add index.html README.md
git commit -m "Bump version after shared/ refactoring"
git push
```

---

## Mitä Phase 0:n jälkeen

Kun tämä plan on suoritettu loppuun:

- `shared/` on toiminnassa, testattu ja kääntyy CI:ssä
- Web on toiminnallisesti identtinen, mutta puhtaat funktiot importtaavat `shared/dist`:istä
- Pnpm workspace on valmiina vastaanottamaan `mobile/`-paketin Vaihe 1:ssä

Seuraavaksi käynnistä **Vaihe 1**-plan: Expo-pohjaisen mobiili-MVP:n rakentaminen. Tämä on uuden planin aihe, joka voi olettaa että `shared/` toimii ja sen voi importata Expo-projektista.
