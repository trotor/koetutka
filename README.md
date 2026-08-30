# Koetutka

Interaktiivinen web-sovellus, joka näyttää SNJ:n (Suomen Noutajakoirajärjestö) koirakokeet ja järjestää ne etäisyyden mukaan valitsemastasi sijainnista.

**Live:** [trotor.github.io/koetutka](https://trotor.github.io/koetutka)

**Lataa mobiilisovellus:**

<p>
  <a href="https://apps.apple.com/fi/app/koetutka/id6779765394"><img src="app-store-badge.svg" alt="Lataa App Storesta" height="44"></a>
  &nbsp;
  <a href="https://play.google.com/store/apps/details?id=com.koetutka"><img src="google-play-badge.png" alt="Hae sovellus Google Playsta" height="66"></a>
</p>

## Ominaisuudet

- **Dynaaminen sijainti** - Valitse paikkakuntasi tekstihaulla tai käytä GPS-paikannusta
- **Etäisyysjärjestys** - Kokeet järjestetään automaattisesti etäisyyden mukaan
- **Suodatus** - Suodata kokeen tyypin (NOME-B, NOU, NOWT) tai tason (ALO, AVO, VOI) mukaan
- **Kalenteriin vienti** - Lataa .ics-tiedosto yhdellä klikkauksella
- **Mobiilioptimoidut** - Toimii hyvin myös puhelimella
- **Automaattinen päivitys** - Data päivittyy päivittäin GitHub Actionsilla

## Käyttö

1. Avaa [trotor.github.io/koetutka](https://trotor.github.io/koetutka)
2. Valitse sijaintisi (tekstihaku tai GPS)
3. Selaa kokeita - ne ovat järjestetty etäisyyden mukaan
4. Klikkaa **ℹ️** nähdäksesi lisätiedot
5. Klikkaa **📅** lisätäksesi kalenteriin

## Kehitys

### Vaatimukset

```bash
python3 -m venv venv
source venv/bin/activate
pip install requests geopy
```

### Datan haku

```bash
# Hae tietyn vuoden data
python snj_kokeet.py --year 2026

# Testaa lokaalisti
python3 -m http.server 8080
# Avaa: http://localhost:8080/
```

### Tiedostorakenne

```
koetutka/
├── index.html              # Pääsivu (JavaScript + CSS inline)
├── snj_kokeet.py           # Datan hakija (Python)
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions: päivittää datan ja deployaa
└── coordinates_cache.json  # Geokoodauksen cache (generoituu)
```

## Tekniikka

**Backend (Python):**
- Hakee tapahtumat SNJ:n API:sta
- Geokoodaa sijainnit Nominatim-palvelulla (tulokset cachetaan)

**Frontend (JavaScript):**
- Laskee etäisyydet Haversine-kaavalla selaimessa
- Sijainnin haku: paikallinen kaupunkilista + Nominatim API
- Kalenteritiedoston generointi (.ics)

**CI/CD:**
- GitHub Actions ajaa päivittäin klo 8:00 (Suomen aikaa)
- Hakee uusimman datan ja deployaa GitHub Pagesiin

## Data

Data haetaan SNJ:n virallisesta koekalenterista. Etäisyydet lasketaan linnuntietä (Haversine).

## Lisenssi

MIT

## Versiohistoria

### v1.13.0 (2026-08-30)
- **Sovellusvinkki mobiiliselaimessa**: puhelimella (iOS/Android) sivun ylälaidassa
  näkyy vinkki natiivisovelluksesta, ja "Lataa" vie oikeaan kauppaan (App Store /
  Google Play). Vinkin voi sulkea, jolloin se pysyy piilossa 30 vrk, eikä sitä
  näytetä lainkaan, jos sivu on avattu kotivalikosta (PWA).

### v1.12.0 (2026-07-26)
- **Suora linkki SNJ:hin**: kokeen tiedoista pääsee suoraan ilmoittautumaan
  SNJ:n koekalenterissa, kun ilmoittautuminen on auki (aiemmin linkki vei aina
  koekalenterin etusivulle)
- **Lähtölista**: kun kutsut on lähetetty, kokeesta pääsee lähtölistaan
- **Kokeen tila**: alustava, peruttu, osallistujat valittu ja kutsut lähetetty
  näkyvät omalla merkillään, ja tila huomioidaan myös "Ilmo auki" -logiikassa
- **Ilmoittautuneiden määrä** näkyy paikkamäärän vierellä
- **Mobiili**: painettavat yhteystiedot, ja Android-sovellus kohdistettu
  Android 16:lle (API-taso 36)

### v1.11.0 (2026-07-09)
- **Ilmoittautuminen auki -korostus**: kun kokeen ilmoittautuminen on
  parhaillaan auki, ilmoittautumisaika näkyy korostettuna vihreällä ja
  perässä "Ilmo auki" -merkki (lista + kortit).

### v1.10.0 (2026-06-29)
- **Luokat ja paikat kokeen tiedoissa**: kokeen tietonäkymään uusi kortti, joka
  näyttää paikkamäärän. Kun luokkakohtaiset paikat ovat tiedossa, ne eritellään
  per luokka, ja monipäiväisissä kokeissa lisäksi päivittäin (esim.
  "ALO · La 8.8. — 15 paikkaa"), ei summattuna. Kun luokkakohtaista erittelyä ei
  ole (esim. alustavat ja WT-kokeet), näytetään kokeen kokonaispaikkamäärä
  ("Yhteensä — N paikkaa"); yksiluokkaisissa luku näkyy suoraan luokan kohdalla.
- **Datahaku**: `snj_kokeet.py` tallentaa nyt myös kokeen kokonaispaikkamäärän
  (`places`).

### Mobiili v1.4.0 (2026-06-29)
- **Luokat ja paikat kokeen tiedoissa**: kokeen tietonäkymä näyttää paikkamäärän
  per luokka (monipäiväisissä päivittäin eriteltynä), tai kokonaispaikkamäärän
  kun luokkakohtaista erittelyä ei ole.

### Mobiili v1.3.0 (2026-06-22)
- **Suosikkien kalenterinäkymä**: Suosikit-välilehdellä uusi Lista/Kalenteri-valinta.
  Kalenteri näyttää suosikit kuukausittain aikajanalla ja nostaa niiden lomaan
  sopivat, päällekkäisyydettömät kokeet ("täyte"). Ehdotukset noudattavat
  Selaa-välilehden suodattimia.
- **Päällekkäisyysmerkinnät Selaa-listassa**: kun suosikkeja on valittuna, jokainen
  koe näyttää merkin "Sopii" (ei mene päällekkäin suosikin kanssa) tai "Päällekkäin".
- **Kokeiden piilotus**: piilota kokeet jotka eivät käy (pitkä painallus kortista tai
  kokeen tiedoista → "Piilota koe"). "Näytä piilotetut" -suodatin palauttaa ne, eivätkä
  piilotetut tule kalenterin täyte-ehdotuksiin.
- **Merkintöjen selitykset** Asetukset-välilehdellä (tähti, Sopii, Päällekkäin,
  Piilotettu, Mennyt).
- **Selkeämpi päivämäärä korteissa**: kokeen tapahtumapäivä on lihavoitu ja
  ilmoittautumisaika himmennetty, jotta päivä erottuu paremmin.
- **Lajittelu ilman sijaintia**: Etäisyys-valinta ei enää näytä rikkinäiseltä, vaan
  kertoo että sijainti pitää valita ensin.

### v1.9.4 (2026-06-22)
- Linkit mobiilisovelluksiin: viralliset App Store- ja Google Play -merkit
  webapp-sivun alatunnisteessa ja README:ssä.

### v1.9.3 (2026-06-22)
- Tapahtumapäivä korostuu taulukossa selkeämmin (lihavoitu) ja ilmoittautumisaika
  on himmennetty.

### Mobiili v1.1.0 (2026-06-12)
- **iOS-sovellus** Androidin rinnalle: sama React Native -koodi, täysi
  ominaisuuspariteetti (lista, kartta, suosikit, sijainti/GPS, etäisyydet,
  suodattimet, kalenteri, ICS-jako, ilmoitukset). Julkaisija Inetor Oy.
  - Natiivikorjaukset RN 0.77:lle: `RCTAppDependencyProvider` (Fabric-komponentit),
    fmt-consteval-patch, react-native-share-headerpolku, sijaintilupakäsittelijä
- **Uusi suodatin "Vain ilmoittautuminen auki"** myös mobiilissa

### v1.9.2 (2026-06-14)
- Lisätty footeriin ja READMEen linkki Android-sovellukseen Google Playssa

### v1.9.1 (2026-06-14)
- Korjattu rikkinäinen GitHub Pages -julkaisu: deploy-workflow ei kopioinut
  `app.js`- ja `styles.css`-tiedostoja `_site/`-hakemistoon commitin `74631fa`
  (index.html:n jako) jälkeen, joten live-sivun tyylit ja logiikka eivät
  latautuneet (404). (#14)

### v1.9.0 (2026-06-10)
- **Uusi suodatin: "Vain ilmoittautuminen auki"** (web + mobiili) — näyttää vain
  kokeet joiden ilmoittautumisaika on parhaillaan käynnissä. Oletuksena pois.
  Jaettu logiikka (`isRegistrationOpen`) `shared/`-paketissa, testattu.

### v1.8.0 (2026-05-31)
- **Uusi Android-sovellus** koetutka rinnalla: natiivi React Native -mobiili
  - Tab-pohjainen UI: Selaa, Suosikit, Asetukset
  - Karttanäkymä (OpenStreetMap + Leaflet) eri värisymboleilla per koetyyppi
  - Lokaalit muistutukset suosikkikokeista N päivää ennen
  - Suora "Lisää kalenteriin" -intent (avaa kalenterisovelluksen täytetyllä lomakkeella)
  - Suosikkien hallinta (tähti) + persistointi
  - Menneet kokeet näkyvät harmaalla "Mennyt"-merkinnällä
- **Aikavyöhykekorjaus** (web): SNJ:n päivämäärät muunnetaan Helsingin aikavyöhykkeeseen ennen muotoilua. Aiemmin esim. 6.6. saattoi näyttäytyä 5.6. UTC-muunnoksen takia.
- Hakukenttä kattaa nyt myös koeluokat (vastaa mobiilin hakua)

### v1.7.1 (2026-05-29)
- Refaktoroitu jaettu logiikka shared/ TypeScript-moduuliksi (haversine, ICS-generointi, suodattimet, hintaformatterit)
- Pohjustaa tulevan mobiilisovelluksen koodinjaolle (pnpm workspace)
- Haku kattaa nyt myös järjestäjän nimen
- Ei muita käyttäjälle näkyviä muutoksia

### v1.7.0 (2026-03-22)
- Lisätty max etäisyys -suodatin: vapaa tekstikenttä ja valmiit 100/200 km pikavalinnat

### v1.6.0 (2026-02-15)
- Lisätty suodatin menneille kokeille: menneet kokeet piilotetaan oletuksena
- Pill-tyylinen toggle järjestysvalintojen vieressä

### v1.5.0 (2026-02-01)
- Lisätty Noutajalista.fi-mainospalkki bannerin alle
- Korjattu maksutietojen näyttö: tuki uudelle API-muodolle jossa hinta voi olla objekti
- Lisätty valinnaiset lisämaksut näkyviin info-modaaliin (esim. ruokailu)

### v1.4.0 (2025-12-31)
- Lisätty jakamistoiminto kortteihin ja info-popuppiin (share-painike)
  - Mobiililla: avaa natiivi jako (WhatsApp, Messenger, SMS jne.)
  - Desktopilla: kopioi linkki leikepöydälle + toast-ilmoitus
- Hash-pohjainen routing: jaetun linkin kautta pääsee suoraan tiettyyn kokeeseen
- Linkin avaus scrollaa kortille ja avaa info-modaalin
- Modernisoitu info-modal: korttipohjainen layout, ikonit, animaatiot
- Mobiililla bottom sheet -tyylinen modal
- Lisätty favicon ja apple-touch-icon

### v1.3.2 (2025-12-30)
- Korjattu ilmoittautumismuistutuksen päivämäärä: käyttää nyt ensimmäistä ilmoittautumispäivää kokeen päivän sijaan
- Muutettu tekstit "Ilmoittautuminen päättyy" -> "Ilmoittautumisaika"
- Erotettu kalenteritapahtumat: kokeen tapahtuma vs. ilmoittautumismuistutus

### v1.3.1 (2025-12-30)
- Parannettu korttien erottuvuutta: lisätty varjo, pyöristetyt kulmat ja isompi väli korttien välillä
- Parannettu hover-efekti korteille

### v1.3.0 (2025-12-29)
- Mobiiliystävällinen korttipohjainennäkymä
- Parannettu käyttökokemus pienillä näytöillä

### v1.2.0 (2025-12-28)
- Lisätty linkki SNJ:n koekalenteriin tapahtuman infoikkunaan

### v1.1.0 (2025-12-28)
- Lisätty banneri-kuva headeriin
- Lisätty yhteystiedot footeriin
- Siivottu projektirakenne

### v1.0.0 (2025-12-14)
- Ensimmäinen julkaisu
- Sijaintipohjainen kokeiden haku
- Pill-suodattimet lajeille ja tasoille
- Kalenteriin vienti (.ics)
- Automaattinen datapäivitys GitHub Actionsilla

## Tekijä

Tero Rönkkö
- Email: tero@savonnuuskut.com
- GitHub: [@trotor](https://github.com/trotor)
