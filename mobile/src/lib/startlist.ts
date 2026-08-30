import { useEffect, useState } from 'react';
import { startlistDataUrl } from '@koetutka/shared';
import type { StartlistEntry } from '@koetutka/shared';
import { BASE_URL } from './data';

/**
 * Lähtölistat haetaan Koetutkan omalta sivustolta (`startlists/<id>.json`), ei
 * SNJ:n API:sta: listat on siellä valmiiksi karsittu (koira, ohjaaja, luokka,
 * ryhmä) ja sama data näkyy sekä webissä että mobiilissa.
 */

/** Kokeet joilla lähtölista on: id -> osallistujien määrä. */
export type StartlistIndex = Record<string, number>;

let indexPromise: Promise<StartlistIndex> | null = null;
const listCache = new Map<string, StartlistEntry[]>();

/**
 * Hakee indeksin (välimuistitettu istunnon ajaksi). Virheestä palautuu tyhjä
 * indeksi: lähtölista on lisätieto, jonka puuttuminen ei saa kaataa näkymää.
 */
export function fetchStartlistIndex(): Promise<StartlistIndex> {
  if (!indexPromise) {
    indexPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/startlists/index.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { events?: StartlistIndex };
        return data?.events ?? {};
      } catch {
        indexPromise = null; // yritetään uudestaan seuraavalla kerralla
        return {};
      }
    })();
  }
  return indexPromise;
}

/**
 * Tyhjentää välimuistin, jotta seuraava haku näkee tuoreet listat. Kutsutaan
 * kun koedata ladataan uudestaan: lähtölistoja julkaistaan päivittäin, eikä
 * pitkään auki ollut sovellus saisi jäädä vanhaan indeksiin.
 */
export function clearStartlistCache(): void {
  indexPromise = null;
  listCache.clear();
}

/** Hakee yhden kokeen lähtölistan. Heittää jos hakua ei saada läpi. */
export async function fetchStartlist(id: string): Promise<StartlistEntry[]> {
  const cached = listCache.get(id);
  if (cached) return cached;
  const res = await fetch(startlistDataUrl(BASE_URL, id));
  if (!res.ok) throw new Error(`Lähtölistaa ei saatu (HTTP ${res.status})`);
  const entries = (await res.json()) as StartlistEntry[];
  listCache.set(id, entries);
  return entries;
}

export type StartlistState =
  | { status: 'loading' }
  /** Kokeelle ei ole lähtölistaa (ei vielä kutsuja, tai koe on liian vanha). */
  | { status: 'none' }
  | { status: 'ready'; entries: StartlistEntry[] }
  | { status: 'error' };

/** Lataa kokeen lähtölistan näkymää varten. */
export function useStartlist(id: string): StartlistState {
  const [state, setState] = useState<StartlistState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    (async () => {
      const index = await fetchStartlistIndex();
      if (!active) return;
      if (index[id] === undefined) {
        setState({ status: 'none' });
        return;
      }
      try {
        const entries = await fetchStartlist(id);
        if (active) setState({ status: 'ready', entries });
      } catch {
        if (active) setState({ status: 'error' });
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
