export type ColorKey = 'default' | 'red' | 'blue' | 'green' | 'purple';

export interface FavoriteColor {
  key: ColorKey;
  color: string;
  /** Paletin oletusnimi. Käytetään a11y-labeleissa ja placeholderina — ei näytetä
   *  selitteessä, jossa näkyy vain käyttäjän itse antama nimi. */
  name: string;
}

export const FAVORITE_COLORS: readonly FavoriteColor[] = [
  { key: 'default', color: '#d97706', name: 'Keltainen' },
  { key: 'red', color: '#dc2626', name: 'Punainen' },
  { key: 'blue', color: '#2563eb', name: 'Sininen' },
  { key: 'green', color: '#15803d', name: 'Vihreä' },
  { key: 'purple', color: '#7c3aed', name: 'Violetti' },
];

export const DEFAULT_COLOR_KEY: ColorKey = 'default';

export type FavoriteColors = ReadonlyMap<string, ColorKey>;
export type ColorLabels = Readonly<Record<string, string>>;

const BY_KEY = new Map<ColorKey, FavoriteColor>(FAVORITE_COLORS.map((c) => [c.key, c]));
const DEFAULT_ENTRY = BY_KEY.get(DEFAULT_COLOR_KEY) as FavoriteColor;

export function isColorKey(value: unknown): value is ColorKey {
  return typeof value === 'string' && BY_KEY.has(value as ColorKey);
}

/** Tuntematon tai puuttuva avain → oletusväri (suojaa vanhalta/tulevalta datalta). */
export function resolveColor(key: string | undefined): string {
  return (isColorKey(key) ? (BY_KEY.get(key) as FavoriteColor) : DEFAULT_ENTRY).color;
}

export function colorName(key: ColorKey): string {
  return (isColorKey(key) ? (BY_KEY.get(key) as FavoriteColor) : DEFAULT_ENTRY).name;
}

/** Puuttuva merkintä = oletusväri. */
export function colorKeyFor(colors: FavoriteColors, id: string): ColorKey {
  const key = colors.get(id);
  return isColorKey(key) ? key : DEFAULT_COLOR_KEY;
}

export function removeColorFor(colors: FavoriteColors, id: string): Map<string, ColorKey> {
  const next = new Map(colors);
  next.delete(id);
  return next;
}

/** Oletusväriä ei talleteta — se on puuttuvan merkinnän merkitys. */
export function setColorFor(colors: FavoriteColors, id: string, key: ColorKey): Map<string, ColorKey> {
  if (key === DEFAULT_COLOR_KEY) return removeColorFor(colors, id);
  const next = new Map(colors);
  next.set(id, key);
  return next;
}

export function setLabelFor(labels: ColorLabels, key: ColorKey, label: string): Record<string, string> {
  const next = { ...labels };
  const trimmed = label.trim();
  if (trimmed) next[key] = trimmed;
  else delete next[key];
  return next;
}

/** Käyttäjän antama nimi, tai '' jos nimeä ei ole. */
export function labelFor(labels: ColorLabels, key: ColorKey): string {
  return labels[key]?.trim() ?? '';
}

export function countByColor(
  events: readonly { id: string }[],
  colors: FavoriteColors,
): Map<ColorKey, number> {
  const counts = new Map<ColorKey, number>();
  for (const e of events) {
    const key = colorKeyFor(colors, e.id);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Paletin järjestyksessä, tyhjät ryhmät pois. Järjestys ryhmän sisällä säilyy. */
export function groupByColor<T extends { id: string }>(
  events: readonly T[],
  colors: FavoriteColors,
): { key: ColorKey; data: T[] }[] {
  return FAVORITE_COLORS.map((c) => ({
    key: c.key,
    data: events.filter((e) => colorKeyFor(colors, e.id) === c.key),
  })).filter((g) => g.data.length > 0);
}
