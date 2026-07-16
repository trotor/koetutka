import { describe, test, expect } from 'vitest';
import {
  FAVORITE_COLORS,
  DEFAULT_COLOR_KEY,
  isColorKey,
  resolveColor,
  colorKeyFor,
  setColorFor,
  removeColorFor,
  setLabelFor,
  labelFor,
  colorName,
  countByColor,
  groupByColor,
  type ColorKey,
} from '../favorite-colors';

// Moduuli tarvitsee kokeesta vain id:n → ei tarvetta rakentaa koko Event-oliota.
function evt(id: string) {
  return { id };
}

describe('paletti', () => {
  test('oletusväri on nykyinen keltainen eikä ulkoasu muutu', () => {
    expect(resolveColor(DEFAULT_COLOR_KEY)).toBe('#d97706');
  });

  test('paletissa on 5 uniikkia avainta ja uniikit värit', () => {
    const keys = FAVORITE_COLORS.map((c) => c.key);
    const colors = FAVORITE_COLORS.map((c) => c.color);
    expect(keys).toEqual(['default', 'red', 'blue', 'green', 'purple']);
    expect(new Set(colors).size).toBe(5);
  });

  test('isColorKey tunnistaa paletin avaimet ja hylkää muut', () => {
    expect(isColorKey('red')).toBe(true);
    expect(isColorKey('magenta')).toBe(false);
    expect(isColorKey(undefined)).toBe(false);
    expect(isColorKey(7)).toBe(false);
  });

  test('resolveColor palauttaa oletusvärin tuntemattomalle ja puuttuvalle avaimelle', () => {
    expect(resolveColor('magenta')).toBe('#d97706');
    expect(resolveColor(undefined)).toBe('#d97706');
    expect(resolveColor('blue')).toBe('#2563eb');
  });

  test('colorName palauttaa paletin oletusnimen', () => {
    expect(colorName('red')).toBe('Punainen');
  });
});

describe('colorKeyFor', () => {
  test('puuttuva merkintä tarkoittaa oletusväriä', () => {
    expect(colorKeyFor(new Map(), 'e1')).toBe('default');
  });

  test('palauttaa asetetun värin', () => {
    expect(colorKeyFor(new Map<string, ColorKey>([['e1', 'blue']]), 'e1')).toBe('blue');
  });
});

describe('setColorFor / removeColorFor', () => {
  test('asettaa värin eikä mutatoi alkuperäistä', () => {
    const before = new Map<string, ColorKey>();
    const after = setColorFor(before, 'e1', 'red');
    expect(after.get('e1')).toBe('red');
    expect(before.size).toBe(0);
  });

  test('oletusväri poistaa merkinnän (oletus ei vie tilaa)', () => {
    const before = new Map<string, ColorKey>([['e1', 'red']]);
    const after = setColorFor(before, 'e1', 'default');
    expect(after.has('e1')).toBe(false);
  });

  test('removeColorFor poistaa merkinnän eikä mutatoi alkuperäistä', () => {
    const before = new Map<string, ColorKey>([['e1', 'red'], ['e2', 'blue']]);
    const after = removeColorFor(before, 'e1');
    expect(after.has('e1')).toBe(false);
    expect(after.get('e2')).toBe('blue');
    expect(before.has('e1')).toBe(true);
  });
});

describe('setLabelFor / labelFor', () => {
  test('asettaa trimmatun nimen eikä mutatoi alkuperäistä', () => {
    const before = {};
    const after = setLabelFor(before, 'red', '  Ilmoittauduttu  ');
    expect(after.red).toBe('Ilmoittauduttu');
    expect(before).toEqual({});
  });

  test('tyhjä tai pelkkiä välilyöntejä poistaa nimen', () => {
    const after = setLabelFor({ red: 'Ilmoittauduttu' }, 'red', '   ');
    expect(after.red).toBeUndefined();
  });

  test('labelFor palauttaa tyhjän merkkijonon kun nimeä ei ole', () => {
    expect(labelFor({}, 'red')).toBe('');
    expect(labelFor({ red: 'Menossa' }, 'red')).toBe('Menossa');
  });
});

describe('countByColor', () => {
  test('laskee värittömät oletusväriin', () => {
    const colors = new Map<string, ColorKey>([['e2', 'red']]);
    const counts = countByColor([evt('e1'), evt('e2'), evt('e3')], colors);
    expect(counts.get('default')).toBe(2);
    expect(counts.get('red')).toBe(1);
    expect(counts.get('blue')).toBeUndefined();
  });
});

describe('groupByColor', () => {
  test('ryhmittelee paletin järjestyksessä ja jättää tyhjät ryhmät pois', () => {
    const colors = new Map<string, ColorKey>([['e2', 'purple'], ['e3', 'red']]);
    const groups = groupByColor([evt('e1'), evt('e2'), evt('e3')], colors);
    expect(groups.map((g) => g.key)).toEqual(['default', 'red', 'purple']);
    expect(groups[0].data.map((e) => e.id)).toEqual(['e1']);
    expect(groups[2].data.map((e) => e.id)).toEqual(['e2']);
  });

  test('säilyttää annetun järjestyksen ryhmän sisällä', () => {
    const colors = new Map<string, ColorKey>([['b', 'red'], ['a', 'red']]);
    const groups = groupByColor([evt('b'), evt('a')], colors);
    expect(groups[0].data.map((e) => e.id)).toEqual(['b', 'a']);
  });
});
