/**
 * Lähtölista: kokeen osallistujat, ryhmiteltynä koepäivään ja luokkaan.
 *
 * Data tulee SNJ:n API:sta, mutta karsittuna ja meidän sivustoltamme
 * (`startlists/<id>.json`) — SNJ:n oma vastaus sallii CORSissa vain
 * koekalenterin originin, joten selain ei voi hakea sitä suoraan. Karsinta
 * tehdään `snj_kokeet.py --startlists`-ajossa: mukana on vain koira, ohjaaja,
 * luokka ja ryhmä.
 */

/** Yksi osallistuja lähtölistalla. */
export interface StartlistEntry {
  /** Luokka (ALO/AVO/VOI). Tyhjä kun kokeessa ei ole luokkia (esim. NOU). */
  class: string;
  /** Koepäivä `YYYY-MM-DD`, paikallinen päivä. Tyhjä jos ei tiedossa. */
  day: string;
  /** Ryhmän aika: `ap`, `ip`, `kp` (koko päivä) tai tyhjä. */
  time: string;
  /** Järjestysnumero ryhmässä, tai null jos puuttuu. */
  number: number | null;
  /** Ohjaajan nimi. */
  handler: string;
  /** Koiran nimi. */
  dog: string;
  /** Koiran rekisterinumero. */
  reg_no: string;
  /** Koiran tittelit, usein tyhjä. */
  titles: string;
}

/** Yksi ryhmä lähtölistalla: sama päivä, aika ja luokka. */
export interface StartlistGroup {
  /** Uniikki avain (`2026-08-29-ap-ALO`), sopii Reactin key-propiksi. */
  key: string;
  /** Otsikko, esim. "La 29.8. ap · ALO". Tyhjä jos ryhmittelyyn ei ole tietoa. */
  label: string;
  entries: StartlistEntry[];
}

const WEEKDAYS = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

const TIME_LABELS: Record<string, string> = {
  ap: 'aamupäivä',
  ip: 'iltapäivä',
  kp: 'koko päivä',
};

const TIME_ORDER: Record<string, number> = { ap: 0, ip: 1, kp: 2 };

const CLASS_ORDER: Record<string, number> = { ALO: 0, AVO: 1, VOI: 2 };

/** Lähtölistan osoite omalla sivustolla. `baseUrl` ilman kauttaviivaa lopussa. */
export function startlistDataUrl(baseUrl: string, id: string): string {
  return `${baseUrl}/startlists/${encodeURIComponent(id)}.json`;
}

/** Muotoilee päivän `YYYY-MM-DD` muotoon "La 29.8.". Tyhjä jos ei jäsenny. */
export function formatStartlistDay(day: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return '';
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`;
}

/** Koiran nimi titteleineen, esim. "FI KVA-WT VESIPEDON VELHO". */
export function formatStartlistDog(entry: Pick<StartlistEntry, 'dog' | 'titles'>): string {
  return [entry.titles, entry.dog].filter((s) => s && s.trim()).join(' ').trim();
}

function classRank(name: string): number {
  const known = CLASS_ORDER[name];
  return known === undefined ? 9 : known;
}

/**
 * Ryhmittelee lähtölistan päivän, ryhmäajan ja luokan mukaan.
 *
 * Ryhmät järjestetään päivän, ajan (ap → ip → kp) ja luokan (ALO → AVO → VOI)
 * mukaan, osallistujat ryhmän sisällä järjestysnumeron mukaan. Otsikosta
 * jätetään pois se mitä ei ole: yksipäiväisessä kokeessa ei toisteta päivää,
 * eikä luokatonta koetta merkitä luokalla. Jos mitään ryhmittelevää tietoa ei
 * ole, palautuu yksi nimetön ryhmä.
 */
export function groupStartlist(entries: StartlistEntry[]): StartlistGroup[] {
  const rows = Array.isArray(entries) ? entries.filter((e) => e && typeof e === 'object') : [];
  if (rows.length === 0) return [];

  const multiDay = new Set(rows.map((e) => e.day).filter(Boolean)).size > 1;

  const groups = new Map<string, StartlistEntry[]>();
  for (const entry of rows) {
    const key = `${entry.day || ''}-${entry.time || ''}-${entry.class || ''}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(entry);
    else groups.set(key, [entry]);
  }

  return Array.from(groups.values())
    .map((bucket) => {
      const first = bucket[0];
      const parts: string[] = [];
      // Päivä toistetaan vain monipäiväisessä kokeessa — muuten se on jo
      // kokeen otsikossa.
      if (multiDay && first.day) parts.push(formatStartlistDay(first.day));
      if (first.time && TIME_LABELS[first.time]) parts.push(TIME_LABELS[first.time]);
      if (first.class) parts.push(first.class);
      return {
        key: `${first.day || ''}-${first.time || ''}-${first.class || ''}`,
        label: parts.join(' · '),
        entries: bucket
          .slice()
          .sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity)),
      };
    })
    .sort((a, b) => {
      const [ae, be] = [a.entries[0], b.entries[0]];
      if (ae.day !== be.day) return ae.day < be.day ? -1 : 1;
      const at = TIME_ORDER[ae.time] ?? 9;
      const bt = TIME_ORDER[be.time] ?? 9;
      if (at !== bt) return at - bt;
      const ac = classRank(ae.class);
      const bc = classRank(be.class);
      if (ac !== bc) return ac - bc;
      return ae.class < be.class ? -1 : ae.class > be.class ? 1 : 0;
    });
}
