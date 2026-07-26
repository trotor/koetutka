import { describe, test, expect } from 'vitest';
import { snjRegistrationUrl, snjStartListUrl, hasStartList, snjCalendarUrl, snjLink } from '../src/snj.js';

describe('snjRegistrationUrl', () => {
  test('rakentaa polun tyypistä ja id:stä', () => {
    expect(snjRegistrationUrl({ type: 'NOME-B', id: 'TYhHtp0Yh-' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-B/TYhHtp0Yh-',
    );
  });

  test('enkoodaa välilyönnin tyypissä', () => {
    expect(snjRegistrationUrl({ type: 'NOME-A SM', id: 'abc' })).toBe(
      'https://koekalenteri.snj.fi/event/NOME-A%20SM/abc',
    );
  });

  test('enkoodaa skandit tyypissä', () => {
    expect(snjRegistrationUrl({ type: 'EPÄVIRALLINEN', id: 'abc' })).toBe(
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
  test('tosi kun kutsut on lähetetty', () => {
    expect(hasStartList({ state: 'invited' })).toBe(true);
  });

  test('epätosi ennen kutsuja, valinnan jälkeenkin, ja perutulle', () => {
    expect(hasStartList({ state: 'picked' })).toBe(false);
    expect(hasStartList({ state: 'confirmed' })).toBe(false);
    expect(hasStartList({ state: 'tentative' })).toBe(false);
    expect(hasStartList({ state: 'cancelled' })).toBe(false);
  });

  test('epätosi kun tila puuttuu', () => {
    expect(hasStartList({})).toBe(false);
  });
});

describe('snjCalendarUrl', () => {
  test('palauttaa koekalenterin etusivun', () => {
    expect(snjCalendarUrl()).toBe('https://koekalenteri.snj.fi/');
  });
});

describe('snjLink', () => {
  const OPEN = { entry_start: '2026-07-01', entry_end: '2026-07-31' };
  const TODAY = new Date('2026-07-15T12:00:00+03:00');

  test('ilmo auki -> ilmoittautumislinkki', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'confirmed', ...OPEN } as never,
      TODAY,
    );
    expect(link).toEqual({
      kind: 'register',
      label: 'Ilmoittaudu SNJ:n koekalenterissa',
      url: 'https://koekalenteri.snj.fi/event/NOU/abc',
    });
  });

  test('osallistujat valittu -> ei lähtölistaa vielä, etusivu', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'picked', ...OPEN } as never,
      TODAY,
    );
    expect(link).toEqual({
      kind: 'calendar',
      label: 'Avaa SNJ:n koekalenteri',
      url: 'https://koekalenteri.snj.fi/',
    });
  });

  test('kutsut lähetetty -> lähtölistalinkki', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'invited', ...OPEN } as never,
      TODAY,
    );
    expect(link).toEqual({
      kind: 'startlist',
      label: 'Lue lähtölista',
      url: 'https://koekalenteri.snj.fi/startlist/abc',
    });
  });

  test('kutsut lähetetty ilman ilmoaikaa -> lähtölistalinkki', () => {
    const link = snjLink({ type: 'NOU', id: 'abc', state: 'invited' } as never, TODAY);
    expect(link.kind).toBe('startlist');
  });

  test('alustava koe ilmoaika auki -> ei ilmoittautumislinkkiä, etusivu', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'tentative', ...OPEN } as never,
      TODAY,
    );
    expect(link).toEqual({
      kind: 'calendar',
      label: 'Avaa SNJ:n koekalenteri',
      url: 'https://koekalenteri.snj.fi/',
    });
  });

  test('ilmo ei vielä auki -> etusivu', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'confirmed', entry_start: '2026-08-01', entry_end: '2026-08-20' } as never,
      TODAY,
    );
    expect(link).toEqual({
      kind: 'calendar',
      label: 'Avaa SNJ:n koekalenteri',
      url: 'https://koekalenteri.snj.fi/',
    });
  });

  test('ilmo mennyt ohi eikä lähtölistaa -> etusivu', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'confirmed', entry_start: '2026-06-01', entry_end: '2026-06-20' } as never,
      TODAY,
    );
    expect(link.kind).toBe('calendar');
  });

  test('peruttu koe -> etusivu, ei koskaan ilmoittautumista', () => {
    const link = snjLink(
      { type: 'NOU', id: 'abc', state: 'cancelled', ...OPEN } as never,
      TODAY,
    );
    expect(link.kind).toBe('calendar');
  });

  test('tuntematon tila ilman ilmoaikaa -> etusivu', () => {
    expect(snjLink({ type: 'NOU', id: 'abc' } as never, TODAY).kind).toBe('calendar');
  });
});
