# Suunnitelma: Lajittelu + "Mitä uutta" (mobiili, iOS + Android)

**Päivä:** 2026-06-18
**Haara:** `feat/mobile-sort-whatsnew`
**Versio:** mobiili 1.1.0 → 1.2.0 (minor)

## Tausta ja tavoite

Mobiilisovelluksesta (React Native, jaettu `shared/`-domainlogiikka) puuttuu kaksi
asiaa, jotka web-versiossa on:

1. **Käyttäjän valittava lajittelu** — listan voi lajitella etäisyyden tai
   ajankohdan mukaan. Mobiilissa lajittelu on tällä hetkellä kovakoodattu
   (`BrowseScreen.tsx`): etäisyys ensin jos sijainti asetettu, muuten päivämäärä.
   Ei käyttöliittymää valita järjestystä.
2. **"Mitä uutta" -ilmoitus** — ensiasennuksessa kerrotaan mistä sovelluksessa on
   kyse; päivityksessä näytetään uusimman version muutokset.

Molemmat rakennetaan platform-agnostiseen `src/`- ja `shared/`-koodiin, joten yksi
toteutus kattaa sekä iOS:n että Androidin (ei natiivihaaroja).

## Suunnittelupäätökset (käyttäjän valinnat)

- **"Mitä uutta" -sisältö:** haetaan etänä GitHub Pages -JSONista (ei sovellukseen
  koodattua muutoslistaa). Poikkeus: welcome-viestille on pieni sovellukseen
  koodattu varateksti offline-ensiasennusta varten.
- **Lajitteluvalinta:** säilytetään käynnistysten välillä (AsyncStorage).
- **"Mitä uutta" -laajuus:** näytetään vain juuri asennetun version muutokset.
- **Avaus:** automaattisen popupin lisäksi avattavissa Asetukset → Tietoja -osiosta.

---

## Osa 1 — Lajittelu (etäisyys / ajankohta)

### Jaettu logiikka (`shared/`)

Uusi `shared/src/sort.ts`:

```ts
export type SortBy = 'distance' | 'date';
export function sortEvents(events: Event[], sortBy: SortBy): Event[];
```

`sortEvents` on puhdas funktio, joka palauttaa uuden lajitellun taulukon. Se
sisältää nykyisen `BrowseScreen`-logiikan:

- `sortBy === 'distance'`: tapahtumat joilla on `distance` ensin nousevasti;
  ne joilta etäisyys puuttuu (null/undefined) loppuun; toissijaisena
  järjestyksenä `date_sort` (nouseva).
- `sortBy === 'date'`: `date_sort.localeCompare` (nouseva).

Export lisätään `shared/src/index.ts`:ään (`export * from './sort.js';`).

Vitest-testit `shared/src/sort.test.ts`: etäisyyslajittelu null-arvojen kanssa,
päivämäärälajittelu, tyhjä lista.

### Mobiilin tila

- `store.ts`: uusi tilakenttä `sortBy: SortBy` (oletus `'distance'`) ja
  `setSortBy(next: SortBy)`-action. Lisätään `persist()`-helperiin ja
  `initFromStorage`-kohtaan.
- `preferences.ts`: `sortBy` mukaan `StoredPrefs`-tyyppiin, `DEFAULTS`-arvoihin
  (`'distance'`), `JsonShape`-tyyppiin sekä `serializePrefs`/`deserializePrefs`-
  funktioihin. Vanhat tallennukset, joista kenttä puuttuu, lukeutuvat oletuksella.

### UI

- Uusi `components/SortSelector.tsx`: kaksi pilleriä **"📍 Etäisyys"** ja
  **"📅 Ajankohta"** (sama UX kuin webissä). Aktiivinen pilleri korostettu.
  Lukee `sortBy`-arvon storesta ja kutsuu `setSortBy`-actionia.
- Sijoitus `BrowseScreen`-näkymään `FilterChips`-rivin alapuolelle.
- **Ilman sijaintia:** etäisyysvalinta näytetään himmennettynä/disabloituna ja
  efektiivinen lajittelu putoaa ajankohtaan (etäisyys ei mielekäs ilman sijaintia).
