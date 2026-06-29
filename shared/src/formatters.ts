import type { Class, ClassPlaces, Cost, CostObject, Event, OptionalCost } from './types.js';

/**
 * Palauttaa kokeen perushinnan numerona, tai null jos ei tiedossa
 * tai vahingoittunutta dataa. Identtinen index.html:n alkuperäisen
 * getCostValue-funktion kanssa.
 */
export function getCostValue(cost: Cost): number | null {
  if (cost === null || cost === undefined || cost === '') return null;
  if (typeof cost === 'number') return cost;
  if (typeof cost === 'object' && typeof (cost as CostObject).normal === 'number') {
    return (cost as CostObject).normal as number;
  }
  return null;
}

/**
 * Palauttaa lisämaksulistan (esim. ruokailu) jos kustannusobjektissa
 * on optionalAdditionalCosts. Numero/null palauttaa tyhjän taulukon.
 */
export function getOptionalCosts(cost: Cost): OptionalCost[] {
  if (cost && typeof cost === 'object' && Array.isArray((cost as CostObject).optionalAdditionalCosts)) {
    return (cost as CostObject).optionalAdditionalCosts as OptionalCost[];
  }
  return [];
}

const WEEKDAYS = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Listaa kokeen paikkamäärät tietonäkymää varten.
 *
 * Ensisijaisesti eritellään per päivä ja per luokka (ei summausta): jos
 * classes-listassa on per-luokka-paikkoja, monipäiväisessä kokeessa sama luokka
 * eri päivinä näkyy omina riveinään ja jokaiselle riville asetetaan `day`-leima
 * (esim. "La 6.6."); yksipäiväisessä `day` on null.
 *
 * Jos per-luokka-paikkoja ei ole (esim. alustavat ja WT-kokeet), käytetään
 * kokeen kokonaispaikkamäärää (`event.places`):
 * - yksi luokka → luku liitetään siihen luokkaan,
 * - monta luokkaa tai ei luokkia → palautetaan yksi kokonaismäärä-rivi
 *   (`class: ''` = "Yhteensä").
 *
 * Palauttaa tyhjän taulukon jos paikkamäärää ei ole lainkaan.
 */
export function listClassPlaces(
  event: Pick<Event, 'classes' | 'places'> | undefined,
): ClassPlaces[] {
  const classes = event?.classes ?? [];
  // 1. Per-luokka-paikat, eriteltynä per päivä.
  const rows: { class: string; places: number; dateKey: string; dayLabel: string | null; order: number }[] = [];
  for (let i = 0; i < classes.length; i++) {
    const c = classes[i];
    const name = typeof c.class === 'string' ? c.class.trim() : '';
    if (!name) continue;
    const places = typeof c.places === 'number' && Number.isFinite(c.places) ? c.places : 0;
    if (places <= 0) continue;
    let dateKey = '';
    let dayLabel: string | null = null;
    if (typeof c.date === 'string' && c.date) {
      const d = new Date(c.date);
      if (!Number.isNaN(d.getTime())) {
        dateKey = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
        dayLabel = `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
      }
    }
    rows.push({ class: name, places, dateKey, dayLabel, order: i });
  }
  if (rows.length > 0) {
    const multiDay = new Set(rows.map((r) => r.dateKey).filter(Boolean)).size > 1;
    rows.sort((a, b) =>
      a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : a.order - b.order,
    );
    return rows.map((r) => ({ class: r.class, places: r.places, day: multiDay ? r.dayLabel : null }));
  }

  // 2. Fallback: kokonaispaikkamäärä kun per-luokka-erittelyä ei ole.
  const total =
    typeof event?.places === 'number' && Number.isFinite(event.places) ? event.places : 0;
  if (total <= 0) return [];
  const names = Array.from(
    new Set(
      classes
        .map((c) => (typeof c.class === 'string' ? c.class.trim() : ''))
        .filter((n) => n),
    ),
  );
  // Yksi luokka → liitetään kokonaismäärä siihen, muuten "Yhteensä"-rivi.
  const label = names.length === 1 ? names[0] : '';
  return [{ class: label, places: total, day: null }];
}
