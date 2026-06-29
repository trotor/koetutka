/**
 * Koordinaattipari: [lat, lon]. SNJ-skripti tuottaa tämän muodossa
 * koordinaatit löytyessä, tai null jos paikkakuntaa ei voitu geokoodata.
 */
export type Coordinates = [number, number];

/** Yhteyshenkilön tiedot (official, secretary). */
export interface Person {
  name: string;
  phone: string;
  email: string;
}

/** Yhden luokan tiedot tapahtuman classes-listassa. */
export interface Class {
  class: string;
  date: string;
  /** Paikkamäärä kyseiseen luokkaan. Voi puuttua tai olla 0 jos ei ilmoitettu. */
  places?: number;
  /** Ilmoittautuneiden määrä (tilannekuva datan haetusta hetkestä). */
  entries?: number;
  [key: string]: unknown;
}

/** Yhden luokan paikkarivi (listClassPlaces). */
export interface ClassPlaces {
  /**
   * Luokan nimi (esim. "ALO"). Tyhjä merkkijono tarkoittaa kokonaismäärä-riviä
   * ("Yhteensä"), jota käytetään kun luokkakohtaista erittelyä ei ole.
   */
  class: string;
  places: number;
  /**
   * Päiväleima esim. "La 6.6." jos koe on monipäiväinen, muuten null
   * (yksipäiväisessä kokeessa päivä on sama kuin kokeen päivämäärä).
   */
  day: string | null;
}

/**
 * Hinta voi olla:
 * - number (yksinkertainen)
 * - string (esim. "" jos ei tiedossa)
 * - object jolla on `normal: number` ja mahdollisesti `optionalAdditionalCosts`
 */
export interface CostObject {
  normal?: number;
  optionalAdditionalCosts?: OptionalCost[];
  [key: string]: unknown;
}

export type Cost = number | string | CostObject | null | undefined;

export interface OptionalCost {
  name?: string;
  description?: string;
  cost?: number;
  [key: string]: unknown;
}

/** Yksittäinen koetapahtuma JSON-tiedostosta. */
export interface Event {
  id: string;
  type: string;
  levels: string;
  date: string;
  date_sort: string;
  end_date_sort: string | null;
  entry_date: string;
  location: string;
  coordinates: Coordinates | null;
  name: string;
  organizer: string;
  official: Person;
  secretary: Person;
  judges: string[];
  description: string;
  cost: Cost;
  cost_member: Cost;
  classes: Class[];
  /**
   * Kokeen kokonaispaikkamäärä. Käytetään kun classes-listassa ei ole
   * per-luokka-paikkoja (esim. alustavat ja WT-kokeet, joissa luokkakohtaiset
   * määrät voivat vielä muuttua). Voi puuttua.
   */
  places?: number;
  /** Lasketaan ajoittain UI:ssa (addDistances). */
  distance?: number | null;
}

/** Käyttäjän valitsema sijainti. */
export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
}

/** Suodatusasetukset (filterEvents). */
export interface FilterOptions {
  searchTerm?: string;
  activeTypes?: Set<string>;
  activeLevels?: Set<string>;
  maxDistanceKm?: number | null;
  hidePast?: boolean;
  /** Jos true, näytetään vain kokeet joiden ilmoittautuminen on parhaillaan auki. */
  onlyRegistrationOpen?: boolean;
  /** Päivämäärä jonka mukaan menneet ja ilmoittautumisaika määritellään (oletuksena tänään). */
  today?: Date;
}
