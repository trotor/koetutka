import { describe, test, expect } from 'vitest';
import { addDistances, filterEvents, isRegistrationOpen, isPast } from '../src/filters.js';
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

  test('searchTerm matchaa myös nimeen ja organizeriin', () => {
    const named = makeEvent({ id: 'd', name: 'Kevätkokeet', organizer: 'Pohjolan Noutajat ry', location: 'Kemi' });
    // nimellä
    expect(filterEvents([named], { searchTerm: 'kevät' }).map((e) => e.id)).toEqual(['d']);
    // organizerilla
    expect(filterEvents([named], { searchTerm: 'pohjolan' }).map((e) => e.id)).toEqual(['d']);
  });

  test('maxDistanceKm päästää läpi kokeet joilla ei ole etäisyyttä', () => {
    const noDistance = makeEvent({ id: 'e', distance: undefined });
    const result = filterEvents([noDistance], { maxDistanceKm: 10 });
    expect(result.map((e) => e.id)).toEqual(['e']);
  });

  test('onlyRegistrationOpen jättää vain ne joiden ilmoittautuminen on auki', () => {
    // tapahtuma 2026, ilmoittautuminen 01.04.-14.04.2026
    const open = makeEvent({ id: 'open', date_sort: '2026-05-24T00:00:00+03:00', entry_date: '01.04.-14.04.' });
    const closed = makeEvent({ id: 'closed', date_sort: '2026-05-24T00:00:00+03:00', entry_date: '01.02.-14.02.' });
    const result = filterEvents([open, closed], {
      onlyRegistrationOpen: true,
      today: new Date('2026-04-10'),
    });
    expect(result.map((e) => e.id)).toEqual(['open']);
  });
});

describe('isRegistrationOpen', () => {
  const ev = (entry_date: string, date_sort = '2026-05-24T00:00:00+03:00'): Event =>
    makeEvent({ entry_date, date_sort });

  test('auki kun tänään on ilmoittautumisvälin sisällä', () => {
    expect(isRegistrationOpen(ev('01.04.-14.04.'), new Date('2026-04-07'))).toBe(true);
  });

  test('kiinni ennen alkupäivää', () => {
    expect(isRegistrationOpen(ev('01.04.-14.04.'), new Date('2026-03-31'))).toBe(false);
  });

  test('kiinni loppupäivän jälkeen', () => {
    expect(isRegistrationOpen(ev('01.04.-14.04.'), new Date('2026-04-15'))).toBe(false);
  });

  test('auki alkupäivänä (inklusiivinen)', () => {
    expect(isRegistrationOpen(ev('01.04.-14.04.'), new Date('2026-04-01'))).toBe(true);
  });

  test('auki loppupäivänä (inklusiivinen)', () => {
    expect(isRegistrationOpen(ev('01.04.-14.04.'), new Date('2026-04-14'))).toBe(true);
  });

  test('vuodenvaihteen yli menevä väli: auki joulukuussa', () => {
    // tapahtuma alkuvuodesta 2026, ilmoittautuminen 15.12.2025-15.01.2026
    const e = ev('15.12.-15.01.', '2026-01-20T00:00:00+02:00');
    expect(isRegistrationOpen(e, new Date('2025-12-20'))).toBe(true);
    expect(isRegistrationOpen(e, new Date('2026-01-10'))).toBe(true);
    expect(isRegistrationOpen(e, new Date('2026-01-16'))).toBe(false);
  });
});

describe('isPast', () => {
  const ev = (date_sort: string, end_date_sort: string | null = null): Event =>
    ({
      id: 'x', type: 'NOME-B', levels: 'VOI', date: '01.04.2026',
      date_sort, end_date_sort, entry_date: '01.03.-20.03.', location: 'Kuopio',
      coordinates: null, name: '', organizer: '', official: { name: '', phone: '', email: '' },
      secretary: { name: '', phone: '', email: '' }, judges: [], description: '',
      cost: 0, cost_member: '', classes: [], places: 0,
    }) as unknown as Event;

  test('mennyt koe on past', () => {
    expect(isPast(ev('2026-04-01T00:00:00+03:00'), new Date('2026-04-05'))).toBe(true);
  });
  test('tuleva koe ei ole past', () => {
    expect(isPast(ev('2026-04-10T00:00:00+03:00'), new Date('2026-04-05'))).toBe(false);
  });
  test('tämänpäiväinen koe ei ole past', () => {
    expect(isPast(ev('2026-04-05T00:00:00+03:00'), new Date('2026-04-05'))).toBe(false);
  });
  test('monipäiväinen: loppupäivä ratkaisee', () => {
    // Alkaa eilen, loppuu huomenna → ei past.
    expect(
      isPast(ev('2026-04-04T00:00:00+03:00', '2026-04-06T00:00:00+03:00'), new Date('2026-04-05')),
    ).toBe(false);
  });
});
