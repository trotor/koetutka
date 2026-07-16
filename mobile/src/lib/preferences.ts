import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterOptions, UserLocation, SortBy } from '@koetutka/shared';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from './notifications.types';
import { isColorKey, type ColorKey } from './favorite-colors';

const KEY = 'koetutka:prefs:v1';

export interface StoredPrefs {
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  hidden: Set<string>;
  calendarAdded: Set<string>;
  showHidden: boolean;
  notifications: NotificationSettings;
  sortBy: SortBy;
  whatsNewLastSeenVersion: string | null;
  favoriteColors: Map<string, ColorKey>;
  colorLabels: Record<string, string>;
}

const DEFAULTS: StoredPrefs = {
  userLocation: null,
  filters: {
    searchTerm: '',
    activeTypes: new Set(),
    activeLevels: new Set(),
    maxDistanceKm: null,
    hidePast: true,
    onlyRegistrationOpen: false,
  },
  favorites: new Set(),
  hidden: new Set(),
  calendarAdded: new Set(),
  showHidden: false,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  sortBy: 'distance',
  whatsNewLastSeenVersion: null,
  favoriteColors: new Map(),
  colorLabels: {},
};

interface JsonShape {
  userLocation: UserLocation | null;
  filters: {
    searchTerm?: string;
    activeTypes?: string[];
    activeLevels?: string[];
    maxDistanceKm?: number | null;
    hidePast?: boolean;
    onlyRegistrationOpen?: boolean;
  };
  favorites?: string[];
  hidden?: string[];
  calendarAdded?: string[];
  showHidden?: boolean;
  notifications?: NotificationSettings;
  sortBy?: SortBy;
  whatsNewLastSeenVersion?: string | null;
  favoriteColors?: Record<string, string>;
  colorLabels?: Record<string, string>;
}

export function serializePrefs(prefs: StoredPrefs): string {
  const json: JsonShape = {
    userLocation: prefs.userLocation,
    filters: {
      searchTerm: prefs.filters.searchTerm,
      activeTypes: Array.from(prefs.filters.activeTypes ?? []),
      activeLevels: Array.from(prefs.filters.activeLevels ?? []),
      maxDistanceKm: prefs.filters.maxDistanceKm,
      hidePast: prefs.filters.hidePast,
      onlyRegistrationOpen: prefs.filters.onlyRegistrationOpen,
    },
    favorites: Array.from(prefs.favorites ?? []),
    hidden: Array.from(prefs.hidden ?? []),
    calendarAdded: Array.from(prefs.calendarAdded ?? []),
    showHidden: prefs.showHidden,
    notifications: prefs.notifications,
    sortBy: prefs.sortBy,
    whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,
    favoriteColors: Object.fromEntries(prefs.favoriteColors ?? new Map()),
    colorLabels: prefs.colorLabels ?? {},
  };
  return JSON.stringify(json);
}

export function deserializePrefs(text: string): StoredPrefs {
  if (!text) return DEFAULTS;
  try {
    const parsed = JSON.parse(text) as JsonShape;
    return {
      userLocation: parsed.userLocation ?? null,
      filters: {
        searchTerm: parsed.filters?.searchTerm ?? '',
        activeTypes: new Set(parsed.filters?.activeTypes ?? []),
        activeLevels: new Set(parsed.filters?.activeLevels ?? []),
        maxDistanceKm: parsed.filters?.maxDistanceKm ?? null,
        hidePast: parsed.filters?.hidePast ?? true,
        onlyRegistrationOpen: parsed.filters?.onlyRegistrationOpen ?? false,
      },
      favorites: new Set(parsed.favorites ?? []),
      hidden: new Set(parsed.hidden ?? []),
      calendarAdded: new Set(parsed.calendarAdded ?? []),
      showHidden: parsed.showHidden ?? false,
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(parsed.notifications ?? {}),
      },
      sortBy: parsed.sortBy ?? 'distance',
      whatsNewLastSeenVersion: parsed.whatsNewLastSeenVersion ?? null,
      favoriteColors: parseFavoriteColors(parsed.favoriteColors),
      colorLabels: parseColorLabels(parsed.colorLabels),
    };
  } catch {
    return DEFAULTS;
  }
}

export async function loadPrefs(): Promise<StoredPrefs> {
  const text = await AsyncStorage.getItem(KEY);
  return deserializePrefs(text ?? '');
}

export async function savePrefs(prefs: StoredPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, serializePrefs(prefs));
}

/** Pudottaa merkinnät joiden väriavain ei ole paletissa. */
function parseFavoriteColors(raw: Record<string, string> | undefined): Map<string, ColorKey> {
  const map = new Map<string, ColorKey>();
  for (const [id, key] of Object.entries(raw ?? {})) {
    if (isColorKey(key)) map.set(id, key);
  }
  return map;
}

/** Pudottaa tuntemattomat avaimet ja tyhjät nimet. */
function parseColorLabels(raw: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, label] of Object.entries(raw ?? {})) {
    if (isColorKey(key) && typeof label === 'string' && label.trim()) out[key] = label.trim();
  }
  return out;
}
