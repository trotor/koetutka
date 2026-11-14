import type { Event } from './types.js';
import { eventRange, FINNISH_MONTHS } from './overlap.js';

/** Viikonpäivien lyhenteet maanantaista alkaen. */
export const FINNISH_WEEKDAYS_SHORT = ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'];

export interface MonthDay {
  /** YYYY-MM-DD */
  iso: string;
  /** Kuukauden päivä (1–31). */
  day: number;
  /** Kuuluuko päivä näytettävään kuukauteen (muuten edellisen/seuraavan reunapäivä). */
  inMonth: boolean;
  isToday: boolean;
  /** Päivälle osuvat kokeet (monipäiväinen koe jokaisena päivänään), alkupäivän mukaan. */
  events: Event[];
}

export interface MonthGrid {
  /** Esim. "2026-11". */
  key: string;
  /** Esim. "Marraskuu 2026". */
  label: string;
  /** 4–6 viikkoa, kukin 7 päivää maanantaista sunnuntaihin. */
  weeks: MonthDay[][];
  /** Kuukauteen osuvat kokeet kerran kukin, alkupäivän mukaan. */
  monthEvents: Event[];
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Paikallinen päivämäärä muodossa YYYY-MM-DD. Ei käytä toISOString():iä, joka
 * antaisi Suomen aikavyöhykkeessä keskiyön jälkeen edellisen päivän.
 */
export function localISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Paikallisen päivän kuukausiavain, esim. "2026-11". */
export function monthKeyOf(date: Date): string {
  return localISODate(date).slice(0, 7);
}

function parseKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-');
  return { year: parseInt(y, 10), month: parseInt(m, 10) - 1 };
}

/** Siirtää kuukausiavainta `delta` kuukautta eteen- tai taaksepäin. */
export function shiftMonthKey(key: string, delta: number): string {
  const { year, month } = parseKey(key);
  const total = year * 12 + month + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12 + 12) % 12 + 1)}`;
}

// Päivälaskenta UTC:nä, jotta kesäaikasiirtymät eivät siirrä päiviä.
const utcISO = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY_MS = 86_400_000;

function byStart(a: Event, b: Event): number {
  const cmp = a.date_sort.localeCompare(b.date_sort);
  return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
}

/**
 * Rakentaa seinäkalenterin kuukausiruudukon: viikot maanantaista alkaen,
 * reunoilla edellisen ja seuraavan kuukauden päivät täyttämässä viikot.
 * Kokeet sijoitetaan jokaiselle päivälle, jonka ne kattavat.
 */
export function buildMonthGrid(key: string, events: Event[], today: Date = new Date()): MonthGrid {
  const { year, month } = parseKey(key);
  const first = Date.UTC(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (new Date(first).getUTCDay() + 6) % 7; // ma = 0
  const cellCount = Math.ceil((leading + daysInMonth) / 7) * 7;
  const gridStart = first - leading * DAY_MS;
  const gridFirstISO = utcISO(gridStart);
  const gridLastISO = utcISO(gridStart + (cellCount - 1) * DAY_MS);
  const monthFirstISO = utcISO(first);
  const monthLastISO = utcISO(Date.UTC(year, month, daysInMonth));
  const todayISO = localISODate(today);

  const sorted = [...events].sort(byStart);
  const byDay = new Map<string, Event[]>();
  const monthEvents: Event[] = [];
  for (const event of sorted) {
    const { start, end } = eventRange(event);
    if (end < gridFirstISO || start > gridLastISO) continue;
    if (start <= monthLastISO && end >= monthFirstISO) monthEvents.push(event);
    const from = Math.max(Date.parse(`${start}T00:00:00Z`), gridStart);
    const to = Math.min(Date.parse(`${end}T00:00:00Z`), gridStart + (cellCount - 1) * DAY_MS);
    for (let t = from; t <= to; t += DAY_MS) {
      const iso = utcISO(t);
      const list = byDay.get(iso);
      if (list) list.push(event);
      else byDay.set(iso, [event]);
    }
  }

  const weeks: MonthDay[][] = [];
  for (let i = 0; i < cellCount; i++) {
    const ms = gridStart + i * DAY_MS;
    const iso = utcISO(ms);
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push({
      iso,
      day: new Date(ms).getUTCDate(),
      inMonth: iso >= monthFirstISO && iso <= monthLastISO,
      isToday: iso === todayISO,
      events: byDay.get(iso) ?? [],
    });
  }

  return { key, label: `${FINNISH_MONTHS[month]} ${year}`, weeks, monthEvents };
}

/**
 * Kuukausi, josta näkymä aukeaa: kuluva kuukausi, jos siinä on vielä tuleva
 * (tai käynnissä oleva) koe; muuten seuraavan tulevan kokeen kuukausi; ja jos
 * tulevia ei ole, kuluva kuukausi.
 */
export function initialMonthKey(events: Event[], today: Date = new Date()): string {
  const todayISO = localISODate(today);
  const current = todayISO.slice(0, 7);
  let next: string | null = null;
  for (const event of events) {
    const { start, end } = eventRange(event);
    if (end < todayISO) continue;
    const key = (start < todayISO ? todayISO : start).slice(0, 7);
    if (next === null || key < next) next = key;
  }
  return next ?? current;
}
