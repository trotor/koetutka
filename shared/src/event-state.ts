import type { Event, EventState } from './types.js';

/** Merkin sävy: UI päättää värit, tämä kertoo vain merkityksen. */
export type StateTone = 'tentative' | 'cancelled' | 'closed';

const BADGES: Partial<Record<EventState, { label: string; tone: StateTone }>> = {
  tentative: { label: 'Alustava', tone: 'tentative' },
  cancelled: { label: 'Peruttu', tone: 'cancelled' },
  picked: { label: 'Osallistujat valittu', tone: 'closed' },
  invited: { label: 'Kutsut lähetetty', tone: 'closed' },
  // confirmed on normaalitapaus eikä tarvitse merkkiä.
};

/**
 * Palauttaa kokeen tilamerkin, tai null jos merkkiä ei tarvita
 * (vahvistettu, puuttuva tai tuntematon tila).
 */
export function stateBadge(
  event: Pick<Event, 'state'>,
): { label: string; tone: StateTone } | null {
  const state = event.state;
  if (!state) return null;
  return BADGES[state] ?? null;
}

/** Tosi jos koe on peruttu. */
export function isCancelled(event: Pick<Event, 'state'>): boolean {
  return event.state === 'cancelled';
}

/**
 * Tosi jos tila kertoo ilmoittautumisen päättyneeksi riippumatta
 * päivämääristä: osallistujat on valittu, kutsut lähetetty, tai koe peruttu.
 */
export function registrationClosedByState(event: Pick<Event, 'state'>): boolean {
  const state = event.state;
  return state === 'picked' || state === 'invited' || state === 'cancelled';
}
