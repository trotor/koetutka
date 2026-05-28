import { describe, test, expect } from 'vitest';
import { generateICS } from '../src/ics.js';
import type { Event } from '../src/types.js';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    type: 'NOME-B',
    levels: 'ALO, AVO',
    date: '24.05.2026',
    date_sort: '2026-05-24T00:00:00+03:00',
    end_date_sort: null,
    entry_date: '01.04.-14.04.',
    location: 'Lahti',
    coordinates: [60.9827, 25.6612],
    name: '',
    organizer: 'Lahden noutajayhdistys',
    official: { name: '', phone: '', email: '' },
    secretary: { name: 'M. Virtanen', phone: '040-1234567', email: 'm@v.fi' },
    judges: ['P. Korhonen', 'J. Mäkinen'],
    description: '',
    cost: 45,
    cost_member: 35,
    classes: [],
    ...overrides,
  };
}

describe('generateICS', () => {
  test('palauttaa kelvollisen VCALENDAR-rakenteen', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Koetutka//FI');
    expect(ics).toContain('STATUS:CONFIRMED');
  });

  test('event-tyyppi luo SUMMARYn locationista, typesta ja levelseista', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('SUMMARY:Lahti - NOME-B - ALO, AVO');
  });

  test('registration-tyyppi luo "Ilmoittautuminen"-otsikon', () => {
    const ics = generateICS(makeEvent(), { type: 'registration' });
    expect(ics).toContain('SUMMARY:Ilmoittautuminen: Lahti - NOME-B');
  });

  test('DTSTART on YYYYMMDD-muodossa date-arvolla', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20260524/);
  });

  test('UID sisältää date_sort ja index', () => {
    const ics = generateICS(makeEvent({ date_sort: '2026-05-24T00:00:00+03:00' }), {
      type: 'event',
      index: 7,
    });
    expect(ics).toContain('UID:2026-05-24T00:00:00+03:00-7@koetutka.fi');
  });

  test('registration parsii entry_datesta ilmoittautumispäivän', () => {
    const ics = generateICS(
      makeEvent({
        entry_date: '03.01.-31.01.',
        date_sort: '2026-05-24T00:00:00+03:00',
      }),
      { type: 'registration' },
    );
    // Ilmoittautuminen alkaa 3.1.2026
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20260103/);
  });

  test('event-kuvauksessa on tuomarit ja sihteeri', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toContain('P. Korhonen');
    expect(ics).toContain('J. Mäkinen');
    expect(ics).toContain('M. Virtanen');
  });

  test('LOCATION sisältää koordinaatit jos saatavilla', () => {
    const ics = generateICS(makeEvent(), { type: 'event' });
    expect(ics).toMatch(/LOCATION:Lahti \(60\.9827, 25\.6612\)/);
  });

  test('LOCATION on pelkkä paikkakunta jos ei koordinaatteja', () => {
    const ics = generateICS(makeEvent({ coordinates: null }), { type: 'event' });
    expect(ics).toMatch(/LOCATION:Lahti(\r|\n)/);
  });
});
