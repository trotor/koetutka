#!/usr/bin/env python3
"""
SNJ koekalenteri - Hakee kaikki kokeet ja geokoodaa sijainnit
Etäisyydet lasketaan frontendissä käyttäjän sijainnista
"""

import requests
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from zoneinfo import ZoneInfo
from geopy.geocoders import Nominatim
import glob
import re
import time
import json
import os
import argparse

# Tiedostopolut
CACHE_FILE = "coordinates_cache.json"
STARTLIST_DIR = "startlists"

API_BASE = "https://21e5yv9tnf.execute-api.eu-north-1.amazonaws.com/prod"

def load_cache():
    """Lataa koordinaattien välimuisti"""
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_cache(cache):
    """Tallenna koordinaattien välimuisti"""
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def get_events():
    """Hae kaikki kokeet API:sta"""
    response = requests.get(f"{API_BASE}/event/")
    response.raise_for_status()
    return response.json()

def clean_location_name(location):
    """Siivoa paikannimi parempaan muotoon geohakua varten"""
    if not location:
        return None

    # Korvataan lyhenteitä
    location = location.replace(" ymp", "")
    location = location.replace(" ympäristö", "")

    # Poistetaan sulkeet ja niiden sisältö
    if "(" in location:
        location = location.split("(")[0].strip()

    return location.strip()

def get_location_coords(location, cache):
    """Hae paikkakunnan koordinaatit (käyttää cachea)"""
    if not location:
        return None

    # Tarkista onko cachessa
    if location in cache:
        cached = cache[location]
        if cached is None:
            return None
        return tuple(cached)

    geolocator = Nominatim(user_agent="snj_kokeet_filter")

    # Kokeillaan eri variaatioita
    location_variants = [
        f"{location}, Finland",
        f"{clean_location_name(location)}, Finland",
    ]

    for variant in location_variants:
        try:
            geo_location = geolocator.geocode(variant, timeout=10)
            if geo_location:
                coords = (geo_location.latitude, geo_location.longitude)
                cache[location] = coords
                return coords
            time.sleep(0.5)
        except Exception as e:
            print(f"Varoitus: {variant}: {e}")

    # Merkitään cacheen että ei löytynyt
    cache[location] = None
    return None

def extract_event_type(event_type_str):
    """Pura kokeen tyyppi (NOME/NoMEWT/NOU jne.)"""
    if not event_type_str:
        return "N/A"
    return event_type_str

