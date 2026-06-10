import { describe, test, expect } from 'vitest';
import { serializePrefs, deserializePrefs, type StoredPrefs } from '../preferences';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../notifications.types';

describe('serializePrefs / deserializePrefs', () => {
  test('round-trippaa userLocation, filtterit ja suosikit', () => {
    const prefs: StoredPrefs = {
      userLocation: { lat: 60.17, lng: 24.94, name: 'Helsinki' },
      filters: {
        searchTerm: 'nome',
        activeTypes: new Set(['NOME-B']),
        activeLevels: new Set(['ALO', 'AVO']),
        maxDistanceKm: 200,
        hidePast: true,
        onlyRegistrationOpen: true,
      },
      favorites: new Set(['evt-a', 'evt-b']),
      notifications: { enabled: true, daysBefore: 7, hourOfDay: 9 },
    };
    const json = serializePrefs(prefs);
    const back = deserializePrefs(json);
    expect(back.userLocation).toEqual(prefs.userLocation);
    expect(back.filters.activeTypes).toEqual(new Set(['NOME-B']));
    expect(back.filters.activeLevels).toEqual(new Set(['ALO', 'AVO']));
    expect(back.filters.maxDistanceKm).toBe(200);
    expect(back.filters.hidePast).toBe(true);
    expect(back.filters.onlyRegistrationOpen).toBe(true);
    expect(back.favorites).toEqual(new Set(['evt-a', 'evt-b']));
    expect(back.notifications).toEqual({ enabled: true, daysBefore: 7, hourOfDay: 9 });
  });

  test('deserializePrefs antaa default-notifikaatiot vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [], maxDistanceKm: null, hidePast: false },
      favorites: [],
    });
    const back = deserializePrefs(oldJson);
    expect(back.notifications).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });

  test('deserializePrefs palauttaa defaultit jos JSON on viallinen', () => {
    const back = deserializePrefs('{not json');
    expect(back.userLocation).toBe(null);
    expect(back.filters.activeTypes).toEqual(new Set());
    expect(back.favorites).toEqual(new Set());
  });

  test('deserializePrefs palauttaa defaultit tyhjälle stringille', () => {
    const back = deserializePrefs('');
    expect(back.userLocation).toBe(null);
    expect(back.favorites).toEqual(new Set());
  });

  test('deserializePrefs säilyttää suosikit vanhasta JSONista jossa ei ole favorites-kenttää', () => {
    // Backwards compatibility — old prefs format without favorites
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [], maxDistanceKm: null, hidePast: true },
    });
    const back = deserializePrefs(oldJson);
    expect(back.favorites).toEqual(new Set());
    expect(back.filters.hidePast).toBe(true);
  });
});
