import { describe, test, expect } from 'vitest';
import { snjEventUrl, snjStartListUrl, hasStartList } from '../src/snj.js';

describe('snjEventUrl', () => {
  test('rakentaa polun tyypistä ja id:stä', () => {
    expect(snjEventUrl({ type: 'NOME-B', id: 'TYhHtp0Yh-' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-B/TYhHtp0Yh-',
    );
  });

  test('enkoodaa välilyönnin tyypissä', () => {
    expect(snjEventUrl({ type: 'NOME-A SM', id: 'abc' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-A%20SM/abc',
    );
  });

  test('enkoodaa skandit tyypissä', () => {
    expect(snjEventUrl({ type: 'EPÄVIRALLINEN', id: 'abc' })).toBe(
      'https://koekalenteri.snj.fi/event/EP%C3%84VIRALLINEN/abc',
    );
  });
});

describe('snjStartListUrl', () => {
  test('rakentaa lähtölistan polun id:stä', () => {
    expect(snjStartListUrl({ id: 'TYhHtp0Yh-' })).toBe(
      'https://koekalenteri.snj.fi/startlist/TYhHtp0Yh-',
    );
  });
});

describe('hasStartList', () => {
  test('tosi kun osallistujat on valittu tai kutsuttu', () => {
    expect(hasStartList({ state: 'picked' })).toBe(true);
    expect(hasStartList({ state: 'invited' })).toBe(true);
  });

  test('epätosi ennen valintaa ja perutulle', () => {
    expect(hasStartList({ state: 'confirmed' })).toBe(false);
    expect(hasStartList({ state: 'tentative' })).toBe(false);
    expect(hasStartList({ state: 'cancelled' })).toBe(false);
  });

  test('epätosi kun tila puuttuu', () => {
    expect(hasStartList({})).toBe(false);
  });
});
