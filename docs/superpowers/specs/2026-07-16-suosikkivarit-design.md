# Suosikkivärit — suunnitelma

**Päivä:** 2026-07-16
**Tila:** Hyväksytty (brainstorming), odottaa toteutus­suunnitelmaa
**Alusta:** mobiili (iOS + Android, sama koodi)

## Tausta

Suosikkiin halutaan väri, jolla käyttäjä voi merkitä esimerkiksi "tänne on
ilmoittauduttu / ollaan menossa". Merkitys on **käyttäjän itsensä
päätettävissä** — sovellus ei sanele mitä väri tarkoittaa, mutta käyttäjä voi
halutessaan **nimetä värin**, jolloin merkitys näkyy sovelluksessa selitteenä.

Nykytila:
- **Suosikit ovat vain mobiilissa.** Web-appissa (`app.js`, `index.html`) ei ole
  suosikkitoimintoa lainkaan → tämä työ ei koske webiä.
- Suosikki on totuusarvo: `favorites: Set<string>` (koe-id:t) storessa
  (`mobile/src/lib/store.ts`), action `toggleFavorite(id)`.
- Persistointi `mobile/src/lib/preferences.ts`: avain `koetutka:prefs:v1`,
  `StoredPrefs`/`JsonShape`, `serializePrefs`/`deserializePrefs` (Set → array,
  AsyncStorage).
- `EventCard` (`mobile/src/components/EventCard.tsx`): tähti `☆`/`★` omassa
  `Pressable`ssa (`onPress` → `toggleFavorite`, **ei long-pressiä**). Aktiivinen
  tähti on kiinteästi keltainen (`starActive: { color: '#d97706' }`). Kortin
  **rungon** `Pressable` käyttää `onLongPress` → `promptHide` (eri kohde, ei
  törmäystä).
- `FavoritesScreen` (`mobile/src/screens/FavoritesScreen.tsx`): laskee `items`
  (suosikit → `showPast`-suodatus → etäisyydet → `sortEvents`), näyttää
  lista- tai kalenterinäkymän, ja jakaa `shareFavoritesList(items)` → jako on jo
  WYSIWYG listanäkymästä.
- `FavoritesAgenda` (`mobile/src/components/FavoritesAgenda.tsx`): **ei ota
  propseja**, lukee storesta itse (`events`, `favorites`, `filters`, `hidden`)
  ja näyttää myös `candidate`-kokeita (päällekkäisyys­ehdokkaat).
- `syncNotifications` ajastaa muistutukset kaikille suosikeille
  (`events.filter(e => favorites.has(e.id))`).

## Tavoite

Suosikille voi antaa värin kiinteästä paletista. Väri näkyy kortin tähdessä.
Suosikit-näytön listan voi **suodattaa** ja **ryhmitellä** värin mukaan, ja
värille voi antaa oman nimen, joka näkyy selitteenä. Ilmoitukset säilyvät
ennallaan.

## Osa 1 — Tietomalli ja migraatio

`favorites: Set<string>` **säilyy sellaisenaan** (jäsenyys). Kaikki nykyiset
`favorites.has(id)` -kutsut (`EventCard`, `FavoritesScreen`, `FavoritesAgenda`,
`syncNotifications`) toimivat muuttumatta. Väri on ohut lisäkerros:

- `favoriteColors: Map<string, ColorKey>` — koe-id → väriavain.
  **Puuttuva = oletusväri.**
- `colorLabels: Record<ColorKey, string>` — väriavain → käyttäjän antama nimi.
  **Globaali, ei per-koe.** Puuttuva/tyhjä = ei nimeä, pelkkä väri.

### Paletti

Uusi moduuli `mobile/src/lib/favorite-colors.ts`:

```ts
export type ColorKey = 'default' | 'red' | 'blue' | 'green' | 'purple';

export const FAVORITE_COLORS: { key: ColorKey; color: string }[] = [
  { key: 'default', color: '#d97706' }, // nykyinen keltainen
  { key: 'red',     color: '#dc2626' },
  { key: 'blue',    color: '#2563eb' },
  { key: 'green',   color: '#15803d' },
  { key: 'purple',  color: '#7c3aed' },
];

export const DEFAULT_COLOR_KEY: ColorKey = 'default';
```

- `resolveColor(key)`: palauttaa hexin; **tuntematon avain → oletusväri**
  (suojaa vanhalta/tulevalta datalta).

### Persistointi

`StoredPrefs`iin ja `JsonShape`en kaksi uutta kenttää:

```ts
favoriteColors?: Record<string, string>;  // id → ColorKey
colorLabels?: Record<string, string>;     // ColorKey → nimi
```

- `serializePrefs`: `Object.fromEntries(prefs.favoriteColors)`.
- `deserializePrefs`: `new Map(Object.entries(parsed.favoriteColors ?? {}))`,
  `colorLabels: parsed.colorLabels ?? {}`.
- **Taaksepäin yhteensopiva:** vanhat tallennetut preferenssit (ilman näitä
  kenttiä) latautuvat ongelmitta → kaikki suosikit oletusvärillä, ei nimiä.
  Avain `koetutka:prefs:v1` **ei muutu** (ei rikkovaa muutosta).

