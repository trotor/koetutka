import type { Event } from '@koetutka/shared';

export const BASE_URL = 'https://trotor.github.io/koetutka';

export async function fetchEvents(year: number): Promise<Event[]> {
  const url = `${BASE_URL}/koetutka_${year}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Vuoden ${year} dataa ei löytynyt (HTTP ${response.status})`);
  }
  return response.json();
}

export async function fetchEventsWithFallback(year: number): Promise<Event[]> {
  try {
    return await fetchEvents(year);
  } catch {
    return await fetchEvents(year - 1);
  }
}
