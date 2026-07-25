# Koeilmoituksen linkki, kokeen tila ja ilmoittautuneet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kokeesta pääsee SNJ:n koeilmoitukseen ja lähtölistaan, kokeen tila (alustava/peruttu/ilmo ohi) näkyy, ilmoittautuneiden määrä näkyy, ja mobiilin yhteystiedot ovat painettavia.

**Architecture:** `snj_kokeet.py` vie neljä uutta kenttää JSONiin. Kaikki logiikka menee `shared/`-pakettiin (kaksi uutta moduulia + kaksi laajennusta), jota sekä mobiili että web käyttävät — web `window.koetutkaShared`-sillan kautta. UI-muutokset ovat ohuita: merkkejä, rivejä ja nappeja olemassa oleviin komponentteihin.

**Tech Stack:** Python 3 (fetcher), TypeScript ESM (`shared/`), React Native 0.77 (mobiili), vanilla JS (web), vitest (testit).

## Global Constraints

- **Kaikki uudet `Event`-kentät ovat optionaalisia:** `state?`, `entry_start?`, `entry_end?`, `entries?`. Uusi sovellusversio saa vanhaa JSONia ja vanha versio uutta — kumpikaan ei saa rikkoutua.
- **Sanaa "täynnä" ei käytetä missään.** Ilmoittautuneita on usein moninkertaisesti paikkoihin nähden (64 ilmoittautunutta 12 paikalle) ja osallistujat arvotaan. Muoto on neutraali: `"8 paikkaa · 17 ilmoittautunutta"`.
- **Tilamerkkiä ei näytetä menneillä kokeilla listanäkymissä** (koekortti, webin taulukko ja kortit). Poikkeus: `cancelled` näytetään aina. Kokeen **tietonäkymä** näyttää "Tila"-rivin aina kun tila on tiedossa — siellä ei ole kohinaongelmaa, koska käyttäjä on avannut juuri sen kokeen.
- **Lähtölistan rajapintaan ei tehdä yhtään verkkokutsua** — ei mobiilista eikä `snj_kokeet.py`:stä. Vain linkki SNJ:n omalle sivulle. Perustelut speksin "Rajattu ulos" -osiossa.
- **Testien sijainti:** `shared/`-logiikka → `shared/tests/<moduuli>.test.ts`, importit muodossa `../src/<moduuli>.js`. Mobiilin omat libit → `mobile/src/lib/tests/`.
- **Versio kaikkialla:** `1.12.0`. Android `versionCode 12`, iOS `CURRENT_PROJECT_VERSION 10`.
- **Ajokomennot:** `pnpm test` (repo root, ajaa shared-testit), `cd mobile && npm test`, `cd mobile && npm run typecheck`. `shared` pitää buildata (`pnpm build`) ennen kuin mobiili/web näkee muutokset.

## File Structure

**Luodaan:**
- `shared/src/event-state.ts` — tilan tulkinta ja merkin sisältö. Yksi vastuu: `state`-kentän merkitys.
- `shared/src/snj.ts` — SNJ:n URL-rakentajat ja lähtölistan olemassaolon päättely.
- `shared/tests/event-state.test.ts`, `shared/tests/snj.test.ts`

**Muokataan:**
- `snj_kokeet.py:270` — neljä uutta kenttää output-dictiin
- `shared/src/types.ts` — `EventState`, uudet `Event`-kentät, `ClassPlaces.entries`
- `shared/src/filters.ts:50` — `isRegistrationOpen`: ISO-päivät + tilaportti
- `shared/src/formatters.ts:50` — `listClassPlaces` tuottaa `entries`, uusi `formatClassPlacesRow`
- `shared/src/index.ts` — uudet moduulit julkiseen APIin
- `mobile/src/components/EventCard.tsx:129` — tilamerkki, `cancelled`-himmennys
- `mobile/src/screens/EventDetailScreen.tsx` — tila-rivi, kaksi nappia, ilmoittautuneet, painettavat yhteystiedot
- `mobile/src/components/HelpSection.tsx` — uudet merkit selitteeseen
- `index.html:176-188` — uudet funktiot `window.koetutkaShared`-siltaan
- `app.js` — tilamerkki (`:726`, `:759`, `:780`), deep link (`:1101`), ilmoittautuneet (`:934`)
- Versiotiedostot + `whatsnew.json` + `README.md`

---

### Task 1: Datapipeline — neljä uutta kenttää JSONiin

**Files:**
- Modify: `snj_kokeet.py:270`

**Interfaces:**
- Consumes: ei mitään (ensimmäinen tehtävä)
- Produces: JSON-kentät `state: str`, `entry_start: str | None` (`YYYY-MM-DD`), `entry_end: str | None`, `entries: int | None`. Näitä kuluttavat Taskit 2, 4 ja 5 TypeScript-tyyppeinä.

- [ ] **Step 1: Lisää kentät output-dictiin**

`snj_kokeet.py`, korvaa nykyinen `'places': event.get('places')` -rivi (rivi 270) tällä:

```python
            'places': event.get('places'),
            # Kokeen tila SNJ:n API:sta: tentative | confirmed | picked |
            # invited | cancelled. UI näyttää alustavan ja perutun merkkinä, ja
            # picked/invited tarkoittaa että ilmoittautuminen on ohi.
            'state': event.get('state'),
            # Ilmoittautumisajan tarkat päivät. entry_date on esitysmuoto
            # ("01.04.-14.04.") josta vuosi puuttuu; nämä ovat vertailukelpoiset.
            'entry_start': entry_start_obj.strftime('%Y-%m-%d') if entry_start_obj else None,
            'entry_end': entry_end_obj.strftime('%Y-%m-%d') if entry_end_obj else None,
            # Ilmoittautuneiden kokonaismäärä. Tarvitaan koska osalla kokeista ei
            # ole luokkaerittelyä lainkaan, jolloin classes[].entries puuttuu.
            'entries': event.get('entries')
```

- [ ] **Step 2: Alusta `entry_start_obj` ja `entry_end_obj` myös virhetilanteessa**

Nykyiset `try/except`-lohkot (rivit 170–180) asettavat vain merkkijonot, joten objektit ovat määrittelemättömiä jos parsinta kaatuu. Korvaa molemmat lohkot:

```python
        try:
            entry_start_obj = datetime.fromisoformat(entry_start_date.replace('Z', '+00:00')).astimezone(helsinki)
            entry_start_str = entry_start_obj.strftime('%d.%m.')
        except:
            entry_start_obj = None
            entry_start_str = ''

        try:
            entry_end_obj = datetime.fromisoformat(entry_end_date.replace('Z', '+00:00')).astimezone(helsinki)
            entry_end_str = entry_end_obj.strftime('%d.%m.')
        except:
            entry_end_obj = None
            entry_end_str = 'N/A'
```