## Osa 2 — Store

Uudet actionit (`mobile/src/lib/store.ts`):

- `setFavoriteColor(id: string, key: ColorKey)`
  - Asettaa `favoriteColors[id] = key`. Jos `key === 'default'`, **poistaa**
    merkinnän (oletus ei vie tilaa).
  - Jos koe **ei ole vielä suosikki**, lisää sen suosikkeihin — värin valinta
    kortilta implikoi suosikoinnin.
  - `persist()` + `void syncNotifications()` (jäsenyys voi muuttua).
- `setColorLabel(key: ColorKey, label: string)`
  - Trimmattu tyhjä → poistaa nimen. `persist()`.
- `toggleFavorite(id)` — säilyy, mutta **siivoaa** `favoriteColors`-merkinnän
  kun suosikki poistetaan (ei orpoja värejä).

## Osa 3 — Vuorovaikutus ja UI

### `EventCard`

- Tähti värjätään suosikin värillä: `resolveColor(favoriteColors.get(id))`.
  Ei-suosikki = nykyinen harmaa `☆`. Oletusväri = **nykyinen keltainen**, joten
  ulkoasu ei muutu käyttäjälle joka ei värejä käytä.
- **Tähden pitkä painallus → värivalitsin.** Lyhyt tap säilyy ennallaan
  (`toggleFavorite`). Kortin rungon long-press (`promptHide`) ei muutu.
- Värivalitsin: kevyt modaali/popover — rivi 5 väripistettä (nykyinen valinta
  korostettuna) + linkki "Nimeä värit" (avaa nimeämismodaalin, ks. alla).
  Nimetyille väreille näytetään nimi pisteen vieressä.

### Nimeämismodaali (jaettu komponentti)

`FavoriteColorLabelsModal` — **yksi** komponentti, kaikki nimeäminen kulkee
sen kautta. Listaa paletin värit, kullakin `TextInput` nimeä varten
(tyhjä = ei nimeä). Käyttää `setColorLabel`ia.

- **Ei `Alert.prompt`** — se on iOS-only ja appi on myös Androidilla.
- Avataan kahdesta paikasta: värivalitsimen "Nimeä värit" -linkistä
  (`EventCard`, toimii myös Selaa-näytöstä) ja Suosikit-näytön selitteestä.

### `FavoritesScreen` — selite, suodatus, ryhmittely

- **Selite-/suodatuspalkki** listanäkymän yläreunaan: siru per **käytössä oleva**
  väri (väripiste + nimi jos annettu + lukumäärä). Sirua painamalla lista
  suodattuu siihen väriin (toggle, uudelleen paino poistaa suodatuksen).
- **"Ryhmittele"-kytkin**: ryhmittelee listan värin mukaan otsikko-osioihin
  (paletin järjestyksessä, nimetön väri otsikoksi pelkkä väripiste).
- **Nimeäminen**: selitepalkin oikeassa reunassa "Nimeä värit" -painike, joka
  avaa jaetun `FavoriteColorLabelsModal`in (ks. yllä).
- Suodatus- ja ryhmittelytila on **paikallista komponenttitilaa** (`useState`),
  **ei persistoitua** — kuten nykyiset `view`/`showPast`.

### Rajaus: agenda ja jako

- **Väri­suodatus ja ryhmittely koskevat vain listanäkymää.** `FavoritesAgenda`
  lukee storesta itse eikä ota propseja, ja näyttää myös
  päällekkäisyys­ehdokkaita — sen suodattaminen värillä ei ole mielekästä.
  Agendan kortit näyttävät silti värit (perii `EventCard`:n kautta).
- **Jako säilyy ennallaan.** `shareFavoritesList(items)` saa listanäkymän
  `items`-listan, joten suodatus/ryhmittely heijastuu jakoon automaattisesti.
  Värin nimeä **ei** lisätä jakoteksti­riveille (YAGNI) →
  `shared/src/favorites-share.ts` **ei muutu**.
- **Ilmoitukset säilyvät ennallaan** — kaikki suosikit muistuttavat värista
  riippumatta. `syncNotifications` ei muutu.

## Osa 4 — Testit

`vitest` (mobile):

- `preferences`: round-trip uusilla kentillä; **vanha JSON ilman niitä** →
  tyhjä `favoriteColors` + `colorLabels` (migraatio); tuntematon väriavain.
- `store`: `setFavoriteColor` lisää jäsenyyden jos puuttuu; `'default'` poistaa
  merkinnän; `toggleFavorite` off siivoaa värin; `setColorLabel` trimmaa/poistaa.
- Puhdas helper (ryhmittely väreittäin + laskurit selitteelle) omana
  testattavana funktiona `favorite-colors.ts`:ssä — ei UI-riippuvuutta.

## Osa 5 — Versiointi

Uusi ominaisuus → **minor-bump 1.7.0**:
- `mobile/package.json` `version`
- iOS `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION` (inkrementti)
- Android `versionName` + `versionCode` (inkrementti)
- `whatsnew.json`: uusi merkintä ylimmäksi (ships web-deployn kautta, ei vaadi
  mobiilibuildia)

## Avoimet kysymykset

Ei avoimia kysymyksiä.
