# Swipe-toiminnot koekortteihin — suunnitelma

**Päivä:** 2026-07-10
**Tila:** Hyväksytty (brainstorming), odottaa toteutus­suunnitelmaa
**Alusta:** mobiili (iOS + Android, sama koodi)

## Tausta

Mobiilin listakortteihin (`EventCard`) halutaan iOS-tyyliset pyyhkäisy­toiminnot,
jotta suosikointi / piilotus / kalenteriin lisäys onnistuu ilman kortin
avaamista. Toiminnot kartoitetaan **nykyisiin** ominaisuuksiin — ei uutta tilaa.

Nykytila:
- `EventCard` (`mobile/src/components/EventCard.tsx`) käytössä kolmessa paikassa:
  `BrowseScreen` (Selaa), `FavoritesScreen` (Suosikit, listanäkymä),
  `FavoritesAgenda` (Suosikit, kalenterinäkymä).
- Store (`mobile/src/lib/store.ts`) tarjoaa `toggleFavorite(id)` ja
  `toggleHidden(id)`; suosikit/piilotetut persistoidaan `preferences.ts`:ssä
  (Set → array, AsyncStorage).
- Kalenteriin lisäys: `addEventToCalendar(event, 'event'|'registration', loc)`
  (`mobile/src/lib/calendar-add.ts`) avaa käyttöjärjestelmän lisäys-dialogin
  `react-native-add-calendar-event`:n `presentEventCreatingDialog`illa. Se **ei
  lue kalenteria**. Paluu iOS: `{action:'SAVED', eventIdentifier}` /
  `{action:'CANCELED'}`; Android: käytännössä `DONE` (ei erottelua).
- `react-native-gesture-handler` 2.24.0 on asennettu, `GestureHandlerRootView`
  kääri appin (`App.tsx`). `react-native-reanimated` **ei** ole asennettu.
- Notifikaatiot (`notifee`) ajastetaan **koepäivän** mukaan — **eivät** muistuta
  ilmoittautumis­deadlineista. Siksi ilmoittautuminen kuuluu kalenteri­toimintoon.

## Tavoite

Lisää `EventCard`:iin `Swipeable`-kääre (gesture-handlerin **legacy**
`Swipeable`, ei vaadi reanimatedia → ei uutta riippuvuutta). Pyyhkäisy­toiminnot
ovat **ruutukohtaiset**. Lisää kevyt "olen jo lisännyt kalenteriin" -muisti
(taso A) joka näkyy kalenterivalikossa.

## Osa 1 — Swipe-layout (napin reuna; vetosuunta on päinvastainen)

```
SELAA (BrowseScreen)
  Vasen reuna (positiivinen)  →  ★ Suosikki          (vihreä, toggle)
  Oikea reuna (poistava)      →  Piilota              (harmaa)

SUOSIKIT (FavoritesScreen, lista)
  Vasen reuna (positiivinen)  →  📅 Kalenteri         (sininen) → valikko Koe / Ilmo
  Oikea reuna (poistava)      →  Poista suosikeista   (punainen)
```

- `EventCard` saa uuden propin `swipeVariant?: 'browse' | 'favorites'`
  (oletus `'browse'`). `BrowseScreen` ei anna sitä (oletus), `FavoritesScreen`
  antaa `'favorites'`. `FavoritesAgenda` käyttää oletusta (`'browse'`:
  vasen = suosikki, oikea = piilota) — järkevä sekanäkymässä.
- Vuorovaikutus: lyhyt liu'utus paljastaa värillisen napin (ikoni + lyhyt
  teksti); loppuun asti liu'uttaminen laukaisee toiminnon suoraan; kevyt
  haptiikka laukaisussa; **ei vahvistus­dialogia** (kaikki peruttavissa).
- Vain **yksi rivi auki kerrallaan**: lista pitää viittausta avoinna olevaan
  `Swipeable`en ja sulkee edellisen kun uusi avautuu.
- Nykyinen long-press-piilotus (`EventCard`) säilyy rinnalla.

## Osa 2 — Kalenteri­valikko (Suosikit, vasen reuna)

- Kalenteri-nappi avaa pienen valikon (`ActionSheetIOS` iOS:llä, `Alert` napeilla
  Androidilla — tai yksinkertainen jaettu valikko­komponentti): **Koe** /
  **Ilmoittautuminen** / Peruuta.
- Kumpikin rivi kutsuu `addEventToCalendar(event, 'event'|'registration', loc)`.
- Rivin edessä **✓** jos kyseinen tyyppi on jo lisätty appin kautta (taso A).

## Osa 3 — Taso A: "olen lisännyt kalenteriin" -muisti

- Store: uusi `calendarAdded: Set<string>`, avaimena `` `${eventId}:${type}` ``
  (type = `'event'` | `'registration'`). Persistoidaan `preferences.ts`:ssä
  samalla Set→array-kaavalla kuin `favorites`/`hidden`.
- Store-action: `markCalendarAdded(eventId, type)` (lisää settiin + persistoi).
  Selector/apuri: onko `(eventId,type)` lisätty.
- `addEventToCalendar` muutetaan palauttamaan `Promise<boolean>` (`true` = lisätty):
  iOS `action === 'SAVED'` → `true`, `'CANCELED'` → `false`; Android (ei erottelua)
  → `true` optimistisesti. Kutsujat (kalenterivalikko **ja** detaljinäytön
  nykyiset lisäys­napit) kutsuvat `markCalendarAdded` kun paluu on `true`.
- Muisti on **vihje, ei totuus**: ei huomaa kalenterista jälkikäteen poistoa eikä
  muualta lisäystä; Androidilla voi merkitä myös perutun. Tämä hyväksytään.

## Osa 4 — Versiointi & whatsnew

- Mobiili `1.5.0 → 1.6.0`; iOS `CURRENT_PROJECT_VERSION 6 → 7`
  (`MARKETING_VERSION 1.6.0`); Android `versionName 1.6.0`, `versionCode 7 → 8`.
- `whatsnew.json`: uusi merkintä (uusin ensin) suomeksi, kuvaa pyyhkäisy­toiminnot.
- Web-versiota **ei** muuteta (ominaisuus on vain mobiilissa).

## Ei mukana (YAGNI)

- Taso B: oikea kalenterin luku/tarkistus (uusi lupa + kirjasto).
- Kalenteri-swipe Selaa-listalle (siellä vasen = suosikki).
- Uusi "osallistun"-tila.
- `react-native-reanimated` (käytetään legacy `Swipeable`a).
- Undo-toast (toiminnot peruttavissa muutenkin).

## Testaus

- Jaettu logiikka on jo testattu; uusi jaettu logiikka on minimaalinen
  (avainmuoto `${id}:${type}` voidaan tehdä pienenä puhtaana apurina + vitest).
- `preferences.ts`:n serialize/deserialize `calendarAdded`:lle testataan
  (`mobile/src/lib/tests/preferences.test.ts` on jo olemassa).
- Muu (Swipeable-UI, kalenterivalikko) todennetaan `npm run typecheck` +
  manuaalinen laite/simulaattori­testi (ei RN-komponenttitestikehystä).
