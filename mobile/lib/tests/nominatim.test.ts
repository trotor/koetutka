import { describe, test, expect, vi, beforeEach } from 'vitest';
import { searchLocation } from '../nominatim';

beforeEach(() => vi.restoreAllMocks());

describe('searchLocation', () => {
  test('palauttaa Nominatim-tulosten lat/lon ja nimen', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify([
        { display_name: 'Helsinki, Suomi', lat: '60.1699', lon: '24.9384' },
        { display_name: 'Helsinki, Toinen', lat: '60.2', lon: '24.9' },
      ]), { status: 200 }),
    ));

    const results = await searchLocation('Helsinki');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: 'Helsinki, Suomi',
      lat: 60.1699,
      lng: 24.9384,
    });
  });

  test('tyhjä haku palauttaa tyhjän taulukon ilman API-kutsua', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchLocation('   ');
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('palauttaa tyhjän taulukon API-virheellä', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    const results = await searchLocation('Helsinki');
    expect(results).toEqual([]);
  });
});
