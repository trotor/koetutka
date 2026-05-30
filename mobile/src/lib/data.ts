import type { Event } from '@koetutka/shared';

export const BASE_URL = 'https://trotor.github.io/koetutka';

class NotFoundError extends Error {
  constructor(year: number) {
    super(`Vuoden ${year} dataa ei ole vielä julkaistu`);
    this.name = 'NotFoundError';
  }
}

export async function fetchEvents(year: number): Promise<Event[]> {
  const url = `${BASE_URL}/koetutka_${year}.json`;
  const response = await fetch(url);
  if (response.status === 404) {
    throw new NotFoundError(year);
  }
  if (!response.ok) {
    throw new Error(`Vuoden ${year} dataa ei löytynyt (HTTP ${response.status})`);
  }
  return response.json();
}

export async function fetchEventsWithFallback(year: number): Promise<Event[]> {
  try {
    return await fetchEvents(year);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return await fetchEvents(year - 1);
    }
    throw e;
  }
}
