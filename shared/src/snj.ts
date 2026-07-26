import type { Event } from './types.js';
import { isRegistrationOpen } from './filters.js';

const BASE = 'https://koekalenteri.snj.fi';

/**
 * Linkki kokeen ilmoittautumiseen SNJ:n koekalenterissa.
 *
 * HUOM: reitti `event/:eventType/:id` on ilmoittautumis*lomake*, ei kokeen
 * ilmoitussivu. Se palauttaa virhesivun `410 Ilmoittautuminen ei ole avoinna`
 * aina kun ilmoittautuminen ei ole auki, joten tätä ei pidä linkittää
 * ehdoitta — käytä `snjLink`iä, joka valitsee toimivan kohteen.
 *
 * Tyyppi enkoodataan, koska arvoissa on välilyöntejä (`NOME-A SM`) ja
 * skandeja (`EPÄVIRALLINEN`).
 */
export function snjRegistrationUrl(event: Pick<Event, 'type' | 'id'>): string {
  return `${BASE}/event/${encodeURIComponent(event.type)}/${encodeURIComponent(event.id)}`;
}

/** Linkki kokeen lähtölistaan SNJ:n koekalenterissa. */
export function snjStartListUrl(event: Pick<Event, 'id'>): string {
  return `${BASE}/startlist/${encodeURIComponent(event.id)}`;
}

/** Koekalenterin etusivu. Fallback kun kokeelle ei ole toimivaa omaa sivua. */
export function snjCalendarUrl(): string {
  return `${BASE}/`;
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

export type SnjLinkKind = 'register' | 'startlist' | 'calendar';

/**
 * Valitsee kokeelle sen yhden ulkoisen SNJ-linkin joka oikeasti toimii.
 *
 * Haarat ovat toisensa poissulkevia rakenteellisesti: `isRegistrationOpen`
 * palauttaa epätoden tiloilla `picked`/`invited`/`cancelled`, ja lähtölista on
 * juuri tiloilla `picked`/`invited`. Valinta on täällä eikä UI:ssa, jotta web
 * ja mobiili eivät voi eriytyä.
 */
export function snjLink(
  event: Event,
  today: Date = new Date(),
): { kind: SnjLinkKind; label: string; url: string } {
  if (isRegistrationOpen(event, today)) {
    return {
      kind: 'register',
      label: 'Ilmoittaudu SNJ:n koekalenterissa',
      url: snjRegistrationUrl(event),
    };
  }
  if (hasStartList(event)) {
    return { kind: 'startlist', label: 'Lue lähtölista', url: snjStartListUrl(event) };
  }
  return { kind: 'calendar', label: 'Avaa SNJ:n koekalenteri', url: snjCalendarUrl() };
}
