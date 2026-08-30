import { describe, test, expect } from 'vitest';
import {
  startlistDataUrl,
  formatStartlistDay,
  formatStartlistDog,
  groupStartlist,
} from '../src/startlist.js';
import type { StartlistEntry } from '../src/startlist.js';

function entry(over: Partial<StartlistEntry> = {}): StartlistEntry {
  return {
    class: 'ALO',
    day: '2026-08-29',
    time: 'ap',
    number: 1,
    handler: 'Mari Koivisto',
    dog: 'PUREFIELD BLOSSOM',
    reg_no: 'FI42871/24',
    titles: '',
    ...over,
  };
}

describe('startlistDataUrl', () => {
  test('rakentaa polun id:stä', () => {
    expect(startlistDataUrl('https://trotor.github.io/koetutka', 'TYhHtp0Yh-')).toBe(
      'https://trotor.github.io/koetutka/startlists/TYhHtp0Yh-.json',
    );
  });

  test('toimii suhteellisella baseurlilla ja enkoodaa id:n', () => {
    expect(startlistDataUrl('.', 'a/b')).toBe('./startlists/a%2Fb.json');
  });
});

describe('formatStartlistDay', () => {
  test('muotoilee viikonpäivän ja päivän', () => {
    expect(formatStartlistDay('2026-08-29')).toBe('La 29.8.');
  });

  test('tyhjä kun päivä ei jäsenny', () => {
    expect(formatStartlistDay('')).toBe('');
    expect(formatStartlistDay('29.8.2026')).toBe('');
  });
});

describe('formatStartlistDog', () => {
  test('liittää tittelit nimen eteen', () => {
    expect(formatStartlistDog({ dog: 'VELHO', titles: 'FI KVA-WT' })).toBe('FI KVA-WT VELHO');
  });

  test('pelkkä nimi kun titteleitä ei ole', () => {
    expect(formatStartlistDog({ dog: 'VELHO', titles: '' })).toBe('VELHO');
  });
});

describe('groupStartlist', () => {
  test('tyhjä lista -> ei ryhmiä', () => {
    expect(groupStartlist([])).toEqual([]);
  });

  test('järjestää osallistujat numeron mukaan', () => {
    const groups = groupStartlist([
      entry({ number: 3, dog: 'C' }),
      entry({ number: 1, dog: 'A' }),
      entry({ number: 2, dog: 'B' }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries.map((e) => e.dog)).toEqual(['A', 'B', 'C']);
  });

  test('numeroton menee viimeiseksi', () => {
    const groups = groupStartlist([
      entry({ number: null, dog: 'X' }),
      entry({ number: 2, dog: 'B' }),
    ]);
    expect(groups[0].entries.map((e) => e.dog)).toEqual(['B', 'X']);
  });

  test('ryhmittelee luokan mukaan ALO -> AVO -> VOI', () => {
    const groups = groupStartlist([
      entry({ class: 'VOI' }),
      entry({ class: 'ALO' }),
      entry({ class: 'AVO' }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['aamupäivä · ALO', 'aamupäivä · AVO', 'aamupäivä · VOI']);
  });

  test('tuntematon luokka viimeiseksi, aakkosjärjestyksessä', () => {
    const groups = groupStartlist([
      entry({ class: 'SM' }),
      entry({ class: 'ALO' }),
      entry({ class: 'KP' }),
    ]);
    expect(groups.map((g) => g.entries[0].class)).toEqual(['ALO', 'KP', 'SM']);
  });

  test('aikajärjestys ap -> ip -> kp', () => {
    const groups = groupStartlist([
      entry({ time: 'kp' }),
      entry({ time: 'ip' }),
      entry({ time: 'ap' }),
    ]);
    expect(groups.map((g) => g.entries[0].time)).toEqual(['ap', 'ip', 'kp']);
  });

  test('yksipäiväisessä kokeessa päivää ei toisteta otsikossa', () => {
    const groups = groupStartlist([entry(), entry({ number: 2 })]);
    expect(groups[0].label).toBe('aamupäivä · ALO');
  });

  test('monipäiväisessä kokeessa päivä on otsikossa ja päivät järjestyksessä', () => {
    const groups = groupStartlist([
      entry({ day: '2026-08-30', time: 'ap' }),
      entry({ day: '2026-08-29', time: 'ip' }),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      'La 29.8. · iltapäivä · ALO',
      'Su 30.8. · aamupäivä · ALO',
    ]);
  });

  test('luokaton koe ilman ryhmäaikaa -> yksi nimetön ryhmä', () => {
    const groups = groupStartlist([
      entry({ class: '', time: '', day: '', number: 1 }),
      entry({ class: '', time: '', day: '', number: 2 }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('');
    expect(groups[0].entries).toHaveLength(2);
  });

  test('avain erottaa ryhmät toisistaan', () => {
    const groups = groupStartlist([entry({ class: 'ALO' }), entry({ class: 'AVO' })]);
    expect(new Set(groups.map((g) => g.key)).size).toBe(2);
  });
});
