import { describe, test, expect } from 'vitest';
import { stateBadge, isCancelled, registrationClosedByState } from '../src/event-state.js';

describe('stateBadge', () => {
  test('alustava saa Alustava-merkin', () => {
    expect(stateBadge({ state: 'tentative' })).toEqual({ label: 'Alustava', tone: 'tentative' });
  });

  test('peruttu saa Peruttu-merkin', () => {
    expect(stateBadge({ state: 'cancelled' })).toEqual({ label: 'Peruttu', tone: 'cancelled' });
  });

  test('picked kertoo että osallistujat on valittu', () => {
    expect(stateBadge({ state: 'picked' })).toEqual({
      label: 'Osallistujat valittu',
      tone: 'closed',
    });
  });

  test('invited kertoo että kutsut on lähetetty', () => {
    expect(stateBadge({ state: 'invited' })).toEqual({
      label: 'Kutsut lähetetty',
      tone: 'closed',
    });
  });

  test('vahvistettu ei tarvitse merkkiä', () => {
    expect(stateBadge({ state: 'confirmed' })).toBeNull();
  });

  test('puuttuva tila ei tuota merkkiä', () => {
    expect(stateBadge({})).toBeNull();
  });

  test('tuntematon tila ei tuota merkkiä', () => {
    expect(stateBadge({ state: 'jotain-uutta' as never })).toBeNull();
  });
});

describe('isCancelled', () => {
  test('tosi vain perutulle', () => {
    expect(isCancelled({ state: 'cancelled' })).toBe(true);
    expect(isCancelled({ state: 'confirmed' })).toBe(false);
    expect(isCancelled({})).toBe(false);
  });
});

describe('registrationClosedByState', () => {
  test('picked, invited ja cancelled sulkevat ilmoittautumisen', () => {
    expect(registrationClosedByState({ state: 'picked' })).toBe(true);
    expect(registrationClosedByState({ state: 'invited' })).toBe(true);
    expect(registrationClosedByState({ state: 'cancelled' })).toBe(true);
  });

  test('tentative ja confirmed eivät sulje', () => {
    expect(registrationClosedByState({ state: 'tentative' })).toBe(false);
    expect(registrationClosedByState({ state: 'confirmed' })).toBe(false);
  });

  test('puuttuva tila ei sulje', () => {
    expect(registrationClosedByState({})).toBe(false);
  });
});
