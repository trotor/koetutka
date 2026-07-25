# Koeilmoituksen linkki, kokeen tila ja painettavat yhteystiedot

**Päivä:** 2026-07-25
**Versio:** web 1.12.0, mobiili 1.12.0 (iOS + Android samaan aikaan)

## Tavoite

Kolme puutetta, jotka kaikki liittyvät samaan käyttötilanteeseen — "löysin
kokeen, mitä nyt":

1. **Kokeesta ei pääse sen omaan ilmoitukseen.** Mobiilissa ei ole linkkiä
   lainkaan. Webissä on nappi (`app.js:1101`), mutta se vie SNJ:n koekalenterin
   *etusivulle*, jolloin käyttäjä saa etsiä kokeen käsin uudestaan.
2. **Kokeen tila ei näy.** Alustavat ja perutut kokeet näkyvät täsmälleen
   samanlaisina kuin vahvistetut.
3. **Yhteystiedot eivät ole painettavia.** Sihteerin puhelin ja sähköposti ovat
   pelkkää tekstiä (`mobile/src/screens/EventDetailScreen.tsx:59` ja `:62`),
   vaikka osassa kokeita ilmoittautuminen tapahtuu nimenomaan sähköpostilla.
4. **Ilmoittautuneiden määrä ei näy, eikä lähtölistaan pääse.** Käyttäjä ei näe
   onko kokeeseen tulossa 5 vai 60 koiraa, eikä pääse valmistuneeseen
   lähtölistaan jossa on oma lähtönumero ja aika.

## Todennetut datalähtökohdat

Nämä on mitattu SNJ:n API:n raakavastauksesta (621 tapahtumaa) 2026-07-25.
Suunnitelma nojaa niihin, joten ne on kirjattu tähän tarkistettavaksi.

**SNJ:n frontendin reittikuvio** (kaivettu `koekalenteri.snj.fi`:n JS-bundlesta):

```
event/:eventType/:id
event/:eventType/:id/:class
event/:eventType/:id/:class/:date
```

**Tapahtumatason `state`** on mukana 621/621 tapahtumassa. Arvot ja tulevien
kokeiden jakauma (25.7.2026 →):

| state | tulevia | merkitys |
|---|---|---|
| `confirmed` | 50 | vahvistettu (normaalitapaus) |
| `tentative` | 25 | alustava, ei vielä varmistunut |
| `picked` | 11 | osallistujat valittu → ilmo ohi |
| `invited` | 6 | kutsut lähetetty → ilmo ohi |
| `cancelled` | 0 juuri nyt (5 menneissä) | peruttu |

**Luokkatason `classes[].state` ei riitä tähän.** Tulevista kokeista vain
3/89:llä on luokkatasoinen state; se täyttyy käytännössä vasta kokeen jälkeen.
Käytettävä tieto on tapahtumatason `state`, jonka `snj_kokeet.py` nykyisin
pudottaa.

**`entryStartDate` / `entryEndDate`** ovat mukana 621/621, mutta muodossa
`2024-01-07T22:00:00.000Z` — UTC:ssä, jossa päivä on eri kuin Helsingissä.
Naiivi merkkijonon katkaisu `[:10]` antaisi päivän pieleen. `snj_kokeet.py:170-180`
parsii nämä jo Helsingin aikaan (`entry_start_obj`, `entry_end_obj`), joten uusi
kenttä muodostetaan olemassa olevasta objektista eikä uutta aikavyöhykelogiikkaa
tarvita.

**Raaka `eventType` vastaa meidän `type`-kenttää** (sama 9 arvoa: `NOME-B`,
`NOU`, `EPÄVIRALLINEN`, `NOWT`, `NOME-A`, `KOULUTUS`, `NOME-A SM`,
`NOME-B SM`, `NOWT SM`). Deep link toimii siis kaikille tyypeille, kun
polkusegmentti URL-enkoodataan (välilyönti, ä).

**Ilmoittautuneiden määrä on kahdessa paikassa.** `classes[].entries` on **jo nyt
meidän JSONissa**, koska `classes`-taulukko välitetään raakana — sitä ei vain
näytetä missään. Tapahtumatason kokonaismäärä `entries` sen sijaan pudotetaan,
ja se tarvitaan, koska **80/205 kokeesta ei ole luokkaerittelyä lainkaan**
(alustavat ja WT-kokeet).