- [ ] **Step 3: Aja skripti ja tarkista kentät**

```bash
source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate && pip install -q requests geopy
python3 snj_kokeet.py --year 2026
```

- [ ] **Step 4: Varmista että kentät ovat mukana ja päivä on oikein**

```bash
python3 -c "
import json
ev = json.load(open('koetutka_2026.json'))
assert all('state' in e for e in ev), 'state puuttuu'
withstate = [e for e in ev if e.get('state')]
print('state:', len(withstate), '/', len(ev))
iso = [e for e in ev if e.get('entry_start')]
print('entry_start:', len(iso), '/', len(ev))
e = iso[0]
print('esim:', e['entry_date'], '->', e['entry_start'], '..', e['entry_end'])
assert e['entry_start'][5:10].replace('-', '.') != '', 'muoto väärä'
print('entries-kenttä:', sum(1 for x in ev if x.get('entries') is not None), 'kokeella')
"
```

Odotettu: `state` 205/205, `entry_start` 205/205, ja esimerkkirivin `entry_date`-päivien pitää täsmätä ISO-päiviin (esim. `01.01.-14.01.` → `2026-01-01 .. 2026-01-14`). Jos ISO-päivä on yhden päivän pielessä, aikavyöhykemuunnos on rikki.

- [ ] **Step 5: Palauta generoitu data ja committaa vain skripti**

Vuorokausiajo generoi JSONit itsestään, joten isoa datadiffiä ei committoida käsin.

```bash
git checkout koetutka_2026.json coordinates_cache.json
git add snj_kokeet.py
git commit -m "feat(data): vie state, entry_start, entry_end ja entries JSONiin"
```

---

### Task 2: `shared/src/event-state.ts` — tilan tulkinta

**Files:**
- Create: `shared/src/event-state.ts`
- Create: `shared/tests/event-state.test.ts`
- Modify: `shared/src/types.ts`, `shared/src/index.ts`

**Interfaces:**
- Consumes: Task 1:n `state`-kenttä.
- Produces:
  - `type EventState = 'tentative' | 'confirmed' | 'picked' | 'invited' | 'cancelled'`
  - `type StateTone = 'tentative' | 'cancelled' | 'closed'`
  - `stateBadge(event: Pick<Event, 'state'>): { label: string; tone: StateTone } | null`
  - `isCancelled(event: Pick<Event, 'state'>): boolean`
  - `registrationClosedByState(event: Pick<Event, 'state'>): boolean`
  - Näitä kuluttavat Taskit 4, 6, 7, 8 ja 9.

- [ ] **Step 1: Lisää tyypit `shared/src/types.ts`:ään**

Lisää tiedoston alkuun, `Coordinates`-tyypin jälkeen:

```ts
/**
 * Kokeen tila SNJ:n API:sta.
 * - `tentative` — alustava, koe ei ole vielä varmistunut
 * - `confirmed` — vahvistettu (normaalitapaus)
 * - `picked` — osallistujat valittu, ilmoittautuminen ohi
 * - `invited` — kutsut lähetetty, ilmoittautuminen ohi
 * - `cancelled` — peruttu
 */
export type EventState = 'tentative' | 'confirmed' | 'picked' | 'invited' | 'cancelled';
```

Lisää `Event`-interfaceen `places`-kentän jälkeen:

```ts
  /** Kokeen tila. Puuttuu vanhemmasta JSONista. */
  state?: EventState;
  /** Ilmoittautumisen alkupäivä `YYYY-MM-DD`. Puuttuu vanhemmasta JSONista. */
  entry_start?: string;
  /** Ilmoittautumisen loppupäivä `YYYY-MM-DD`. Puuttuu vanhemmasta JSONista. */
  entry_end?: string;
  /** Ilmoittautuneiden kokonaismäärä. Puuttuu vanhemmasta JSONista. */
  entries?: number;
```

- [ ] **Step 2: Kirjoita kaatuva testi**

Luo `shared/tests/event-state.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { stateBadge, isCancelled, registrationClosedByState } from '../src/event-state.js';

describe('stateBadge', () => {
  test('alustava saa Alustava-merkin', () => {
    expect(stateBadge({ state: 'tentative' })).toEqual({ label: 'Alustava', tone: 'tentative' });
  });

  test('peruttu saa Peruttu-merkin', () => {
    expect(stateBadge({ state: 'cancelled' })).toEqual({ label: 'Peruttu', tone: 'cancelled' });
  });

  test('picked kertoo että osallistujat on valittu', () => {
    expect(stateBadge({ state: 'picked' })).toEqual({
      label: 'Osallistujat valittu',
      tone: 'closed',
    });
  });

  test('invited kertoo että kutsut on lähetetty', () => {
    expect(stateBadge({ state: 'invited' })).toEqual({
      label: 'Kutsut lähetetty',
      tone: 'closed',
    });
  });

  test('vahvistettu ei tarvitse merkkiä', () => {
    expect(stateBadge({ state: 'confirmed' })).toBeNull();
  });

  test('puuttuva tila ei tuota merkkiä', () => {
    expect(stateBadge({})).toBeNull();
  });

  test('tuntematon tila ei tuota merkkiä', () => {
    expect(stateBadge({ state: 'jotain-uutta' as never })).toBeNull();
  });
});

describe('isCancelled', () => {
  test('tosi vain perutulle', () => {
    expect(isCancelled({ state: 'cancelled' })).toBe(true);
    expect(isCancelled({ state: 'confirmed' })).toBe(false);
    expect(isCancelled({})).toBe(false);
  });
});

describe('registrationClosedByState', () => {
  test('picked, invited ja cancelled sulkevat ilmoittautumisen', () => {
    expect(registrationClosedByState({ state: 'picked' })).toBe(true);
    expect(registrationClosedByState({ state: 'invited' })).toBe(true);
    expect(registrationClosedByState({ state: 'cancelled' })).toBe(true);
  });

  test('tentative ja confirmed eivät sulje', () => {
    expect(registrationClosedByState({ state: 'tentative' })).toBe(false);
    expect(registrationClosedByState({ state: 'confirmed' })).toBe(false);
  });

  test('puuttuva tila ei sulje', () => {
    expect(registrationClosedByState({})).toBe(false);
  });
});
```

- [ ] **Step 3: Aja testi ja varmista että se kaatuu**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "../src/event-state.js"`

- [ ] **Step 4: Toteuta moduuli**

Luo `shared/src/event-state.ts`:

```ts
import type { Event, EventState } from './types.js';

/** Merkin sävy: UI päättää värit, tämä kertoo vain merkityksen. */
export type StateTone = 'tentative' | 'cancelled' | 'closed';

