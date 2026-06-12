import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterOptions, UserLocation } from '@koetutka/shared';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from './notifications.types';

const KEY = 'koetutka:prefs:v1';

export interface StoredPrefs {
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  notifications: NotificationSettings;
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
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
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
  notifications?: NotificationSettings;
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
    notifications: prefs.notifications,
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
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(parsed.notifications ?? {}),
      },
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
