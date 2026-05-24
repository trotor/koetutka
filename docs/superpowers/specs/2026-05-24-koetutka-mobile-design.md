# Koetutka — natiivimobiilisovellus

**Status:** Suunnitelma · **Pvm:** 2026-05-24 · **Tekijä:** Tero Rönkkö

## Yleiskuva

Koetutka on tällä hetkellä yksisivuinen web-sovellus (`index.html`), joka näyttää SNJ:n noutajakokeet käyttäjän valitseman sijainnin lähellä. Tämä spec kuvaa miten siitä rakennetaan natiivi iOS- ja Android-sovellus säilyttäen samalla nykyisen web-version.

Tavoitteena on **laadukas mobiilikäyttökokemus** — natiivi tuntuma, push-tyyppiset ilmoitukset uusista kokeista, suosikit ja offline-käyttö.

## Tavoitteet

- Aito natiivi tuntuma molemmilla alustoilla (ei webview-wrapperi)
- Sovellus saatavilla App Storessa ja Google Playssä
- Ilmoitukset uusista kokeista käyttäjän alueella, ilmoittautumisajan avautumisesta ja päättymisestä
- Suosikit ja sijaintipreferenssit talletettuna paikallisesti laitteeseen
- Toimii offline (viimeisin haettu data käytettävissä ilman verkkoa)
- Nykyinen web-versio jatkaa rinnalla täydellä toiminnallisuudella
- Liiketoimintalogiikka (etäisyys, suodatus, ICS) jaettu webin ja mobiilin välillä

## Ei-tavoitteet

- Käyttäjätilien tai kirjautumisen lisääminen
- Käyttäjädatan tallennus serverille tai pilveen (kaikki paikallista)
- Push-backendin rakentaminen (käytetään background fetchiä + paikallisia ilmoituksia)
- Tulosten, ilmoittautumisen tai järjestäjäpalvelujen lisäys (pelkkä koekalenteri)
- Webin replikointi nykyiset 1:1 — mobiili saa olla mobiilin näköinen, ei kopio

## Lähestymistapa

**Expo + React Native + TypeScript.**

- React Native antaa aidot natiivi-UI-komponentit (ei webview)
- Expo SDK + EAS Build hoitaa buildit, store-submitin ja OTA-päivitykset
- TypeScript-tyypit jaetaan webin kanssa
- JS-tausta (nykyinen `index.html`) siirtyy luonnollisesti
- Aktiivinen ekosysteemi, hyvät kirjastot kartalle, sijainnille, ilmoituksille

Hylätyt vaihtoehdot: Capacitor (webview ei vastaa "laadukas natiivi" -tavoitetta), Flutter (uusi kieli, ei koodinjakoa webin kanssa), erilliset natiivikoodikannat (hobby-ylläpidolle liikaa).

## Arkkitehtuuri

```
┌──────────────────────────────────────────────────────────────┐
│  GitHub-repo (monorepo-light)                                │
│                                                              │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │  web/       │  │  shared/         │  │  mobile/       │   │
│  │  index.html │──▶  distance.ts     ◀──│  Expo + RN     │   │
│  │  (olemassa) │  │  ics.ts          │  │  (uusi)        │   │
│  │             │  │  filters.ts      │  │                │   │
│  │             │  │  formatters.ts   │  │                │   │
│  │             │  │  types.ts        │  │                │   │
│  └─────────────┘  └──────────────────┘  └────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  data/                                                  │ │
│  │  snj_kokeet.py   GitHub Actions (cron)                  │ │
│  │  koetutka_YYYY.json (julkaistaan GitHub Pagesissa)      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      CDN (GitHub Pages)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         Web-käyttäjät                Mobiilikäyttäjät
         (selain)                     (iOS / Android)
```

**Ei serveri-puolen komponentteja muita kuin nykyinen GitHub Actions + Pages.** Push-ilmoitukset hoituvat mobiilissa background fetchillä, joka ajaa paikallisen ilmoituksen jos uusia osumia löytyy.

### Repo-rakenne

Nykyinen repo (`koetutka/`) laajenee:

