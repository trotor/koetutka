# Suosikkien kalenterinäkymä, täyte-ehdotukset ja päivämäärän korostus

**Date:** 2026-06-22
**Status:** Approved design → implementation
**Scope:** Mobile (React Native) + shared package; light web polish.

## Background

Koetutka shows Finnish retriever trials. The mobile app already has a **Suosikit**
(favorites) tab. Two usability gaps motivated this work:

1. On the mobile event card, the **trial date** and the **registration period**
   (`ilm.`) share one identical muted-gray line, so the date a user actually cares
   about does not stand out.
2. There is no way to plan a season: a user wants to see their favorites laid out on
   a calendar and discover *other* trials that do **not** clash with them — "filler"
   for free weekends.

Favorites is a **mobile-only** feature (the web `app.js` has no favorites concept), so
the calendar view lives in the mobile app. Date emphasis applies to both platforms.

## Goals

- Make the trial date visually dominant over the registration period on event cards.
- Add an agenda-style calendar view of favorites on the Suosikit tab.
- Surface non-conflicting trials ("filler candidates") in that calendar, drawn from the
  events matching the user's current Browse filters.
- Mark every event in the Browse list as either fitting around the favorites ("Sopii")
  or clashing with one ("Päällekkäin").

## Non-goals

- No favorites/calendar/markings on the web (web gets only the date-emphasis polish).
- No month-grid calendar (agenda/timeline layout chosen).
- No new persistence — reuses existing `favorites` and `filters` store state.

## Data model

Each `Event` carries `date` (`DD.MM.YYYY`, may be a range like `16.-17.05.2026`),
`date_sort` (ISO start) and `end_date_sort` (ISO end, or null). 25 of 201 events in 2026
span multiple days. Overlap logic therefore treats every trial as an **inclusive date
range** `[start, end]` where `start = date_sort[:10]`, `end = (end_date_sort || date_sort)[:10]`.

## Shared package — `shared/src/overlap.ts` (new, unit-tested)

Pure functions, exported via `shared/src/index.ts`:

- `eventRange(event): { start: string; end: string }` — inclusive `YYYY-MM-DD` range.
- `rangesOverlap(a, b): boolean` — `a.start <= b.end && b.start <= a.end`.
- `fitAgainstFavorites(event, favoriteEvents): 'free' | 'conflict'` — `'conflict'` if the
  event overlaps any favorite (compared by range), else `'free'`. Skips a favorite that
  shares the event's `id` (an event never conflicts with itself).
- `FINNISH_MONTHS: string[]` — month names for labels.
- `buildAgenda({ favorites, candidates, today }): AgendaMonth[]` where
  `AgendaMonth = { key: string; label: string; items: AgendaItem[] }` and
  `AgendaItem = { kind: 'favorite' | 'candidate'; event: Event }`.
  - Hides past (range end `< today`).
  - Groups by calendar month of the start date; months chronological; items within a
    month sorted by `date_sort`, favorites before candidates on the same date.
  - `label` like `"Helmikuu 2026"`; `key` like `"2026-02"`.
  - `today` is injectable for deterministic tests (defaults to `new Date()`).

## Mobile UI

### `EventCard.tsx`
- Split the meta line into two `Text` runs: **trial date** (`event.date`) bold, darker
  (`#333`, weight `700`); registration lighter (`· ilm. {entry_date}`, `#999`, weight
  normal). Past-styling still dims both.
- New optional prop `fit?: 'free' | 'conflict'`. When set, render a small badge in the
  meta row: `'free'` → green **"Sopii"**; `'conflict'` → muted amber **"Päällekkäin"**.
  When `undefined`, no badge (default). The favorite star and "Mennyt" badge are unchanged.

### `BrowseScreen.tsx`
- Memoize `favoriteEvents = events.filter(e => favorites.has(e.id))`.
- Only when `favorites.size > 0`, compute `fit` per visible non-favorite event via
  `fitAgainstFavorites` and pass it to `EventCard`. Favorites themselves get no badge.

### `FavoritesScreen.tsx`
- Add a **Lista | Kalenteri** segmented toggle (same visual pattern as `ListMapToggle`;
  a small dedicated toggle or a generalized one). Default `Lista` (current behavior).
- `Lista` = today's sorted favorites list (unchanged).
- `Kalenteri` renders the new `FavoritesAgenda`.

### `FavoritesAgenda.tsx` (new)
- Reads `events`, `favorites`, `filters`, `userLocation` from the store.
- `favoriteEvents` = events that are favorites (future ones surface in the agenda).
- `candidates` = `filterEvents(addDistances(events, userLocation?), filters)` minus
  favorites minus any event whose `fitAgainstFavorites === 'conflict'`. These are the
  non-clashing filler trials, honoring the user's current Browse filters (Q3 decision).
- Calls `buildAgenda` and renders a `SectionList`: month header + `EventCard`s.
  Favorites show the filled star; candidates render with `fit="free"` and a lighter
  left-border accent so they read as suggestions.
- A hint line: *"Ehdotukset perustuvat Selaa-välilehden suodattimiin."*
- Empty state when there are no favorites: reuse/adapt the existing empty copy.

## Web — date-emphasis polish (`styles.css`, minimal `app.js`)

The web table/card date is already `font-weight: 600`. Light polish only:
- Bump table `.date` to weight `700`.
- Mute the registration column text and the card `✏️ Ilmo:` link so the trial date
  clearly dominates. No structural/markup changes, no favorites/calendar.

## Edge cases

- Two single-day trials on the same date → `conflict` (you cannot attend both — the
  intended signal).
- Multi-day ranges handled inclusively on both ends.
- No favorites → no Browse badges; agenda shows only candidates with the filter hint.
- No active filters → candidate pool is every non-conflicting future trial; acceptable
  per the user's choice, mitigated by the filter hint (user can narrow in Browse).
- No `userLocation` → distance-based filters are skipped exactly as in Browse today.

## Testing

- `shared/tests/overlap.test.ts` (vitest): `eventRange`, `rangesOverlap` (incl. touching
  and multi-day), `fitAgainstFavorites` (self-skip, same-day conflict, no-favorites),
  `buildAgenda` (month grouping/order, past hidden, favorite-before-candidate ordering)
  with an injected `today`.
- `cd shared && npm test`, `cd mobile && npm test && npm run typecheck` must pass.

## Versioning (per CLAUDE.md)

Minor bump (new feature):
- `mobile/package.json` `version` (drives the Tietoja footer).
- iOS `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION` (build number).
- Android `versionName` + `versionCode`.
- Web: footer `#version` in `index.html` + a `README.md` Version History entry.
- Add a `whatsnew.json` entry describing the calendar/markings.

## Files touched

**New:** `shared/src/overlap.ts`, `shared/tests/overlap.test.ts`,
`mobile/src/components/FavoritesAgenda.tsx` (+ a calendar/list toggle component).

**Modified:** `shared/src/index.ts`, `mobile/src/components/EventCard.tsx`,
`mobile/src/screens/BrowseScreen.tsx`, `mobile/src/screens/FavoritesScreen.tsx`,
`styles.css`, `app.js`, `index.html`, `README.md`, `whatsnew.json`,
`mobile/package.json`, iOS Xcode project, `mobile/android/app/build.gradle`.

## Out-of-scope follow-ups (filed as idea issues)

- Access to participant lists (ilmoittautuneet/osallistujat) for upcoming and past trials.
- A separate "Osallistun" (attending) state distinct from favorite (e.g. a different-
  colored star) — relates directly to this calendar's conflict planning.
