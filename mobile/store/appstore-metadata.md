# App Store -metadata: Koetutka

Tiedot App Store Connectiin syöttämistä varten (iOS). Pohjautuu Play Store
-metadataan (`metadata.md`), mukautettuna Applen kenttiin.

## Perustiedot

| Kenttä | Arvo |
|---|---|
| App Name (≤30 merkkiä) | Koetutka |
| Subtitle (≤30 merkkiä) | ks. `listing.fi.json` |
| Bundle ID | `com.koetutka` |
| SKU | koetutka-ios |
| Julkaisija | Inetor Oy (Team `TTND84D98U`) |
| Versio | ks. Xcode-projekti (`MARKETING_VERSION`) |
| Primary Category | Sports |
| Secondary Category | Navigation |
| Hinta | Ilmainen |
| Saatavuus | Suomi (voi olla maailmanlaajuinen) |
| Ensisijainen kieli | Suomi (fi-FI) |
| Age rating | 4+ |

## Kauppatekstit

Subtitle, Promotional Text, Keywords, Description ja What's New ovat tiedostossa
[`listing.fi.json`](listing.fi.json). Vie ne App Store Connectiin:
`python3 mobile/store/push-listing.py ios` (ilman `--live` vain näyttää muutokset).
Skripti päivittää vain muokattavaa versiota (PREPARE_FOR_SUBMISSION), ei myynnissä
olevaa: tekstit kuvaavat uuden version ominaisuuksia.

## URLit

| Kenttä | Arvo |
|---|---|
| Support URL | https://trotor.github.io/koetutka |
| Marketing URL | https://trotor.github.io/koetutka |
| Privacy Policy URL | https://trotor.github.io/koetutka/privacy.html |

## App Privacy (nutrition labels)

App Store Connect → App Privacy. Vastaa:

- **Data collection:** "Does this app collect data?" → **No** (ei kerätä eikä
  lähetetä käyttäjätietoja). Sijainti käsitellään vain laitteella, ei linkitetä
  henkilöllisyyteen eikä käytetä seurantaan.

Jos halutaan olla erityisen tarkkoja, voi ilmoittaa "Location → App Functionality,
Not Linked to You, Not Used for Tracking" — mutta koska sijaintia ei lähetetä
mihinkään, "No data collected" on perusteltu.

## Kuvakaappaukset

6.9" (1320×2868): `marketing/ios/01–05*.png`, koostettu raakakuvista
`screenshots-ios/` skriptillä `make-marketing.py`. Raakakuvat kaapataan iPhone 17
Pro Max -simulaattorista debug-buildilla:

    xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100
    xcrun simctl launch <udid> com.koetutka -koetutkaShot favorites:month
    xcrun simctl io <udid> screenshot raw.png

`-koetutkaShot` (vain `__DEV__`): `map`, `favorites:list|month|agenda`,
`settings`, `event:<id>` — ks. `mobile/src/dev/screenshot-scene.ts`.

## Review-tiedot (App Review Information)

- **Sign-in required:** No (ei kirjautumista)
- **Demo account:** ei tarvita
- **Notes:** "Sovellus näyttää julkista koekalenteridataa SNJ:n avoimesta API:sta.
  Sijainti- ja kalenteriluvat ovat valinnaisia (GPS-painike ja kalenteriin lisäys)."

## Yhteystiedot

| Kenttä | Arvo |
|---|---|
| Sähköposti | tero@savonnuuskut.com |
| Tekijä | Tero Rönkkö |
| Julkaisija | Inetor Oy |