```
koetutka/
├── shared/                  # uusi: TS-moduulit
│   ├── distance.ts
│   ├── ics.ts
│   ├── filters.ts
│   ├── formatters.ts
│   ├── types.ts
│   └── package.json
├── web/                     # olemassa: index.html siirtyy tänne
│   └── index.html
├── mobile/                  # uusi: Expo-appi
│   ├── app/                 # expo-router screen-tiedostot
│   ├── components/
│   ├── lib/
│   ├── app.config.ts
│   └── package.json
├── snj_kokeet.py            # olemassa
├── coordinates_cache.json   # olemassa
└── koetutka_YYYY.json       # olemassa
```

Workspace-rakenne (pnpm workspaces) saa `mobile/` ja `web/` importtaamaan `shared/`:n suoraan ilman erillistä julkaisuvaihetta.

### Jaettu logiikka (`shared/`)

Vaatii nykyisen `index.html`:n inline-JS:n eriyttämisen omiksi moduuleiksi:

- **`distance.ts`** — Haversine-kaava (`haversine(lat1, lon1, lat2, lon2): number`)
- **`ics.ts`** — ICS-tiedoston generointi tapahtumasta ja ilmoittautumismuistutuksesta
- **`filters.ts`** — Suodatus tyyppien, tasojen, etäisyyden ja menneisyyden mukaan
- **`formatters.ts`** — Päivämäärä-, hinta- ja etäisyysmuotoilijat
- **`types.ts`** — `Event`, `Cost`, `Person`, `Filter` -tyypit (SNJ-JSON-rakenteen mukaan)

Web päivittyy käyttämään näitä — UI pysyy täysin samana, vain rakenne muuttuu.

### Mobiilin tech stack

| Asia | Valinta | Perustelu |
|------|---------|-----------|
| Framework | Expo SDK 51+ + React Native | Yksi koodikanta, natiivi tuntuma |
| Kieli | TypeScript | Jaettu webin kanssa, tyyppiturvallisuus |
| Reititys | `expo-router` (file-based) | Natiivi navigaatiotuntuma, helppo |
| State | Zustand | Pieni, helppo, ei boilerplatea |
| Storage | `AsyncStorage` + `expo-file-system` | Preferenssit + JSON-cache |
| Kartta | `react-native-maps` | iOS: Apple Maps oletus, Android: Google Maps |
| Sijainti | `expo-location` | GPS + reverse-geocoding |
| Background | `expo-background-fetch` + `expo-task-manager` | Päivittäinen päivitys |
| Ilmoitukset | `expo-notifications` (vain paikalliset) | Ei serveriä, ei tokeneita |
| Build | EAS Build | Pilvikäännös ilman omaa Maccia Androidiin |

### Tietovirta

```
1. GitHub Actions (cron, päivittäinen)
   → snj_kokeet.py → SNJ API + Nominatim
   → koetutka_YYYY.json päivittyy

2. Mobiilisovellus (käynnistyksessä JA background fetchissä)
   → fetch(GitHub Pages /koetutka_YYYY.json)
   → tallenna AsyncStorageen offline-käyttöön
   → vertaa tallennettuihin "tunnetut event ID:t"
   → näytä paikallinen ilmoitus uusista jos preferenssit täsmäävät

3. Käyttäjä avaa appin
   → shared/filters + shared/distance laskee suodatetun listan
   → näyttää listan tai kartan
```

## Navigaatiorakenne

**Bottom tab bar, 3 tabia + 1 toggle.**

```
┌─────────────────────────────────────┐
│                                     │
│         (näkymä sisältö)            │
│                                     │
├─────────────────────────────────────┤
│  [📋 Selaa]  [★ Suosikit]  [⚙ Aset.] │
└─────────────────────────────────────┘
```

- **Selaa** (oletustabi) — sisältää oman toggle-pillin `[📋 Lista | 🗺 Kartta]` jotka jakavat saman suodatinkontekstin
- **Suosikit** — vain tähdellä merkityt kokeet aikajärjestyksessä, ylhäällä "Seuraava: X — Y päivän päästä" -banneri
- **Asetukset** — sijainti, max-etäisyys, ilmoituspreferenssit, lajisuodattimet, sovelluksen tiedot

