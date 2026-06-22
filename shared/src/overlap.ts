import type { Event } from './types.js';

/** Kuukausien nimet suomeksi, 0-indeksoituna (FINNISH_MONTHS[1] === 'Helmikuu'). */
export const FINNISH_MONTHS = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu',
];

/** Inklusiivinen päivämääräväli muodossa YYYY-MM-DD. */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Palauttaa kokeen inklusiivisen päivämäärävälin. Yksipäiväisellä kokeella
 * (end_date_sort null) start === end. Käyttää ISO-aikaleimojen päiväosaa.
 */
export function eventRange(event: Event): DateRange {
  const start = event.date_sort.split('T')[0];
  const end = (event.end_date_sort || event.date_sort).split('T')[0];
  return { start, end };
}

/** Menevätkö kaksi inklusiivista väliä päällekkäin (koskettavat päivät mukaan luettuna). */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start <= b.end && b.start <= a.end;
}

/**
 * Palauttaa 'conflict' jos koe menee päällekkäin jonkin suosikin kanssa,
 * muuten 'free'. Ohittaa suosikin jolla on sama id (koe ei mene päällekkäin
 * itsensä kanssa).
 */
export function fitAgainstFavorites(event: Event, favorites: Event[]): 'free' | 'conflict' {
  const range = eventRange(event);
  for (const fav of favorites) {
    if (fav.id === event.id) continue;
    if (rangesOverlap(range, eventRange(fav))) return 'conflict';
  }
  return 'free';
}

export type AgendaItemKind = 'favorite' | 'candidate';

export interface AgendaItem {
  kind: AgendaItemKind;
  event: Event;
}

export interface AgendaMonth {
  /** Esim. "2026-02". */
  key: string;
  /** Esim. "Helmikuu 2026". */
  label: string;
  items: AgendaItem[];
}

interface BuildAgendaParams {
  favorites: Event[];
  candidates: Event[];
  today?: Date;
}

/**
 * Rakentaa kuukausittain ryhmitellyn aikajanan suosikeista ja täyte-ehdokkaista.
 * - Piilottaa menneet (välin loppu < today).
 * - Kuukaudet aikajärjestyksessä; kuukauden sisällä alkupäivän mukaan, ja
 *   samana päivänä suosikit ennen ehdokkaita.
 */
export function buildAgenda({ favorites, candidates, today = new Date() }: BuildAgendaParams): AgendaMonth[] {
  const todayISO = today.toISOString().split('T')[0];

  const all: AgendaItem[] = [
    ...favorites.map((event) => ({ kind: 'favorite' as const, event })),
    ...candidates.map((event) => ({ kind: 'candidate' as const, event })),
  ].filter((item) => eventRange(item.event).end >= todayISO);

  const kindRank = (kind: AgendaItemKind) => (kind === 'favorite' ? 0 : 1);
  all.sort((a, b) => {
    const cmp = a.event.date_sort.localeCompare(b.event.date_sort);
    return cmp !== 0 ? cmp : kindRank(a.kind) - kindRank(b.kind);
  });

  const months: AgendaMonth[] = [];
  const byKey = new Map<string, AgendaMonth>();
  for (const item of all) {
    const key = eventRange(item.event).start.slice(0, 7); // YYYY-MM
    let month = byKey.get(key);
    if (!month) {
      const [year, mm] = key.split('-');
      month = { key, label: `${FINNISH_MONTHS[parseInt(mm, 10) - 1]} ${year}`, items: [] };
      byKey.set(key, month);
      months.push(month);
    }
    month.items.push(item);
  }
  return months;
}
