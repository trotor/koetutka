import { haversine } from './distance.js';
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
 * `entry_date` on muotoa "PP.KK.-PP.KK." (esim. "01.04.-14.04."). Vuosi
 * päätellään kokeen `date_sort`-vuodesta. Jos väli menee vuodenvaihteen yli
 * (loppu ennen alkua kalenterissa), alkupäivä tulkitaan edellisen vuoden
 * puolelle. Väli on inklusiivinen molemmista päistä.
 */
export function isRegistrationOpen(event: Event, today: Date = new Date()): boolean {
  const match = event.entry_date?.match(/(\d{1,2})\.(\d{1,2})\.-(\d{1,2})\.(\d{1,2})\./);
  if (!match) return false;

  const startDay = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10);
  const endDay = parseInt(match[3], 10);
  const endMonth = parseInt(match[4], 10);

  const eventYear = new Date(event.date_sort).getFullYear();
  const endTime = dateOnly(eventYear, endMonth, endDay);
  // Jos alku on kalenterissa loppua myöhemmin, väli alkoi edellisenä vuonna.
  const startsBeforeEnd =
    startMonth < endMonth || (startMonth === endMonth && startDay <= endDay);
  const startYear = startsBeforeEnd ? eventYear : eventYear - 1;
  const startTime = dateOnly(startYear, startMonth, startDay);

  const todayTime = dateOnly(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );

  return todayTime >= startTime && todayTime <= endTime;
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
