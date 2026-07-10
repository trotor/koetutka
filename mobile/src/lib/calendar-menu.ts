import { ActionSheetIOS, Alert, Platform } from 'react-native';
import type { Event } from '@koetutka/shared';
import { addEventToCalendar } from './calendar-add';
import type { CalendarType } from './calendar-added';

/**
 * Näyttää "Lisää kalenteriin" -valikon (Koe / Ilmoittautuminen). ✓ näkyy tyypin
 * edessä jos se on jo lisätty appin kautta. Onnistuneen lisäyksen jälkeen
 * kutsuu markAdded(type).
 */
export function presentCalendarMenu(
  event: Event,
  isAdded: (type: CalendarType) => boolean,
  markAdded: (type: CalendarType) => void,
  locationName?: string,
): void {
  const label = (type: CalendarType, base: string) => (isAdded(type) ? `✓ ${base}` : base);
  const run = async (type: CalendarType) => {
    const ok = await addEventToCalendar(event, type, locationName);
    if (ok) markAdded(type);
  };
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Lisää kalenteriin',
        options: [label('event', 'Koe'), label('registration', 'Ilmoittautuminen'), 'Peruuta'],
        cancelButtonIndex: 2,
      },
      (i) => {
        if (i === 0) void run('event');
        else if (i === 1) void run('registration');
      },
    );
  } else {
    Alert.alert('Lisää kalenteriin', undefined, [
      { text: label('event', 'Koe'), onPress: () => void run('event') },
      { text: label('registration', 'Ilmoittautuminen'), onPress: () => void run('registration') },
      { text: 'Peruuta', style: 'cancel' },
    ]);
  }
}
