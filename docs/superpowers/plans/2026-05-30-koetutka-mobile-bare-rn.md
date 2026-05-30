# Koetutka Mobile — Bare React Native CLI -konversio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Korvata olemassaoleva `mobile/` (Expo SDK 51) bare React Native CLI -projektilla. Sama feature-setti, ei Expon SDK:ta tai Expo-kohtaisia työkaluja. Lopputulos: itsenäinen `mobile/`-paketti jossa on natiivit `ios/`- ja `android/`-hakemistot, oma Metro-bundler, oma navigaatio React Navigationilla.

**Architecture:** `npx @react-native-community/cli init` -pohjainen template. Navigaatio: `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` (korvaa expo-routerin). Native-toiminnot: `@react-native-community/geolocation` + `react-native-permissions` (sijainti), `react-native-fs` + `react-native-share` (ICS), `react-native-safe-area-context` + `react-native-screens` + `react-native-gesture-handler` (säilyvät, eivät ole Expo-spesifejä).

**Tech Stack:** React Native 0.74 (sama kuin nyt), React Navigation 6, react-native-permissions, react-native-fs, react-native-share, zustand, AsyncStorage. Vitest pure-logiikalle. Xcode (iOS) + Android Studio / SDK (Android) paikallisesti.

---

## Konteksti

Olemassaoleva Expo-pohjainen `mobile/`-paketti merettiin masteriin commitilla `8959b69`. Tämä plan **korvaa** sen kokonaan bare RN -versiolla. Vanha versio säilyy git-historiassa (`8959b69~..8959b69`). Suurin osa `lib/`-koodista ja monet komponentit ovat suoraan käyttökelpoisia — vain Expo-SDK-kutsut vaativat korvauksen.

**Mitä säilyy 1:1:**
- `shared/`-paketti (ei muutoksia)
- `mobile/lib/data.ts`, `lib/nominatim.ts`, `lib/preferences.ts`, `lib/store.ts` (puhdas TS)
- `mobile/lib/tests/*` (vitest-testit)
- `mobile/components/FilterChips.tsx`, `ListMapToggle.tsx`, `MapPlaceholder.tsx` (vain RN-primitiivit)

**Mikä korvataan:**
- `mobile/app/` (expo-router) → `mobile/src/navigation/` + `mobile/src/screens/` (React Navigation)
- `mobile/lib/ics-export.ts` (expo-file-system + expo-sharing → react-native-fs + react-native-share)
- `mobile/components/LocationSection.tsx` (expo-location → react-native-permissions + Geolocation)
- `mobile/components/EventCard.tsx` (expo-routerin `Link` → React Navigationin `navigation.navigate`)
- `mobile/app.json` → `app.json` + natiiviset `Info.plist`/`AndroidManifest.xml`
- `mobile/index.ts` (expo-router/entry → AppRegistry)
- Lisätään `mobile/App.tsx` (juurikomponentti, joka aiemmin oli implisiittinen expo-routerilla)
- `mobile/babel.config.js` (metro-react-native-babel-preset)
- `mobile/metro.config.js` (RN CLI default + workspace fixit)
- `mobile/ios/` + `mobile/android/` -hakemistot luodaan

---

## Repo-rakenne konversion jälkeen

```
koetutka/
├── shared/                           # ei muutoksia
├── mobile/
│   ├── package.json                  # uusi: bare RN deps
│   ├── tsconfig.json                 # päivitetty
│   ├── babel.config.js               # uusi: metro-react-native-babel-preset
│   ├── metro.config.js               # uusi: workspace-aware
│   ├── index.js                      # uusi: AppRegistry.registerComponent
│   ├── App.tsx                       # uusi: root component
│   ├── app.json                      # uusi: nimi + displayName (RN CLI:n muoto)
│   ├── vitest.config.ts              # ei muutoksia
│   ├── .gitignore                    # päivitetty: + ios/build, android/build...
│   ├── ios/                          # native iOS Xcode -projekti
│   ├── android/                      # native Android Gradle -projekti
│   ├── src/
│   │   ├── navigation/
│   │   │   └── index.tsx             # NavigationContainer + Stack + Tab
│   │   ├── screens/
│   │   │   ├── BrowseScreen.tsx
│   │   │   ├── FavoritesScreen.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── EventDetailScreen.tsx
│   │   ├── components/
│   │   │   ├── EventCard.tsx
│   │   │   ├── FilterChips.tsx
│   │   │   ├── LocationSection.tsx
│   │   │   ├── ListMapToggle.tsx
│   │   │   └── MapPlaceholder.tsx
│   │   └── lib/
│   │       ├── data.ts
│   │       ├── store.ts
│   │       ├── nominatim.ts
│   │       ├── preferences.ts
│   │       ├── ics-export.ts
│   │       └── tests/
│   └── README.md
└── pnpm-workspace.yaml               # ei muutoksia, 'mobile' jo listalla
```

Huom: kaikki ei-natiivit lähdetiedostot siirtyvät `src/`-hakemistoon. Tämä on bare RN -konventio (expo-router käytti `app/`:tä, mutta bare RN:ssä `app/`-juuressa ei ole erityismerkitystä).

---

## Vastuujako tiedostoittain

- **`mobile/index.js`** — RN-natiivin entry point. Kutsuu `AppRegistry.registerComponent('Koetutka', () => App)`.
- **`mobile/App.tsx`** — Juurikomponentti: `GestureHandlerRootView` + `SafeAreaProvider` + `NavigationContainer` + `initFromStorage`-koukku.
- **`mobile/app.json`** — Vain `{ name: "Koetutka", displayName: "Koetutka" }`.
- **`mobile/src/navigation/index.tsx`** — `RootNavigator`: Stack (Tabs + EventDetail-modaali); Tab navigator (Selaa, Suosikit, Asetukset).
- **`mobile/src/screens/BrowseScreen.tsx`** — Sama logiikka kuin entinen `app/(tabs)/index.tsx`.
- **`mobile/src/screens/FavoritesScreen.tsx`** — Placeholder.
- **`mobile/src/screens/SettingsScreen.tsx`** — Sama kuin entinen.
- **`mobile/src/screens/EventDetailScreen.tsx`** — Sama logiikka kuin entinen `app/event/[id].tsx`, mutta lukee `route.params.id` `useLocalSearchParams`-koukun sijaan.
- **`mobile/src/lib/ics-export.ts`** — Käyttää `react-native-fs` + `react-native-share`.
- **`mobile/src/components/LocationSection.tsx`** — Käyttää `@react-native-community/geolocation` + `react-native-permissions`.
- **`mobile/src/components/EventCard.tsx`** — Käyttää `navigation.navigate('EventDetail', { id })` `Link`:n sijaan.