**Lähtölista on julkinen sivuna, mutta rajattu rajapintana.**
`https://koekalenteri.snj.fi/startlist/{id}` renderöityy ilman kirjautumista
(varmistettu selaimella: 23 osallistujaa lähtönumeroineen ja ap/ip-jaolla).
Taustalla `GET /prod/startlist/{id}` palauttaa 200 + datan kun lista on olemassa
ja **404 + `[]`** kun ei ole. Lista syntyy vasta kun osallistujat on valittu:
`confirmed`-koe jossa on 17 ilmoittautunutta → 404, `invited`-koe → 200.

Rajapintaa **ei kutsuta meidän koodista**, ks. "Rajattu ulos".

**Data päivittyy kerran vuorokaudessa.** `.github/workflows/deploy.yml` ajaa
`snj_kokeet.py`:n cronilla `0 6 * * *` (08:00 Suomen aikaa) ja committaa
tuloksen. Tämä on `state`- ja `entries`-ominaisuuksien edellytys: tieto on
korkeintaan ~24 h vanha. UI ei silti saa antaa ymmärtää että luku on
reaaliaikainen.

## Arkkitehtuuri

### 1. Datapipeline — `snj_kokeet.py`

Kolme uutta kenttää output-dictiin (nykyinen dict päättyy `'places'`-riviin,
`snj_kokeet.py:270`):

| kenttä | lähde | muoto |
|---|---|---|
| `state` | `event['state']` sellaisenaan | `'tentative' \| 'confirmed' \| 'picked' \| 'invited' \| 'cancelled'` |
| `entry_start` | `entry_start_obj.strftime('%Y-%m-%d')` | `YYYY-MM-DD` (Helsinki) |
| `entry_end` | `entry_end_obj.strftime('%Y-%m-%d')` | `YYYY-MM-DD` (Helsinki) |
| `entries` | `event['entries']` | luku tai puuttuu |

`entry_start` / `entry_end` jätetään pois kun parsinta epäonnistuu (sama
`try/except`-rakenne kuin nykyisillä `entry_*_str`-kentillä).

JSONeja **ei tarvitse generoida käsin**: kun `snj_kokeet.py`-muutos on
masterissa, seuraava vuorokausiajo (08:00 Suomen aikaa) tuottaa uudet kentät
itsestään. Toteutuksen aikana testaamiseen riittää `workflow_dispatch` tai
skriptin ajo paikallisesti — mutta uusi sovellusversio ei saa olettaa kenttien
olevan siellä, ks. yhteensopivuus alla.

**Yhteensopivuus molempiin suuntiin.** Mobiili hakee JSONit ajonaikaisesti
GitHub Pagesista, joten versiot elävät ristiin:
- vanha sovellusversio + uusi JSON → uudet kentät ohitetaan, ei vaikutusta
- uusi sovellusversio + vanha JSON → `state` puuttuu (ei merkkiä), `entry_start`
  puuttuu (nykyinen regex-fallback), ei virhettä

### 2. `shared/` — logiikka

**Uusi `shared/src/event-state.ts`.** Oma moduuli, jotta tilalogiikka ei
sotkeudu suodattimiin ja on testattavissa erikseen.

```ts
export type EventState = 'tentative' | 'confirmed' | 'picked' | 'invited' | 'cancelled';
export type StateTone = 'tentative' | 'cancelled' | 'closed';

/** Merkin sisältö kortille ja tietonäkymään, tai null jos merkkiä ei tarvita. */
export function stateBadge(event: Event): { label: string; tone: StateTone } | null;

export function isCancelled(event: Event): boolean;

/** Tosi kun tila sanoo ilmoittautumisen päättyneeksi: picked | invited | cancelled. */
export function registrationClosedByState(event: Event): boolean;
```

Otsikot: `tentative` → "Alustava", `cancelled` → "Peruttu", `picked` →
"Osallistujat valittu", `invited` → "Kutsut lähetetty". `confirmed` palauttaa
`null`, koska normaalitapaus ei tarvitse merkkiä. Puuttuva `state` palauttaa
`null`.

**Uusi `shared/src/snj.ts`.**

```ts
export function snjEventUrl(event: Event): string;
// → https://koekalenteri.snj.fi/event/{encodeURIComponent(event.type)}/{event.id}

export function snjStartListUrl(event: Event): string;
// → https://koekalenteri.snj.fi/startlist/{event.id}

/** Tosi kun lähtölista on odotettavissa: state on 'invited' tai 'picked'. */
export function hasStartList(event: Event): boolean;
```

`hasStartList` on tarkoituksella pelkkä tilapäättely eikä verkkokutsu. Se voi
osua harvoin väärin (linkki listaan jota ei ole), mikä on hyväksyttävä hinta
siitä että mitään ylimääräistä ei haeta.

