import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchEvents, fetchEventsWithFallback, BASE_URL } from '../data';

beforeEach(() => {
  vi.restoreAllMocks();
});

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
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify([{ id: 'a' }, { id: 'b' }]), { status: 200 }),
      ),
    );

    const events = await fetchEvents(2026);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('a');
  });

  test('kaataa virheen jos status ei OK', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Not found', { status: 404 })),
    );

    await expect(fetchEvents(2027)).rejects.toThrow();
  });

  test('toinen kerros fallbackaa edelliseen vuoteen 404:n jälkeen', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes('2027')) return new Response('', { status: 404 });
        return new Response(JSON.stringify([{ id: 'a' }]), { status: 200 });
      }),
    );

    const events = await fetchEventsWithFallback(2027);
    expect(events).toHaveLength(1);
    expect(calls).toEqual([
      `${BASE_URL}/koetutka_2027.json`,
      `${BASE_URL}/koetutka_2026.json`,
    ]);
  });
});