---

## Task 1: Varmuuskopioi ja poista vanha Expo-pohjainen mobile/

**Files:**
- Delete: kaikki `mobile/`:n alta paitsi `mobile/lib/tests/` (säilytetään tilapäisesti vertailua varten)
- Verify: vanha versio on git-historiassa (`8959b69`)

- [ ] **Step 1: Varmista että vanha versio on git-historiassa**

Run: `git log --oneline mobile/ | head -5`
Expected: näet kommittilistan, mukaan lukien `8959b69 Merge branch 'worktree-mobile-mvp'`. Tämä todistaa että vanha Expo-versio on tallessa git-historiassa eikä sitä menetä poistamalla.

- [ ] **Step 2: Poista vanha mobile/**

Run:
```bash
rm -rf mobile/
```

Expected: hakemisto poistettu. `ls mobile/` palauttaa "No such file or directory".

- [ ] **Step 3: Poista node_modules + ohjelmistolinjattu data root-hakemistosta**

Run:
```bash
rm -rf node_modules
```

(Lockfile pidetään toistaiseksi — `pnpm install` tehdään Task 2:n jälkeen kun uudet riippuvuudet on määritelty.)

- [ ] **Step 4: Commit**

```bash
git add -A mobile/ node_modules
git commit -m "Remove Expo-based mobile/ to make way for bare RN rewrite"
```

Tämä commit on tahallinen — `8959b69`-pohjainen versio jää git-historiaan kaikkien revertien varalle.

---

## Task 2: Bare RN -projektin scaffold

**Files:**
- Create: `mobile/` (kokonaisuudessaan `react-native-community/cli`:n template)
- Create: `mobile/package.json` (päivitetään template-pohjasta omaan)

- [ ] **Step 1: Generoi bare RN -projekti väliaikaiseen hakemistoon**

Bare RN -projektin generointi vaatii Node-pohjaisen CLI:n. Käytetään `react-native-community/cli`:tä uusimmalla 0.74-versiolla.

Run:
```bash
cd /tmp
npx @react-native-community/cli@latest init KoetutkaTemp --version 0.74.5 --skip-install
```

Expected: CLI luo `/tmp/KoetutkaTemp/` jossa on:
- `package.json`
- `tsconfig.json`
- `babel.config.js`
- `metro.config.js`
- `index.js`
- `App.tsx`
- `app.json`
- `ios/` ja `android/` natiivihakemistot
- `.gitignore`

(Jos CLI kysyy interaktiivisesti templaten tai TypeScriptin, valitse oletukset. `--skip-install` estää ylimääräisen npm-asennuksen — me käytämme pnpm:ää.)

- [ ] **Step 2: Siirrä generoitu projekti `mobile/`:ksi**

Run:
```bash
mv /tmp/KoetutkaTemp /Users/teroronkko/code/koetutka/mobile
cd /Users/teroronkko/code/koetutka/mobile
ls -la
```

Expected: näet `package.json`, `App.tsx`, `index.js`, `ios/`, `android/` jne.

- [ ] **Step 3: Päivitä mobile/package.json**

Replace the entire contents of `mobile/package.json` with:

```json
{
  "name": "@koetutka/mobile",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit",
    "pod-install": "cd ios && pod install"
  },
  "dependencies": {
    "@koetutka/shared": "workspace:*",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/geolocation": "^3.4.0",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-fs": "^2.20.0",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-permissions": "^4.1.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-share": "^10.2.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/babel-preset": "0.74.85",
    "@react-native/metro-config": "0.74.85",
    "@react-native/typescript-config": "0.74.85",
    "@types/react": "~18.2.79",
    "metro-react-native-babel-preset": "^0.77.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

Huom: scaffold-template lisäsi paljon devDependencyjä jotka tarvitaan natiivibuildiin. Pidetään template-versioiden niiden ja korvataan vain yllä mainitut. JOS yllä oleva package.json estää templaten oman riippuvuusresoluution, tarkista template-package.json:n devDeps ja säilytä ne mukana.

- [ ] **Step 4: Lisää workspace-protokollalla shared näkyväksi**

`@koetutka/shared` näkyy `workspace:*` -syntaksilla — pnpm hoitaa loput.

- [ ] **Step 5: Säädä metro.config.js workspace-tietoiseksi**

Replace contents of `mobile/metro.config.js`:

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

- [ ] **Step 6: Säädä babel.config.js**

Replace contents of `mobile/babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

- [ ] **Step 7: Säädä tsconfig.json**

Replace contents of `mobile/tsconfig.json`:

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "App.tsx", "index.js"]
}
```

- [ ] **Step 8: Päivitä app.json**

Replace contents of `mobile/app.json`:

```json
{
  "name": "Koetutka",
  "displayName": "Koetutka"
}
```

(RN CLI:n app.json on minimaalinen — natiivimuokset menevät suoraan iOS:n `Info.plist`:iin ja Androidin `AndroidManifest.xml`:ään.)

- [ ] **Step 9: Päivitä .gitignore**

Append to `mobile/.gitignore`:

```
# Workspace
node_modules/

# RN build artifacts
ios/build/
android/build/
android/app/build/
android/.gradle/
ios/Pods/
ios/*.xcworkspace/xcuserdata/
ios/*.xcodeproj/xcuserdata/
ios/*.xcodeproj/project.xcworkspace/xcuserdata/

# macOS
.DS_Store
```

- [ ] **Step 10: Asenna riippuvuudet**

Run:
```bash
cd /Users/teroronkko/code/koetutka
pnpm install
```

Expected: pnpm asentaa kaikki uudet riippuvuudet workspaceen. Mahdollisesti tulee varoituksia peer-depeistä — ne ovat OK kunhan asennus onnistuu.

- [ ] **Step 11: Verify TypeScript-typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä (App.tsx on vielä CLI-templaten oma, mutta typecheck pitäisi mennä läpi).

- [ ] **Step 12: Commit**

```bash
git add mobile/ pnpm-lock.yaml
git commit -m "Scaffold bare React Native CLI project under mobile/"
```

---

## Task 3: iOS Pods + Android natiivikonfiguraatio

**Files:**
- Modify: `mobile/ios/Podfile` (verify)
- Modify: `mobile/android/app/src/main/AndroidManifest.xml` (sijaintilupa)
- Modify: `mobile/ios/Koetutka/Info.plist` (sijaintikäyttötarkoitus)

- [ ] **Step 1: Asenna iOS Podit**

Run:
```bash
cd /Users/teroronkko/code/koetutka/mobile/ios
pod install
```

Expected: CocoaPods asentaa kaikki natiiviriippuvuudet (React Native core + lisätyt RN-libraryt). Ottaa 2–5 min ensimmäisellä kerralla. Lopussa tulostuu `Pod installation complete!`.

Jos tämä epäonnistuu virheellä "Pod could not find compatible versions for pod RNFS":
- Aja `cd .. && pnpm install` uudelleen
- Yritä uudestaan `pod install`
- Jos vielä failaa, lisää `react-native-fs` Podfile:en käsin: `pod 'RNFS', :path => '../node_modules/react-native-fs'`

- [ ] **Step 2: Lisää iOS-sijaintilupa Info.plistiin**

Edit `mobile/ios/Koetutka/Info.plist`. Etsi `<dict>` joka on ylimmän tason `<plist>`-elementin sisällä, ja lisää sen sisälle (esim. juuri ennen sulkemaa `</dict>`-tagia):

```xml
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>Koetutka käyttää sijaintiasi kokeiden etäisyyden laskemiseen.</string>
```

(Käytä todellisuudessa tabia tai 1 tabuaattorin korkeutta riippuen siitä mitä Info.plistissä on.)

- [ ] **Step 3: Lisää Android-sijaintilupa AndroidManifest.xml:ään**

Edit `mobile/android/app/src/main/AndroidManifest.xml`. Etsi `<manifest>`-tagin sisältö ja lisää ENNEN `<application>`-tagia:

```xml
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
```

(INTERNET on yleensä jo olemassa templaten ansiosta — tarkista ja älä duplikoi.)

- [ ] **Step 4: Verify iOS-buildin runtime-pohja**

Run:
```bash
cd /Users/teroronkko/code/koetutka/mobile
npx react-native config
```

Expected: tulostuu JSON-konfiguraatio joka listaa kaikki linkitetyt natiivimoduulit. Etsi `RNCAsyncStorage`, `RNFS`, `RNShare`, `RNCGeolocation`, `RNPermissions`, `RNGestureHandler`, `RNCSafeAreaContext`, `RNScreens` — kaikkien pitäisi näkyä.

- [ ] **Step 5: Commit**

```bash
git add mobile/ios/Podfile.lock mobile/ios/Koetutka/Info.plist mobile/android/app/src/main/AndroidManifest.xml
git commit -m "Configure iOS Pods and Android location permissions"
```

(Huom: `Podfile.lock` committoidaan — vastaa pnpm-lock.yamlin roolia natiivikääntämisessä.)

---

## Task 4: Navigaatiorunko (React Navigation Stack + Tab)

**Files:**
- Create: `mobile/src/navigation/index.tsx`
- Create: `mobile/src/screens/BrowseScreen.tsx` (placeholder)
- Create: `mobile/src/screens/FavoritesScreen.tsx` (placeholder)
- Create: `mobile/src/screens/SettingsScreen.tsx` (placeholder)
- Create: `mobile/src/screens/EventDetailScreen.tsx` (placeholder)
- Replace: `mobile/App.tsx`
- Replace: `mobile/index.js`

- [ ] **Step 1: Luo src/screens/-placeholderit**

Create `mobile/src/screens/BrowseScreen.tsx`:

```typescript
import { Text, View, StyleSheet } from 'react-native';

export default function BrowseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Selaa kokeita</Text>
      <Text style={styles.body}>Data ladataan myöhemmässä taskissa.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 16, color: '#666' },
});
```

Luo identtisellä rakenteella `FavoritesScreen.tsx` ("Suosikit", "Suosikkitoiminto tulossa Vaiheessa 4."), `SettingsScreen.tsx` ("Asetukset", "Sijainti ja suodattimet tulevat Task 8:ssa."), ja `EventDetailScreen.tsx` ("Kokeen tiedot", "Lisätään Task 11:ssä.") — sama runko mutta erilainen otsikkoteksti.

- [ ] **Step 2: Luo src/navigation/index.tsx**

Create `mobile/src/navigation/index.tsx`:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  EventDetail: { id: string };
};

export type TabsParamList = {
  Browse: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

const GREEN = '#2d5a27';

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Selaa' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Suosikit' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Asetukset' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            presentation: 'modal',
            title: 'Kokeen tiedot',
            headerStyle: { backgroundColor: GREEN },
            headerTintColor: 'white',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 3: Korvaa App.tsx**

Replace contents of `mobile/App.tsx`:

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#2d5a27" />
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 4: Päivitä index.js**

Replace contents of `mobile/index.js`:

```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/ mobile/App.tsx mobile/index.js
git commit -m "Add React Navigation tab + stack with placeholder screens"
```

---

## Task 5: Ensimmäinen iOS-ajo varmistuksena

Tämä vaihe ei tee koodimuutoksia — vain varmistaa että app käynnistyy iOS-simulaattorissa ennen kuin lisätään lisää koodia. Jos tässä menee pieleen, vika on todennäköisesti natiivikonfiguraatiossa eikä koodissa.

- [ ] **Step 1: Käynnistä Metro**

Run:
```bash
cd /Users/teroronkko/code/koetutka/mobile
pnpm start
```

Metro käynnistyy. Pidä terminaali auki.

- [ ] **Step 2: Avaa toinen terminaali ja käynnistä iOS-build**

Run:
```bash
cd /Users/teroronkko/code/koetutka/mobile
pnpm ios
```

Expected: Xcode-build käynnistyy. Ottaa 5–10 min ensimmäisellä kerralla. Lopussa iOS-simulaattori avautuu ja näytetään 3-tab-navigaatio placeholdereineen.

Mahdolliset virheet:
- "No simulator found" → avaa Xcode > Settings > Components ja lataa jokin iOS-simulaattori
- "CocoaPods could not find compatible versions for pod" → palaa Task 3:een ja varmista pod install onnistui
- "Multiple commands produce" → `cd ios && pod deintegrate && pod install`

- [ ] **Step 3: Sammuta Metro ja simulaattori**

Sammuta Metro `Ctrl+C`. Sulje simulaattori.

- [ ] **Step 4: Ei committia tarvita — tämä oli vain verifiointi**

Jos kaikki toimi, voit edetä. Jos ei, debuggaa ennen kuin etenet Task 6:een.

---

## Task 6: Siirrä lib/-tiedostot

**Files:**
- Create: `mobile/src/lib/data.ts`
- Create: `mobile/src/lib/nominatim.ts`
- Create: `mobile/src/lib/preferences.ts`
- Create: `mobile/src/lib/store.ts`
- Create: `mobile/src/lib/tests/data.test.ts`
- Create: `mobile/src/lib/tests/nominatim.test.ts`
- Create: `mobile/src/lib/tests/preferences.test.ts`
- Create: `mobile/vitest.config.ts`

Nämä tiedostot ovat puhtaita TypeScript-moduuleja jotka eivät käytä Expon SDK:ta — ne kopioidaan käytännössä sellaisinaan vanhasta paketista (joka on git-historiassa commitilla `8959b69`).

- [ ] **Step 1: Luo vitest.config.ts**

Create `mobile/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Luo src/lib/data.ts**

Create `mobile/src/lib/data.ts`:

```typescript
import type { Event } from '@koetutka/shared';

export const BASE_URL = 'https://trotor.github.io/koetutka';

class NotFoundError extends Error {
  constructor(year: number) {
    super(`Vuoden ${year} dataa ei ole vielä julkaistu`);
    this.name = 'NotFoundError';
  }
}

export async function fetchEvents(year: number): Promise<Event[]> {
  const url = `${BASE_URL}/koetutka_${year}.json`;
  const response = await fetch(url);
  if (response.status === 404) {
    throw new NotFoundError(year);
  }
  if (!response.ok) {
    throw new Error(`Vuoden ${year} dataa ei löytynyt (HTTP ${response.status})`);
  }
  return response.json();
}

export async function fetchEventsWithFallback(year: number): Promise<Event[]> {
  try {
    return await fetchEvents(year);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return await fetchEvents(year - 1);
    }
    throw e;
  }
}
```

- [ ] **Step 3: Luo src/lib/nominatim.ts**

Create `mobile/src/lib/nominatim.ts`:

```typescript
export interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchLocation(query: string): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed,
  )}&format=json&countrycodes=fi&limit=5`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Koetutka-Mobile/0.1 (https://github.com/trotor/koetutka)' },
    });
    if (!response.ok) return [];
    const items: NominatimItem[] = await response.json();
    return items.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Luo src/lib/preferences.ts**

Create `mobile/src/lib/preferences.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterOptions, UserLocation } from '@koetutka/shared';

const KEY = 'koetutka:prefs:v1';

export interface StoredPrefs {
  userLocation: UserLocation | null;
  filters: FilterOptions;
}

const DEFAULTS: StoredPrefs = {
  userLocation: null,
  filters: {
    searchTerm: '',
    activeTypes: new Set(),
    activeLevels: new Set(),
    maxDistanceKm: null,
    hidePast: true,
  },
};

interface JsonShape {
  userLocation: UserLocation | null;
  filters: {
    searchTerm?: string;
    activeTypes?: string[];
    activeLevels?: string[];
    maxDistanceKm?: number | null;
    hidePast?: boolean;
  };
}

export function serializePrefs(prefs: StoredPrefs): string {
  const json: JsonShape = {
    userLocation: prefs.userLocation,
    filters: {
      searchTerm: prefs.filters.searchTerm,
      activeTypes: Array.from(prefs.filters.activeTypes ?? []),
      activeLevels: Array.from(prefs.filters.activeLevels ?? []),
      maxDistanceKm: prefs.filters.maxDistanceKm,
      hidePast: prefs.filters.hidePast,
    },
  };
  return JSON.stringify(json);
}

export function deserializePrefs(text: string): StoredPrefs {
  if (!text) return DEFAULTS;
  try {
    const parsed = JSON.parse(text) as JsonShape;
    return {
      userLocation: parsed.userLocation ?? null,
      filters: {
        searchTerm: parsed.filters?.searchTerm ?? '',
        activeTypes: new Set(parsed.filters?.activeTypes ?? []),
        activeLevels: new Set(parsed.filters?.activeLevels ?? []),
        maxDistanceKm: parsed.filters?.maxDistanceKm ?? null,
        hidePast: parsed.filters?.hidePast ?? true,
      },
    };
  } catch {
    return DEFAULTS;
  }
}

export async function loadPrefs(): Promise<StoredPrefs> {
  const text = await AsyncStorage.getItem(KEY);
  return deserializePrefs(text ?? '');
}

export async function savePrefs(prefs: StoredPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, serializePrefs(prefs));
}
```

- [ ] **Step 5: Luo src/lib/store.ts**

Create `mobile/src/lib/store.ts`:

```typescript
import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { loadPrefs, savePrefs } from './preferences';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
  prefsLoaded: boolean;
}

interface Actions {
  initFromStorage: () => Promise<void>;
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: true,
};

export const useStore = create<State & Actions>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      prefsLoaded: true,
    });
  },

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => {
    set({ userLocation });
    void savePrefs({ userLocation, filters: get().filters });
  },

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters });
    void savePrefs({ userLocation: get().userLocation, filters });
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    void savePrefs({ userLocation: get().userLocation, filters: defaultFilters });
  },
}));
```

- [ ] **Step 6: Luo tests/data.test.ts**

Create `mobile/src/lib/tests/data.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchEvents, fetchEventsWithFallback, BASE_URL } from '../data';

beforeEach(() => vi.restoreAllMocks());

describe('fetchEvents', () => {
  test('hakee oikean URL:n nykyiselle vuodelle', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'X' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchEvents(2026);
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/koetutka_2026.json`);
  });

  test('palauttaa parsedin event-listan', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'a' }, { id: 'b' }]), { status: 200 }),
    ));
    const events = await fetchEvents(2026);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('a');
  });

  test('kaataa virheen jos status ei OK', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not found', { status: 404 })));
    await expect(fetchEvents(2027)).rejects.toThrow();
  });

  test('fetchEventsWithFallback fallbackaa 404:lla edelliseen vuoteen', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes('2027')) return new Response('', { status: 404 });
      return new Response(JSON.stringify([{ id: 'a' }]), { status: 200 });
    }));
    const events = await fetchEventsWithFallback(2027);
    expect(events).toHaveLength(1);
    expect(calls).toEqual([
      `${BASE_URL}/koetutka_2027.json`,
      `${BASE_URL}/koetutka_2026.json`,
    ]);
  });

  test('fallback ei käynnisty muista virheistä kuin 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    await expect(fetchEventsWithFallback(2027)).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Luo tests/nominatim.test.ts**

Create `mobile/src/lib/tests/nominatim.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { searchLocation } from '../nominatim';

beforeEach(() => vi.restoreAllMocks());

describe('searchLocation', () => {
  test('palauttaa Nominatim-tulosten lat/lon ja nimen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify([
        { display_name: 'Helsinki, Suomi', lat: '60.1699', lon: '24.9384' },
        { display_name: 'Helsinki, Toinen', lat: '60.2', lon: '24.9' },
      ]), { status: 200 }),
    ));
    const results = await searchLocation('Helsinki');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ name: 'Helsinki, Suomi', lat: 60.1699, lng: 24.9384 });
  });

  test('tyhjä haku palauttaa tyhjän taulukon ilman API-kutsua', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchLocation('   ');
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('palauttaa tyhjän taulukon API-virheellä', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    const results = await searchLocation('Helsinki');
    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 8: Luo tests/preferences.test.ts**

Create `mobile/src/lib/tests/preferences.test.ts`:

```typescript
import { describe, test, expect } from 'vitest';
import { serializePrefs, deserializePrefs, type StoredPrefs } from '../preferences';

describe('serializePrefs / deserializePrefs', () => {
  test('round-trippaa userLocation ja filtterit', () => {
    const prefs: StoredPrefs = {
      userLocation: { lat: 60.17, lng: 24.94, name: 'Helsinki' },
      filters: {
        searchTerm: 'nome',
        activeTypes: new Set(['NOME-B']),
        activeLevels: new Set(['ALO', 'AVO']),
        maxDistanceKm: 200,
        hidePast: true,
      },
    };
    const json = serializePrefs(prefs);
    const back = deserializePrefs(json);
    expect(back.userLocation).toEqual(prefs.userLocation);
    expect(back.filters.activeTypes).toEqual(new Set(['NOME-B']));
    expect(back.filters.activeLevels).toEqual(new Set(['ALO', 'AVO']));
    expect(back.filters.maxDistanceKm).toBe(200);
    expect(back.filters.hidePast).toBe(true);
  });

  test('deserializePrefs palauttaa defaultit jos JSON on viallinen', () => {
    const back = deserializePrefs('{not json');
    expect(back.userLocation).toBe(null);
    expect(back.filters.activeTypes).toEqual(new Set());
  });

  test('deserializePrefs palauttaa defaultit tyhjälle stringille', () => {
    const back = deserializePrefs('');
    expect(back.userLocation).toBe(null);
  });
});
```

- [ ] **Step 9: Aja testit + typecheck**

Run:
```bash
pnpm --filter @koetutka/mobile test
pnpm --filter @koetutka/mobile typecheck
```

Expected: 11 testiä läpi (5 data + 3 nominatim + 3 preferences). Typecheck clean.

- [ ] **Step 10: Commit**

```bash
git add mobile/src/lib/ mobile/vitest.config.ts
git commit -m "Port lib/ modules from Expo version with 11 tests"
```

---

## Task 7: Selaa-näkymä: lataa data + renderöi raakalista

**Files:**
- Modify: `mobile/src/screens/BrowseScreen.tsx`

- [ ] **Step 1: Päivitä BrowseScreen lataamaan + renderöimään**

Replace contents of `mobile/src/screens/BrowseScreen.tsx`:

```typescript
import { useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useStore } from '@/lib/store';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d5a27" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Virhe: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.title}>{item.type} · {item.levels}</Text>
          <Text style={styles.sub}>{item.location} — {item.date}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Ei kokeita vielä.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12, backgroundColor: '#f8f9fa' },
  row: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#2d5a27' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
  empty: { color: '#666', textAlign: 'center', padding: 24 },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/BrowseScreen.tsx
git commit -m "Wire BrowseScreen to load events from production JSON"
```

---

## Task 8: Sijainnin asetukset (bare RN-versiot)

**Files:**
- Create: `mobile/src/components/LocationSection.tsx`
- Modify: `mobile/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Luo LocationSection käyttämään react-native-permissions + Geolocation**

Create `mobile/src/components/LocationSection.tsx`:

```typescript
import { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  check, request, PERMISSIONS, RESULTS, type Permission,
} from 'react-native-permissions';
import { searchLocation, type LocationResult } from '@/lib/nominatim';
import { useStore } from '@/lib/store';

const LOCATION_PERMISSION: Permission = Platform.OS === 'ios'
  ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export function LocationSection() {
  const userLocation = useStore((s) => s.userLocation);
  const setUserLocation = useStore((s) => s.setUserLocation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(text: string) {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const found = await searchLocation(text);
      setResults(found);
      setIsSearching(false);
    }, 400);
  }

  function selectResult(loc: LocationResult) {
    setUserLocation(loc);
    setQuery('');
    setResults([]);
  }

  async function useGps() {
    setIsGpsLoading(true);
    try {
      let status = await check(LOCATION_PERMISSION);
      if (status === RESULTS.DENIED) {
        status = await request(LOCATION_PERMISSION);
      }
      if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
        Alert.alert('Lupa evätty', 'Sijainnin käyttöä ei sallittu.');
        return;
      }
      Geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Nykyinen sijainti',
          });
          setIsGpsLoading(false);
        },
        () => {
          Alert.alert('Virhe', 'Sijaintia ei voitu hakea.');
          setIsGpsLoading(false);
        },
        { enableHighAccuracy: false, timeout: 15000 },
      );
    } catch {
      Alert.alert('Virhe', 'Sijaintia ei voitu hakea.');
      setIsGpsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sijaintisi</Text>
      {userLocation && (
        <View style={styles.currentRow}>
          <Text style={styles.currentText}>📍 {userLocation.name}</Text>
          <Pressable onPress={() => setUserLocation(null)}>
            <Text style={styles.clear}>Poista</Text>
          </Pressable>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Kirjoita paikkakunta..."
        value={query}
        onChangeText={handleSearch}
      />
      {isSearching && <Text style={styles.hint}>Haetaan…</Text>}
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.lat}-${item.lng}-${idx}`}
          style={styles.suggestions}
          renderItem={({ item }) => (
            <Pressable onPress={() => selectResult(item)} style={styles.suggestion}>
              <Text>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable onPress={useGps} style={styles.gps} disabled={isGpsLoading}>
        <Text style={styles.gpsText}>{isGpsLoading ? '⏳ Haetaan…' : '📍 Käytä sijaintiani'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  currentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#e8f0e6', padding: 8, borderRadius: 6, marginBottom: 8,
  },
  currentText: { fontSize: 14, color: '#1a472a' },
  clear: { fontSize: 13, color: '#b91c1c' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  suggestions: { maxHeight: 200, marginTop: 4 },
  suggestion: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gps: { marginTop: 12, padding: 12, backgroundColor: '#2d5a27', borderRadius: 6, alignItems: 'center' },
  gpsText: { color: 'white', fontWeight: '600' },
});
```

- [ ] **Step 2: Päivitä SettingsScreen**

Replace contents of `mobile/src/screens/SettingsScreen.tsx`:

```typescript
import { ScrollView, StyleSheet } from 'react-native';
import { LocationSection } from '@/components/LocationSection';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LocationSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#f8f9fa', flexGrow: 1 },
});
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/components/LocationSection.tsx mobile/src/screens/SettingsScreen.tsx
git commit -m "Add bare-RN LocationSection with permissions + geolocation"
```

---

## Task 9: Suodattimet + etäisyysjärjestys

**Files:**
- Create: `mobile/src/components/FilterChips.tsx`
- Create: `mobile/src/components/EventCard.tsx`
- Modify: `mobile/src/screens/BrowseScreen.tsx`

- [ ] **Step 1: Luo FilterChips**

Create `mobile/src/components/FilterChips.tsx`. Use the same content as the prior Expo version (it doesn't depend on Expo):

```typescript
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/lib/store';

const TYPES = ['NOME-B', 'NOU', 'NOWT', 'NOME-A'];
const LEVELS = ['ALO', 'AVO', 'VOI'];
const DISTANCES: { label: string; value: number | null }[] = [
  { label: 'Mikä tahansa', value: null },
  { label: '100 km', value: 100 },
  { label: '200 km', value: 200 },
  { label: '500 km', value: 500 },
];

export function FilterChips() {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const userLocation = useStore((s) => s.userLocation);

  function toggleType(type: string) {
    const next = new Set(filters.activeTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    setFilters({ activeTypes: next });
  }

  function toggleLevel(level: string) {
    const next = new Set(filters.activeLevels);
    if (next.has(level)) next.delete(level); else next.add(level);
    setFilters({ activeLevels: next });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Laji</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => toggleType(t)}
            style={[styles.chip, filters.activeTypes?.has(t) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeTypes?.has(t) && styles.chipTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Taso</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => toggleLevel(l)}
            style={[styles.chip, filters.activeLevels?.has(l) && styles.chipActive]}
          >
            <Text style={[styles.chipText, filters.activeLevels?.has(l) && styles.chipTextActive]}>
              {l}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {userLocation && (
        <>
          <Text style={styles.label}>Max etäisyys</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {DISTANCES.map((d) => (
              <Pressable
                key={d.label}
                onPress={() => setFilters({ maxDistanceKm: d.value })}
                style={[styles.chip, filters.maxDistanceKm === d.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, filters.maxDistanceKm === d.value && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Piilota menneet</Text>
        <Pressable
          onPress={() => setFilters({ hidePast: !filters.hidePast })}
          style={[styles.toggle, filters.hidePast && styles.toggleOn]}
        >
          <Text style={[styles.toggleText, filters.hidePast && styles.toggleTextOn]}>
            {filters.hidePast ? 'Päällä' : 'Pois'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white' },
  label: { fontSize: 12, color: '#888', marginTop: 8, marginBottom: 4, fontWeight: '600' },
  row: { gap: 6, paddingBottom: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  chipActive: { backgroundColor: '#2d5a27' },
  chipText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  toggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: '#e8f0e6' },
  toggleOn: { backgroundColor: '#2d5a27' },
  toggleText: { fontSize: 12, color: '#1a472a', fontWeight: '600' },
  toggleTextOn: { color: 'white' },
});
```

- [ ] **Step 2: Luo EventCard käyttämään navigation prop:ia**

Create `mobile/src/components/EventCard.tsx`:

```typescript
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Event } from '@koetutka/shared';
import type { RootStackParamList } from '../navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function EventCard({ event }: { event: Event }) {
  const navigation = useNavigation<Navigation>();
  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { id: event.id })}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.type} · {event.levels}</Text>
        {typeof event.distance === 'number' && (
          <Text style={styles.distance}>{event.distance} km</Text>
        )}
      </View>
      <Text style={styles.location}>{event.location}</Text>
      <Text style={styles.date}>{event.date} · ilm. {event.entry_date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: '#2d5a27',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a472a', flex: 1 },
  distance: { fontSize: 14, color: '#666', fontWeight: '600' },
  location: { fontSize: 14, color: '#333', marginTop: 4 },
  date: { fontSize: 12, color: '#888', marginTop: 2 },
});
```

- [ ] **Step 3: Päivitä BrowseScreen käyttämään shared/-suodatusta + etäisyyksiä**

Replace contents of `mobile/src/screens/BrowseScreen.tsx`:

```typescript
import { useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { addDistances, filterEvents } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import { EventCard } from '@/components/EventCard';
import { FilterChips } from '@/components/FilterChips';

export default function BrowseScreen() {
  const events = useStore((s) => s.events);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const loadEvents = useStore((s) => s.loadEvents);
  const userLocation = useStore((s) => s.userLocation);
  const filters = useStore((s) => s.filters);

  useEffect(() => {
    loadEvents(new Date().getFullYear());
  }, [loadEvents]);

  const visible = useMemo(() => {
    const withDistance = userLocation ? addDistances(events, userLocation) : events;
    const filtered = filterEvents(withDistance, filters);
    return [...filtered].sort((a, b) => {
      const aHas = a.distance !== undefined && a.distance !== null;
      const bHas = b.distance !== undefined && b.distance !== null;
      if (aHas && bHas) return (a.distance as number) - (b.distance as number);
      if (aHas) return -1;
      if (bHas) return 1;
      return a.date_sort.localeCompare(b.date_sort);
    });
  }, [events, userLocation, filters]);

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2d5a27" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Virhe: {error}</Text>
        <Text style={styles.retryHint} onPress={() => loadEvents(new Date().getFullYear())}>
          Yritä uudelleen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FilterChips />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
            <Text style={styles.emptyHint}>Kokeile suuremman etäisyyden tai vähemmän rajauksia.</Text>
          </View>
        }
        ListHeaderComponent={<Text style={styles.count}>{visible.length} koetta</Text>}
        onRefresh={() => loadEvents(new Date().getFullYear())}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  list: { padding: 12 },
  count: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  emptyWrap: { padding: 24, alignItems: 'center' },
  empty: { color: '#666', textAlign: 'center' },
  emptyHint: { color: '#888', fontSize: 13, marginTop: 8, textAlign: 'center' },
  error: { color: '#b91c1c', fontSize: 14, padding: 24, textAlign: 'center' },
  retryHint: { color: '#2d5a27', fontSize: 14, marginTop: 12, textDecorationLine: 'underline' },
});
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/FilterChips.tsx mobile/src/components/EventCard.tsx mobile/src/screens/BrowseScreen.tsx
git commit -m "Add filters and distance-sorted browse with EventCard navigation"
```

---

## Task 10: Lista/kartta-toggle + placeholder

**Files:**
- Create: `mobile/src/components/ListMapToggle.tsx`
- Create: `mobile/src/components/MapPlaceholder.tsx`
- Modify: `mobile/src/screens/BrowseScreen.tsx`

- [ ] **Step 1: Luo ListMapToggle**

Create `mobile/src/components/ListMapToggle.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  value: 'list' | 'map';
  onChange: (next: 'list' | 'map') => void;
}

export function ListMapToggle({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.btn, value === 'list' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'list' && styles.textActive]}>📋 Lista</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('map')}
        style={[styles.btn, value === 'map' && styles.btnActive]}
      >
        <Text style={[styles.text, value === 'map' && styles.textActive]}>🗺 Kartta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', backgroundColor: '#e8f0e6', borderRadius: 999,
    padding: 3, margin: 12,
  },
  btn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 999 },
  btnActive: { backgroundColor: '#2d5a27' },
  text: { fontSize: 13, color: '#1a472a', fontWeight: '600' },
  textActive: { color: 'white' },
});
```

- [ ] **Step 2: Luo MapPlaceholder**

Create `mobile/src/components/MapPlaceholder.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';

export function MapPlaceholder({ eventCount }: { eventCount: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Karttanäkymä tulossa</Text>
      <Text style={styles.body}>
        {eventCount} koetta valittuihin suodattimiin sopivaa kohdetta. Kartta lisätään
        Vaiheessa 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a472a', marginBottom: 8 },
  body: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
```

- [ ] **Step 3: Integroi togglet BrowseScreeniin**

Modify `mobile/src/screens/BrowseScreen.tsx`. Add at the top:

```typescript
import { useState } from 'react';
import { ListMapToggle } from '@/components/ListMapToggle';
import { MapPlaceholder } from '@/components/MapPlaceholder';
```

(Combine `useState` with the existing `useEffect, useMemo` import.)

Lisää `const [view, setView] = useState<'list' | 'map'>('list');` `useEffect`-rivien yläpuolelle.

Korvaa `return (`-osio:

```typescript
  return (
    <View style={styles.wrap}>
      <ListMapToggle value={view} onChange={setView} />
      <FilterChips />
      {view === 'list' ? (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <EventCard event={item} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>Ei kokeita näillä suodattimilla.</Text>
              <Text style={styles.emptyHint}>Kokeile suuremman etäisyyden tai vähemmän rajauksia.</Text>
            </View>
          }
          ListHeaderComponent={<Text style={styles.count}>{visible.length} koetta</Text>}
          onRefresh={() => loadEvents(new Date().getFullYear())}
          refreshing={isLoading}
        />
      ) : (
        <MapPlaceholder eventCount={visible.length} />
      )}
    </View>
  );
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/ListMapToggle.tsx mobile/src/components/MapPlaceholder.tsx mobile/src/screens/BrowseScreen.tsx
git commit -m "Add list/map toggle with placeholder in BrowseScreen"
```

---

## Task 11: EventDetail-näkymä

**Files:**
- Modify: `mobile/src/screens/EventDetailScreen.tsx`

- [ ] **Step 1: Toteuta EventDetailScreen**

Replace contents of `mobile/src/screens/EventDetailScreen.tsx`:

```typescript
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { getCostValue, getOptionalCosts } from '@koetutka/shared';
import { useStore } from '@/lib/store';
import type { RootStackParamList } from '../navigation';

type Route = RouteProp<RootStackParamList, 'EventDetail'>;

export default function EventDetailScreen() {
  const route = useRoute<Route>();
  const { id } = route.params;
  const event = useStore((s) => s.events.find((e) => e.id === id));

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Koetta ei löytynyt.</Text>
      </View>
    );
  }

  const cost = getCostValue(event.cost);
  const costMember = getCostValue(event.cost_member);
  const optionalCosts = getOptionalCosts(event.cost);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{event.type} · {event.levels}</Text>
      <Text style={styles.location}>📍 {event.location}</Text>
      <Text style={styles.date}>📅 {event.date}</Text>
      {typeof event.distance === 'number' && (
        <Text style={styles.distance}>🚗 {event.distance} km</Text>
      )}

      <InfoRow label="Ilmoittautuminen" value={event.entry_date} />
      {event.organizer && <InfoRow label="Järjestäjä" value={event.organizer} />}
      {event.judges.length > 0 && (
        <InfoRow label="Tuomarit" value={event.judges.join(', ')} />
      )}
      {event.secretary.name && (
        <InfoRow label="Sihteeri" value={`${event.secretary.name}${event.secretary.phone ? `\n${event.secretary.phone}` : ''}${event.secretary.email ? `\n${event.secretary.email}` : ''}`} />
      )}
      {event.official.name && (
        <InfoRow label="Yhteyshenkilö" value={`${event.official.name}${event.official.phone ? `\n${event.official.phone}` : ''}${event.official.email ? `\n${event.official.email}` : ''}`} />
      )}
      {cost !== null && <InfoRow label="Maksu" value={`${cost} €`} />}
      {costMember !== null && <InfoRow label="Jäsenmaksu" value={`${costMember} €`} />}
      {optionalCosts.length > 0 && (
        <InfoRow
          label="Lisämaksut"
          value={optionalCosts
            .map((c) => `${c.name || c.description || 'lisämaksu'}: ${c.cost ?? '?'} €`)
            .join('\n')}
        />
      )}
      {event.description && <InfoRow label="Kuvaus" value={event.description} />}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: '#1a472a', marginBottom: 8 },
  location: { fontSize: 16, color: '#333', marginBottom: 4 },
  date: { fontSize: 14, color: '#555', marginBottom: 4 },
  distance: { fontSize: 14, color: '#555', marginBottom: 12 },
  row: { backgroundColor: 'white', padding: 12, marginBottom: 8, borderRadius: 6 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 14, color: '#333' },
});
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/EventDetailScreen.tsx
git commit -m "Implement EventDetailScreen with all info rows"
```

---

## Task 12: ICS-kalenterivienti bare-RN-libroilla

**Files:**
- Create: `mobile/src/lib/ics-export.ts`
- Modify: `mobile/src/screens/EventDetailScreen.tsx`

- [ ] **Step 1: Luo ics-export bare RN -libroilla**

Create `mobile/src/lib/ics-export.ts`:

```typescript
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert } from 'react-native';
import { generateICS, type Event } from '@koetutka/shared';

type EventType = 'event' | 'registration';

/**
 * Tuottaa ICS-tiedoston tilapäishakemistoon ja avaa native share-sheetin.
 */
