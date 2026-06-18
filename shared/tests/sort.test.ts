import { describe, test, expect } from 'vitest';
import { sortEvents } from '../src/sort.js';
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

describe('sortEvents', () => {
  test('distance: lähin ensin, etäisyydettömät loppuun', () => {
    const a = makeEvent({ id: 'a', distance: 100 });
    const b = makeEvent({ id: 'b', distance: 10 });
    const c = makeEvent({ id: 'c', distance: null });
    const result = sortEvents([a, b, c], 'distance');
    expect(result.map((e) => e.id)).toEqual(['b', 'a', 'c']);
  });

  test('distance: etäisyydettömät keskenään päivämäärän mukaan', () => {
    const a = makeEvent({ id: 'a', distance: null, date_sort: '2026-06-01T00:00:00+03:00' });
    const b = makeEvent({ id: 'b', distance: null, date_sort: '2026-03-01T00:00:00+02:00' });
    const result = sortEvents([a, b], 'distance');
    expect(result.map((e) => e.id)).toEqual(['b', 'a']);
  });

  test('date: vanhin (aikajärjestys) ensin', () => {
    const a = makeEvent({ id: 'a', date_sort: '2026-06-01T00:00:00+03:00' });
    const b = makeEvent({ id: 'b', date_sort: '2026-03-01T00:00:00+02:00' });
    const result = sortEvents([a, b], 'date');
    expect(result.map((e) => e.id)).toEqual(['b', 'a']);
  });

  test('ei mutatoi alkuperäistä taulukkoa', () => {
    const a = makeEvent({ id: 'a', distance: 100 });
    const b = makeEvent({ id: 'b', distance: 10 });
    const input = [a, b];
    sortEvents(input, 'distance');
    expect(input.map((e) => e.id)).toEqual(['a', 'b']);
  });

  test('tyhjä lista palauttaa tyhjän', () => {
    expect(sortEvents([], 'distance')).toEqual([]);
  });
});