- `BrowseScreen`: inline-sort `visible`-useMemossa korvataan
  `sortEvents(filtered, effectiveSortBy)`-kutsulla, missä
  `effectiveSortBy = sortBy === 'distance' && !userLocation ? 'date' : sortBy`.

**Rajaus:** Suosikit-näkymä pysyy päivämäärälajiteltuna kuten nyt. Lajitteluvalitsin
on vain päälistalla, kuten alkuperäisessä webissä.

---

## Osa 2 — "Mitä uutta" -ilmoitus (etähaettu sisältö)

### Remote-sisältö (GitHub Pages)

Uusi `whatsnew.json` repon juureen, tarjoillaan osoitteesta
`https://trotor.github.io/koetutka/whatsnew.json`. Rakenne:

```json
{
  "welcome": {
    "title": "Tervetuloa Koetutkaan",
    "body": "Koetutka näyttää noutajien metsästyskokeet kartalla ja listana, lähimmät ensin…"
  },
  "releases": [
    {
      "version": "1.2.0",
      "date": "2026-06-18",
      "title": "Lajittelu ja Mitä uutta",
      "items": [
        "Listan voi nyt lajitella etäisyyden tai ajankohdan mukaan",
        "Uusi Mitä uutta -näkymä"
      ]
    }
  ]
}
```

`deploy.yml`:n "Prepare deployment directory" -vaiheeseen lisätään
`cp whatsnew.json _site/`.

### Logiikka

- `data.ts`: `fetchWhatsNew(): Promise<WhatsNewData>` hakee JSONin ja
  **välimuistittaa** viimeisimmän onnistuneen haun AsyncStorageen (esim. avain
  `koetutka:whatsnew:v1`), jotta Asetukset-avaus ja popup toimivat myös offline
  ensimmäisen onnistuneen haun jälkeen. Haun epäonnistuessa palautetaan välimuisti
  jos saatavilla.
- Uusi `mobile/src/lib/whatsnew.ts`:
  - Tyypit `WhatsNewData`, `ReleaseNote`, `WhatsNewContent` (diskriminoitu unioni:
    `{ kind: 'welcome'; title; body }` tai
    `{ kind: 'release'; version; title; date?; items }`).
  - **Puhdas** `resolveWhatsNew({ current, lastSeen, data }): WhatsNewContent | null`:
    - `lastSeen == null` → `welcome` (ensiasennus). Jos remoten welcome puuttuu →
      käytä sovellukseen koodattua varatekstiä.
    - `lastSeen !== current` → remoten release jonka `version === current`.
      Jos remotessa ei vielä ole tätä versiota → palauta `null` (ei näytetä, eikä
      `lastSeen`:iä päivitetä → näytetään myöhemmin kun remote päivittyy).
    - `lastSeen === current` → `null`.
  - Sovellukseen koodattu welcome-varateksti vakiona tässä tiedostossa.

### Tila & UI

- `store.ts`:
  - Uusi tila `whatsNew: { visible: boolean; content: WhatsNewContent | null }`.
  - `checkWhatsNew()`: kutsutaan käynnistyksessä `prefsLoaded`:n jälkeen. Lukee
    `pkg.version` (= `current`) ja tallennetun `whatsNewLastSeenVersion`
    (= `lastSeen`), hakee `fetchWhatsNew()`, ajaa `resolveWhatsNew`. Jos tulos ei
    ole `null`, asettaa `whatsNew = { visible: true, content }`.
  - `openWhatsNew()`: manuaalinen avaus Asetuksista. Näyttää nykyisen version
    releasen (tai uusimman saatavilla olevan / varatekstin). **Ei** muuta
    `lastSeen`:iä.
  - `dismissWhatsNew()`: asettaa `whatsNewLastSeenVersion = current` (vain jos
    suljettu sisältö oli automaattinen, ei manuaalinen avaus), persistoi, sulkee
    modaalin.
