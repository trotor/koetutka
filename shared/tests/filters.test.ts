import { describe, test, expect } from 'vitest';
import { addDistances, filterEvents } from '../src/filters.js';
import type { Event, UserLocation } from '../src/types.js';

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

describe('addDistances', () => {
  const user: UserLocation = { lat: 60.1699, lng: 24.9384, name: 'Helsinki' };

  test('lisää distance-kentän kun koordinaatit löytyy', () => {
    const event = makeEvent({ coordinates: [60.9827, 25.6612] });
    const [result] = addDistances([event], user);
    expect(result.distance).toBeGreaterThan(80);
    expect(result.distance).toBeLessThan(110);
  });

  test('distance on null jos koordinaatit puuttuvat', () => {
    const event = makeEvent({ coordinates: null });
    const [result] = addDistances([event], user);
    expect(result.distance).toBeNull();
  });

  test('ei mutatoi alkuperäistä eventtiä', () => {
    const event = makeEvent();
    const original = { ...event };
    addDistances([event], user);
    expect(event).toEqual(original);
  });
});

describe('filterEvents', () => {
  const e1 = makeEvent({ id: 'a', type: 'NOME-B', location: 'Lahti', distance: 50, date_sort: '2030-01-01T00:00:00+02:00' });
  const e2 = makeEvent({ id: 'b', type: 'NOU', location: 'Oulu', distance: 500, date_sort: '2030-02-01T00:00:00+02:00' });
  const e3 = makeEvent({ id: 'c', type: 'NOME-B', location: 'Turku', distance: 250, date_sort: '2020-01-01T00:00:00+02:00' });

  test('palauttaa kaikki ilman suodattimia', () => {
    expect(filterEvents([e1, e2, e3], {})).toHaveLength(3);
  });

  test('hidePast piilottaa menneet kokeet', () => {
    const result = filterEvents([e1, e2, e3], {
      hidePast: true,
      today: new Date('2026-01-01'),
    });
    const ids = result.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['a', 'b']));
    expect(ids).not.toContain('c');
  });

  test('maxDistanceKm rajaa', () => {
    const result = filterEvents([e1, e2, e3], { maxDistanceKm: 300 });
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(['a', 'c']));
    expect(result.map((e) => e.id)).not.toContain('b');
  });

  test('activeTypes rajaa tyypin mukaan', () => {
    const result = filterEvents([e1, e2, e3], {
      activeTypes: new Set(['NOME-B']),
    });
    expect(result.map((e) => e.id).sort()).toEqual(['a', 'c']);
  });

  test('searchTerm matchaa locationiin (case-insensitive)', () => {
    const result = filterEvents([e1, e2, e3], { searchTerm: 'OULU' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  test('useat suodattimet yhdistetään AND-logiikalla', () => {
    const result = filterEvents([e1, e2, e3], {
      activeTypes: new Set(['NOME-B']),
      maxDistanceKm: 100,
    });
    expect(result.map((e) => e.id)).toEqual(['a']);
  });
});
