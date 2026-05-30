# Koetutka Mobile

Expo + React Native -mobiilisovellus, joka näyttää SNJ:n noutajakokeet käyttäjän sijainnista.

## Kehityskäyttö

```bash
# repo-juuressa:
pnpm install

# käynnistä Metro-bundler:
pnpm --filter @koetutka/mobile start

# Avaa Expo Go puhelimellasi ja skannaa QR-koodi.
# Tai paina 'i' (iOS-simulaattori) / 'a' (Android-emulaattori).
```

## Testit

```bash
pnpm --filter @koetutka/mobile test
pnpm --filter @koetutka/mobile typecheck
```

## Build (tulevaisuudessa, Vaihe 4)

Tällä hetkellä appi pyörii vain Expo Go:ssa. Production-build (App Store, Play Store)
asennetaan Vaiheessa 4 EAS Buildilla.

## Rakenne

- `app/` — expo-router file-based routes (näytöt + layout)
- `components/` — uudelleenkäytettävät React-komponentit
- `lib/` — puhdas TypeScript (datan haku, store, ICS, sijainti, persistointi)
- `lib/tests/` — vitest-testit puhtaalle logiikalle

Liiketoimintalogiikka (etäisyys, suodatus, ICS-generointi) tulee `@koetutka/shared`
-paketista, joka on jaettu web-sovelluksen kanssa.
