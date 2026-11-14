import { describe, test, expect } from 'vitest';
import {
  buildMonthGrid,
  shiftMonthKey,
  monthKeyOf,
  localISODate,
  initialMonthKey,
  FINNISH_WEEKDAYS_SHORT,
} from '../src/month-grid.js';
import type { Event } from '../src/types.js';

function ev(id: string, start: string, end: string | null = null): Event {
  return {
    id,
    type: 'NOME-B',
    levels: 'ALO',
    date: '',
    date_sort: `${start}T00:00:00+03:00`,
    end_date_sort: end ? `${end}T00:00:00+03:00` : null,
    entry_date: '',
    location: 'Lahti',
    coordinates: null,
    name: '',
    organizer: '',
    official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' },
    judges: [],
    description: '',
    cost: 0,
    cost_member: 0,
    classes: [],
  } as unknown as Event;
}

describe('localISODate / monthKeyOf', () => {
  test('uses local date parts, not UTC', () => {
    // Paikallinen keskiyö — toISOString() antaisi Suomessa edellisen päivän.
    const d = new Date(2026, 10, 1, 0, 30);
    expect(localISODate(d)).toBe('2026-11-01');
    expect(monthKeyOf(d)).toBe('2026-11');
  });
});

describe('shiftMonthKey', () => {
  test('moves across year boundaries', () => {
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(shiftMonthKey('2027-01', -1)).toBe('2026-12');
    expect(shiftMonthKey('2026-05', 0)).toBe('2026-05');
    expect(shiftMonthKey('2026-05', 14)).toBe('2027-07');
  });
});

describe('buildMonthGrid', () => {
  test('weeks start on Monday and cover the whole month', () => {
    // Marraskuun 1. päivä 2026 on sunnuntai.
    const grid = buildMonthGrid('2026-11', [], new Date(2026, 10, 14));
    expect(grid.label).toBe('Marraskuu 2026');
    expect(grid.weeks[0]).toHaveLength(7);
    expect(grid.weeks[0][0].iso).toBe('2026-10-26');
    expect(grid.weeks[0][0].inMonth).toBe(false);
    expect(grid.weeks[0][6].iso).toBe('2026-11-01');
    expect(grid.weeks[0][6].inMonth).toBe(true);
    const last = grid.weeks[grid.weeks.length - 1];
    expect(last[6].iso).toBe('2026-12-06');
    expect(grid.weeks).toHaveLength(6);
    expect(FINNISH_WEEKDAYS_SHORT[0]).toBe('ma');
  });

  test('February starting on Monday fits in four rows', () => {
    // Helmikuun 1. päivä 2027 on maanantai, ei karkausvuosi.
    const grid = buildMonthGrid('2027-02', [], new Date(2027, 1, 10));
    expect(grid.weeks).toHaveLength(4);
    expect(grid.weeks[0][0].iso).toBe('2027-02-01');
    expect(grid.weeks[3][6].iso).toBe('2027-02-28');
  });

  test('marks today', () => {
    const grid = buildMonthGrid('2026-11', [], new Date(2026, 10, 14, 23, 50));
    const today = grid.weeks.flat().filter((d) => d.isToday);
    expect(today.map((d) => d.iso)).toEqual(['2026-11-14']);
  });

  test('places single and multi-day events on every day they cover', () => {
    const a = ev('a', '2026-11-07');
    const b = ev('b', '2026-11-07', '2026-11-08');
    const grid = buildMonthGrid('2026-11', [b, a], new Date(2026, 10, 1));
    const day = (iso: string) => grid.weeks.flat().find((d) => d.iso === iso)!;
    expect(day('2026-11-07').events.map((e) => e.id)).toEqual(['a', 'b']);
    expect(day('2026-11-08').events.map((e) => e.id)).toEqual(['b']);
    expect(day('2026-11-09').events).toEqual([]);
  });

  test('includes events on the leading/trailing days of neighbouring months', () => {
    const grid = buildMonthGrid('2026-11', [ev('x', '2026-10-31'), ev('y', '2026-12-05')], new Date(2026, 10, 1));
    const days = grid.weeks.flat();
    expect(days.find((d) => d.iso === '2026-10-31')!.events.map((e) => e.id)).toEqual(['x']);
    expect(days.find((d) => d.iso === '2026-12-05')!.events.map((e) => e.id)).toEqual(['y']);
  });

  test('monthEvents lists events touching the month, in date order, once each', () => {
    const grid = buildMonthGrid(
      '2026-11',
      [ev('late', '2026-11-28'), ev('span', '2026-10-31', '2026-11-01'), ev('out', '2026-12-05')],
      new Date(2026, 10, 1),
    );
    expect(grid.monthEvents.map((e) => e.id)).toEqual(['span', 'late']);
  });
});

describe('initialMonthKey', () => {
  const today = new Date(2026, 10, 14);
  test('current month when it has an upcoming event', () => {
    expect(initialMonthKey([ev('a', '2026-11-20'), ev('b', '2027-01-03')], today)).toBe('2026-11');
  });
  test('month of the next upcoming event otherwise', () => {
    expect(initialMonthKey([ev('old', '2026-06-01'), ev('b', '2027-01-03')], today)).toBe('2027-01');
  });
  test('an event still running today counts as upcoming', () => {
    expect(initialMonthKey([ev('a', '2026-10-31', '2026-11-14')], today)).toBe('2026-11');
  });
  test('current month when nothing is upcoming', () => {
    expect(initialMonthKey([ev('old', '2026-06-01')], today)).toBe('2026-11');
    expect(initialMonthKey([], today)).toBe('2026-11');
  });
});
