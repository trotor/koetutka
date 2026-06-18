import type { Event } from './types.js';

export type SortBy = 'distance' | 'date';

/**
 * Palauttaa uuden lajitellun taulukon. Ei mutatoi syötettä.
 * - 'distance': lähimmät ensin; etäisyydettömät (null/undefined) loppuun,
 *   keskenään aikajärjestyksessä; etäisyydellisten kesken toissijaisesti aika.
 * - 'date': aikajärjestys (date_sort nouseva).
 */
export function sortEvents(events: Event[], sortBy: SortBy): Event[] {
  const copy = [...events];
  if (sortBy === 'date') {
    return copy.sort((a, b) => a.date_sort.localeCompare(b.date_sort));
  }
  return copy.sort((a, b) => {
    const aHas = a.distance !== undefined && a.distance !== null;
    const bHas = b.distance !== undefined && b.distance !== null;
    if (aHas && bHas) {
      const diff = (a.distance as number) - (b.distance as number);
      return diff !== 0 ? diff : a.date_sort.localeCompare(b.date_sort);
    }
    if (aHas) return -1;
    if (bHas) return 1;
    return a.date_sort.localeCompare(b.date_sort);
  });
}