Detail-näkymät avautuvat bottom sheet -modaaliksi mistä tahansa listasta tai kartan pin-popupista.

## Näytöt

### 1. Selaa · Lista

- Yläosa: oma sijainti + muuta-painike, suodatin-chipit (lajit, max-etäisyys, "vain tulevat")
- Toggle-pilli: Lista / Kartta
- Lista korttipohjainen (kuten nykyinen v1.3.0-mobiilinäkymä)
- Korttin sisältö: laji + taso, paikkakunta, päivämäärä, ilmoittautumisaika, etäisyys
- Suosikit korostetaan oranssilla reunalla + tähdellä
- Pull-to-refresh hakee uusimman JSONin
- Tyhjä tila: "Ei kokeita säteelläsi — kokeile suurempaa etäisyyttä"

### 2. Selaa · Kartta

- Sama suodatin kuin listassa
- Pin per koe; suosikit oranssilla, muut vihreällä, oma sijainti sinisellä
- Lähellä olevien pinien klusterointi
- Pinin klikkaus → mini-kortti pinin yli; kortin klikkaus → bottom sheet -detail
- "Keskitä omaan sijaintiin" -painike

### 3. Kokeen tiedot (bottom sheet)

- Ylhäällä: laji + taso, paikkakunta, etäisyys, päivämäärä, tähti-painike
- Tieto-rivit: ilmoittautumisaika, hinta (jäsen/ei-jäsen), tuomarit, järjestäjä, yhteyshenkilöt, kuvaus, luokat
- Painikkeet: **📅 Kalenteri** (kokeen tapahtuma + ilmoittautumismuistutus), **↗ Jaa** (natiivi share), **🗺 Aja** (avaa karttasovellus paikkakuntahaulla)
- Linkki SNJ:n kalenteriin
- Pieni huomautus jos sijainti vain paikkakuntatasolla: "Tarkka paikka selviää järjestäjältä"

### 4. Suosikit

- Lista vain tähdellä merkityistä kokeista, järjestys lähimmästä päivämäärästä
- Ylhäällä "Seuraava koe: Lahti 7.6. — 14 päivän päästä" -banneri (vain jos tulevia kokeita)
- Tyhjä tila: "Lisää suosikkeja tähtipainikkeella"

### 5. Asetukset

Sektiot:

- **Sijainti**: oma sijainti (paikkakunta), maksimietäisyys
- **Ilmoitukset**: päätoggle "Uudet kokeet säteelläsi", erikseen "Ilmoittautuminen avautuu (1 vrk ennen)", "Ilmoittautuminen päättyy (3 vrk ennen)"
- **Lajit**: vain valitut lajit -toggle + checkbox-lista (NOME-A, NOME-B, NOU, NOWT)
- **Sovellus**: versio, palaute, GitHub-linkki, lisenssit

### 6. Onboarding (ensimmäinen käynnistys)

- 1 näyttö: "Tervetuloa Koetutkaan — valitse sijaintisi"
- Joko GPS-painike tai paikkakuntahaku
- Skip → asetuksissa voi tehdä myöhemmin
- Ei rekisteröitymistä, ei tilejä

## Ilmoitukset

**Background fetch + paikalliset ilmoitukset.** Ei push-serveriä.

### Mekanismi

1. Appi rekisteröi `BackgroundFetch`-taskin asennuksen yhteydessä — pyyntö ajaa task n. kerran päivässä
2. iOS päättää tarkan ajan; Android käyttää WorkManageria luotettavasti
3. Task ajaa:
   - Hae JSON GitHub Pagesista
   - Vertaa AsyncStorageen tallennettuun "tunnettujen event ID:eiden" listaan
   - Suodata uudet käyttäjän preferensseillä (sijainti + max-etäisyys + lajisuodattimet)
   - Jos osumia → ajasta paikallinen ilmoitus
   - Päivitä tunnettujen ID:eiden lista