const BADGES: Partial<Record<EventState, { label: string; tone: StateTone }>> = {
  tentative: { label: 'Alustava', tone: 'tentative' },
  cancelled: { label: 'Peruttu', tone: 'cancelled' },
  picked: { label: 'Osallistujat valittu', tone: 'closed' },
  invited: { label: 'Kutsut lähetetty', tone: 'closed' },
  // confirmed on normaalitapaus eikä tarvitse merkkiä.
};

/**
 * Palauttaa kokeen tilamerkin, tai null jos merkkiä ei tarvita
 * (vahvistettu, puuttuva tai tuntematon tila).
 */
export function stateBadge(
  event: Pick<Event, 'state'>,
): { label: string; tone: StateTone } | null {
  const state = event.state;
  if (!state) return null;
  return BADGES[state] ?? null;
}

/** Tosi jos koe on peruttu. */
export function isCancelled(event: Pick<Event, 'state'>): boolean {
  return event.state === 'cancelled';
}

/**
 * Tosi jos tila kertoo ilmoittautumisen päättyneeksi riippumatta
 * päivämääristä: osallistujat on valittu, kutsut lähetetty, tai koe peruttu.
 */
export function registrationClosedByState(event: Pick<Event, 'state'>): boolean {
  const state = event.state;
  return state === 'picked' || state === 'invited' || state === 'cancelled';
}
```

- [ ] **Step 5: Vie moduuli julkiseen APIin**

`shared/src/index.ts`, lisää `export * from './filters.js';` -rivin jälkeen:

```ts
export * from './event-state.js';
```

- [ ] **Step 6: Aja testit ja typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS, 76 + 11 testiä

- [ ] **Step 7: Commit**

```bash
git add shared/src/event-state.ts shared/src/types.ts shared/src/index.ts shared/tests/event-state.test.ts
git commit -m "feat(shared): kokeen tilan tulkinta ja tilamerkki"
```

---

### Task 3: `shared/src/snj.ts` — URL-rakentajat

**Files:**
- Create: `shared/src/snj.ts`
- Create: `shared/tests/snj.test.ts`
- Modify: `shared/src/index.ts`

**Interfaces:**
- Consumes: Task 2:n `EventState`-tyyppi (`hasStartList` nojaa tilaan).
- Produces:
  - `snjEventUrl(event: Pick<Event, 'type' | 'id'>): string`
  - `snjStartListUrl(event: Pick<Event, 'id'>): string`
  - `hasStartList(event: Pick<Event, 'state'>): boolean`
  - Näitä kuluttavat Taskit 7 ja 9.

- [ ] **Step 1: Kirjoita kaatuva testi**

Luo `shared/tests/snj.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { snjEventUrl, snjStartListUrl, hasStartList } from '../src/snj.js';

