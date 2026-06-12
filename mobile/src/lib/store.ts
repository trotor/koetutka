import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { loadPrefs, savePrefs } from './preferences';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  rescheduleAll,
  requestPermission,
  cancelAll,
} from './notifications';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  notifications: NotificationSettings;
  prefsLoaded: boolean;
}

interface Actions {
  initFromStorage: () => Promise<void>;
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
  setNotifications: (next: Partial<NotificationSettings>) => Promise<void>;
  syncNotifications: () => Promise<void>;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: true,
  onlyRegistrationOpen: false,
};

function persist(state: State) {
  void savePrefs({
    userLocation: state.userLocation,
    filters: state.filters,
    favorites: state.favorites,
    notifications: state.notifications,
  });
}

export const useStore = create<State & Actions>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,
  favorites: new Set(),
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      favorites: prefs.favorites,
      notifications: prefs.notifications,
      prefsLoaded: true,
    });
  },

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
      void get().syncNotifications();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => {
    set({ userLocation });
    persist(get());
  },

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters });
    persist(get());
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    persist(get());
  },

  toggleFavorite: (id: string) => {
    const favorites = new Set(get().favorites);
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    set({ favorites });
    persist(get());
    void get().syncNotifications();
  },

  setNotifications: async (partial) => {
    const prev = get().notifications;
    const next = { ...prev, ...partial };
    if (next.enabled && !prev.enabled) {
      const ok = await requestPermission();
      if (!ok) {
        return;
      }
    }
    set({ notifications: next });
    persist(get());
    if (!next.enabled) {
      await cancelAll();
    } else {
      await get().syncNotifications();
    }
  },

  syncNotifications: async () => {
    const state = get();
    if (!state.notifications.enabled) return;
    const favs = state.events.filter((e) => state.favorites.has(e.id));
    await rescheduleAll(favs, state.notifications);
  },
}));