def process_events(events, target_year):
    """Käsittele tapahtumat ja palauta lista"""
    cache = load_cache()
    results = []

    # Suodata vuoden mukaan
    filtered_events = []
    for event in events:
        start_date = event.get('startDate')
        if start_date:
            try:
                date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if date_obj.year == target_year:
                    filtered_events.append(event)
            except:
                pass

    print(f"\nHaetaan koordinaatteja {len(filtered_events)} kokeelle vuodelta {target_year}...\n")

    for idx, event in enumerate(filtered_events, 1):
        location = event.get('location', 'Ei tiedossa')

        # Näytetään edistyminen
        if idx % 10 == 0:
            print(f"Käsitelty {idx}/{len(filtered_events)} koetta...")

        # Hae koordinaatit
        coords = get_location_coords(location, cache)

        # Jos koordinaatteja ei löydy, tarkistetaan tunnettuja paikkoja
        if not coords:
            known_locations = {
                'kuopio': (62.8924, 27.6782),
                'helsinki': (60.1699, 24.9384),
                'tampere': (61.4978, 23.7610),
                'oulu': (65.0121, 25.4651),
                'turku': (60.4518, 22.2666),
            }
            for key, default_coords in known_locations.items():
                if location and key in location.lower():
                    coords = default_coords
                    cache[location] = coords
                    break

        if coords:
            time.sleep(0.3)  # Rate limiting

        # Kerää kokeen tiedot
        event_type = extract_event_type(event.get('eventType'))
        start_date = event.get('startDate', '')
        end_date = event.get('endDate', '')
        entry_start_date = event.get('entryStartDate', '')
        entry_end_date = event.get('entryEndDate', '')

        # Parsitaan päivämäärät — SNJ:n API antaa päivän UTC:ssä, mutta
        # kokeet ovat Helsingin aikaa. Muunnetaan ennen formatointia jotta
        # date_str ja date_sort ovat samassa, paikallisessa aikavyöhykkeessä.
        helsinki = ZoneInfo('Europe/Helsinki')
        try:
            date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00')).astimezone(helsinki)
            date_str = date_obj.strftime('%d.%m.%Y')
            date_sort = date_obj
        except:
            date_str = start_date
            date_sort = datetime.max

        # Parsitaan loppupäivä
        end_date_obj = None
        if end_date:
            try:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00')).astimezone(helsinki)
                if end_date_obj.date() != date_obj.date():
                    date_str = f"{date_obj.strftime('%d.')}-{end_date_obj.strftime('%d.%m.%Y')}"
            except:
                pass

        try:
            entry_start_obj = datetime.fromisoformat(entry_start_date.replace('Z', '+00:00')).astimezone(helsinki)
            entry_start_str = entry_start_obj.strftime('%d.%m.')
        except:
            entry_start_obj = None
            entry_start_str = ''

        try:
            entry_end_obj = datetime.fromisoformat(entry_end_date.replace('Z', '+00:00')).astimezone(helsinki)
            entry_end_str = entry_end_obj.strftime('%d.%m.')
        except:
            entry_end_obj = None
            entry_end_str = 'N/A'

        # Luo ilmoittautumisaikaväli
        if entry_start_str and entry_end_str != 'N/A':
            entry_date_str = f"{entry_start_str}-{entry_end_str}"
        elif entry_end_str != 'N/A':
            entry_date_str = f"päättyy {entry_end_str}"
        else:
            entry_date_str = 'N/A'

        # Kerää kaikki luokat (ALO/AVO/VOI) ja niiden päivät
        classes = event.get('classes', [])
        class_levels = {}

        for cls in classes:
            class_name = cls.get('class', '')
            class_date = cls.get('date', '')

            if class_name:
                day_name = ''
                if class_date:
                    try:
                        cls_date_obj = datetime.fromisoformat(class_date.replace('Z', '+00:00'))
                        cls_date_local = cls_date_obj.astimezone(ZoneInfo('Europe/Helsinki'))
                        weekdays = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']
                        day_name = weekdays[cls_date_local.weekday()]

                        if class_name not in class_levels:
                            class_levels[class_name] = []
                        class_levels[class_name].append(day_name)
                    except:
                        if class_name not in class_levels:
                            class_levels[class_name] = []

        # Muodosta levels_str päivien kanssa
        if class_levels:
            level_parts = []
            for level in sorted(class_levels.keys()):
                days = class_levels[level]
                if days:
                    unique_days = sorted(set(days))
                    level_parts.append(f"{level} ({', '.join(unique_days)})")
                else:
                    level_parts.append(level)
            levels_str = ', '.join(level_parts)
        else:
            levels_str = 'N/A'

        # Kerää lisätiedot
        organizer = event.get('organizer', {})
        organizer_name = organizer.get('name', '') if isinstance(organizer, dict) else ''

        contact_info = event.get('contactInfo', {})
        official = contact_info.get('official', {}) if isinstance(contact_info, dict) else {}
        secretary = contact_info.get('secretary', {}) if isinstance(contact_info, dict) else {}

        judges = event.get('judges', [])
        judges_list = [j.get('name', '') for j in judges if isinstance(j, dict)]

        results.append({
            'id': event.get('id', ''),
            'type': event_type,
            'levels': levels_str,
            'date': date_str,
            'date_sort': date_sort.isoformat() if isinstance(date_sort, datetime) else str(date_sort),
            'end_date_sort': end_date_obj.isoformat() if end_date_obj else None,
            'entry_date': entry_date_str,
            'location': location,
            'coordinates': list(coords) if coords else None,
            'name': event.get('name', ''),
            'organizer': organizer_name,
            'official': {
                'name': official.get('name', '') if isinstance(official, dict) else '',
                'phone': official.get('phone', '') if isinstance(official, dict) else '',
                'email': official.get('email', '') if isinstance(official, dict) else ''
            },
            'secretary': {
                'name': secretary.get('name', '') if isinstance(secretary, dict) else '',
                'phone': secretary.get('phone', '') if isinstance(secretary, dict) else '',
                'email': secretary.get('email', '') if isinstance(secretary, dict) else ''
            },
            'judges': judges_list,
            'description': event.get('description', ''),
            'cost': event.get('cost', ''),
            'cost_member': event.get('costMember', ''),
            'classes': classes,
            # Kokeen kokonaispaikkamäärä. Osalla kokeista (esim. alustavat ja
            # WT-kokeet) ei ole per-luokka-paikkoja classes-listassa, vaan vain
            # tämä kokonaisluku. UI näyttää sen "Yhteensä"-rivinä kun luokkakohtaista
            # erittelyä ei ole.
            'places': event.get('places'),
            # Kokeen tila SNJ:n API:sta: tentative | confirmed | picked |
            # invited | cancelled. UI näyttää alustavan ja perutun merkkinä, ja
            # picked/invited tarkoittaa että ilmoittautuminen on ohi.
            'state': event.get('state'),
            # Ilmoittautumisajan tarkat päivät. entry_date on esitysmuoto
            # ("01.04.-14.04.") josta vuosi puuttuu; nämä ovat vertailukelpoiset.
            'entry_start': entry_start_obj.strftime('%Y-%m-%d') if entry_start_obj else None,
            'entry_end': entry_end_obj.strftime('%Y-%m-%d') if entry_end_obj else None,
            # Ilmoittautuneiden kokonaismäärä. Tarvitaan koska osalla kokeista ei
            # ole luokkaerittelyä lainkaan, jolloin classes[].entries puuttuu.
            'entries': event.get('entries')
        })

    # Tallenna cache
    save_cache(cache)

    # Järjestä päivämäärän mukaan
    results.sort(key=lambda x: x['date_sort'])

    # Tulosta yhteenveto
    print(f"\nYhteensä {len(results)} koetta vuonna {target_year}")

    # Laske kuinka monelta puuttuu koordinaatit
    missing_coords = sum(1 for r in results if r['coordinates'] is None)
    if missing_coords > 0:
        print(f"Varoitus: {missing_coords} kokeelta puuttuu koordinaatit")

    return results

