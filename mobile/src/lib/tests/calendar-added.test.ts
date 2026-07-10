import { describe, test, expect } from 'vitest';
import { calendarAddedKey } from '../calendar-added';

describe('calendarAddedKey', () => {
  test('yhdistää id:n ja tyypin', () => {
    expect(calendarAddedKey('abc', 'event')).toBe('abc:event');
    expect(calendarAddedKey('abc', 'registration')).toBe('abc:registration');
  });
});