export async function exportEventICS(
  event: Event,
  type: EventType,
  userLocationName?: string,
): Promise<void> {
  try {
    const ics = generateICS(event, { type, userLocationName, index: 0 });
    const prefix = type === 'registration' ? 'ilmoittautuminen' : 'koe';
    const safeLoc = event.location.replace(/[^\p{L}\d_-]/gu, '_');
    const filename = `koetutka-${prefix}-${safeLoc}-${event.date.replace(/\./g, '-')}.ics`;
    const path = `${RNFS.CachesDirectoryPath}/${filename}`;

    await RNFS.writeFile(path, ics, 'utf8');

    await Share.open({
      url: `file://${path}`,
      filename,
      type: 'text/calendar',
      title: type === 'registration' ? 'Ilmoittautumismuistutus' : 'Lisää kalenteriin',
      saveToFiles: true,
    });
  } catch (e) {
    // Share.open kaataa virheen jos käyttäjä peruu — pidetään hiljainen
    const message = e instanceof Error ? e.message : '';
    if (!message.toLowerCase().includes('cancel') && !message.includes('User did not share')) {
      Alert.alert('Virhe', 'Kalenteritiedoston luonti epäonnistui.');
    }
  }
}
```

- [ ] **Step 2: Lisää painikkeet detail-näkymään**

Modify `mobile/src/screens/EventDetailScreen.tsx`. Lisää imports-ylävasempaan:

```typescript
import { Pressable } from 'react-native';
import { exportEventICS } from '@/lib/ics-export';
```

(Yhdistä `Pressable` olemassa olevaan `import ... from 'react-native'` -riviin tarvittaessa.)

Korvaa `{event.description && ...}` -rivin jälkeinen `</ScrollView>` näin:

```typescript
      {event.description && <InfoRow label="Kuvaus" value={event.description} />}

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() => exportEventICS(event, 'event', useStore.getState().userLocation?.name)}
        >
          <Text style={styles.buttonText}>📅 Lisää kalenteriin</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => exportEventICS(event, 'registration', useStore.getState().userLocation?.name)}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>🔔 Ilmoittautumismuistutus</Text>
        </Pressable>
      </View>
    </ScrollView>
