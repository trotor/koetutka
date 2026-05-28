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
 * - searchTerm: case-insensitive match locationiin, typeen, levelsiin, organizeriin
 * - activeTypes: jos asetettu, vain mainitut tyypit
 * - activeLevels: jos asetettu, levels-merkkijonon pitää sisältää joku tasoista
 * - maxDistanceKm: jos asetettu ja eventillä on distance, pitää olla ≤ tämä
 * - hidePast: jos true, pudottaa eventit joiden end_date_sort (tai date_sort) on
 *   ennen `today`-päivää
 */
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

    if (searchTerm) {
      const haystack = [
        event.location,
        event.type,
        event.levels,
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
