import { describe, test, expect } from 'vitest';
import {
  eventRange,
  rangesOverlap,
  fitAgainstFavorites,
  buildAgenda,
  FINNISH_MONTHS,
} from '../src/overlap.js';
import type { Event } from '../src/types.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'X',
    type: 'NOME-B',
    levels: 'ALO',
    date: '24.05.2026',
    date_sort: '2026-05-24T00:00:00+03:00',
    end_date_sort: null,
    entry_date: '01.04.-14.04.',
    location: 'Lahti',
    coordinates: [60.9827, 25.6612],
    name: '',
    organizer: 'Test ry',
    official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' },
    judges: [],
    description: '',
    cost: 45,
    cost_member: 35,
    classes: [],
    ...overrides,
  };
}

describe('eventRange', () => {
  test('yksipäiväinen: end_date_sort null → start === end', () => {
    const e = makeEvent({ date_sort: '2026-05-24T00:00:00+03:00', end_date_sort: null });
    expect(eventRange(e)).toEqual({ start: '2026-05-24', end: '2026-05-24' });
  });

  test('monipäiväinen: käyttää end_date_sortin loppupäivää', () => {
    const e = makeEvent({
      date_sort: '2026-05-16T00:00:00+03:00',
      end_date_sort: '2026-05-17T00:00:00+03:00',
    });
    expect(eventRange(e)).toEqual({ start: '2026-05-16', end: '2026-05-17' });
  });
});

describe('rangesOverlap', () => {
  test('koskettavat päivät (loppu === alku) menevät päällekkäin', () => {
    expect(
      rangesOverlap({ start: '2026-05-16', end: '2026-05-17' }, { start: '2026-05-17', end: '2026-05-18' }),
    ).toBe(true);
  });

  test('erilliset päivät eivät mene päällekkäin', () => {
    expect(
      rangesOverlap({ start: '2026-05-16', end: '2026-05-16' }, { start: '2026-05-18', end: '2026-05-18' }),
    ).toBe(false);
  });

  test('sama päivä menee päällekkäin', () => {
    expect(
      rangesOverlap({ start: '2026-02-14', end: '2026-02-14' }, { start: '2026-02-14', end: '2026-02-14' }),
    ).toBe(true);
  });
});

describe('fitAgainstFavorites', () => {
  test('sama päivä suosikin kanssa → conflict', () => {
    const event = makeEvent({ id: 'e', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const fav = makeEvent({ id: 'f', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    expect(fitAgainstFavorites(event, [fav])).toBe('conflict');
  });

  test('eri päivä kuin suosikit → free', () => {
    const event = makeEvent({ id: 'e', date_sort: '2026-02-21T00:00:00+02:00', end_date_sort: null });
    const fav = makeEvent({ id: 'f', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    expect(fitAgainstFavorites(event, [fav])).toBe('free');
  });

  test('ei suosikkeja → free', () => {
    expect(fitAgainstFavorites(makeEvent(), [])).toBe('free');
  });

  test('ei vertaa itseensä (sama id) → free', () => {
    const event = makeEvent({ id: 'same', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const self = makeEvent({ id: 'same', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    expect(fitAgainstFavorites(event, [self])).toBe('free');
  });
});

describe('FINNISH_MONTHS', () => {
  test('helmikuu on indeksissä 1', () => {
    expect(FINNISH_MONTHS[1]).toBe('Helmikuu');
    expect(FINNISH_MONTHS).toHaveLength(12);
  });
});

describe('buildAgenda', () => {
  const today = new Date('2026-01-01T00:00:00Z');

  test('ryhmittelee kuukausittain aikajärjestyksessä ja merkitsee tyypit', () => {
    const fav = makeEvent({ id: 'f', date: '14.02.2026', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const cand1 = makeEvent({ id: 'c1', date: '21.02.2026', date_sort: '2026-02-21T00:00:00+02:00', end_date_sort: null });
    const cand2 = makeEvent({ id: 'c2', date: '07.03.2026', date_sort: '2026-03-07T00:00:00+02:00', end_date_sort: null });

    const agenda = buildAgenda({ favorites: [fav], candidates: [cand1, cand2], today });

    expect(agenda.map((m) => m.key)).toEqual(['2026-02', '2026-03']);
    expect(agenda[0].label).toBe('Helmikuu 2026');
    expect(agenda[0].items.map((i) => [i.kind, i.event.id])).toEqual([
      ['favorite', 'f'],
      ['candidate', 'c1'],
    ]);
    expect(agenda[1].items.map((i) => i.event.id)).toEqual(['c2']);
  });

  test('piilottaa menneet (range end < today)', () => {
    const past = makeEvent({ id: 'p', date_sort: '2025-12-20T00:00:00+02:00', end_date_sort: null });
    const future = makeEvent({ id: 'fu', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const agenda = buildAgenda({ favorites: [past, future], candidates: [], today });
    const ids = agenda.flatMap((m) => m.items.map((i) => i.event.id));
    expect(ids).toEqual(['fu']);
  });

  test('samana päivänä suosikki ennen ehdokasta', () => {
    const fav = makeEvent({ id: 'f', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const cand = makeEvent({ id: 'c', date_sort: '2026-02-14T00:00:00+02:00', end_date_sort: null });
    const agenda = buildAgenda({ favorites: [fav], candidates: [cand], today });
    expect(agenda[0].items.map((i) => i.kind)).toEqual(['favorite', 'candidate']);
  });

  test('tyhjä syöte palauttaa tyhjän', () => {
    expect(buildAgenda({ favorites: [], candidates: [], today })).toEqual([]);
  });
});
