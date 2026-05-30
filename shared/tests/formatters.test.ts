import { describe, test, expect } from 'vitest';
import {
  getCostValue,
  getOptionalCosts,
} from '../src/formatters.js';

describe('getCostValue', () => {
  test('null tai undefined tai tyhjä palauttaa null', () => {
    expect(getCostValue(null)).toBe(null);
    expect(getCostValue(undefined)).toBe(null);
    expect(getCostValue('')).toBe(null);
  });

  test('numero palautetaan sellaisenaan', () => {
    expect(getCostValue(45)).toBe(45);
    expect(getCostValue(0)).toBe(0);
  });

  test('objekti jolla on normal palauttaa normalin', () => {
    expect(getCostValue({ normal: 35 })).toBe(35);
  });

  test('objekti ilman normalia palauttaa null', () => {
    expect(getCostValue({ optionalAdditionalCosts: [] })).toBe(null);
  });
});

describe('getOptionalCosts', () => {
  test('objektista palautetaan optionalAdditionalCosts', () => {
    const costs = [{ name: 'Ruokailu', cost: 10 }];
    expect(getOptionalCosts({ normal: 35, optionalAdditionalCosts: costs })).toEqual(costs);
  });

  test('numero palautetaan tyhjänä', () => {
    expect(getOptionalCosts(45)).toEqual([]);
  });

  test('null palautetaan tyhjänä', () => {
    expect(getOptionalCosts(null)).toEqual([]);
  });
});
