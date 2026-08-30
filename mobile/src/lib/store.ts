import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions, SortBy } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { clearStartlistCache } from './startlist';
import { loadPrefs, savePrefs } from './preferences';
import { calendarAddedKey, type CalendarType } from './calendar-added';
import {
  setColorFor,
  removeColorFor,
  setLabelFor,
  type ColorKey,
} from './favorite-colors';
import pkg from '../../package.json';
import {
  fetchWhatsNew,
  getCachedWhatsNew,
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
  hidden: Set<string>;
  calendarAdded: Set<string>;
  showHidden: boolean;
  notifications: NotificationSettings;
  sortBy: SortBy;
  whatsNewLastSeenVersion: string | null;
  favoriteColors: Map<string, ColorKey>;
  colorLabels: Record<string, string>;
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
  setFavoriteColor: (id: string, key: ColorKey) => void;
  setColorLabel: (key: ColorKey, label: string) => void;
  toggleHidden: (id: string) => void;
  markCalendarAdded: (eventId: string, type: CalendarType) => void;
  setShowHidden: (show: boolean) => void;
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
    hidden: state.hidden,
    calendarAdded: state.calendarAdded,
    showHidden: state.showHidden,
    notifications: state.notifications,
    sortBy: state.sortBy,
    whatsNewLastSeenVersion: state.whatsNewLastSeenVersion,
    favoriteColors: state.favoriteColors,
    colorLabels: state.colorLabels,
  });
}

export const useStore = create<State & Actions>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,
  favorites: new Set(),
  hidden: new Set(),
  calendarAdded: new Set(),
  showHidden: false,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  sortBy: 'distance',
  whatsNewLastSeenVersion: null,
  favoriteColors: new Map(),
  colorLabels: {},
  whatsNew: { visible: false, content: null, manual: false },
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      favorites: prefs.favorites,
      hidden: prefs.hidden,
      calendarAdded: prefs.calendarAdded,
      showHidden: prefs.showHidden,
      notifications: prefs.notifications,
      sortBy: prefs.sortBy,
      whatsNewLastSeenVersion: prefs.whatsNewLastSeenVersion,
      favoriteColors: prefs.favoriteColors,
      colorLabels: prefs.colorLabels,
      prefsLoaded: true,
    });
  },

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    clearStartlistCache();
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
    let favoriteColors = get().favoriteColors;
    if (favorites.has(id)) {
      favorites.delete(id);
      favoriteColors = removeColorFor(favoriteColors, id); // ei orpoja värejä
    } else {
      favorites.add(id);
    }
    set({ favorites, favoriteColors });
    persist(get());
    void get().syncNotifications();
  },

  setFavoriteColor: (id: string, key: ColorKey) => {
    const favorites = new Set(get().favorites);
    const wasFavorite = favorites.has(id);
    if (!wasFavorite) favorites.add(id); // värin valinta implikoi suosikoinnin
    set({ favorites, favoriteColors: setColorFor(get().favoriteColors, id, key) });
    persist(get());
    if (!wasFavorite) void get().syncNotifications();
  },

  setColorLabel: (key: ColorKey, label: string) => {
    set({ colorLabels: setLabelFor(get().colorLabels, key, label) });
    persist(get());
  },

  toggleHidden: (id: string) => {
    const hidden = new Set(get().hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    set({ hidden });
    persist(get());
  },

  markCalendarAdded: (eventId, type) => {
    const key = calendarAddedKey(eventId, type);
    if (get().calendarAdded.has(key)) return;
    const calendarAdded = new Set(get().calendarAdded);
    calendarAdded.add(key);
    set({ calendarAdded });
    persist(get());
  },

  setShowHidden: (showHidden: boolean) => {
    set({ showHidden });
    persist(get());
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
    // Näytä heti välimuistilla/varatekstillä, ettei avaus tunnu jähmeältä.
    const cached = await getCachedWhatsNew();
    set({ whatsNew: { visible: true, content: pickManualContent(APP_VERSION, cached), manual: true } });
    // Päivitä taustalla tuoreella sisällöllä, jos modaali on yhä auki manuaalisena.
    const fresh = await fetchWhatsNew();
    const state = get().whatsNew;
    if (fresh && state.visible && state.manual) {
      set({ whatsNew: { visible: true, content: pickManualContent(APP_VERSION, fresh), manual: true } });
    }
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
