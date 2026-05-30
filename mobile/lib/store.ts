import { create } from 'zustand';
import type { Event, UserLocation, FilterOptions } from '@koetutka/shared';
import { fetchEventsWithFallback } from './data';

interface State {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  userLocation: UserLocation | null;
  filters: FilterOptions;
}

interface Actions {
  loadEvents: (year: number) => Promise<void>;
  setUserLocation: (location: UserLocation | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterOptions = {
  searchTerm: '',
  activeTypes: new Set(),
  activeLevels: new Set(),
  maxDistanceKm: null,
  hidePast: true,
};

export const useStore = create<State & Actions>((set) => ({
  events: [],
  isLoading: false,
  error: null,
  userLocation: null,
  filters: defaultFilters,

  loadEvents: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await fetchEventsWithFallback(year);
      set({ events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Tuntematon virhe', isLoading: false });
    }
  },

  setUserLocation: (userLocation) => set({ userLocation }),

  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