# --- Lähtölistat -----------------------------------------------------------
#
# SNJ:n API tarjoaa julkisen lähtölistan (`/startlist/{id}`), mutta vastaus
# sallii CORSissa vain koekalenterin oman originin, joten selain ei voi hakea
# sitä suoraan. Siksi listat haetaan täällä ja julkaistaan karsittuna omalta
# sivustolta. Karsinta on tietoinen: mukaan vain se mitä lähtölistan lukija
# tarvitsee (koira, ohjaaja, luokka, ryhmä). Erityisesti sirunumero (rfid),
# omistaja, kasvattaja ja koiran koko tuloshistoria jätetään pois.
#
# Listoja ei committoida repoon vaan ne generoidaan jokaisessa deployssa, jotta
# SNJ:ssä tehdyt poistot heijastuvat myös meille eikä henkilötieto jää
# git-historiaan.

# Ryhmän aikakoodit SNJ:n datassa.
STARTLIST_TIMES = ('ap', 'ip', 'kp')

# Tilat joissa lähtölista voi olla olemassa. `picked` (osallistujat valittu)
# palauttaa aina 404 — lista syntyy vasta kutsujen myötä. `confirmed` on mukana
# koska osalla jo pidetyistä kokeista tila ei ole ehtinyt vaihtua `invited`ksi,
# mutta lista on silti olemassa.
STARTLIST_STATES = ('invited', 'confirmed')


def _startlist_group_date(group):
    """Ryhmän päivä muodossa YYYY-MM-DD, paikallisena päivänä.

    `group.key` on jo paikallinen (esim. "2026-08-29-kp"), kun taas `group.date`
    on UTC ja voi osoittaa edelliseen päivään. Käytetään siis ensisijaisesti
    avainta.
    """
    key = group.get('key') or ''
    m = re.match(r'^(\d{4}-\d{2}-\d{2})', key)
    if m:
        return m.group(1)
    try:
        dt = datetime.fromisoformat(group['date'].replace('Z', '+00:00'))
        return dt.astimezone(ZoneInfo('Europe/Helsinki')).strftime('%Y-%m-%d')
    except (KeyError, AttributeError, ValueError):
        return ''


