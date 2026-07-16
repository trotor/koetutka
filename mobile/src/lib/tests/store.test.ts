import { describe, test, expect, beforeEach, vi } from 'vitest';

// notifications importoi notifeen (natiivimoduuli) → pakko mockata.
vi.mock('../notifications', () => ({
  DEFAULT_NOTIFICATION_SETTINGS: { enabled: false, daysBefore: 7, hourOfDay: 9 },
  rescheduleAll: vi.fn(),
  requestPermission: vi.fn(),
  cancelAll: vi.fn(),
}));
// Estetään oikeat AsyncStorage-kirjoitukset persist():stä.
vi.mock('../preferences', () => ({
  loadPrefs: vi.fn(),
  savePrefs: vi.fn(),
}));

import { useStore } from '../store';
import { rescheduleAll } from '../notifications';

beforeEach(() => {
  useStore.setState({ favorites: new Set(), favoriteColors: new Map(), colorLabels: {} });
});

describe('setFavoriteColor', () => {
  test('värin valinta ei-suosikille lisää sen suosikkeihin', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.get('e1')).toBe('red');
  });

  test('värin vaihto säilyttää suosikkiuden', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    useStore.getState().setFavoriteColor('e1', 'blue');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.get('e1')).toBe('blue');
  });

  test('oletusväri poistaa merkinnän mutta säilyttää suosikin', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    useStore.getState().setFavoriteColor('e1', 'default');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });
});

describe('syncNotifications vain jäsenyyden muuttuessa', () => {
  beforeEach(() => {
    useStore.setState({
      favorites: new Set(),
      favoriteColors: new Map(),
      colorLabels: {},
      events: [],
      notifications: { enabled: true, daysBefore: 7, hourOfDay: 9 },
    });
    vi.mocked(rescheduleAll).mockClear();
  });

  test('värin asetus ei-suosikille synkkaa ilmoitukset (jäsenyys muuttuu)', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    expect(vi.mocked(rescheduleAll)).toHaveBeenCalledTimes(1);
  });

  test('värin vaihto olemassa olevalle suosikille ei synkkaa uudelleen', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    expect(vi.mocked(rescheduleAll)).toHaveBeenCalledTimes(1);

    useStore.getState().setFavoriteColor('e1', 'blue');
    expect(vi.mocked(rescheduleAll)).toHaveBeenCalledTimes(1);
  });

  test('suosikin poisto synkkaa ilmoitukset uudelleen (jäsenyys muuttuu)', () => {
    useStore.getState().setFavoriteColor('e1', 'red');
    expect(vi.mocked(rescheduleAll)).toHaveBeenCalledTimes(1);

    useStore.getState().toggleFavorite('e1');
    expect(vi.mocked(rescheduleAll)).toHaveBeenCalledTimes(2);
  });
});

describe('toggleFavorite siivoaa värin', () => {
  test('suosikin poisto poistaa myös värin', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().toggleFavorite('e1'); // poistaa suosikeista
    expect(useStore.getState().favorites.has('e1')).toBe(false);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });

  test('uudelleen lisätty suosikki saa oletusvärin', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().toggleFavorite('e1');
    useStore.getState().toggleFavorite('e1');
    expect(useStore.getState().favorites.has('e1')).toBe(true);
    expect(useStore.getState().favoriteColors.has('e1')).toBe(false);
  });

  test('ei kosketa muiden kokeiden värejä', () => {
    useStore.getState().setFavoriteColor('e1', 'blue');
    useStore.getState().setFavoriteColor('e2', 'red');
    useStore.getState().toggleFavorite('e1');
    expect(useStore.getState().favoriteColors.get('e2')).toBe('red');
  });
});

describe('setColorLabel', () => {
  test('trimmaa nimen', () => {
    useStore.getState().setColorLabel('red', '  Ilmoittauduttu  ');
    expect(useStore.getState().colorLabels.red).toBe('Ilmoittauduttu');
  });

  test('tyhjä nimi poistaa merkinnän', () => {
    useStore.getState().setColorLabel('red', 'Menossa');
    useStore.getState().setColorLabel('red', '   ');
    expect(useStore.getState().colorLabels.red).toBeUndefined();
  });
});
