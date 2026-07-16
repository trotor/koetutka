import { describe, test, expect } from 'vitest';
import { serializePrefs, deserializePrefs, type StoredPrefs } from '../preferences';
import { DEFAULT_NOTIFICATION_SETTINGS } from '../notifications.types';
import type { ColorKey } from '../favorite-colors';

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
      hidden: new Set(),
      calendarAdded: new Set(),
      showHidden: false,
      notifications: { enabled: true, daysBefore: 7, hourOfDay: 9 },
      sortBy: 'distance',
      whatsNewLastSeenVersion: null,
      favoriteColors: new Map(),
      colorLabels: {},
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

  test('round-trippaa sortBy', () => {
    const prefs: StoredPrefs = {
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
      sortBy: 'date',
      whatsNewLastSeenVersion: null,
      favoriteColors: new Map(),
      colorLabels: {},
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.sortBy).toBe('date');
  });

  test('deserializePrefs antaa sortBy-defaultin (distance) vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: [],
    });
    expect(deserializePrefs(oldJson).sortBy).toBe('distance');
  });

  test('round-trippaa whatsNewLastSeenVersion', () => {
    const prefs: StoredPrefs = {
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
      whatsNewLastSeenVersion: '1.2.0',
      favoriteColors: new Map(),
      colorLabels: {},
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.whatsNewLastSeenVersion).toBe('1.2.0');
  });

  test('whatsNewLastSeenVersion default on null vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: [],
    });
    expect(deserializePrefs(oldJson).whatsNewLastSeenVersion).toBeNull();
  });

  test('round-trippaa hidden ja showHidden', () => {
    const prefs: StoredPrefs = {
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
      hidden: new Set(['h1', 'h2']),
      calendarAdded: new Set(),
      showHidden: true,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      sortBy: 'distance',
      whatsNewLastSeenVersion: null,
      favoriteColors: new Map(),
      colorLabels: {},
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.hidden).toEqual(new Set(['h1', 'h2']));
    expect(back.showHidden).toBe(true);
  });

  test('hidden/showHidden defaultit vanhalle JSONille', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: [],
    });
    const back = deserializePrefs(oldJson);
    expect(back.hidden).toEqual(new Set());
    expect(back.showHidden).toBe(false);
  });

  test('calendarAdded säilyy serialize→deserialize-kierroksessa', () => {
    const base = deserializePrefs(''); // DEFAULTS
    const prefs = { ...base, calendarAdded: new Set(['e1:event', 'e2:registration']) };
    const round = deserializePrefs(serializePrefs(prefs));
    expect(Array.from(round.calendarAdded).sort()).toEqual(['e1:event', 'e2:registration']);
  });

  test('vanha data ilman calendarAdded-kenttää → tyhjä set', () => {
    const round = deserializePrefs('{"userLocation":null,"filters":{}}');
    expect(round.calendarAdded).toEqual(new Set());
  });

  test('round-trippaa favoriteColors ja colorLabels', () => {
    const base = deserializePrefs(''); // DEFAULTS
    const prefs: StoredPrefs = {
      ...base,
      favorites: new Set(['e1', 'e2']),
      favoriteColors: new Map<string, ColorKey>([['e1', 'red'], ['e2', 'purple']]),
      colorLabels: { red: 'Ilmoittauduttu' },
    };
    const back = deserializePrefs(serializePrefs(prefs));
    expect(back.favoriteColors.get('e1')).toBe('red');
    expect(back.favoriteColors.get('e2')).toBe('purple');
    expect(back.colorLabels).toEqual({ red: 'Ilmoittauduttu' });
  });

  test('vanha JSON ilman värikenttiä → tyhjät defaultit (migraatio)', () => {
    const oldJson = JSON.stringify({
      userLocation: null,
      filters: { searchTerm: '', activeTypes: [], activeLevels: [] },
      favorites: ['e1'],
    });
    const back = deserializePrefs(oldJson);
    expect(back.favorites).toEqual(new Set(['e1']));
    expect(back.favoriteColors).toEqual(new Map());
    expect(back.colorLabels).toEqual({});
  });

  test('tuntematon väriavain pudotetaan latauksessa', () => {
    const json = JSON.stringify({
      userLocation: null,
      filters: {},
      favorites: ['e1', 'e2'],
      favoriteColors: { e1: 'magenta', e2: 'blue' },
      colorLabels: { magenta: 'Roska', blue: 'Menossa' },
    });
    const back = deserializePrefs(json);
    expect(back.favoriteColors.has('e1')).toBe(false);
    expect(back.favoriteColors.get('e2')).toBe('blue');
    expect(back.colorLabels).toEqual({ blue: 'Menossa' });
  });

  test('tyhjä nimi ei päädy talteen', () => {
    const json = JSON.stringify({
      userLocation: null,
      filters: {},
      favorites: [],
      colorLabels: { red: '   ' },
    });
    expect(deserializePrefs(json).colorLabels).toEqual({});
  });

  test('viallinen JSON → tyhjät värikentät', () => {
    const back = deserializePrefs('{not json');
    expect(back.favoriteColors).toEqual(new Map());
    expect(back.colorLabels).toEqual({});
  });
});
