import type { Event } from './types.js';

/**
 * Vuodet, joiden datatiedostot (`koetutka_YYYY.json`) ladataan: kuluva ja
 * seuraava. Seuraavan vuoden tiedosto ilmestyy syksyllä, kun SNJ julkaisee
 * kalenterin — siihen asti sen lataus epäonnistuu ja se jätetään pois.
 */
export function dataYears(today: Date = new Date()): number[] {
  const year = today.getFullYear();
  return [year, year + 1];
}

/**
 * Yhdistää vuosikohtaiset koelistat yhdeksi. Saman id:n koe esiintyy vain
 * kerran (myöhempi lista voittaa); kokeet ilman id:tä säilytetään sellaisenaan.
 * Tulos on järjestetty alkupäivän mukaan.
 */
export function mergeYearData(lists: Event[][]): Event[] {
  const byId = new Map<string, Event>();
  const withoutId: Event[] = [];
  for (const list of lists) {
    for (const event of list) {
      if (event.id) byId.set(event.id, event);
      else withoutId.push(event);
    }
  }
  return [...byId.values(), ...withoutId].sort((a, b) =>
    (a.date_sort || '').localeCompare(b.date_sort || ''),
  );
}
