# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Koetutka** - Finnish retriever trial finder. Fetches dog trial (koirakoe) data from the Finnish Retriever Club (SNJ) calendar API, allows users to select their location, and shows trials sorted by distance with calendar export functionality.

## Commands

```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install requests geopy

# Fetch data for a specific year (creates koetutka_YYYY.json)
python3 snj_kokeet.py --year 2026

# Test locally (requires HTTP server due to fetch)
python3 -m http.server 8080
# Then open: http://localhost:8080/

# Deploy to server
scp index.html koetutka_2026.json dino@ronkko.fi:public_html/muikea.fi/koetutka/
```

## Architecture

**Backend (Python - snj_kokeet.py):**
- Fetches all events from SNJ API
- Geocodes locations via Nominatim (results cached in `coordinates_cache.json`)
- Outputs JSON file with event data and coordinates
- No distance filtering - all events included

**Frontend (index.html):**
- Loads JSON data via fetch
- User selects location: text search (with autocomplete) OR GPS geolocation
- Calculates distances using Haversine formula in JavaScript
- Sorts by distance (default) or other columns
- Includes filtering by type/level, calendar export (.ics)

**External APIs:**
- SNJ Events: `https://21e5yv9tnf.execute-api.eu-north-1.amazonaws.com/prod/event/`
- Geocoding: Nominatim (rate-limited, results cached)
- Location search: Nominatim (for user location input)

**Output Files:**
- `koetutka_YYYY.json` - Event data with coordinates
- `coordinates_cache.json` - Geocoding cache (persistent)
- `index.html` - Self-contained interactive page

## Yearly Update Process

1. Run `python3 snj_kokeet.py --year YYYY` for each needed year
2. Deploy `index.html` and `koetutka_YYYY.json` files to server
3. The frontend automatically tries to load next year's data first, then current year

## Deployment

Target: `www.muikea.fi/koetutka/`

Files to deploy:
- `index.html` - Main page
- `koetutka_2025.json` - Current year data
- `koetutka_2026.json` - Next year data

```bash
scp index.html koetutka_*.json dino@ronkko.fi:public_html/muikea.fi/koetutka/
```