**Lisäys `shared/src/formatters.ts`:ään**, `listClassPlaces`-funktion (rivi 50)
viereen: ilmoittautuneiden määrän muotoilu. Käytetään `classes[].entries`ia kun
luokkaerittely on, muuten tapahtumatason `entries`iä.

Sanamuoto on tässä olennainen: **sanaa "täynnä" ei käytetä.** Näissä kokeissa
ilmoittautuneita on usein moninkertaisesti paikkoihin nähden (esim. 64
ilmoittautunutta 12 paikalle) ja osallistujat arvotaan tai karsitaan — "täynnä"
antaisi väärän kuvan siitä että myöhässä oleva ei mahdu. Muoto on neutraali
"17 ilmoittautunutta · 8 paikkaa".

**Muutos `shared/src/filters.ts:50` `isRegistrationOpen`iin.** Kaksi muutosta
nykyiseen:
1. Kun `entry_start` ja `entry_end` ovat olemassa, vertaa niihin. Muuten käytä
   nykyistä `entry_date`-regexiä, joka päättelee vuoden — se jää fallbackiksi
   vanhalle datalle.
2. Palauta `false` kun `registrationClosedByState(event)`, riippumatta
   päivämääristä.

Kohta 2 muuttaa myös olemassa olevan "Vain ilmo auki" -suodattimen tulosta:
koe jonka osallistujat on jo valittu ei enää näy avoimena. Tämä on
tarkoitettu korjaus, ei sivuvaikutus.

**`shared/src/types.ts`:** `state?: EventState`, `entry_start?: string`,
`entry_end?: string` — kaikki optionaalisia yllä kuvatun yhteensopivuuden takia.

### 3. Mobiili

**`EventCard.tsx:129`** — `stateBadge()`-merkki olemassa olevaan `badges`-riviin
muiden joukkoon ("Piilotettu", "Ilmo auki", "Sopii", "Päällekkäin", "Mennyt").
`cancelled` himmentää lisäksi kortin kierrättämällä olemassa olevat
`past`-tyylit. Peruttu koe **ei katoa listalta** — suosikiksi merkityn kokeen
peruminen on juuri se tieto jonka käyttäjän pitää nähdä.

Menneillä kokeilla tilamerkkiä **ei näytetä**, koska "Mennyt" kertoo saman ja
"Kutsut lähetetty" olisi pelkkää kohinaa. Poikkeus on `cancelled`, joka
näytetään aina — myös menneenä, koska peruttu ja pidetty koe eivät ole sama
asia.

**`EventDetailScreen.tsx`** — kolme muutosta:
- "Tila"-rivi selitteellä (`tentative`: "koe ei ole vielä varmistunut")
- nappi "Avaa SNJ:n koekalenterissa" → `Linking.openURL(snjEventUrl(event))`.
  Sijoitetaan nappilistan **ensimmäiseksi**, nykyisen "Lisää kalenteriin"
  -napin yläpuolelle: kokeen löytämisen jälkeen seuraava askel on ilmoitus,
  ei kalenteri.
- nappi "Lue lähtölista" → `snjStartListUrl(event)`, näytetään vain kun
  `hasStartList(event)`. SNJ-napin alle, koska se on saman perheen toiminto.
- ilmoittautuneiden määrä paikkatietojen yhteyteen (nykyinen `classPlaces`-
  kortti), muodossa "17 ilmoittautunutta · 8 paikkaa"
- sihteerin ja yhteyshenkilön yhteystiedot: nimi jää tekstiksi, mutta puhelin
  ja sähköposti tulevat **omiksi painettaviksi riveikseen** (`tel:` /
  `mailto:`) nykyisen yhden monirivisen tekstirivin sijaan. Rivi jätetään pois
  kun kenttä on tyhjä, kuten nyt.

**`HelpSection.tsx`** — uudet merkit selitteeseen, koska tiedosto dokumentoi jo
muut merkit.

### 4. Web

- `app.js:1101` — nappi kokeen omaan sivuun `snjEventUrl`-vastineella
- lähtölistalinkki samalla ehdolla (`hasStartList`)
- tilamerkki listaan ja modaaliin samalla sanastolla kuin mobiilissa
- ilmoittautuneiden määrä paikkatietojen yhteyteen

Webin yhteystiedot **ovat jo `tel:`/`mailto:`-linkkejä** (`app.js:1027` ja
`:1034`), eli painettavat yhteystiedot on puhtaasti mobiilin puute.
- versio `index.html`-footeriin ja `README.md`:n versiohistoriaan

## Testaus

Vitest-testit olemassa olevalla konventiolla (`mobile/src/lib/tests/`):

