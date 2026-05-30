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
  [key: string]: unknown;
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
  /** Päivämäärä jonka mukaan menneet määritellään (oletuksena tänään). */
  today?: Date;
}
