import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';
import { loadPrefs, savePrefs } from './preferences';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
  favorites: Set<string>;
  prefsLoaded: boolean;
}

interface Actions {
  initFromStorage: () => Promise<void>;
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  toggleFavorite: (id: string) => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: false,
};

export const useStore = create<State & Actions>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,
  favorites: new Set(),
  prefsLoaded: false,

  initFromStorage: async () => {
    const prefs = await loadPrefs();
    set({
      userLocation: prefs.userLocation,
      filters: prefs.filters,
      favorites: prefs.favorites,
      prefsLoaded: true,
    });
  },

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => {
    set({ userLocation });
    void savePrefs({ userLocation, filters: get().filters, favorites: get().favorites });
  },

  setFilters: (partial) => {
    const filters = { ...get().filters, ...partial };
    set({ filters });
    void savePrefs({ userLocation: get().userLocation, filters, favorites: get().favorites });
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    void savePrefs({
      userLocation: get().userLocation,
      filters: defaultFilters,
      favorites: get().favorites,
    });
  },

  toggleFavorite: (id: string) => {
    const favorites = new Set(get().favorites);
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    set({ favorites });
    void savePrefs({
      userLocation: get().userLocation,
      filters: get().filters,
      favorites,
    });
  },
}));
