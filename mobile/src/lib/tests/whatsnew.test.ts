import { describe, test, expect } from 'vitest';
import {
  resolveWhatsNew,
  pickManualContent,
  FALLBACK_WELCOME,
  type WhatsNewData,
} from '../whatsnew';

const data: WhatsNewData = {
  welcome: { title: 'Tervetuloa', body: 'Esittely' },
  releases: [
    { version: '1.2.0', date: '2026-06-18', title: 'Lajittelu', items: ['Lajittelu', 'Mitä uutta'] },
    { version: '1.1.0', title: 'Vanha', items: ['Vanha juttu'] },
  ],
};

describe('resolveWhatsNew', () => {
  test('ensiasennus (lastSeen null) → welcome remotesta', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: null, data });
    expect(r).toEqual({ kind: 'welcome', title: 'Tervetuloa', body: 'Esittely' });
  });

  test('ensiasennus ilman remotea → varateksti', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: null, data: null });
    expect(r).toEqual({ kind: 'welcome', title: FALLBACK_WELCOME.title, body: FALLBACK_WELCOME.body });
  });

  test('päivitys → asennetun version release', () => {
    const r = resolveWhatsNew({ current: '1.2.0', lastSeen: '1.1.0', data });
    expect(r).toEqual({
      kind: 'release',
      version: '1.2.0',
      date: '2026-06-18',
      title: 'Lajittelu',
      items: ['Lajittelu', 'Mitä uutta'],
    });
  });

  test('päivitys mutta remotessa ei vielä tätä versiota → null', () => {
    const r = resolveWhatsNew({ current: '1.3.0', lastSeen: '1.2.0', data });
    expect(r).toBeNull();
  });

  test('sama versio jo nähty → null', () => {
    expect(resolveWhatsNew({ current: '1.2.0', lastSeen: '1.2.0', data })).toBeNull();
  });
});

describe('pickManualContent', () => {
  test('palauttaa asennetun version releasen', () => {
    const r = pickManualContent('1.2.0', data);
    expect(r).toMatchObject({ kind: 'release', version: '1.2.0' });
  });

  test('jos versiota ei löydy, palauttaa uusimman releasen', () => {
    const r = pickManualContent('9.9.9', data);
    expect(r).toMatchObject({ kind: 'release', version: '1.2.0' });
  });

  test('ilman releaseja palauttaa welcomen (varateksti jos remotea ei ole)', () => {
    const r = pickManualContent('1.2.0', null);
    expect(r).toEqual({ kind: 'welcome', title: FALLBACK_WELCOME.title, body: FALLBACK_WELCOME.body });
  });
});
