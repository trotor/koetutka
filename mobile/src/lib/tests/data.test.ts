import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchEvents, fetchEventsWithFallback, fetchUpcomingEvents, BASE_URL } from '../data';

beforeEach(() => vi.restoreAllMocks());

describe('fetchEvents', () => {
  test('hakee oikean URL:n nykyiselle vuodelle', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'X' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchEvents(2026);
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/koetutka_2026.json`);
  });

  test('palauttaa parsedin event-listan', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify([{ id: 'a' }, { id: 'b' }]), { status: 200 }),
    ));
    const events = await fetchEvents(2026);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('a');
  });

  test('kaataa virheen jos status ei OK', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not found', { status: 404 })));
    await expect(fetchEvents(2027)).rejects.toThrow();
  });

  test('fetchEventsWithFallback fallbackaa 404:lla edelliseen vuoteen', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes('2027')) return new Response('', { status: 404 });
      return new Response(JSON.stringify([{ id: 'a' }]), { status: 200 });
    }));
    const events = await fetchEventsWithFallback(2027);
    expect(events).toHaveLength(1);
    expect(calls).toEqual([
      `${BASE_URL}/koetutka_2027.json`,
      `${BASE_URL}/koetutka_2026.json`,
    ]);
  });

  test('fallback ei käynnisty muista virheistä kuin 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    await expect(fetchEventsWithFallback(2027)).rejects.toThrow();
  });
});

describe('fetchUpcomingEvents', () => {
  const OCT_2026 = new Date(2026, 9, 1);

  function stubYears(files: Record<number, unknown[] | number>) {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      calls.push(url);
      const year = Number(url.match(/koetutka_(\d{4})\.json/)?.[1]);
      const file = files[year];
      if (file === undefined) return new Response('', { status: 404 });
      if (typeof file === 'number') return new Response('', { status: file });
      return new Response(JSON.stringify(file), { status: 200 });
    }));
    return calls;
  }

  test('yhdistää kuluvan ja seuraavan vuoden päivämääräjärjestyksessä', async () => {
    stubYears({
      2026: [{ id: 'b', date_sort: '2026-11-01T00:00:00+02:00' }],
      2027: [{ id: 'c', date_sort: '2027-06-05T00:00:00+03:00' }],
    });
    const events = await fetchUpcomingEvents(OCT_2026);
    expect(events.map((e) => e.id)).toEqual(['b', 'c']);
  });

  test('seuraavan vuoden puuttuminen ei haittaa', async () => {
    stubYears({ 2026: [{ id: 'a', date_sort: '2026-10-03T00:00:00+03:00' }] });
    const events = await fetchUpcomingEvents(OCT_2026);
    expect(events.map((e) => e.id)).toEqual(['a']);
  });

  test('seuraavan vuoden palvelinvirhe ei kaada latausta', async () => {
    stubYears({ 2026: [{ id: 'a', date_sort: '2026-10-03T00:00:00+03:00' }], 2027: 500 });
    const events = await fetchUpcomingEvents(OCT_2026);
    expect(events.map((e) => e.id)).toEqual(['a']);
  });

  test('kuluvan vuoden puuttuessa fallbackaa edelliseen vuoteen', async () => {
    const calls = stubYears({ 2025: [{ id: 'old', date_sort: '2025-12-01T00:00:00+02:00' }] });
    const events = await fetchUpcomingEvents(OCT_2026);
    expect(events.map((e) => e.id)).toEqual(['old']);
    expect(calls).toContain(`${BASE_URL}/koetutka_2025.json`);
  });

  test('kuluvan vuoden palvelinvirhe kaataa latauksen', async () => {
    stubYears({ 2026: 500, 2027: [] });
    await expect(fetchUpcomingEvents(OCT_2026)).rejects.toThrow();
  });
});
