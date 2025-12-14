#!/usr/bin/env python3
"""
SNJ koekalenteri - Hakee kaikki kokeet ja geokoodaa sijainnit
Etäisyydet lasketaan frontendissä käyttäjän sijainnista
"""

import requests
from datetime import datetime
from zoneinfo import ZoneInfo
from geopy.geocoders import Nominatim
import time
import json
import os
import argparse

# Tiedostopolut
CACHE_FILE = "coordinates_cache.json"

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
    url = "https://21e5yv9tnf.execute-api.eu-north-1.amazonaws.com/prod/event/"
    response = requests.get(url)
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

        # Parsitaan päivämäärät
        try:
            date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            date_str = date_obj.strftime('%d.%m.%Y')
            date_sort = date_obj
        except:
            date_str = start_date
            date_sort = datetime.max

        # Parsitaan loppupäivä
        end_date_obj = None
        if end_date:
            try:
                end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end_date_obj.date() != date_obj.date():
                    date_str = f"{date_obj.strftime('%d.')}-{end_date_obj.strftime('%d.%m.%Y')}"
            except:
                pass

        try:
            entry_start_obj = datetime.fromisoformat(entry_start_date.replace('Z', '+00:00'))
            entry_start_str = entry_start_obj.strftime('%d.%m.')
        except:
            entry_start_str = ''

        try:
            entry_end_obj = datetime.fromisoformat(entry_end_date.replace('Z', '+00:00'))
            entry_end_str = entry_end_obj.strftime('%d.%m.')
        except:
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
            'classes': classes
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
    args = parser.parse_args()

    print(f"Haetaan SNJ:n koekalenterin dataa vuodelle {args.year}...")
    events = get_events()
    print(f"Yhteensä {len(events)} koetta kalenterissa")

    results = process_events(events, args.year)
    save_results(results, args.year)

if __name__ == "__main__":
    main()
