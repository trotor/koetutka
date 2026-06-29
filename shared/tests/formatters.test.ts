import { describe, test, expect } from 'vitest';
import {
  getCostValue,
  getOptionalCosts,
  listClassPlaces,
} from '../src/formatters.js';
import type { Class } from '../src/types.js';

const cls = (over: Partial<Class>): Class => ({ class: 'ALO', date: '', ...over });

describe('getCostValue', () => {
  test('null tai undefined tai tyhjä palauttaa null', () => {
    expect(getCostValue(null)).toBe(null);
    expect(getCostValue(undefined)).toBe(null);
    expect(getCostValue('')).toBe(null);
  });

  test('numero palautetaan sellaisenaan', () => {
    expect(getCostValue(45)).toBe(45);
    expect(getCostValue(0)).toBe(0);
  });

  test('objekti jolla on normal palauttaa normalin', () => {
    expect(getCostValue({ normal: 35 })).toBe(35);
  });

  test('objekti ilman normalia palauttaa null', () => {
    expect(getCostValue({ optionalAdditionalCosts: [] })).toBe(null);
  });
});

describe('getOptionalCosts', () => {
  test('objektista palautetaan optionalAdditionalCosts', () => {
    const costs = [{ name: 'Ruokailu', cost: 10 }];
    expect(getOptionalCosts({ normal: 35, optionalAdditionalCosts: costs })).toEqual(costs);
  });

  test('numero palautetaan tyhjänä', () => {
    expect(getOptionalCosts(45)).toEqual([]);
  });

  test('null palautetaan tyhjänä', () => {
    expect(getOptionalCosts(null)).toEqual([]);
  });
});

describe('listClassPlaces', () => {
  // Suomen kesäaika: 2026-06-05T21:00Z = la 6.6. paikallista, 2026-06-06T21:00Z = su 7.6.
  const SAT = '2026-06-05T21:00:00.000Z';
  const SUN = '2026-06-06T21:00:00.000Z';
  // Odotettu päiväleima lasketaan samasta päivämäärästä, jotta testi ei riipu
  // ajoympäristön aikavyöhykkeestä (esim. CI eri TZ:ssä).
  const WD = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];
  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    return `${WD[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
  };
  // Apuri: kääri luokat (ja valinnainen kokonaismäärä) tapahtumaksi.
  const ev = (classes: Class[], places?: number) => ({ classes, places });

  test('tyhjä tai puuttuva tapahtuma palauttaa tyhjän', () => {
    expect(listClassPlaces(ev([]))).toEqual([]);
    expect(listClassPlaces(undefined)).toEqual([]);
  });

  test('yksipäiväinen koe: paikat luokittain ilman päiväleimaa', () => {
    const e = ev([
      cls({ class: 'ALO', places: 60, date: SAT }),
      cls({ class: 'AVO', places: 25, date: SAT }),
      cls({ class: 'VOI', places: 15, date: SAT }),
    ]);
    expect(listClassPlaces(e)).toEqual([
      { class: 'ALO', places: 60, day: null },
      { class: 'AVO', places: 25, day: null },
      { class: 'VOI', places: 15, day: null },
    ]);
  });

  test('monipäiväinen koe: sama luokka eri päivinä omina riveinään (ei summaa)', () => {
    const e = ev([
      cls({ class: 'ALO', places: 16, date: SAT }),
      cls({ class: 'ALO', places: 15, date: SUN }),
    ]);
    expect(listClassPlaces(e)).toEqual([
      { class: 'ALO', places: 16, day: dayLabel(SAT) },
      { class: 'ALO', places: 15, day: dayLabel(SUN) },
    ]);
  });

  test('monipäiväinen koe: rivit järjestetään päivän mukaan', () => {
    const e = ev([
      cls({ class: 'ALO', places: 15, date: SUN }),
      cls({ class: 'ALO', places: 16, date: SAT }),
    ]);
    expect(listClassPlaces(e)).toEqual([
      { class: 'ALO', places: 16, day: dayLabel(SAT) },
      { class: 'ALO', places: 15, day: dayLabel(SUN) },
    ]);
  });

  test('jättää pois luokat joilla ei ole per-luokka-paikkoja (0, puuttuva)', () => {
    const e = ev([
      cls({ class: 'ALO', places: 38, date: SAT }),
      cls({ class: 'AVO', places: 0, date: SAT }),
      cls({ class: 'VOI', date: SAT }),
    ]);
    expect(listClassPlaces(e)).toEqual([{ class: 'ALO', places: 38, day: null }]);
  });

  test('sivuuttaa luokat joilla ei ole nimeä', () => {
    const e = ev([
      cls({ class: '', places: 10, date: SAT }),
      cls({ class: 'ALO', places: 20, date: SAT }),
    ]);
    expect(listClassPlaces(e)).toEqual([{ class: 'ALO', places: 20, day: null }]);
  });

  test('fallback: yksi luokka ilman per-luokka-paikkoja → kokonaismäärä luokalle', () => {
    const e = ev([cls({ class: 'AVO', date: SAT })], 16);
    expect(listClassPlaces(e)).toEqual([{ class: 'AVO', places: 16, day: null }]);
  });

  test('fallback: monta luokkaa ilman per-luokka-paikkoja → Yhteensä-rivi', () => {
    const e = ev(
      [
        cls({ class: 'ALO', date: SAT }),
        cls({ class: 'AVO', date: SAT }),
        cls({ class: 'VOI', date: SAT }),
      ],
      80,
    );
    expect(listClassPlaces(e)).toEqual([{ class: '', places: 80, day: null }]);
  });

  test('fallback: ei luokkia mutta kokonaismäärä → Yhteensä-rivi', () => {
    expect(listClassPlaces(ev([], 16))).toEqual([{ class: '', places: 16, day: null }]);
  });

  test('per-luokka-paikat menevät kokonaismäärän edelle', () => {
    const e = ev([cls({ class: 'ALO', places: 60, date: SAT })], 999);
    expect(listClassPlaces(e)).toEqual([{ class: 'ALO', places: 60, day: null }]);
  });

  test('ei paikkamäärää lainkaan → tyhjä', () => {
    expect(listClassPlaces(ev([cls({ class: 'AVO', date: SAT })]))).toEqual([]);
  });
});
