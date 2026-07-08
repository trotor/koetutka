# Ilmoittautuminen auki -korostus & suosikkien jako — suunnitelma

**Päivä:** 2026-07-08
**Tila:** Hyväksytty (brainstorming), odottaa spec-katselmointia

## Tausta

Kaksi käyttäjän pyytämää parannusta Koetutkaan:

1. **Ilmoittautuminen auki -korostus.** Kokeet, joiden ilmoittautuminen on juuri
   nyt auki, näyttävät ilmoittautumisajan korostettuna. Sekä web että mobiili.
2. **Suosikkien jako.** Mobiilin suosikkilistan kokeet voi jakaa tiiviinä
   copy-paste-tekstinä (päivä · tyyppi · luokka · paikkakunta).

Nykytila:
- `isRegistrationOpen(koe, now)` on jo olemassa webin `app.js:105`:ssä, mutta
  sitä käytetään vain suodattimeen ("näytä vain ne joiden ilmo auki").
  Ilmoittautumisaika näytetään aina haaleana harmaana (web taulukko + kortit,
  mobiilin `EventCard`).
- Suosikit ovat **vain mobiilissa** (`FavoritesScreen`, `store.favorites`).
  Webissä ei ole suosikkilistaa. `react-native-share` on jo asennettu ja
  käytössä.
- `FavoritesScreen` näyttää tällä hetkellä **kaikki** suosikit (myös menneet),
  ilman suodattimia, lajiteltuna `sortBy`-valinnan mukaan.

## Tavoite

Sama testattu logiikka `shared/`-paketissa, ohut alusta­kohtainen UI molemmissa.
Ei uusia riippuvuuksia.

---

## Osa 1 — Jaettu logiikka (`shared/`, vitest-testattava)

Uusi tiedosto `shared/src/registration.ts` (tai lisäys olemassa olevaan;
toteutus valitsee), export kautta `shared/src/index.ts`.

### 1a. `isRegistrationOpen(event, now = new Date()): boolean`

Siirretään webin `app.js:105-116` inline-logiikka `shared/`-pakettiin
**täsmälleen samana** (mukaan lukien vuodenvaihteen yli menevä väli: `entry_date`
muotoa `"PP.KK.-PP.KK."`, vuosi päätellään `date_sort`:sta, alku edellisen vuoden
puolelle jos väli menee vuodenvaihteen yli).

- Palauttaa `false`, jos `entry_date` ei täsmää regexiin.
- Web `app.js` muutetaan käyttämään `window.koetutkaShared.isRegistrationOpen`
  (poistetaan inline-duplikaatti; suodatinlogiikka säilyy ennallaan).

### 1b. `isPast(event, now = new Date()): boolean`

Pieni jaettu apufunktio (mobiilin `EventCard`:n nykyinen `isPast` yleistettynä):
vertaa `end_date_sort || date_sort` -päivää tämän päivän ISO-päivään.

- Käytetään suosikkilistan menneiden suodatukseen.
- `EventCard.tsx` refaktoroidaan käyttämään tätä (DRY, matala riski).

### 1c. `buildFavoritesShareText(events): string`

Puhdas formatointifunktio. **Ei suodata eikä järjestä** — formatoi annetun
listan täsmälleen annetussa järjestyksessä (WYSIWYG; kutsuja päättää sisällön ja
järjestyksen).

Muoto:

```
Suosikkikokeet – Koetutka

<rivi per koe>
```

Rivi per koe: `{event.date} · {type}[ · {levels}] · {location}`

- Päivä: `event.date` sellaisenaan (`"24.01.2026"`).
- `levels`-segmentti **jätetään pois**, jos `levels` on tyhjä, puuttuu tai
  (case-insensitive) `"N/A"`.
- Erotin segmenttien välissä `" · "`.
- Ei alatunnistetta/linkkiä (pidetään tiiviinä, kuten hyväksytty esikatselu).
- Tyhjä lista → pelkkä otsikko (kutsuja ei näytä jakonappia tyhjälle listalle,
  joten tätä ei käytännössä tapahdu).

**Testit (`shared`):**
- `isRegistrationOpen`: ennen väliä / välissä / jälkeen; vuodenvaihteen yli;
  viallinen `entry_date`.
- `isPast`: mennyt / tuleva / tämänpäiväinen; monipäiväinen (`end_date_sort`).
- `buildFavoritesShareText`: perus, `levels=N/A` pois, tyhjä lista, järjestys
  säilyy annettuna.

---

## Osa 2 — Ilmoittautuminen auki -korostus (web + mobiili)

