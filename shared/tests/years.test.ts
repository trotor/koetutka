import { describe, test, expect } from 'vitest';
import { dataYears, mergeYearData } from '../src/years.js';
import type { Event } from '../src/types.js';

function makeEvent(id: string | undefined, dateSort: string): Event {
  return {
    id,
    type: 'NOME-B',
    levels: 'ALO',
    date: '',
    date_sort: dateSort,
    end_date_sort: null,
    entry_date: '',
    location: 'Kuopio',
    coordinates: [62.89, 27.68],
    name: '',
    organizer: 'Test ry',
    official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' },
    judges: [],
    description: '',
    cost: 0,
    cost_member: '',
  } as Event;
}

describe('dataYears', () => {
  test('palauttaa kuluvan ja seuraavan vuoden', () => {
    expect(dataYears(new Date(2026, 9, 1))).toEqual([2026, 2027]);
  });

  test('toimii vuodenvaihteen yli', () => {
    expect(dataYears(new Date(2026, 11, 31))).toEqual([2026, 2027]);
    expect(dataYears(new Date(2027, 0, 1))).toEqual([2027, 2028]);
  });
});

describe('mergeYearData', () => {
  test('yhdistää vuodet ja järjestää päivämäärän mukaan', () => {
    const y2026 = [makeEvent('b', '2026-11-01T00:00:00+02:00'), makeEvent('a', '2026-10-03T00:00:00+03:00')];
    const y2027 = [makeEvent('c', '2027-06-05T00:00:00+03:00')];
    expect(mergeYearData([y2027, y2026]).map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  test('poistaa saman id:n duplikaatit, myöhempi lista voittaa', () => {
    const old = makeEvent('x', '2026-12-31T00:00:00+02:00');
    const fresh = { ...makeEvent('x', '2026-12-31T00:00:00+02:00'), location: 'Leppävirta' };
    const merged = mergeYearData([[old], [fresh]]);
    expect(merged).toHaveLength(1);
    expect(merged[0].location).toBe('Leppävirta');
  });

  test('säilyttää kokeet joilla ei ole id:tä', () => {
    const merged = mergeYearData([
      [makeEvent(undefined, '2026-05-01T00:00:00+03:00')],
      [makeEvent(undefined, '2026-05-01T00:00:00+03:00')],
    ]);
    expect(merged).toHaveLength(2);
  });

  test('tyhjät listat', () => {
    expect(mergeYearData([])).toEqual([]);
    expect(mergeYearData([[], []])).toEqual([]);
  });
});
