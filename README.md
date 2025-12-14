# Koetutka

Interaktiivinen web-sovellus, joka näyttää SNJ:n (Suomen Noutajakoirajärjestö) koirakokeet ja järjestää ne etäisyyden mukaan valitsemastasi sijainnista.

**Live:** [trotor.github.io/koetutka](https://trotor.github.io/koetutka)

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

## Tekijä

Tero Ronkko