Kun `isRegistrationOpen(koe)` on tosi: ilmoittautumisaika **vihreä + lihavoitu**
ja perään pieni vihreä **"Ilmo auki"** -pilleri. Ei muutosta kun ilmo ei ole auki.

### Web (`app.js` + `styles.css`)

- Taulukon `entry-date`-solu (`app.js:734`): lisää `registration-open`-luokka ja
  "Ilmo auki" -pilleri kun auki.
- Kortin ilmoittautumiskohta desktop (`app.js:765-767`) ja mobiili
  (`app.js:786-788`): sama korostus + pilleri.
- Tyylit `styles.css`:ään: `.registration-open` (vihreä teksti, `font-weight`)
  ja `.reg-open-badge` (vihreä pilleri; sävyt sovituksessa web-teemaan).

### Mobiili (`EventCard.tsx`)

- `ilm. {event.entry_date}` -teksti (`EventCard.tsx:64`): vihreä + lihavoitu kun
  auki (uusi tyyli, esim. `entryOpen`).
- Uusi vihreä `Ilmo auki` -badge nykyiseen `badges`-riviin (`EventCard.tsx:66-71`),
  samaan tapaan kuin "Sopii"/"Mennyt" (vihreät sävyt kuten `fitFree`).
- Korostus ei näy menneille kokeille (past-tilassa haalennus voittaa; auki-tila
  koskee käytännössä vain tulevia).

---

## Osa 3 — Suosikkien jako (vain mobiili, `FavoritesScreen.tsx`)

### 3a. "Näytä menneet" -kytkin

- Uusi paikallinen tila (esim. `showPast`, oletus `false`) — kuten webin
  `hidePastEvents = true`.
- `items`-memo suodattaa menneet pois kun `showPast === false`
  (`shared` `isPast`). Nykyinen suosikki-filtteröinti, etäisyys ja `sortEvents`
  säilyvät.
- Kytkin näkyy vain listanäkymässä (kalenteri/agenda on jo tuleviin painottuva).

### 3b. Jako-nappi

- Listanäkymän ylätunnisteeseen kontrollirivi: vasemmalla *"N suosikkia"*,
  oikealla *Näytä menneet* -kytkin ja **"⤴ Jaa lista"** -nappi. (Tarkka
  asettelu toteutuksessa; SortSelectorin ja listan väliin tai
  `ListHeaderComponent`iin.)
- Nappi kutsuu `buildFavoritesShareText(items)` (täsmälleen ruudulla näkyvä
  lista, samassa järjestyksessä) ja avaa `react-native-share`:n
  (`Share.open({ message })`).
- Jos `items` on tyhjä, nappia ei näytetä (tyhjä-tila on jo oma näkymänsä).
- Kalenterinäkymässä (`FavoritesAgenda`) ei jako-nappia tässä vaiheessa (YAGNI).

**Jaon periaate on WYSIWYG:** jaettu teksti = listalla näkyvät kokeet. Menneiden
näkyvyyttä ohjataan listan kytkimellä, ei jaon omalla logiikalla.

---

## Osa 4 — Versiointi & whatsnew

Minor-bump (uusi ominaisuus) molemmille:

| Kohde | Nykyinen | Uusi |
|-------|----------|------|
| Web `index.html` footer + `README.md` | v1.10.0 | v1.11.0 |
| Mobiili `mobile/package.json` | 1.4.0 | 1.5.0 |
| iOS `MARKETING_VERSION` | 1.4.0 | 1.5.0 |
| iOS `CURRENT_PROJECT_VERSION` | 5 | 6 |
| Android `versionName` | 1.4.0 | 1.5.0 |
| Android `versionCode` | 6 | 7 |

`whatsnew.json`: uusi merkintä (uusin ensin) molemmille versioille — sisältö
suomeksi, kuvaa ilmo-auki-korostuksen ja suosikkien jaon. Ships web-deployn kautta.

## Ei mukana (YAGNI)

- "Ilmoittautuminen sulkeutuu pian" -korostus.
- Suosikkien jako webissä (ei suosikkeja webissä).
- Jako kalenterinäkymästä.
- Alatunniste/sovelluslinkki jaettuun tekstiin.
- Suosikkilistan laji-/tasosuodattimet (vain menneet-kytkin nyt).

## Testaus

- `cd mobile && npm test && npm run typecheck` (shared + mobiili vitest).
- Web: manuaalinen tarkistus paikallisella palvelimella (`python3 -m http.server`)
  — ilmo-auki-korostus taulukossa ja korteissa.
- Mobiili: suosikkilistan menneet-kytkin ja jako-napin tuottama teksti.