- `preferences.ts`: uusi `whatsNewLastSeenVersion: string | null` (oletus `null`).
- Uusi `components/WhatsNewModal.tsx`: RN-`Modal`. Näyttää welcomen (otsikko +
  body) tai releasen (otsikko + versio + lista kohdista). Sulkunappi kutsuu
  `dismissWhatsNew`. Renderöidään `navigation/index.tsx`-juuressa
  (`NavigationContainer`-sisällä), jotta kelluu kaikkien välilehtien yllä.
- `AboutSection.tsx`: uusi **"Mitä uutta"** -rivi, joka kutsuu `openWhatsNew()`.

### Virhetilanteet

- Haku ei estä käynnistystä → täysin asynkroninen; modaali ilmestyy kun sisältö on
  valmis.
- Haku epäonnistuu eikä välimuistia ole: ensiasennuksessa näytetään koodattu
  welcome-varateksti; päivityksessä ei näytetä mitään ja `lastSeen` jää ennalleen
  (yritetään seuraavalla käynnistyksellä).
- `lastSeen` päivitetään vain kun automaattinen ilmoitus on näytetty ja suljettu,
  joten käyttäjä ei jää offline-/remote-viiveen takia paitsi ilmoituksesta.
- Welcomen ja releasen yhtäaikainen näyttö estetään (welcome voittaa
  ensiasennuksessa).

### Testit

- `mobile/src/lib/whatsnew.test.ts` (vitest): `resolveWhatsNew` ensiasennus
  (welcome), ensiasennus ilman remoten welcomea (varateksti), päivitys (matching
  release), päivitys ilman remoten releasea (null), sama versio (null). Puhdas
  funktio → ei verkkoa/AsyncStoragea testissä.

---

## Osa 3 — Versiointi, käyttöönotto ja testaus

### Versiointi (CLAUDE.md mukaisesti)

- `mobile/package.json`: `1.1.0` → `1.2.0`. Ohjaa "Tietoja"-footeria ja "Mitä
  uutta" -logiikan `current`-versiota.
- iOS (Xcode-projekti): `MARKETING_VERSION` → `1.2.0`, `CURRENT_PROJECT_VERSION` +1.
- Android (`mobile/android/app/build.gradle`): `versionName` → `1.2.0`,
  `versionCode` +1.
- `whatsnew.json`:n `releases[0].version` = `1.2.0`.

### Käyttöönotto

- `whatsnew.json` repon juureen + `deploy.yml`:ään `cp whatsnew.json _site/`.
  Push masteriin julkaisee sen Pagesiin. JSONin on oltava Pagesissa ennen kuin
  v1.2.0-build leviää käyttäjille, jotta päivitysviesti löytyy.
- iOS/Android store-paketointi ja lataus ovat käyttäjän manuaalisia vaiheita.
  Koodi, versionostot ja remote-JSON valmistellaan tässä työssä.

### Testaus / verifiointi

- `shared` + `mobile`: `npm test` (vitest) ja `npm run typecheck` molemmissa.
- Uudet vitest-testit: `shared/src/sort.test.ts`, `mobile/src/lib/whatsnew.test.ts`;
  `preferences`-testejä laajennetaan uusilla kentillä jos testitiedosto on olemassa.
- Manuaalinen tarkistus simulaattorilla jää käyttäjälle.

## Tiedostot

**Uudet:**
- `shared/src/sort.ts`, `shared/src/sort.test.ts`
- `mobile/src/lib/whatsnew.ts`, `mobile/src/lib/whatsnew.test.ts`
- `mobile/src/components/SortSelector.tsx`, `mobile/src/components/WhatsNewModal.tsx`
- `whatsnew.json`

**Muokattavat:**
- `shared/src/index.ts`
- `mobile/src/lib/store.ts`, `mobile/src/lib/preferences.ts`, `mobile/src/lib/data.ts`
- `mobile/src/screens/BrowseScreen.tsx`, `mobile/src/components/AboutSection.tsx`,
  `mobile/src/navigation/index.tsx`
- `mobile/package.json`, iOS/Android-versiot, `.github/workflows/deploy.yml`

## Työtapa

Trunk-based: työ tehdään lyhytikäisessä haarassa `feat/mobile-sort-whatsnew`, joka
integroidaan masteriin nopeasti. Ei pitkäikäistä feature-haaraa.
