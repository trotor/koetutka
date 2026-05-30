import { describe, test, expect } from 'vitest';
import { haversine } from '../src/distance.js';

describe('haversine', () => {
  test('Helsinki–Tampere on noin 160 km', () => {
    // Helsinki: 60.1699, 24.9384
    // Tampere: 61.4978, 23.7610
    const distance = haversine(60.1699, 24.9384, 61.4978, 23.7610);
    expect(distance).toBeGreaterThan(155);
    expect(distance).toBeLessThan(165);
  });

  test('sama piste palauttaa 0', () => {
    expect(haversine(60, 25, 60, 25)).toBe(0);
  });

  test('symmetrinen — etäisyys A→B = B→A', () => {
    const ab = haversine(60.1699, 24.9384, 65.0121, 25.4651);
    const ba = haversine(65.0121, 25.4651, 60.1699, 24.9384);
    expect(ab).toBeCloseTo(ba, 5);
  });

  test('Helsinki–Oulu on noin 540 km', () => {
    // Oulu: 65.0121, 25.4651
    const distance = haversine(60.1699, 24.9384, 65.0121, 25.4651);
    expect(distance).toBeGreaterThan(530);
    expect(distance).toBeLessThan(550);
  });
});
