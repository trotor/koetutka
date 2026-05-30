# Koetutka Mobile

Bare React Native CLI -mobiilisovellus, joka näyttää SNJ:n noutajakokeet käyttäjän sijainnista.

## Esivaatimukset

Mac:
- Node.js 20+
- pnpm 9+
- Xcode (App Storesta) ja Xcode Command Line Tools
- CocoaPods (`sudo gem install cocoapods`)
- Android Studio (Android-kehitykseen)

## Asennus

```bash
# repo-juuressa:
pnpm install

# rakenna jaettu paketti:
pnpm --filter @koetutka/shared build

# asenna iOS-natiiviriippuvuudet:
pnpm --filter @koetutka/mobile pod-install
```

## Käynnistys

**iOS-simulaattori:**
```bash
# käynnistä Metro:
pnpm --filter @koetutka/mobile start
# uudessa terminaalissa:
pnpm --filter @koetutka/mobile ios
```

**Android-emulaattori:**
```bash
# vaatii että Android Studiosta on käynnistetty emulaattori tai laite on liitetty USB:llä
pnpm --filter @koetutka/mobile start
pnpm --filter @koetutka/mobile android
```

**Fyysinen iPhone (USB):**
1. Avaa `mobile/ios/Koetutka.xcworkspace` Xcodessa
2. Valitse oma kehittäjätili (Signing & Capabilities)
3. Yhdistä iPhone USB:llä, valitse se kohteeksi
4. Paina Run (▶)

## Testit

```bash
pnpm --filter @koetutka/mobile test
pnpm --filter @koetutka/mobile typecheck
```

## Rakenne

- `App.tsx` — juurikomponentti (navigaatio + persistointi)
- `index.js` — RN-natiivi entry (AppRegistry)
- `src/navigation/` — React Navigation (Stack + Tab)
- `src/screens/` — näkymät (Browse, Favorites, Settings, EventDetail)
- `src/components/` — uudelleenkäytettävät React-komponentit
- `src/lib/` — puhdas TS (datan haku, store, ICS, sijainti, persistointi)
- `src/lib/tests/` — vitest-testit puhtaalle logiikalle
- `ios/` — natiivi Xcode-projekti
- `android/` — natiivi Gradle-projekti

Liiketoimintalogiikka (etäisyys, suodatus, ICS-generointi) tulee `@koetutka/shared`
-paketista, joka on jaettu web-sovelluksen kanssa.

## Production build (tulevaisuudessa, Vaihe 4)

iOS: Xcode Archive → App Store Connect.
Android: `cd android && ./gradlew bundleRelease` → Play Console.
