# Play Store -metadata: Koetutka

Sovelluksen perustiedot ja kuvaukset Google Play Consoleen syöttämistä varten.

## Perustiedot

| Kenttä | Arvo |
|---|---|
| Sovelluksen nimi | Koetutka |
| Julkaisija | Inetor Oy |
| Tekijä | Tero Rönkkö |
| Paketin nimi (applicationId) | `com.koetutka` |
| Versio | ks. `mobile/android/app/build.gradle` |
| Kategoria | Sport (Urheilu) — alakategoria: Outdoors |
| Sisältöluokitus | Everyone (Kaikille) |
| Hinta | Ilmainen |
| Käyttöalueet | Suomi |
| Tukikieli | Suomi (fi-FI) |

## Kauppatekstit

Lyhyt kuvaus, pitkä kuvaus ja julkaisutiedot ovat tiedostossa
[`listing.fi.json`](listing.fi.json) (yhteinen lähde App Storen kanssa). Vie ne
kauppaan: `python3 mobile/store/push-listing.py play` (ilman `--live` vain
näyttää muutokset).

## Kauppakuvat

| Kuva | Mitat | Tiedosto |
|---|---|---|
| Sovellusikoni | 512×512 | `icon-512.png` |
| Feature graphic | 1024×500 | `feature-graphic-1024x500.png` |
| Puhelinkuvat (markkinointi) | 1080×2100 | `marketing/android/01–05*.png` |
| Raakakuvakaappaukset | 1080×2400 | `screenshots/01–05*.png` (Pixel 7 -emulaattori) |

Markkinointikuvat koostetaan raakakuvista: `python3 mobile/store/make-marketing.py`.
Raakakuvat kaapataan debug-buildista esimerkkisuosikeilla (sijainti Lahti, 12
suosikkia kesä–elokuulta 2027, värit Ilmoittauduttu/Harkinnassa/Kaverin kanssa).

## Yhteystiedot

| Kenttä | Arvo |
|---|---|
| Sähköposti | tero@savonnuuskut.com |
| Verkkosivu | https://trotor.github.io/koetutka |
| Tietosuojaseloste-URL | https://trotor.github.io/koetutka/privacy.html |

## Tietosuojaseloste

Julkaistu: `privacy.html` (GitHub Pages).

## Sovelluksen ladonta Play Consoleen

1. Mene https://play.google.com/console
2. Luo uusi sovellus → "Create app"
   - Nimi: Koetutka
   - Oletuskieli: Suomi (fi-FI)
   - Tyyppi: App
   - Ilmainen
   - Hyväksy ehdot
3. Täytä Store presence → Main store listing tämän tiedoston tiedoilla
4. Lataa AAB: Production → Create new release → Upload
   - AAB-polku: `mobile/android/app/build/outputs/bundle/release/app-release.aab`
5. App content -osio:
   - Privacy policy URL (käytä yllä mainittua)
   - Data safety: ks. alla
   - Target audience: 18+
   - News app: No
   - Ads: No
6. Lähetä review-tarkasteluun

## Data safety (Play Console)

| Kysymys | Vastaus |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | Yes (kaikki HTTPS) |
| Do you provide a way for users to request that their data is deleted? | N/A — ei kerätä |

## Upload-keystoren tiedot

Tärkeää — säilytä turvassa! Ilman näitä et voi koskaan päivittää sovellusta.

- **Tiedosto:** `mobile/android/app/upload-keystore.jks` (ei committoitu repoon)
- **Properties:** `mobile/android/keystore.properties` (ei committoitu repoon)
- **Alias:** `koetutka-upload`
- **Salasana:** ks. keystore.properties
- **Voimassaoloaika:** 10 000 päivää (yli 27 vuotta)
- **Allekirjoitus:** SHA256withRSA, 2048-bittinen avain

**Varmuuskopioi keystore.properties + upload-keystore.jks turvalliseen paikkaan!**
