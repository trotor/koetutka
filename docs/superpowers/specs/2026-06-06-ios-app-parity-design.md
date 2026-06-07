# iOS-sovellus: pariteetti & App Store -julkaisu

**Päivä:** 2026-06-06
**Tila:** Hyväksytty, toteutuksessa

## Tausta

Koetutka on React Native -sovellus (RN 0.77), jonka Android-versio on julkaistu
Play Storessa (v1.0.2, applicationId `com.koetutka`, julkaisija Inetor Oy).
JS/TS-koodi `mobile/src/`-kansiossa on jaettu ja alustariippumaton — vain kaksi
`Platform.OS`-haaraa, ja iOS:n sijaintilupatapaus on jo käsitelty. `mobile/ios/`
on RN:n oletustelineistö (Info.plist sijaintiluvalla, tyhjä AppIcon-asset,
oletus-bundle-ID).

## Tavoite

Tuoda iOS-versio täyteen ominaisuuspariteettiin Androidin kanssa ja viedä se
**App Store -julkaisuun asti** Inetor Oy:n Apple Developer -tilillä. Työ tehdään
GitHub-issueina (`trotor/koetutka`), yksi issue kerrallaan, jokaisella selkeä
"valmis kun" -kriteeri.

## Reunaehdot ja ympäristö

- Xcode 26.5, CocoaPods 1.16.2, iOS-simulaattorit (iPhone 17 -sarja) saatavilla.
- Järjestelmän Ruby 2.6.10 — voi vaatia huomiota `pod install`-ajossa.
- Apple Developer Program -jäsenyys aktiivinen organisaationa (Inetor Oy).
- iOS bundle ID = `com.koetutka` (sama kuin Androidin applicationId).
- Versio iOS:llä aloitetaan 1.0.0 (build 1) — oma App Store -versiointi.
- "Tismalleen sama": ominaisuudet identtiset, ei iOS-erityistä UI-uudelleensuunnittelua.

## Tekniset riskikohdat

- **notifee** (paikallisilmoitukset) vaatii AppDelegate-asennuksen iOS:llä.
- **react-native-add-calendar-event** vaatii kalenterilupatekstit Info.plistiin;
  iOS 17 erottelee write-only- ja full-access -luvat.
- Ruby 2.6 ja `pod install` — varauduttava versio-ongelmiin.
- WebView-kartta (Leaflet/OSM) — ei iOS-erityistarpeita odotettavissa.

## Issue-jaottelu (Milestone: iOS-pariteetti & App Store -julkaisu)

1. **iOS-natiivikonfiguraatio & allekirjoitus** — Bundle ID `com.koetutka`,
   MARKETING_VERSION/CURRENT_PROJECT_VERSION, Inetor Oy:n team, deployment target.
   Valmis kun: projekti allekirjoittuu oikealla tiimillä.
2. **Luvat & Info.plist + AppDelegate** — `NSCalendarsUsageDescription`
   (+ iOS 17 write-only), notifee-asennus AppDelegateen, sijaintiluvan varmistus.
   Valmis kun: kaikki natiivimoduulit löytävät tarvittavat luvat.
3. **CocoaPods + ensimmäinen vihreä simulaattori-build** — `pod install`,
   mahdollisten pod-/Ruby-ongelmien korjaus, sovellus käynnistyy.
   Valmis kun: app avautuu ja lataa koetiedot simulaattorissa.
4. **iOS-sovelluskuvake & latausnäyttö** — generoi AppIcon-setti
   `store/icon-source.png`:stä, viimeistele LaunchScreen.
   Valmis kun: kuvake ja splash näkyvät oikein.
5. **Ominaisuuspariteetin varmistus (simulaattori)** — tarkistuslista:
   sijainti/GPS, Nominatim-haku + autocomplete, etäisyyslajittelu, kartta,
   suosikit, ilmoitukset, kalenterilisäys, ICS-jako, suodattimet/haku.
   Valmis kun: jokainen ominaisuus toimii kuten Androidilla.
6. **Testaus fyysisellä laitteella** — oikeat ilmoitukset, kalenterilisäys, GPS.
   Valmis kun: toiminnot vahvistettu oikealla iPhonella.
7. **App Store Connect + iOS-kuvakaappaukset + metatiedot** — app-tietue,
   6.7"/6.9" kuvakaappaukset, kuvaus, avainsanat, privacy.html-URL,
   privacy-nutrition-labelit.
   Valmis kun: listaus valmis tarkistettavaksi.
8. **TestFlight-build** — archive ja lataus App Store Connectiin, sisäinen testaus.
   Valmis kun: build saatavilla TestFlightissa.
9. **App Store -julkaisu tarkistukseen** — lähetä review-jonoon.
   Valmis kun: submitted for review.
10. **Dokumentaatio & versiointi** — README:n versiohistoria, CLAUDE.md:hen
    iOS-build/deploy-osio.
    Valmis kun: dokumentaatio päivitetty.

## Riippuvuudet

Issuet etenevät pääosin numerojärjestyksessä. 1–3 ovat pohja kaikelle.
4 voidaan tehdä rinnakkain 2–3 kanssa. 5 vaatii 3:n. 6 vaatii 5:n. 7 voidaan
aloittaa rinnan, mutta kuvakaappaukset vaativat 5:n (toimiva app). 8 vaatii 1–6.
9 vaatii 7–8. 10 viimeisenä.
