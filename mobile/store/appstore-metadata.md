# App Store -metadata: Koetutka

Tiedot App Store Connectiin syöttämistä varten (iOS). Pohjautuu Play Store
-metadataan (`metadata.md`), mukautettuna Applen kenttiin.

## Perustiedot

| Kenttä | Arvo |
|---|---|
| App Name (≤30 merkkiä) | Koetutka |
| Subtitle (≤30 merkkiä) | Noutajakokeet kartalla |
| Bundle ID | `com.koetutka` |
| SKU | koetutka-ios |
| Julkaisija | Inetor Oy (Team `TTND84D98U`) |
| Versio | `1.1.0` (build 1) |
| Primary Category | Sports |
| Secondary Category | Navigation |
| Hinta | Ilmainen |
| Saatavuus | Suomi (voi olla maailmanlaajuinen) |
| Ensisijainen kieli | Suomi (fi-FI) |
| Age rating | 4+ |

## Subtitle-vaihtoehtoja (≤30 merkkiä)

```
Noutajakokeet kartalla
```
(22 merkkiä) — vaihtoehto: `Koekalenteri etäisyyden mukaan` (30)

## Promotional Text (≤170 merkkiä, päivitettävissä ilman uutta buildia)

```
SNJ:n noutajakokeet etäisyysjärjestyksessä — kartta, suosikit, muistutukset ja kalenteriin lisäys yhdellä napautuksella.
```

## Keywords (≤100 merkkiä, pilkuilla eroteltuna, ei välilyöntejä)

```
noutaja,koe,koira,SNJ,NOME,NOU,NOWT,koekalenteri,metsästys,nouto,kartta,kalenteri,labradori,kennel
```

## Description (≤4000 merkkiä)

```
Koetutka näyttää Suomen Noutajakoirajärjestön (SNJ) koetapahtumat järjestettynä etäisyyden mukaan sinun sijainnistasi. Sovellus on noutajien rodunomaisten kokeiden harrastajien työkalu — selaa, suodata, suosikoi ja lisää kalenteriin yhdellä napautuksella.

OMINAISUUDET

• Lista- ja karttanäkymä — selaa kokeita listana etäisyysjärjestyksessä tai katso koko Suomi kerralla kartalla
• Eri koetyypit eri värein — NOME-B, NOU, NOWT ja NOME-A erottuvat omilla väreillään kartalla
• Sijainnin valinta — kirjoita paikkakunta tai käytä laitteen GPS:ää
• Etäisyysjärjestys — kokeet listataan automaattisesti läheltä kauas
• Suodattimet — koetyyppi, taso (ALO/AVO/VOI), maksimietäisyys, menneet kokeet pois, vain ilmoittautuminen auki
• Pikahaku — etsi tekstillä paikkakunnasta, järjestäjästä, tuomarista tai luokasta
• Suosikit — tähtää itsellesi tärkeät kokeet ja löydä ne nopeasti
• Muistutukset — saat ilmoituksen suosikkikokeestasi 1, 3, 7 tai 14 päivää ennen
• Lisää kalenteriin — kokeen tiedot suoraan kalenteriisi valmiiksi täytettynä (otsikko, sijainti, päivämäärät, kuvaus, järjestäjän yhteystiedot, hinnat)
• Ilmoittautumismuistutus — luo erillinen merkintä kalenteriisi ilmoittautumisajan alkamispäivälle
• ICS-vienti — voit jakaa kokeen .ics-tiedostona myös muille kalentereille

DATALÄHDE

Tapahtumadata haetaan SNJ:n virallisesta koekalenteri-API:sta ja päivittyy päivittäin. Kartan tiilet tulevat OpenStreetMapista.

YKSITYISYYS

Koetutka ei kerää eikä lähetä mitään tietoja kolmansille osapuolille. Sijaintisi käsitellään vain laitteellasi, eikä sitä lähetetä mihinkään. Hakemasi paikkakunnat haetaan OpenStreetMapin Nominatim-palvelusta.

KEHITTÄJÄLTÄ

Koetutka on avoimen lähdekoodin työkalu (MIT-lisenssi). Tekijä: Tero Rönkkö. Julkaisija: Inetor Oy. Lähdekoodi: github.com/trotor/koetutka.

Palautetta voi lähettää sähköpostilla osoitteeseen tero@savonnuuskut.com.
```

## What's New (release notes)

```
Ensimmäinen iOS-julkaisu.

• Lista- ja karttanäkymä SNJ:n koetapahtumista
• Sijaintipohjainen etäisyyslaskenta (GPS tai paikkakunta)
• Suodattimet, pikahaku ja "vain ilmoittautuminen auki"
• Suosikit + muistutukset
• Lisää kalenteriin ja ICS-vienti
```

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

## Kuvakaappaukset (vaaditaan)

App Store vaatii vähintään 6.9" ja 6.5" kuvat. Simulaattorista (#5) on jo otettu
näkymät, mutta ne pitää kaapata **oikeilla laiteko'oilla**:

| Koko | Laite (simulaattori) | Resoluutio (px) |
|---|---|---|
| 6.9" (vaadittu) | iPhone 17 Pro Max / 16 Pro Max | 1320×2868 |
| 6.5" (vaadittu) | iPhone 11 Pro Max / Xs Max | 1242×2688 |

Suositellut näkymät (samat kuin Play Storessa): 1) lista, 2) kartta,
3) koetiedot, 4) asetukset. Kaappaa esim. `xcrun simctl io <UDID> screenshot`.

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
