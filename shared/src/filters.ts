import { haversine } from './distance.js';
import { registrationClosedByState } from './event-state.js';
import type { Event, FilterOptions, UserLocation } from './types.js';

/**
 * Palauttaa uuden taulukon eventeistä, joihin on lisätty `distance`-kenttä
 * käyttäjän sijainnista. Ei mutatoi alkuperäisiä objekteja.
 */
export function addDistances(
  events: Event[],
  user: UserLocation,
): Event[] {
  return events.map((event) => {
    if (event.coordinates && event.coordinates.length === 2) {
      const km = haversine(
        user.lat,
        user.lng,
        event.coordinates[0],
        event.coordinates[1],
      );
      return { ...event, distance: Math.round(km) };
    }
    return { ...event, distance: null };
  });
}

/**
 * Suodattaa eventit annetuilla kriteereillä. Kaikki kriteerit ovat
 * valinnaisia; tyhjä optio-objekti palauttaa kaikki eventit.
 *
 * - searchTerm: case-insensitive match locationiin, typeen, levelsiin, nimeen, organizeriin
 * - activeTypes: jos asetettu, vain mainitut tyypit
 * - activeLevels: jos asetettu, levels-merkkijonon pitää sisältää joku tasoista
 * - maxDistanceKm: jos asetettu ja eventillä on distance, pitää olla ≤ tämä
 * - hidePast: jos true, pudottaa eventit joiden end_date_sort (tai date_sort) on
 *   ennen `today`-päivää
 */
/** Vie päivämäärän puhtaaksi keskipäivän aikaleimaksi (vältetään aikavyöhyke- ja DST-reunatapaukset vertailussa). */
function dateOnly(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

/**
 * Palauttaa true, jos kokeen ilmoittautuminen on `today`-päivänä auki.
 *
 * Ensisijaisesti käytetään tarkkoja ISO-päiviä `entry_start` ja `entry_end`.
 * Jos ne puuttuvat (vanhempi JSON), palataan `entry_date`-merkkijonoon muodossa
 * "PP.KK.-PP.KK." (esim. "01.04.-14.04."), jossa vuosi päätellään kokeen
 * `date_sort`-vuodesta: jos väli menee vuodenvaihteen yli (loppu ennen alkua
 * kalenterissa), alkupäivä tulkitaan edellisen vuoden puolelle.
 *
 * Kokeen tila ohittaa päivämäärät: kun osallistujat on valittu, kutsut
 * lähetetty tai koe peruttu, ilmoittautuminen ei ole auki.
 *
 * Väli on inklusiivinen molemmista päistä.
 */
export function isRegistrationOpen(event: Event, today: Date = new Date()): boolean {
  if (registrationClosedByState(event)) return false;

  const todayTime = dateOnly(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  // 1. Tarkat ISO-päivät kun ne ovat saatavilla.
  if (event.entry_start && event.entry_end) {
    const start = isoDateOnly(event.entry_start);
    const end = isoDateOnly(event.entry_end);
    if (start !== null && end !== null) {
      return todayTime >= start && todayTime <= end;
    }
  }

  // 2. Fallback: entry_date-merkkijono, jossa vuosi päätellään.
  const match = event.entry_date?.match(/(\d{1,2})\.(\d{1,2})\.-(\d{1,2})\.(\d{1,2})\./);
  if (!match) return false;

  const startDay = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10);
  const endDay = parseInt(match[3], 10);
  const endMonth = parseInt(match[4], 10);

  const eventYear = new Date(event.date_sort).getFullYear();
  const endTime = dateOnly(eventYear, endMonth, endDay);
  const startsBeforeEnd =
    startMonth < endMonth || (startMonth === endMonth && startDay <= endDay);
  const startYear = startsBeforeEnd ? eventYear : eventYear - 1;
  const startTime = dateOnly(startYear, startMonth, startDay);

  return todayTime >= startTime && todayTime <= endTime;
}

/** Parsii `YYYY-MM-DD` samaan vertailumuotoon kuin dateOnly, tai null. */
function isoDateOnly(iso: string): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return dateOnly(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
}

/**
 * Palauttaa true, jos koe on jo mennyt: kokeen loppupäivä
 * (`end_date_sort` tai sen puuttuessa `date_sort`) on ennen `today`-päivää.
 * Vertailu tehdään ISO-päiväosalla (YYYY-MM-DD).
 */
export function isPast(event: Event, today: Date = new Date()): boolean {
  const todayISO = today.toISOString().split('T')[0];
  const end = (event.end_date_sort || event.date_sort).split('T')[0];
  return end < todayISO;
}

export function filterEvents(
  events: Event[],
  options: FilterOptions,
): Event[] {
  const today = options.today ?? new Date();
  const todayISO = today.toISOString().split('T')[0];
  const searchTerm = options.searchTerm?.toLowerCase().trim() ?? '';

  return events.filter((event) => {
    if (options.hidePast) {
      const eventDateISO = (event.end_date_sort || event.date_sort).split('T')[0];
      if (eventDateISO < todayISO) return false;
    }

    if (options.onlyRegistrationOpen) {
      if (!isRegistrationOpen(event, today)) return false;
    }

    if (searchTerm) {
      const haystack = [
        event.location,
        event.type,
        event.levels,
        event.name,
        event.organizer,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }

    if (options.activeTypes && options.activeTypes.size > 0) {
      if (!options.activeTypes.has(event.type)) return false;
    }

    if (options.activeLevels && options.activeLevels.size > 0) {
      const hasAny = Array.from(options.activeLevels).some((lvl) =>
        event.levels.includes(lvl),
      );
      if (!hasAny) return false;
    }

    if (
      options.maxDistanceKm !== null &&
      options.maxDistanceKm !== undefined &&
      event.distance !== null &&
      event.distance !== undefined
    ) {
      if (event.distance > options.maxDistanceKm) return false;
    }

    return true;
  });
}
