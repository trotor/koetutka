import type { Event } from './types.js';

const BASE = 'https://koekalenteri.snj.fi';

/**
 * Linkki kokeen omaan ilmoitukseen SNJ:n koekalenterissa.
 * Reittikuvio on `event/:eventType/:id`; tyyppi voi sisältää välilyönnin
 * ja skandeja, joten se enkoodataan.
 */
export function snjEventUrl(event: Pick<Event, 'type' | 'id'>): string {
  return `${BASE}/event/${encodeURIComponent(event.type)}/${encodeURIComponent(event.id)}`;
}

/** Linkki kokeen lähtölistaan SNJ:n koekalenterissa. */
export function snjStartListUrl(event: Pick<Event, 'id'>): string {
  return `${BASE}/startlist/${encodeURIComponent(event.id)}`;
}

/**
 * Tosi kun lähtölista on odotettavissa: osallistujat on valittu (`picked`) tai
 * kutsut lähetetty (`invited`). Tämä on tarkoituksella pelkkä tilapäättely eikä
 * verkkokutsu — lista voi harvoin puuttua, mikä on hyväksyttävä hinta siitä
 * ettei mitään ylimääräistä haeta.
 */
export function hasStartList(event: Pick<Event, 'state'>): boolean {
  return event.state === 'picked' || event.state === 'invited';
}
