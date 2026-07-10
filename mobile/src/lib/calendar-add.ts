import { Alert, Platform } from 'react-native';
import * as AddCalendarEvent from 'react-native-add-calendar-event';
import {
  buildCalendarEventInput,
  type Event,
} from '@koetutka/shared';

type Type = 'event' | 'registration';

function toISO(date: Date, hour: number): string {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function endOfDayExclusiveISO(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function addEventToCalendar(
  event: Event,
  type: Type,
  userLocationName?: string,
): Promise<boolean> {
  const input = buildCalendarEventInput(event, { type, userLocationName });
  try {
    const result = await AddCalendarEvent.presentEventCreatingDialog({
      title: input.title,
      startDate: input.allDay
        ? toISO(input.startDate, 9)
        : toISO(input.startDate, 9),
      endDate: input.allDay
        ? endOfDayExclusiveISO(input.endDate)
        : toISO(input.endDate, 17),
      location: input.location,
      notes: input.description,
      allDay: input.allDay,
    });
    // iOS: { action: 'SAVED' | 'CANCELED' }; Android: yleensä { action: 'DONE' }.
    return (result as { action?: string })?.action !== 'CANCELED';
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.toLowerCase().includes('cancel')) return false;
    if (Platform.OS === 'android') {
      Alert.alert(
        'Kalenterin avaaminen epäonnistui',
        'Tarkista että puhelimessa on kalenterisovellus asennettuna.',
      );
    } else {
      Alert.alert('Virhe', 'Tapahtuman lisäys epäonnistui.');
    }
    return false;
  }
}
