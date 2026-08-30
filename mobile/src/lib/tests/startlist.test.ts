import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchStartlist, fetchStartlistIndex, clearStartlistCache } from '../startlist';
import { BASE_URL } from '../data';

beforeEach(() => {
  vi.restoreAllMocks();
  clearStartlistCache();
});

describe('fetchStartlistIndex', () => {
  test('hakee indeksin ja palauttaa events-kentän', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ generated: 'x', events: { abc: 12 } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchStartlistIndex()).toEqual({ abc: 12 });
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/startlists/index.json`);
  });

  test('välimuistittaa: toinen kutsu ei hae uudestaan', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ events: { abc: 1 } }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchStartlistIndex();
    await fetchStartlistIndex();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('virhe -> tyhjä indeksi, ja seuraava kutsu yrittää uudestaan', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchStartlistIndex()).toEqual({});
    await fetchStartlistIndex();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('vastaus ilman events-kenttää -> tyhjä indeksi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    expect(await fetchStartlistIndex()).toEqual({});
  });
});

describe('fetchStartlist', () => {
  test('hakee kokeen lähtölistan omalta sivustolta', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ dog: 'A' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const entries = await fetchStartlist('abc');
    expect(entries).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/startlists/abc.json`);
  });

  test('välimuistittaa haetun listan', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ dog: 'A' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchStartlist('abc');
    await fetchStartlist('abc');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('heittää kun listaa ei ole', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(fetchStartlist('puuttuu')).rejects.toThrow();
  });

  test('clearStartlistCache pakottaa uuden haun', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ dog: 'A' }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchStartlist('abc');
    clearStartlistCache();
    await fetchStartlist('abc');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