describe('snjEventUrl', () => {
  test('rakentaa polun tyypistä ja id:stä', () => {
    expect(snjEventUrl({ type: 'NOME-B', id: 'TYhHtp0Yh-' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-B/TYhHtp0Yh-',
    );
  });

  test('enkoodaa välilyönnin tyypissä', () => {
    expect(snjEventUrl({ type: 'NOME-A SM', id: 'abc' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-A%20SM/abc',
    );
  });

  test('enkoodaa skandit tyypissä', () => {
    expect(snjEventUrl({ type: 'EPÄVIRALLINEN', id: 'abc' })).toBe(
      'https://koekalenteri.snj.fi/event/EP%C3%84VIRALLINEN/abc',
    );
  });
});

describe('snjStartListUrl', () => {
  test('rakentaa lähtölistan polun id:stä', () => {
    expect(snjStartListUrl({ id: 'TYhHtp0Yh-' })).toBe(
      'https://koekalenteri.snj.fi/startlist/TYhHtp0Yh-',
    );
  });
});

describe('hasStartList', () => {
  test('tosi kun osallistujat on valittu tai kutsuttu', () => {
    expect(hasStartList({ state: 'picked' })).toBe(true);
    expect(hasStartList({ state: 'invited' })).toBe(true);
  });

  test('epätosi ennen valintaa ja perutulle', () => {
    expect(hasStartList({ state: 'confirmed' })).toBe(false);
    expect(hasStartList({ state: 'tentative' })).toBe(false);
    expect(hasStartList({ state: 'cancelled' })).toBe(false);
  });

  test('epätosi kun tila puuttuu', () => {
    expect(hasStartList({})).toBe(false);
  });
});
```

- [ ] **Step 2: Aja testi ja varmista että se kaatuu**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "../src/snj.js"`

- [ ] **Step 3: Toteuta moduuli**

Luo `shared/src/snj.ts`:

```ts
import type { Event } from './types.js';

const BASE = 'https://koekalenteri.snj.fi';

/**
 * Linkki kokeen omaan ilmoitukseen SNJ:n koekalenterissa.
 * Reittikuvio on `event/:eventType/:id`; tyyppi voi sisältää välilyönnin
 * ja skandeja, joten se enkoodataan.
 */
export function snjEventUrl(event: Pick<Event, 'type' | 'id'>): string {
  return `${BASE}/event/${encodeURIComponent(event.type)}/${encodeURIComponent(event.id)}`;
}

/** Linkki kokeen lähtölistaan SNJ:n koekalenterissa. */
export function snjStartListUrl(event: Pick<Event, 'id'>): string {
  return `${BASE}/startlist/${encodeURIComponent(event.id)}`;
}

/**
 * Tosi kun lähtölista on odotettavissa: osallistujat on valittu (`picked`) tai
 * kutsut lähetetty (`invited`). Tämä on tarkoituksella pelkkä tilapäättely eikä
 * verkkokutsu — lista voi harvoin puuttua, mikä on hyväksyttävä hinta siitä
 * ettei mitään ylimääräistä haeta.
 */
export function hasStartList(event: Pick<Event, 'state'>): boolean {
  return event.state === 'picked' || event.state === 'invited';
}
```

- [ ] **Step 4: Vie julkiseen APIin**

`shared/src/index.ts`, lisää `export * from './event-state.js';` -rivin jälkeen:

```ts
export * from './snj.js';
```

- [ ] **Step 5: Aja testit ja typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add shared/src/snj.ts shared/src/index.ts shared/tests/snj.test.ts
git commit -m "feat(shared): SNJ:n koeilmoituksen ja lähtölistan URL:t"
```

---

### Task 4: `isRegistrationOpen` — ISO-päivät ja tilaportti

**Files:**
- Modify: `shared/src/filters.ts:50`
- Modify: `shared/tests/filters.test.ts`

**Interfaces:**
- Consumes: Task 1:n `entry_start`/`entry_end`, Task 2:n `registrationClosedByState`.
- Produces: `isRegistrationOpen(event, today?)` samalla signatuurilla kuin ennen — vain käyttäytyminen tarkentuu. Kuluttajat (`filterEvents`, `EventCard`, `app.js`) eivät muutu.

- [ ] **Step 1: Kirjoita kaatuvat testit**

Lisää `shared/tests/filters.test.ts`:n `isRegistrationOpen`-describe-lohkoon (etsi olemassa oleva `describe('isRegistrationOpen'`):

```ts
  test('käyttää ISO-päiviä kun ne ovat saatavilla', () => {
    const event = makeEvent({
      entry_date: 'jotain-rikkinäistä',
      entry_start: '2026-04-01',
      entry_end: '2026-04-14',
    });
    expect(isRegistrationOpen(event, new Date('2026-04-07T12:00:00+03:00'))).toBe(true);
    expect(isRegistrationOpen(event, new Date('2026-04-15T12:00:00+03:00'))).toBe(false);
  });

  test('ISO-väli on inklusiivinen molemmista päistä', () => {
    const event = makeEvent({ entry_start: '2026-04-01', entry_end: '2026-04-14' });
    expect(isRegistrationOpen(event, new Date('2026-04-01T00:30:00+03:00'))).toBe(true);
    expect(isRegistrationOpen(event, new Date('2026-04-14T23:30:00+03:00'))).toBe(true);
  });

  test('ISO-päivät toimivat vuodenvaihteen yli ilman päättelyä', () => {
    const event = makeEvent({
      date_sort: '2026-01-20T00:00:00+02:00',
      entry_date: '20.12.-10.01.',
      entry_start: '2025-12-20',
      entry_end: '2026-01-10',
    });
    expect(isRegistrationOpen(event, new Date('2025-12-28T12:00:00+02:00'))).toBe(true);
  });

  test('palaa entry_date-regexiin kun ISO-päivät puuttuvat', () => {
    const event = makeEvent({ entry_date: '01.04.-14.04.' });
    expect(isRegistrationOpen(event, new Date('2026-04-07T12:00:00+03:00'))).toBe(true);
  });

  test('tila sulkee ilmoittautumisen vaikka päivät olisivat avoinna', () => {
    const event = makeEvent({
      entry_start: '2026-04-01',
      entry_end: '2026-04-14',
      state: 'picked',
    });
    expect(isRegistrationOpen(event, new Date('2026-04-07T12:00:00+03:00'))).toBe(false);
  });

  test('peruttu koe ei ole koskaan avoinna', () => {
    const event = makeEvent({ entry_date: '01.04.-14.04.', state: 'cancelled' });
    expect(isRegistrationOpen(event, new Date('2026-04-07T12:00:00+03:00'))).toBe(false);
  });

  test('tentative ja confirmed eivät estä avoimuutta', () => {
    for (const state of ['tentative', 'confirmed'] as const) {
      const event = makeEvent({ entry_start: '2026-04-01', entry_end: '2026-04-14', state });
      expect(isRegistrationOpen(event, new Date('2026-04-07T12:00:00+03:00'))).toBe(true);
    }
  });
```

- [ ] **Step 2: Aja testit ja varmista että uudet kaatuvat**

Run: `pnpm test`
Expected: FAIL — ISO-testit ja tilaporttitestit kaatuvat (nykyinen toteutus lukee vain `entry_date`ia eikä tunne `state`ia)

- [ ] **Step 3: Toteuta muutos**

`shared/src/filters.ts`, lisää importti tiedoston alkuun:

```ts
import { registrationClosedByState } from './event-state.js';
```

Korvaa `isRegistrationOpen`-funktio ja sen docstring kokonaan:

```ts
/**
 * Palauttaa true, jos kokeen ilmoittautuminen on `today`-päivänä auki.
 *
 * Ensisijaisesti käytetään tarkkoja ISO-päiviä `entry_start` ja `entry_end`.
 * Jos ne puuttuvat (vanhempi JSON), palataan `entry_date`-merkkijonoon muodossa
 * "PP.KK.-PP.KK." (esim. "01.04.-14.04."), jossa vuosi päätellään kokeen
 * `date_sort`-vuodesta: jos väli menee vuodenvaihteen yli (loppu ennen alkua
 * kalenterissa), alkupäivä tulkitaan edellisen vuoden puolelle.
 *
 * Kokeen tila ohittaa päivämäärät: kun osallistujat on valittu, kutsut
 * lähetetty tai koe peruttu, ilmoittautuminen ei ole auki.
 *
 * Väli on inklusiivinen molemmista päistä.
 */
export function isRegistrationOpen(event: Event, today: Date = new Date()): boolean {
  if (registrationClosedByState(event)) return false;

  const todayTime = dateOnly(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  // 1. Tarkat ISO-päivät kun ne ovat saatavilla.
  if (event.entry_start && event.entry_end) {
    const start = isoDateOnly(event.entry_start);
    const end = isoDateOnly(event.entry_end);
    if (start !== null && end !== null) {
      return todayTime >= start && todayTime <= end;
    }
  }

  // 2. Fallback: entry_date-merkkijono, jossa vuosi päätellään.
  const match = event.entry_date?.match(/(\d{1,2})\.(\d{1,2})\.-(\d{1,2})\.(\d{1,2})\./);
  if (!match) return false;

  const startDay = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10);
  const endDay = parseInt(match[3], 10);
  const endMonth = parseInt(match[4], 10);

  const eventYear = new Date(event.date_sort).getFullYear();
  const endTime = dateOnly(eventYear, endMonth, endDay);
  const startsBeforeEnd =
    startMonth < endMonth || (startMonth === endMonth && startDay <= endDay);
  const startYear = startsBeforeEnd ? eventYear : eventYear - 1;
  const startTime = dateOnly(startYear, startMonth, startDay);

  return todayTime >= startTime && todayTime <= endTime;
}

/** Parsii `YYYY-MM-DD` samaan vertailumuotoon kuin dateOnly, tai null. */
function isoDateOnly(iso: string): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return dateOnly(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
}
```

- [ ] **Step 4: Aja testit ja typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS — kaikki vanhat filters-testit edelleen läpi, uudet 7 läpi

- [ ] **Step 5: Commit**

```bash
git add shared/src/filters.ts shared/tests/filters.test.ts
git commit -m "fix(shared): isRegistrationOpen käyttää ISO-päiviä ja huomioi tilan"
```

---

### Task 5: Ilmoittautuneiden määrä `listClassPlaces`iin

**Files:**
- Modify: `shared/src/types.ts` (`ClassPlaces`)
- Modify: `shared/src/formatters.ts:50`
- Modify: `shared/tests/formatters.test.ts`

**Interfaces:**
- Consumes: Task 1:n `entries`, olemassa oleva `classes[].entries`.
- Produces:
  - `ClassPlaces` saa kentän `entries?: number`
  - `formatClassPlacesRow(cp: ClassPlaces): string` → `"8 paikkaa"` | `"8 paikkaa · 17 ilmoittautunutta"`
  - Näitä kuluttavat Taskit 7 ja 9.

- [ ] **Step 1: Lisää `entries` `ClassPlaces`-tyyppiin**

`shared/src/types.ts`, `ClassPlaces`-interfaceen `day`-kentän jälkeen:

```ts
  /**
   * Ilmoittautuneiden määrä tälle riville, jos tiedossa. Tilannekuva datan
   * hakuhetkestä (päivittyy kerran vuorokaudessa).
   */
  entries?: number;
```

- [ ] **Step 2: Kirjoita kaatuvat testit**

Lisää `shared/tests/formatters.test.ts`:n loppuun. Tiedostossa on jo apurit
`cls({...})` (yksi luokka) ja `ev(classes, places?)` (tapahtumakääre) sekä vakio
`SAT`; käytä niitä. `ev` ei tunne `entries`-kenttää, joten tapahtumatason
testissä käytetään objektiliteraalia.

**Tärkeää:** älä muuta olemassa olevia `toEqual`-vertailuja. Ne odottavat
tarkalleen `{ class, places, day }`, ja uusi `entries` on tarkoituksella poissa
kun sitä ei ole datassa — juuri siksi toteutuksessa käytetään ehdollista
spreadia.

```ts
describe('listClassPlaces – ilmoittautuneet', () => {
  test('poimii entries per luokka', () => {
    const rows = listClassPlaces(ev([cls({ class: 'ALO', places: 12, date: SAT, entries: 64 })]));
    expect(rows).toHaveLength(1);
    expect(rows[0].entries).toBe(64);
  });

  test('entries on undefined kun sitä ei ole luokassa', () => {
    const rows = listClassPlaces(ev([cls({ class: 'ALO', places: 12, date: SAT })]));
    expect(rows[0].entries).toBeUndefined();
  });

  test('Yhteensä-rivi käyttää tapahtumatason entries-lukua', () => {
    const rows = listClassPlaces({
      classes: [cls({ class: 'ALO', date: SAT }), cls({ class: 'AVO', date: SAT })],
      places: 60,
      entries: 41,
    });
    expect(rows).toEqual([{ class: '', places: 60, day: null, entries: 41 }]);
  });
});

describe('formatClassPlacesRow', () => {
  test('pelkät paikat kun ilmoittautuneita ei tiedetä', () => {
    expect(formatClassPlacesRow({ class: 'ALO', places: 8, day: null })).toBe('8 paikkaa');
  });

  test('yksikkömuoto yhdelle paikalle', () => {
    expect(formatClassPlacesRow({ class: 'ALO', places: 1, day: null })).toBe('1 paikka');
  });

  test('paikat ja ilmoittautuneet', () => {
    expect(formatClassPlacesRow({ class: 'ALO', places: 8, day: null, entries: 17 })).toBe(
      '8 paikkaa · 17 ilmoittautunutta',
    );
  });

  test('yksikkömuoto yhdelle ilmoittautuneelle', () => {
    expect(formatClassPlacesRow({ class: 'ALO', places: 8, day: null, entries: 1 })).toBe(
      '8 paikkaa · 1 ilmoittautunut',
    );
  });

  test('nolla ilmoittautunutta näytetään', () => {
    expect(formatClassPlacesRow({ class: 'ALO', places: 8, day: null, entries: 0 })).toBe(
      '8 paikkaa · 0 ilmoittautunutta',
    );
  });

  test('ylikysyntää ei kutsuta täydeksi', () => {
    const row = formatClassPlacesRow({ class: 'ALO', places: 12, day: null, entries: 64 });
    expect(row).toBe('12 paikkaa · 64 ilmoittautunutta');
    expect(row).not.toContain('täynnä');
  });
});
```

Lisää `formatClassPlacesRow` tiedoston ylimpään importtiin.

- [ ] **Step 3: Aja testit ja varmista että ne kaatuvat**

Run: `pnpm test`
Expected: FAIL — `formatClassPlacesRow is not a function` ja `entries` on `undefined` odotetuissa riveissä

- [ ] **Step 4: Toteuta muutokset**

`shared/src/formatters.ts`: laajenna `rows`-välirakennetta ja molempia palautuspolkuja. Muuta `rows`-muuttujan tyyppi:

```ts
  const rows: { class: string; places: number; entries?: number; dateKey: string; dayLabel: string | null; order: number }[] = [];
```

Muuta `rows.push`-kutsu:

```ts
    const entries = typeof c.entries === 'number' && Number.isFinite(c.entries) ? c.entries : undefined;
    rows.push({ class: name, places, entries, dateKey, dayLabel, order: i });
```

Muuta per-luokka-paluu:

```ts
    return rows.map((r) => ({
      class: r.class,
      places: r.places,
      day: multiDay ? r.dayLabel : null,
      ...(r.entries === undefined ? {} : { entries: r.entries }),
    }));
```

Muuta fallback-paluu (tiedoston viimeinen rivi ennen sulkevaa aaltosulkua):

```ts
  const totalEntries =
    typeof event?.entries === 'number' && Number.isFinite(event.entries) ? event.entries : undefined;
  return [
    {
      class: label,
      places: total,
      day: null,
      ...(totalEntries === undefined ? {} : { entries: totalEntries }),
    },
  ];
```

Päivitä myös `listClassPlaces`-signatuuri ottamaan `entries` mukaan:

```ts
export function listClassPlaces(
  event: Pick<Event, 'classes' | 'places' | 'entries'> | undefined,
): ClassPlaces[] {
```

Lisää tiedoston loppuun uusi funktio:

```ts
/**
 * Muotoilee yhden paikkarivin tekstiksi.
 *
 * Sanaa "täynnä" ei käytetä: näissä kokeissa ilmoittautuneita on usein
 * moninkertaisesti paikkoihin nähden ja osallistujat arvotaan, joten "täynnä"
 * antaisi väärän kuvan siitä ettei myöhässä oleva mahdu.
 */
export function formatClassPlacesRow(cp: ClassPlaces): string {
  const places = `${cp.places} ${cp.places === 1 ? 'paikka' : 'paikkaa'}`;
  if (cp.entries === undefined) return places;
  const entries = `${cp.entries} ${cp.entries === 1 ? 'ilmoittautunut' : 'ilmoittautunutta'}`;
  return `${places} · ${entries}`;
}
```

- [ ] **Step 5: Aja testit ja typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: PASS — vanhat formatters-testit läpi (uusi `entries`-kenttä on optionaalinen eikä riko `toEqual`-vertailuja joissa sitä ei ole)

- [ ] **Step 6: Commit**

```bash
git add shared/src/formatters.ts shared/src/types.ts shared/tests/formatters.test.ts
git commit -m "feat(shared): ilmoittautuneiden määrä paikkariveille"
```

---

### Task 6: Mobiilin korttiin tilamerkki

**Files:**
- Modify: `mobile/src/components/EventCard.tsx:7` (importit), `:37-38` (tilalaskenta), `:129-135` (merkit), `:196-232` (tyylit)

**Interfaces:**
- Consumes: Task 2:n `stateBadge`, `isCancelled`.
- Produces: ei uusia rajapintoja.

- [ ] **Step 1: Buildaa shared jotta mobiili näkee uudet funktiot**

Run: `pnpm build`
Expected: `shared/dist/` päivittyy ilman virheitä

- [ ] **Step 2: Lisää importit ja tilalaskenta**

`mobile/src/components/EventCard.tsx`, muuta rivi 7:

```ts
import { isRegistrationOpen, isPast, stateBadge, isCancelled } from '@koetutka/shared';
```

Lisää rivien 37–38 (`past`/`regOpen`) jälkeen:

```ts
  const cancelled = isCancelled(event);
  // Tilamerkkiä ei näytetä menneillä kokeilla — "Mennyt" kertoo saman ja
  // "Kutsut lähetetty" olisi pelkkää kohinaa. Peruttu näytetään aina, koska
  // peruttu ja pidetty koe eivät ole sama asia.
  const badge = !past || cancelled ? stateBadge(event) : null;
  const dimmed = past || cancelled;
```

- [ ] **Step 3: Näytä merkki ja himmennä peruttu**

Korvaa merkkirivit (nykyiset rivit 129–135):

```tsx
            <View style={styles.badges}>
              {isHidden && <Text style={styles.hiddenBadge}>Piilotettu</Text>}
              {badge && <Text style={badgeStyleFor(badge.tone)}>{badge.label}</Text>}
              {regOpen && <Text style={styles.regOpenBadge}>Ilmo auki</Text>}
              {!isHidden && fit === 'free' && <Text style={styles.fitFree}>Sopii</Text>}
              {!isHidden && fit === 'conflict' && <Text style={styles.fitConflict}>Päällekkäin</Text>}
              {past && <Text style={styles.pastBadge}>Mennyt</Text>}
            </View>
```

Vaihda `past &&`-himmennykset `dimmed &&`-muotoon riveillä 114, 118, 123 ja 126–127, esimerkiksi:

```tsx
            <Text style={[styles.title, dimmed && styles.titlePast]} numberOfLines={1}>
```

- [ ] **Step 4: Lisää tyylit ja sävykartta**

Lisää `EventCard.tsx`:ään ennen `const styles = StyleSheet.create({`:

```tsx
function badgeStyleFor(tone: 'tentative' | 'cancelled' | 'closed') {
  if (tone === 'tentative') return styles.stateTentative;
  if (tone === 'cancelled') return styles.stateCancelled;
  return styles.stateClosed;
}
```

Lisää `styles`-objektiin `pastBadge`-tyylin viereen:

```ts
  stateTentative: {
    fontSize: 11, color: '#92400e', backgroundColor: '#fef3c7',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  stateCancelled: {
    fontSize: 11, color: '#991b1b', backgroundColor: '#fee2e2',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  stateClosed: {
    fontSize: 11, color: '#555', backgroundColor: '#e0e0e0',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
```

- [ ] **Step 5: Aja typecheck ja testit**

Run: `cd mobile && npm run typecheck && npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/components/EventCard.tsx
git commit -m "feat(mobile): kokeen tilamerkki koekorttiin"
```

---

### Task 7: Mobiilin tietonäkymä — tila, linkit, ilmoittautuneet, yhteystiedot

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.tsx`

**Interfaces:**
- Consumes: Task 2:n `stateBadge`, Task 3:n `snjEventUrl`/`snjStartListUrl`/`hasStartList`, Task 5:n `formatClassPlacesRow`.
- Produces: ei uusia rajapintoja.

- [ ] **Step 1: Päivitä importit**

`mobile/src/screens/EventDetailScreen.tsx`, korvaa rivit 3–4:

```tsx
import { ScrollView, View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  getCostValue,
  getOptionalCosts,
  listClassPlaces,
  formatClassPlacesRow,
  stateBadge,
  snjEventUrl,
  snjStartListUrl,
  hasStartList,
} from '@koetutka/shared';
```

- [ ] **Step 2: Lisää tila-rivi selitteellä**

Lisää rivin 30 (`const classPlaces = ...`) jälkeen:

```tsx
  const badge = stateBadge(event);
  const hint = event.state ? STATE_HINTS[event.state] : undefined;
```

Lisää tiedoston moduulitasolle (komponentin ulkopuolelle, heti `type Route`
-rivin jälkeen). Selitteet avaimitetaan **tilalla, ei näyttötekstillä** — muuten
merkin tekstin muuttaminen rikkoisi selitteen hiljaisesti:

```tsx
const STATE_HINTS: Partial<Record<EventState, string>> = {
  tentative: 'Koe ei ole vielä varmistunut.',
  cancelled: 'Koe on peruttu.',
  picked: 'Ilmoittautuminen on päättynyt.',
  invited: 'Ilmoittautuminen on päättynyt.',
};
```

Lisää `EventState` tyyppi-importtina:

```tsx
import type { EventState } from '@koetutka/shared';
```

Lisää `<InfoRow label="Ilmoittautuminen" ... />` -rivin **eteen** (rivi 41):

```tsx
      {badge && (
        <InfoRow label="Tila" value={hint ? `${badge.label}\n${hint}` : badge.label} />
      )}
```

- [ ] **Step 3: Näytä ilmoittautuneet paikkarivillä**

Korvaa `classPlaces`-lohko (nykyiset rivit 42–53):

```tsx
      {classPlaces.length > 0 && (
        <InfoRow
          label="Luokat ja paikat"
          value={classPlaces
            .map((cp) => {
              const cls = cp.class || 'Yhteensä';
              const name = cp.day ? `${cls} · ${cp.day}` : cls;
              return `${name}: ${formatClassPlacesRow(cp)}`;
            })
            .join('\n')}
        />
      )}
```

- [ ] **Step 4: Tee yhteystiedot painettaviksi**

Korvaa sihteeri- ja yhteyshenkilörivit (nykyiset rivit 58–63):

```tsx
      {event.secretary.name && (
        <ContactRow label="Sihteeri" person={event.secretary} />
      )}
      {event.official.name && (
        <ContactRow label="Yhteyshenkilö" person={event.official} />
      )}
```

Lisää `InfoRow`-funktion jälkeen uusi komponentti:

```tsx
function ContactRow({
  label,
  person,
}: {
  label: string;
  person: { name: string; phone: string; email: string };
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{person.name}</Text>
      {!!person.phone && (
        <Pressable
          onPress={() => Linking.openURL(`tel:${person.phone.replace(/\s/g, '')}`)}
          accessibilityRole="link"
        >
          <Text style={styles.link}>{person.phone}</Text>
        </Pressable>
      )}
      {!!person.email && (
        <Pressable
          onPress={() => Linking.openURL(`mailto:${person.email}`)}
          accessibilityRole="link"
        >
          <Text style={styles.link}>{person.email}</Text>
        </Pressable>
      )}
    </View>
  );
}
```

- [ ] **Step 5: Lisää SNJ- ja lähtölistanapit ensimmäisiksi**

Lisää `<View style={styles.buttonRow}>` -elementin **ensimmäiseksi lapseksi** (ennen "Lisää kalenteriin" -nappia):

```tsx
        <Pressable
          style={styles.button}
          onPress={() => Linking.openURL(snjEventUrl(event))}
        >
          <Text style={styles.buttonText}>🔗 Avaa SNJ:n koekalenterissa</Text>
        </Pressable>
        {hasStartList(event) && (
          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => Linking.openURL(snjStartListUrl(event))}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              📋 Lue lähtölista
            </Text>
          </Pressable>
        )}
```

Muuta "Lisää kalenteriin" -nappi toissijaiseksi, jotta ensisijainen väri on vain SNJ-napilla:

```tsx
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={async () => {
            const ok = await addEventToCalendar(event, 'event', useStore.getState().userLocation?.name);
            if (ok) useStore.getState().markCalendarAdded(event.id, 'event');
          }}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>📅 Lisää kalenteriin</Text>
        </Pressable>
```

- [ ] **Step 6: Lisää linkkityyli**

`styles`-objektiin `value`-tyylin jälkeen:

```ts
  link: { fontSize: 14, color: '#2d5a27', textDecorationLine: 'underline', marginTop: 4 },
```

- [ ] **Step 7: Aja typecheck ja testit**

Run: `cd mobile && npm run typecheck && npm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.tsx
git commit -m "feat(mobile): SNJ-linkit, tila, ilmoittautuneet ja painettavat yhteystiedot"
```

---

### Task 8: Merkkien selite ohjeisiin

**Files:**
- Modify: `mobile/src/components/HelpSection.tsx`

**Interfaces:**
- Consumes: Task 6:n merkkitekstit ja -värit.
- Produces: ei mitään.

- [ ] **Step 1: Lisää kolme selitettä**

`mobile/src/components/HelpSection.tsx`, lisää "Mennyt"-rivin **eteen** (nykyinen rivi 42):

```tsx
      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeTentative}>Alustava</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Alustava koe.</Text> Koetta ei ole vielä vahvistettu,
          joten ajankohta tai paikka voi vielä muuttua.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeCancelled}>Peruttu</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Peruttu koe.</Text> Koe on peruttu. Peruttu koe jää
          näkyviin, jotta huomaat sen myös suosikeistasi.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeClosed}>Ilmo ohi</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Ilmoittautuminen ohi.</Text> Merkki "Osallistujat
          valittu" tai "Kutsut lähetetty" tarkoittaa että ilmoittautuminen on päättynyt.
          Silloin kokeen tiedoista pääsee lukemaan lähtölistan.
        </Text>
      </View>
```

- [ ] **Step 2: Lisää tyylit**

`styles`-objektiin `badgePast`-tyylin jälkeen:

```ts
  badgeTentative: { ...badge, color: '#92400e', backgroundColor: '#fef3c7' },
  badgeCancelled: { ...badge, color: '#991b1b', backgroundColor: '#fee2e2' },
  badgeClosed: { ...badge, color: '#555', backgroundColor: '#e0e0e0' },
```

- [ ] **Step 3: Aja typecheck**

Run: `cd mobile && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/HelpSection.tsx
git commit -m "docs(mobile): uudet merkit ohjeselitteeseen"
```

---

### Task 9: Web — silta, tilamerkki, deep link, ilmoittautuneet

**Files:**
- Modify: `index.html:176-198` (silta)
- Modify: `app.js:726`, `:759`, `:780` (tilamerkit), `:934-953` (ilmoittautuneet), `:1100-1103` (linkit)
- Modify: `styles.css` (merkkityylit)

**Interfaces:**
- Consumes: Taskit 2, 3 ja 5 `window.koetutkaShared`-sillan kautta.
- Produces: ei mitään.

- [ ] **Step 1: Buildaa shared ja lisää funktiot siltaan**

Run: `pnpm build`

`index.html`, lisää importtilistaan (rivit 176–185):

```js
            stateBadge,
            isCancelled,
            snjEventUrl,
            snjStartListUrl,
            hasStartList,
            formatClassPlacesRow,
```

ja samat nimet `window.koetutkaShared`-objektiin (rivi 188 alkaen).

- [ ] **Step 2: Lisää tilamerkki taulukkoriville**

`app.js`, lisää `regOpen`-muuttujan määrittelyn viereen samassa funktiossa (etsi `const regOpen` rivin 726 yläpuolelta):

```js
                    const badge = window.koetutkaShared.stateBadge(koe);
                    const badgeHtml = badge
                        ? ` <span class="state-badge state-${badge.tone}">${badge.label}</span>`
                        : '';
```

Muuta rivi 726 (`entry-date`-solu) päättymään merkkiin:

```js
                        <td class="entry-date${regOpen ? ' registration-open' : ''}">${koe.entry_date}${regOpen ? ' <span class="reg-open-badge">Ilmo auki</span>' : ''}${badgeHtml}</td>
```

Tee sama lisäys `${badgeHtml}` korttinäkymän riveille 759 ja 780, `reg-open-badge`-spanin perään.

- [ ] **Step 3: Näytä ilmoittautuneet paikkariveillä**

`app.js`, korvaa rivit 946–953 (`classPlaces.forEach`-lohko):

```js
                classPlaces.forEach(cp => {
                    const name = cp.class || 'Yhteensä';
                    const label = cp.day ? `${name} · ${cp.day}` : name;
                    html += `
                                <div class="info-row">
                                    <span class="info-row-label">${label}</span>
                                    <span class="info-row-value">${window.koetutkaShared.formatClassPlacesRow(cp)}</span>
                                </div>`;
                });
```

- [ ] **Step 4: Korjaa modaalin linkit**

`app.js`, korvaa `modal-footer`-lohko (rivit 1100–1103):

```js
                <div class="modal-footer">
                    <a href="${window.koetutkaShared.snjEventUrl(koe)}" target="_blank" rel="noopener" class="btn btn-snj">
                        Avaa SNJ:n koekalenterissa
                    </a>${window.koetutkaShared.hasStartList(koe) ? `
                    <a href="${window.koetutkaShared.snjStartListUrl(koe)}" target="_blank" rel="noopener" class="btn btn-snj">
                        Lue lähtölista
                    </a>` : ''}
                </div>`;
```

- [ ] **Step 5: Lisää merkkityylit**

`styles.css`, lisää `.reg-open-badge`-säännön viereen:

```css
.state-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
}
.state-tentative { color: #92400e; background: #fef3c7; }
.state-cancelled { color: #991b1b; background: #fee2e2; }
.state-closed { color: #555; background: #e0e0e0; }
```

- [ ] **Step 6: Testaa selaimessa**

```bash
python3 -m http.server 8080
```

Avaa `http://localhost:8080/` ja tarkista:
1. Listalla näkyy "Alustava"-merkkejä (25 tulevaa koetta on alustavia)
2. Kokeen Info-modaalissa "Luokat ja paikat" näyttää muodon "12 paikkaa · 64 ilmoittautunutta"
3. Modaalin "Avaa SNJ:n koekalenterissa" avaa **kokeen oman sivun**, ei etusivua

**Huom:** paikallinen `koetutka_2026.json` ei sisällä `state`- eikä `entries`-kenttiä ennen kuin vuorokausiajo on generoinut ne (Task 1 committoi vain skriptin). Testaa siis joko ajamalla `python3 snj_kokeet.py --year 2026` paikallisesti tai lisäämällä kentät käsin yhteen kokeeseen. Merkkien puuttuminen ilman kenttiä on **oikea** käyttäytyminen — varmista sekin.

- [ ] **Step 7: Varmista deep linkin toimivuus selaimessa**

SNJ:n SPA palauttaa HTTP 200 mille tahansa polulle, joten tämä on pakko tarkistaa silmällä. Avaa kolme URLia ja varmista että oikea koe latautuu:

```
https://koekalenteri.snj.fi/event/NOME-B/<id jostain NOME-B-kokeesta>
https://koekalenteri.snj.fi/event/EPÄVIRALLINEN/<id jostain epävirallisesta>
https://koekalenteri.snj.fi/event/NOME-A SM/<id jostain SM-kokeesta>
```

Jos jokin tyyppi **ei** resolvoidu, lisää `shared/src/snj.ts`:ään fallback: kyseisille tyypeille palautetaan `https://koekalenteri.snj.fi/` ja lisätään testi joka lukitsee sen.

- [ ] **Step 8: Commit**

```bash
git add index.html app.js styles.css
git commit -m "feat(web): tilamerkki, kokeen deep link, lähtölista ja ilmoittautuneet"
```

---

### Task 10: Versiot, whatsnew ja README

**Files:**
- Modify: `mobile/package.json`, `mobile/android/app/build.gradle`, `mobile/ios/Koetutka.xcodeproj/project.pbxproj`, `index.html`, `whatsnew.json`, `README.md`

**Interfaces:**
- Consumes: kaikki edelliset taskit valmiina.
- Produces: julkaisukelpoinen 1.12.0.

- [ ] **Step 1: Nosta mobiilin versiot**

- `mobile/package.json`: `"version": "1.12.0"`
- `mobile/android/app/build.gradle`: `versionCode 12`, `versionName "1.12.0"`
- `mobile/ios/Koetutka.xcodeproj/project.pbxproj`: `MARKETING_VERSION = 1.12.0;` (2 kohtaa), `CURRENT_PROJECT_VERSION = 10;` (2 kohtaa)

```bash
perl -pi -e 's/MARKETING_VERSION = 1\.7\.1;/MARKETING_VERSION = 1.12.0;/' mobile/ios/Koetutka.xcodeproj/project.pbxproj
perl -pi -e 's/CURRENT_PROJECT_VERSION = 9;/CURRENT_PROJECT_VERSION = 10;/' mobile/ios/Koetutka.xcodeproj/project.pbxproj
```

- [ ] **Step 2: Nosta webin versio**

`index.html`: `<span id="version">v1.12.0</span>`

- [ ] **Step 3: Korvaa whatsnew'n 1.7.1-merkintä 1.12.0:lla**

Poista `whatsnew.json`:sta koko `1.7.1`-objekti ja lisää tilalle ensimmäiseksi:

```json
    {
      "version": "1.12.0",
      "date": "2026-07-25",
      "title": "Suora linkki koeilmoitukseen ja kokeen tila",
      "items": [
        "Kokeen tiedoista pääsee suoraan kokeen omaan ilmoitukseen SNJ:n koekalenterissa",
        "Kun osallistujat on valittu, kokeen tiedoista pääsee lukemaan lähtölistan",
        "Alustavat ja perutut kokeet näkyvät nyt omalla merkillään",
        "Ilmoittautuneiden määrä näkyy paikkamäärän vierellä",
        "Sihteerin ja yhteyshenkilön puhelin ja sähköposti ovat painettavia",
        "Android-sovellus on käännetty Android 16:lle (API-taso 36)"
      ]
    },
```

1.7.1:tä ei julkaistu kauppoihin, joten käyttäjille ei näytetä versiota jota ei ollut.

- [ ] **Step 4: Lisää README-merkintä**

`README.md`, korvaa aiemmin lisätty "Mobiili v1.7.1" -osio tällä:

```markdown
### v1.12.0 (2026-07-25)
- **Suora linkki koeilmoitukseen**: kokeen tiedoista pääsee kokeen omaan
  sivuun SNJ:n koekalenterissa (aiemmin linkki vei etusivulle)
- **Lähtölista**: kun osallistujat on valittu, kokeesta pääsee lähtölistaan
- **Kokeen tila**: alustavat ja perutut kokeet näkyvät omalla merkillään, ja
  tila huomioidaan myös "Ilmo auki" -logiikassa
- **Ilmoittautuneiden määrä** näkyy paikkamäärän vierellä
- **Mobiili**: painettavat yhteystiedot, ja Android-sovellus kohdistettu
  Android 16:lle (API-taso 36)
```

- [ ] **Step 5: Aja koko testipatteri**

```bash
pnpm test && pnpm typecheck && cd mobile && npm test && npm run typecheck && cd ..
python3 -c "import json; d=json.load(open('whatsnew.json')); print([r['version'] for r in d['releases']][:3])"
```

Expected: kaikki läpi, whatsnew alkaa `['1.12.0', '1.7.0', '1.6.0']`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: bump 1.12.0 (web + mobiili) + whatsnew"
```

---

## Julkaisu (taskien jälkeen, vaatii käyttäjän)

1. **Merge masteriin ja pushaa.** Vuorokausiajo generoi uudet JSON-kentät seuraavana aamuna 08:00 ja deployaa webin. Varmista että `whatsnew.json` ja JSONit ovat GitHub Pagesissa **ennen** kauppaversioita, koska mobiili hakee ne ajonaikaisesti.
2. **Android:** `./gradlew :app:bundleRelease` → lataa AAB Play Consoleen.
3. **iOS:** Xcode → Product → Archive → App Store Connect → TestFlight → review.
4. Molemmat kaupat samaan aikaan.
