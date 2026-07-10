export type CalendarType = 'event' | 'registration';

/** Persistointiavain "olen lisännyt kalenteriin" -muistille. */
export function calendarAddedKey(eventId: string, type: CalendarType): string {
  return `${eventId}:${type}`;
}