```

Lisää tyylit `styles`-objektiin:

```typescript
  buttonRow: { marginTop: 12, gap: 8 },
  button: { backgroundColor: '#2d5a27', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#2d5a27' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  buttonTextSecondary: { color: '#2d5a27' },
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @koetutka/mobile typecheck`
Expected: ei virheitä.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/lib/ics-export.ts mobile/src/screens/EventDetailScreen.tsx
git commit -m "Add ICS calendar export with react-native-fs + react-native-share"
```

---

## Task 13: Persistointi (initFromStorage app-käynnistyksessä)

**Files:**
- Modify: `mobile/App.tsx`

- [ ] **Step 1: Lisää initFromStorage-kutsu Appiin**

Replace contents of `mobile/App.tsx`:

```typescript
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useStore } from './src/lib/store';
import RootNavigator from './src/navigation';

export default function App() {
  const init = useStore((s) => s.initFromStorage);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#2d5a27" />
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Verify typecheck + tests**

Run: `pnpm --filter @koetutka/mobile typecheck && pnpm --filter @koetutka/mobile test`
Expected: typecheck clean, 11 testiä läpi.

- [ ] **Step 3: Commit**

```bash
git add mobile/App.tsx
git commit -m "Initialize store from AsyncStorage on app startup"
```

---

## Task 14: Polish + README + Run-ohjeet

**Files:**
- Create: `mobile/README.md`

- [ ] **Step 1: Luo mobile/README.md**

Create `mobile/README.md`:

```markdown
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
```

- [ ] **Step 2: Aja kaikki testit + typecheck kerran lopuksi**

Run:
```bash
pnpm --filter @koetutka/mobile typecheck
pnpm --filter @koetutka/mobile test
pnpm test
```

Expected: typecheck clean. Mobile tests 11 läpi. Shared tests 31 läpi.

- [ ] **Step 3: Commit**

```bash
git add mobile/README.md
git commit -m "Add bare RN README with build and run instructions"
```

---

## Mitä Task 14:n jälkeen

Kun tämä plan on suoritettu loppuun:

- `mobile/`-paketti on aito bare React Native CLI -projekti — ei Expon SDK:ta, ei Expo Goa, ei EASia
- Native `ios/` ja `android/` -hakemistot ovat suoraan editoitavissa Xcodessa / Android Studiossa
- Sama tekninen logiikka jaettu `@koetutka/shared`-paketin kautta web-sovelluksen kanssa
- Sama feature-setti kuin Expo-versiossa: 3-tab nav, sijainti, suodattimet, detail-näkymä, ICS-vienti, persistointi
- Käynnistys vaatii Xcoden (iOS) tai Android Studion (Android) paikallisesti

Seuraavat plan-dokumentit:
- **Vaihe 2 plan**: oikea karttanäkymä (`react-native-maps`), suosikit (AsyncStorage:ssa), jako, "Aja"-reittiohjeet
- **Vaihe 3 plan**: background fetch + paikalliset ilmoitukset (uudet kokeet, ilmoittautumismuistutukset). Bare RN:llä tämä käyttää `react-native-background-fetch` + `notifee` / `react-native-push-notification`.
- **Vaihe 4 plan**: App icon + splash + Fastlane-konfiguraatio → App Store + Google Play submission. iOS: Xcode Archive + App Store Connect. Android: `gradlew bundleRelease` + Play Console.

Vaihe 2 voi alkaa heti kun Vaihe 1 toimii kunnolla puhelimellasi.