4. Samat tarkistukset ajetaan myös appin käynnistyksessä — jos background fetch ei ole ehtinyt ajaa, käyttäjä saa silti ilmoituksen seuraavalla avauksella

### Ilmoitustyypit

- **Uudet kokeet säteelläsi** — kun JSONiin ilmestyy uusi tapahtuma joka täyttää preferenssit. Ryhmitellään: "3 uutta koetta 200 km säteelläsi"
- **Ilmoittautuminen avautuu** — 1 vrk ennen ilmoittautumisajan alkua, erikseen suosikkien osalta
- **Ilmoittautuminen päättyy** — 3 vrk ennen ilmoittautumisajan loppua, erikseen suosikkien osalta

Käyttäjä voi togglata näitä erikseen asetuksissa.

### iOS-rajoitteet

Apple ei takaa background fetchin ajoaikaa. Pahimmillaan voi viivästyä, mutta käyttäjä saa silti ilmoituksen seuraavalla avauksella. Pidetään hyväksyttävänä hobby-appille.

## Datan käsittely

- **Yksi staattinen JSON** GitHub Pagesissa, sama mitä web käyttää tällä hetkellä
- **Vuosivalinta**: appi yrittää ladata nykyisen vuoden JSONin, fallbackina edellinen vuosi (sama logiikka kuin nykywebissä)
- **Cache**: viimeisin onnistunut JSON-lataus tallennetaan `expo-file-system`-tiedostoksi → toimii offline
- **Tunnettujen event ID:eiden lista** AsyncStoragessa diffaukseen
- **Preferenssit** AsyncStoragessa (sijainti, max-etäisyys, lajisuodattimet, ilmoitustogglet, suosikkien ID-lista)

Ei käyttäjädataa lähde laitteelta mihinkään ulos. App Store / Google Play -tietosuojakuvauksessa "ei kerää käyttäjätietoja".

## Jako, kartta ja kalenteri

- **Jako**: `expo-sharing`-natiivi share-sheet. Linkki muotoa `https://trotor.github.io/koetutka/#event/{id}` (sama hash-routing mikä webillä on jo)
- **Kalenteri**: ICS-tiedosto generoidaan `shared/ics.ts`:llä, tallennetaan tilapäisesti laitteelle ja avataan native handlerilla (lisää Calendariin/Kalenteriin)
- **Reittiohjeet**: `Linking.openURL` paikkakuntahaulla — iOS: `maps://?q=Lahti`, Android: `geo:0,0?q=Lahti`. Käyttäjän oletuskarttasovellus avautuu

## Distribuutio

### App Store (iOS)

