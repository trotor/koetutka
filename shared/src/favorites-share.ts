import type { Event } from './types.js';

const SHARE_HEADER = 'Suosikkikokeet – Koetutka';

/**
 * Rakentaa jaettavan tiivistelmän suosikkikokeista. WYSIWYG: formatoi
 * annetun listan sellaisenaan annetussa järjestyksessä — ei suodata eikä
 * järjestä. Rivi per koe: "{date} · {type}[ · {levels}] · {location}".
 * `levels` jätetään pois jos tyhjä tai "N/A".
 */
export function buildFavoritesShareText(events: Event[]): string {
  const lines = events.map((e) => {
    const segments: string[] = [e.date, e.type];
    const levels = (e.levels ?? '').trim();
    if (levels && levels.toUpperCase() !== 'N/A') segments.push(levels);
    segments.push(e.location);
    return segments.join(' · ');
  });
  return [SHARE_HEADER, '', ...lines].join('\n');
}
