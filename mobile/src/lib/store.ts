import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions, SortBy } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { loadPrefs, savePrefs } from './preferences';
import pkg from '../../package.json';
import {
  fetchWhatsNew,
  resolveWhatsNew,
  pickManualContent,
  type WhatsNewContent,
} from './whatsnew';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  rescheduleAll,
  requestPermission,
  cancelAll,
} from './notifications';

const APP_VERSION = pkg.version;

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  notifications: NotificationSettings;
  sortBy: SortBy;
  whatsNewLastSeenVersion: string | null;
  whatsNew: { visible: boolean; content: WhatsNewContent | null; manual: boolean };
  prefsLoaded: boolean;
}

interface Actions {
  initFromStorage: () => Promise<void>;
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  setSortBy: (next: SortBy) => void;
  toggleFavorite: (id: string) => void;
  setNotifications: (next: Partial<NotificationSettings>) => Promise<void>;
  syncNotifications: () => Promise<void>;
  checkWhatsNew: () => Promise<void>;
  openWhatsNew: () => Promise<void>;
  dismissWhatsNew: () => void;
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
    sortBy: state.sortBy,
    whatsNewLastSeenVersion: state.whatsNewLastSeenVersion,
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
  sortBy: 'distance',
  whatsNewLastSeenVersion: null,
  whatsNew: { visible: false, content: null, manual: false },
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      favorites: prefs.favorites,
      notifications: prefs.notifications,
      sortBy: prefs.sortBy,
      whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,
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

  setSortBy: (sortBy) => {
    set({ sortBy });
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

  checkWhatsNew: async () => {
    const data = await fetchWhatsNew();
    const content = resolveWhatsNew({
      current: APP_VERSION,
      lastSeen: get().whatsNewLastSeenVersion,
      data,
    });
    if (content) {
      set({ whatsNew: { visible: true, content, manual: false } });
    }
  },

  openWhatsNew: async () => {
    const data = await fetchWhatsNew();
    const content = pickManualContent(APP_VERSION, data);
    set({ whatsNew: { visible: true, content, manual: true } });
  },

  dismissWhatsNew: () => {
    const wasManual = get().whatsNew.manual;
    set({ whatsNew: { visible: false, content: null, manual: false } });
    if (!wasManual) {
      set({ whatsNewLastSeenVersion: APP_VERSION });
      persist(get());
    }
  },
}));