- Apple Developer Program -tili ($99/v)
- Bundle ID: `com.savonnuuskut.koetutka` (tai `fi.muikea.koetutka`)
- App Store Connect: nimi, kuvaus, avainsanat, screenshot-vaatimukset (vähintään 6.7" iPhone)
- Tietosuojakuvaus: ei kerätä käyttäjätietoja, sijaintia käytetään vain paikallisesti
- Background mode -perustelu: "App refreshes trial data daily so users can be notified about new events near them"
- EAS Submit → review (yleensä 24–48h)

### Google Play

- Google Play Developer -tili ($25 kertamaksu)
- ID-tarkistus (1–2 vk ensimmäisellä kerralla)
- Play Console: vastaavat materiaalit, target SDK -vaatimukset, ikäluokitus (3+)
- EAS Submit → review (yleensä 24h)

### Brändäys

- App icon vaatii useita kokoja (iOS: 1024×1024, Android: 512×512, adaptive icon)
- Splash screen
- Värimaailma nykyisestä vihreästä (`#2d5a27`)
- Pohjana voidaan käyttää nykyistä favicon-192 / apple-touch-iconia, mutta erikseen vaaditaan adaptiivinen iconi Androidiin

## Toteutusvaiheet

### Vaihe 0 — `shared/`-refaktorointi (~1 vk)

- Pystytä pnpm workspaces
- Pilkko `index.html`:stä JS pois omiksi `.ts`-tiedostoiksi `shared/`-kansioon
- Päivitä `index.html` käyttämään näitä `<script type="module">`-tagilla
- Verifioi että web toimii kuten ennen
- **Commit-piste**: web toimii muuttumattomana, logiikka on jaettavissa

### Vaihe 1 — MVP-mobiili (~3–4 vk)

- `npx create-expo-app mobile/` TypeScript-templatella
- `expo-router`-asennus, 3-tabin pohja
- Selaa-tabissa lista, suodatin-chipit, fetch GitHub Pagesista
- Bottom sheet -detail, ICS-vienti
- Sijainnin asetus: tekstihaku (Nominatim) + GPS
- **Commit-piste**: appi pyörii Expo Go:ssa, voi testata puhelimellasi USB:n yli

### Vaihe 2 — Kartta, suosikit, jako (~2 vk)

- `react-native-maps` integraatio, klusterointi, pin-popup
- AsyncStorage suosikeille, Suosikit-tab näkymä
- Natiivi share, "Aja"-painike, paikkakuntahuomautus
- **Commit-piste**: kaikki päätoiminnot toimivat ilman ilmoituksia

### Vaihe 3 — Background fetch + ilmoitukset (~1–2 vk)

- `expo-background-fetch` + `expo-task-manager` daily task
- `expo-notifications` paikalliset ilmoitukset
- Tunnettujen ID:eiden diffaus + preferenssisuodatus
- Asetukset-tabin togglet
- Offline-cache (`expo-file-system`)
- **Commit-piste**: ilmoitukset toimivat oikealla puhelimella

### Vaihe 4 — Store-julkaisu (~2–4 vk, paljon odotusta)

- Apple Developer + Google Play -tilien avaus
- EAS Build production-konfiguraatio (icon, splash, bundle ID)
- Screenshot-tuotanto (vähintään 6.7" iPhone + Android-vastaava)
- App Store Connect + Play Console -metadata
- EAS Submit + review-kierros
- **Commit-piste**: Koetutka julkaistu storeen

### Vaihe 5 — Polish (jatkuva)

- Animaatiot (sheet, list-itemit, toggle)
- Pull-to-refresh feedback, skeleton-loaderit
- Tyhjät tilat eri näkymissä
- Tumma teema
- OTA-päivitykset EAS Updaten kautta

## Riskit ja avoimet kysymykset

| Riski | Lievennys |
|-------|-----------|
| Apple-review hylkää background fetchin perustelujen vuoksi | Selkeä kirjallinen perustelu sumissaossa, varakeino: ajetaan vain käynnistyksessä |
| iOS background fetch ei ajaudu riittävän usein | Hyväksytään hobby-appille; käynnistyksessä tarkistus toimii varakeinona |
| Karttakirjasto vaatii Google Maps API -avaimen iOS:lla | Käytetään Apple Mapsia iOS:lla oletuksena (ilmainen, parempi tuntuma) |
| Nykyinen `index.html` rikkoutuu `shared/`-refaktorin yhteydessä | Vaihe 0 saatetaan loppuun erillisenä commitina, verifioidaan webin toimivuus ennen mobiilityön aloitusta |
| OTA-päivitysten väärinkäyttö (Apple kieltää suuret muutokset OTAn yli) | Käytetään OTAa vain bugifixeihin ja pieniin parannuksiin |
| Brändityö (ikoni, screenshotit) vie ennakoitua kauemmin | Aloitetaan jo vaiheen 1 aikana rinnalla |

### Avoimet kysymykset

- **Bundle ID** — `com.savonnuuskut.koetutka` vai `fi.muikea.koetutka`?
- **App-näyttönimi** — "Koetutka" vai jokin laajempi (esim. "Koetutka — Noutajakokeet")?
- **Karttapalvelu Androidilla** — Google Maps oletus, voiko olla OpenStreetMap-pohjainen?
- **Brändäys** — teetkö itse vai onko graafikko jolta kysytään ikoni?

Nämä ratkaistaan vaiheessa 4 viimeistään.
