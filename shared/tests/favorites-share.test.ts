import { describe, test, expect } from 'vitest';
import { buildFavoritesShareText } from '../src/favorites-share.js';
import type { Event } from '../src/types.js';

const ev = (over: Partial<Event>): Event =>
  ({
    id: 'x', type: 'NOME-B', levels: 'VOI', date: '24.01.2026',
    date_sort: '2026-01-24T00:00:00+02:00', end_date_sort: null,
    entry_date: '01.01.-14.01.', location: 'Kuopio', coordinates: null,
    name: '', organizer: '', official: { name: '', phone: '', email: '' },
    secretary: { name: '', phone: '', email: '' }, judges: [], description: '',
    cost: 0, cost_member: '', classes: [], places: 0, ...over,
  }) as unknown as Event;

describe('buildFavoritesShareText', () => {
  test('perusmuoto: otsikko, tyhjä rivi, rivi per koe', () => {
    const text = buildFavoritesShareText([
      ev({ date: '24.01.2026', type: 'NOME-B', levels: 'VOI', location: 'Kuopio' }),
      ev({ date: '07.03.2026', type: 'WT', levels: 'AVO', location: 'Oulu' }),
    ]);
    expect(text).toBe(
      'Suosikkikokeet – Koetutka\n\n' +
        '24.01.2026 · NOME-B · VOI · Kuopio\n' +
        '07.03.2026 · WT · AVO · Oulu',
    );
  });

  test('levels jätetään pois kun N/A', () => {
    const text = buildFavoritesShareText([
      ev({ date: '14.02.2026', type: 'NOME-A SM', levels: 'N/A', location: 'Salo' }),
    ]);
    expect(text).toBe('Suosikkikokeet – Koetutka\n\n14.02.2026 · NOME-A SM · Salo');
  });

  test('levels jätetään pois kun tyhjä', () => {
    const text = buildFavoritesShareText([
      ev({ date: '14.02.2026', type: 'NOME-A SM', levels: '', location: 'Salo' }),
    ]);
    expect(text).toBe('Suosikkikokeet – Koetutka\n\n14.02.2026 · NOME-A SM · Salo');
  });

  test('järjestys säilyy annettuna (ei uudelleenjärjestystä)', () => {
    const text = buildFavoritesShareText([
      ev({ date: '07.03.2026', type: 'WT', levels: 'AVO', location: 'Oulu' }),
      ev({ date: '24.01.2026', type: 'NOME-B', levels: 'VOI', location: 'Kuopio' }),
    ]);
    const lines = text.split('\n');
    expect(lines[2]).toContain('Oulu');
    expect(lines[3]).toContain('Kuopio');
  });
});
