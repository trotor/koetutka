# Play Store -metadata: Koetutka

Sovelluksen perustiedot ja kuvaukset Google Play Consoleen syöttämistä varten.

## Perustiedot

| Kenttä | Arvo |
|---|---|
| Sovelluksen nimi | Koetutka |
| Paketin nimi (applicationId) | `com.koetutka` |
| Versio (versionName) | `1.0` |
| Version koodi (versionCode) | `1` |
| Kategoria | Sport (Urheilu) — alakategoria: Outdoors |
| Sisältöluokitus | Everyone (Kaikille) |
| Hinta | Ilmainen |
| Käyttöalueet | Suomi |
| Tukikieli | Suomi (fi-FI) |

## Lyhyt kuvaus (≤ 80 merkkiä)

```
Noutajakoirien koekalenteri etäisyyden mukaan: kartta, suosikit, kalenteri.
```

(79 merkkiä)

## Pitkä kuvaus (≤ 4000 merkkiä)

```
Koetutka näyttää Suomen Noutajakoirajärjestön (SNJ) koetapahtumat järjestettynä etäisyyden mukaan sinun sijainnistasi. Sovellus on noutajien rodunomaisten kokeiden harrastajien työkalu — selaa, suodata, suosikoi ja lisää kalenteriin yhdellä napautuksella.

OMINAISUUDET

• Lista- ja karttanäkymä — selaa kokeita listana etäisyysjärjestyksessä tai katso koko Suomi kerralla kartalla
• Eri koetyypit eri värein — NOME-B, NOU, NOWT ja NOME-A erottuvat omilla väreillään kartalla
• Sijainnin valinta — kirjoita paikkakunta tai käytä laitteen GPS:ää
• Etäisyysjärjestys — kokeet listataan automaattisesti läheltä kauas
• Suodattimet — koetyyppi, taso (ALO/AVO/VOI), maksimietäisyys, menneet kokeet pois
• Pikahaku — etsi tekstillä paikkakunnasta, järjestäjästä, tuomarista tai luokasta
• Suosikit — tähtää itsellesi tärkeät kokeet ja löydä ne nopeasti
• Muistutukset — saat ilmoituksen suosikkikokeestasi 1, 3, 7 tai 14 päivää ennen
• Lisää kalenteriin — natiivi kalenteri-intent avaa kokeen suoraan kalenterisovellukseesi valmiiksi täytettynä (otsikko, sijainti, päivämäärät, kuvaus, järjestäjän yhteystiedot, hinnat)
• Ilmoittautumismuistutus — luo erillinen merkintä kalenteriisi ilmoittautumisajan alkamispäivälle
• ICS-vienti — voit jakaa kokeen .ics-tiedostona myös muille kalentereille

DATALÄHDE

Tapahtumadata haetaan SNJ:n virallisesta koekalenteri-API:sta ja päivittyy päivittäin. Kartan tiilet tulevat OpenStreetMapista.

YKSITYISYYS

Koetutka ei kerää eikä lähetä mitään tietoja kolmansille osapuolille. Sijaintisi käsitellään vain laitteellasi, eikä sitä lähetetä mihinkään. Hakemasi paikkakunnat haetaan OpenStreetMapin Nominatim-palvelusta.

KEHITTÄJÄLTÄ

Koetutka on harrastajan tekemä avoimen lähdekoodin työkalu (MIT-lisenssi). Lähdekoodi: github.com/trotor/koetutka.

Palautetta voi lähettää sähköpostilla osoitteeseen tero@savonnuuskut.com.
```

## Mitä uutta (release notes, ≤ 500 merkkiä)

```
v1.0 — ensimmäinen julkaisu

• Lista- ja karttanäkymä SNJ:n koetapahtumista
• Sijaintipohjainen etäisyyslaskenta
• Suodattimet ja pikahaku
• Suosikit + muistutukset suosikkikokeista
• Kalenteri-intent (avaa kokeen suoraan kalenterisovellukseen)
```

## Yhteystiedot

| Kenttä | Arvo |
|---|---|
| Sähköposti | tero@savonnuuskut.com |
| Verkkosivu | https://trotor.github.io/koetutka |
| Tietosuojaseloste-URL | https://trotor.github.io/koetutka/privacy.html *(luotava ennen julkaisua)* |

## Tietosuojaseloste — sisältöluonnos

Play vaatii URL-osoitteen tietosuojaselosteeseen. Suositus: luo `privacy.html`-tiedosto repoon ja deployaa GitHub Pagesilla.

Sisältö:

> **Tietosuoja — Koetutka**
>
> Koetutka ei kerää eikä lähetä käyttäjätietoja kolmansille osapuolille.
>
> **Tiedot, joita sovellus käsittelee paikallisesti laitteella:**
> - Käyttäjän valitsema sijainti (paikkakunta tai GPS-koordinaatit)
> - Suosikkikokeiden tunnisteet
> - Notifikaatioasetukset
>
> Nämä tiedot tallennetaan vain laitteen omaan tallennukseen (AsyncStorage), eikä niitä lähetetä Koetutkan kehittäjälle tai muille tahoille.
>
> **Ulkoiset palvelut:**
> - **Suomen Noutajakoirajärjestön (SNJ) koekalenteri-API:** koetapahtumadatan haku.
> - **OpenStreetMap Nominatim:** paikkakuntien geokoodaus.
> - **OpenStreetMap (tile-palvelin):** karttatiilet.
>
> Nämä palvelut näkevät ainoastaan IP-osoitteesi tavallisten verkkopyyntöjen yhteydessä.
>
> **Luvat:**
> - Sijainti (valinnainen, käytetään vain GPS-painikkeessa)
> - Notifikaatiot (valinnainen, käytetään vain käyttäjän valitsemiin muistutuksiin)
>
> Yhteys: tero@savonnuuskut.com
> Päivitetty: 2026-06-01

## Grafiikat (vaaditaan ennen julkaisua)

| Kuva | Mitat | Status | Huom |
|---|---|---|---|
| Sovellusikoni (Play Store) | 512×512 PNG | **PUUTTUU** | Korvaa nykyinen default-ikoni (mobile/android/app/src/main/res/mipmap-*). Käytä esim. koiran silhuetti + 📍-pin tai banner.jpg:n koira |
| Feature graphic | 1024×500 PNG/JPG | **PUUTTUU** | Esim. banner.jpg cropattuna + sovelluksen nimi |
| Phone screenshots (≥2, suositus 4-8) | 1080×2400 PNG | **VALMIIT** (4 kpl) | screenshots/01-list.png, 02-map.png, 03-settings.png, 04-detail.png |
| Mainosvideo (valinnainen) | YouTube URL | – | – |

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