- `event-state.test.ts` — jokainen viisi tilaa, puuttuva `state`
- `snj.test.ts` — URL-enkoodaus `EPÄVIRALLINEN` ja `NOME-A SM` -tyypeille,
  `hasStartList` jokaisella tilalla
- ilmoittautuneiden muotoilu — luokkaerittelystä, tapahtumatasolta, molemmat
  puuttuvat, `entries > places`
- `isRegistrationOpen` — ISO-polku, regex-fallback kun ISO puuttuu, tilaportti
  (`picked` → false vaikka päivät olisivat avoinna), vuodenvaihde

**Selainvarmistus, jota ei voi automatisoida:** SNJ:n SPA palauttaa HTTP 200
mille tahansa polulle, joten deep linkin toimivuutta ei voi todentaa curlilla.
Kolme linkkiä on avattava selaimessa ja katsottava että oikea koe latautuu:
yksi `NOME-B`, yksi `EPÄVIRALLINEN` ja yksi `NOME-A SM`. Jos jokin tyyppi ei
resolvoidu, `snjEventUrl` saa fallbackin koekalenterin etusivulle kyseisille
tyypeille.

## Versiointi ja julkaisu

Web ja mobiili yhdenmukaistetaan tässä julkaisussa: web 1.11.0 ja mobiili 1.7.1
→ **molemmat 1.12.0**.

- `mobile/package.json` → `1.12.0`
- Android `versionName 1.12.0`, `versionCode 12`
- iOS `MARKETING_VERSION 1.12.0`, `CURRENT_PROJECT_VERSION 10`
- `index.html` footer → `v1.12.0`, `README.md` versiohistoria
- `whatsnew.json`: **1.7.1-merkintä poistetaan** ja Android 16 mainitaan osana
  1.12.0:aa. 1.7.1 on committoitu (`d7a4fb0`) mutta sitä ei julkaista
  kauppoihin, joten käyttäjille ei pidä näyttää versiota jota ei ollut.

Julkaisujärjestys: JSONit ja `whatsnew.json` webiin ensin (mobiili hakee ne
ajonaikaisesti), sitten kauppaversiot molemmille alustoille yhtä aikaa.

## Rajattu ulos

**Lähtölistan datan hakeminen sovellukseen.** `GET /prod/startlist/{id}` on auki
ilman autentikointia, mutta sitä ei kutsuta meidän koodista — ei mobiilista eikä
`snj_kokeet.py`:stä. Kolme syytä:

1. **CORS on rajattu `access-control-allow-origin: https://koekalenteri.snj.fi`.**
   Web ei voi kutsua endpointia selaimesta lainkaan, joten ominaisuudesta tulisi
   väistämättä alustojen välillä epäsymmetrinen.
2. **SNJ:n oma UI portittaa lähtölistan `startListPublished`-lipulla, mutta
   rajapinta palvelee listan lipusta riippumatta.** Yhdessä oman originin
   CORS-rajauksen kanssa tämä sanoo että endpoint on tarkoitettu heidän omalle
   frontendilleen, ei julkiseksi rajapinnaksi.
3. **Payload on henkilötietoa.** Per osallistuja `handler`, `owner` ja `breeder`
   (nimet), koiran `regNo`, `dob`, `kcId` ja **`rfid` eli mikrosirunumero**, sekä
   `results` = koiran koko koetuloshistoria. Näiden peilaaminen omaan JSONiin
   GitHub Pagesiin tarkoittaisi että julkaisemme henkilötietoa omalla
   domainilla ja Koetutkasta tulee itsenäinen rekisterinpitäjä. `privacy.html`
   pitäisi kirjoittaa uusiksi.

Jos tämä halutaan joskus, oikea järjestys on kysyä SNJ:ltä onko endpoint
tarkoitettu julkiseksi ja saada lupa — ei rakentaa ensin. Linkki heidän omalle
sivulleen antaa käyttäjälle saman tiedon ilman yhtäkään näistä ongelmista.

- Kokeen tulokset. Julkista per-koe-tulosrajapintaa ei näytä olevan; tulokset
  ovat johdettavissa lähtölistan `dog.results`-kentästä, mikä on vielä syvemmällä
  henkilötietoalueella kuin yllä.
- Push-muistutukset ilmoittautumisen avautumisesta (`notifee` on jo
  riippuvuutena, mutta tämä on oma projektinsa).
- "Piilota alustavat" -suodatin: 25/89 tulevaa koetta on alustavia, joten
  suodatin voisi jättää käyttäjän vahingossa näkemättä isoa osaa kokeista.