def trim_startlist(rows):
    """Karsi lähtölista julkaistavaan muotoon (ks. moduulin kommentti yllä)."""
    trimmed = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        dog = row.get('dog') or {}
        group = row.get('group') or {}
        time_code = group.get('time') or ''
        trimmed.append({
            # Luokka puuttuu kokeista joissa niitä ei ole (esim. NOU).
            'class': row.get('class') or '',
            'day': _startlist_group_date(group),
            'time': time_code if time_code in STARTLIST_TIMES else '',
            'number': group.get('number') if isinstance(group.get('number'), int) else None,
            'handler': row.get('handler') or '',
            'dog': dog.get('name') or '',
            'reg_no': dog.get('regNo') or '',
            'titles': dog.get('titles') or '',
        })
    return trimmed


def fetch_startlist(event_id):
    """Hae yhden kokeen lähtölista. None jos listaa ei ole (404)."""
    try:
        response = requests.get(f"{API_BASE}/startlist/{event_id}", timeout=30)
    except requests.RequestException as e:
        print(f"  Virhe {event_id}: {e}")
        return None
    if response.status_code == 404:
        return None
    if not response.ok:
        print(f"  Virhe {event_id}: HTTP {response.status_code}")
        return None
    rows = response.json()
    if not isinstance(rows, list) or not rows:
        return None
    return trim_startlist(rows)


def published_event_ids():
    """Kokeiden id:t julkaistavista koetutka_YYYY.json-tiedostoista."""
    ids = set()
    for path in sorted(glob.glob('koetutka_*.json')):
        with open(path, 'r', encoding='utf-8') as f:
            for event in json.load(f):
                if event.get('id'):
                    ids.add(event['id'])
    return ids


def build_startlists(events):
    """Hae lähtölistat julkaistuille kokeille ja kirjoita startlists/-hakemistoon."""
    ids = published_event_ids()
    if not ids:
        print("Ei koetutka_YYYY.json-tiedostoja — aja ensin --year")
        return

    candidates = [
        e for e in events
        if e.get('id') in ids and e.get('state') in STARTLIST_STATES
    ]
    print(f"Haetaan lähtölistoja {len(candidates)} kokeelle "
          f"({len(ids)} julkaistua koetta)...")

    os.makedirs(STARTLIST_DIR, exist_ok=True)
    for stale in glob.glob(os.path.join(STARTLIST_DIR, '*.json')):
        os.remove(stale)

    with ThreadPoolExecutor(max_workers=6) as pool:
        lists = list(pool.map(lambda e: (e['id'], fetch_startlist(e['id'])), candidates))

    index = {}
    for event_id, rows in lists:
        if not rows:
            continue
        with open(os.path.join(STARTLIST_DIR, f'{event_id}.json'), 'w', encoding='utf-8') as f:
            json.dump(rows, f, ensure_ascii=False, separators=(',', ':'))
        index[event_id] = len(rows)

    with open(os.path.join(STARTLIST_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'generated': datetime.now(ZoneInfo('Europe/Helsinki')).isoformat(timespec='seconds'),
            'events': index,
        }, f, ensure_ascii=False, separators=(',', ':'))

    total = sum(index.values())
    print(f"Lähtölistoja {len(index)} kpl, {total} osallistujaa "
          f"-> {STARTLIST_DIR}/")


def save_results(results, target_year):
    """Tallenna tulokset JSON-muotoon"""
    output_file = f"koetutka_{target_year}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nTulokset tallennettu: {output_file}")
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Hae SNJ kokeet ja geokoodaa sijainnit')
    parser.add_argument('--year', type=int, default=2026, help='Vuosi (oletus: 2026)')
    parser.add_argument('--startlists', action='store_true',
                        help='Hae vain lähtölistat jo julkaistuille kokeille')
    args = parser.parse_args()

    if args.startlists:
        print("Haetaan SNJ:n lähtölistoja...")
        build_startlists(get_events())
        return

    print(f"Haetaan SNJ:n koekalenterin dataa vuodelle {args.year}...")
    events = get_events()
    print(f"Yhteensä {len(events)} koetta kalenterissa")

    results = process_events(events, args.year)
    save_results(results, args.year)

if __name__ == "__main__":
    main()
