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
scp index.html styles.css app.js koetutka_2026.json dino@ronkko.fi:public_html/muikea.fi/koetutka/
```

## Architecture

**Backend (Python - snj_kokeet.py):**
- Fetches all events from SNJ API
- Geocodes locations via Nominatim (results cached in `coordinates_cache.json`)
- Outputs JSON file with event data and coordinates
- No distance filtering - all events included

**Frontend (index.html + styles.css + app.js):**
- `index.html` is markup only; styles live in `styles.css` and logic in `app.js`
  (a small inline `<script type="module">` imports `shared/dist` and bootstraps)
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
2. Deploy `index.html`, `styles.css`, `app.js` and `koetutka_YYYY.json` files to server
3. The frontend automatically tries to load next year's data first, then current year

## Deployment

### GitHub Pages (Primary)
Live at: **https://trotor.github.io/koetutka/**

Push to `master` branch triggers automatic deployment via GitHub Pages.

### Alternative: muikea.fi
Target: `www.muikea.fi/koetutka/`

```bash
scp index.html styles.css app.js banner.jpg koetutka_*.json dino@ronkko.fi:public_html/muikea.fi/koetutka/
```

## Mobile App (React Native)

The `mobile/` workspace is a React Native app (RN 0.77, new architecture)
sharing all domain logic with the web app via the `shared/` package. Same
features on iOS and Android — the `src/` code is platform-agnostic apart from a
couple of `Platform.OS` branches. Published by Inetor Oy.

```bash
# From repo root: install JS deps (pnpm workspace)
pnpm install

# iOS: install pods, then run on a simulator
cd mobile/ios && pod install && cd ..
cd mobile && npm run ios          # or: npx react-native run-ios

# Android
cd mobile && npm run android

# Tests / typecheck (mobile + shared use vitest)
cd mobile && npm test && npm run typecheck
```

**Identity & signing:**
- Bundle id / applicationId: `com.koetutka` (same on both platforms)
- iOS team: Inetor oy, Team ID `TTND84D98U` (automatic signing)
- Android keystore: see `mobile/android/app/upload-keystore.jks` (gitignored)

**iOS Podfile patches (in `mobile/ios/Podfile` post_install):**
- `setup_permissions(['LocationWhenInUse'])` — compiles the iOS location handler
- Patches bundled `fmt` 11.0.2 to drop `consteval` (Xcode 26 clang rejects it)
- Adds the ReactCodegen header path to the `RNShare` target (react-native-share
  10.2.1 misses it under the new architecture)
- `AppDelegate.mm` sets `self.dependencyProvider = [RCTAppDependencyProvider new]`
  (required since RN 0.77 to register third-party Fabric components)

**iOS release (App Store, via Inetor Oy account):**
1. Bump versions (see Versioning) — `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION`
2. In Xcode: Product → Archive (Release), then distribute to App Store Connect
3. TestFlight for internal testing, then submit for review

**iOS app icon:** regenerate from `mobile/store/icon-source.png` into
`mobile/ios/Koetutka/Images.xcassets/AppIcon.appiconset/` (no alpha channel).

## Files

**Core files (deployed):**
- `index.html` - Main page (markup)
- `styles.css` - Page styles
- `app.js` - Page logic
- `banner.jpg` - Header banner image
- `favicon.ico` - Favicon (multi-size)
- `favicon-192.png` - Android/PWA icon
- `apple-touch-icon.png` - iOS home screen icon
- `koetutka_2025.json` - Current year data
- `koetutka_2026.json` - Next year data

**Development files:**
- `snj_kokeet.py` - Data fetcher script
- `coordinates_cache.json` - Geocoding cache

## Versioning

When making changes to the application, **always update the version number**:

**Web:**
1. Update `index.html` - Change the version in footer (`<span id="version">vX.X.X</span>`)
2. Update `README.md` - Add entry to the Version History section

**Mobile** (when changing the app, e.g. shared logic or RN screens):
1. `mobile/package.json` `version` - drives the in-app "Tietoja" footer (both platforms)
2. iOS: `MARKETING_VERSION` (user-facing) + `CURRENT_PROJECT_VERSION` (build number,
   increment for every App Store/TestFlight upload) in the Xcode project
3. Android: `versionName` + `versionCode` (increment) in `mobile/android/app/build.gradle`

Use semantic versioning:
- **Major (X.0.0)** - Breaking changes or major new features
- **Minor (0.X.0)** - New features, significant improvements
- **Patch (0.0.X)** - Bug fixes, small tweaks

## Contact

- **Author:** Tero Rönkkö
- **Email:** tero@savonnuuskut.com
- **GitHub:** https://github.com/trotor/koetutka
