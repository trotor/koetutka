import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { generateICS, type Event } from '@koetutka/shared';

type EventType = 'event' | 'registration';

export async function exportEventICS(
  event: Event,
  type: EventType,
  userLocationName?: string,
): Promise<void> {
  try {
    const ics = generateICS(event, { type, userLocationName, index: 0 });
    const prefix = type === 'registration' ? 'ilmoittautuminen' : 'koe';
    const safeLoc = event.location.replace(/[^\p{L}\d_-]/gu, '_');
    const filename = `koetutka-${prefix}-${safeLoc}-${event.date.replace(/\./g, '-')}.ics`;
    const uri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, ics, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Jakaminen ei käytössä',
        'Tiedosto tallennettiin laitteelle, mutta jakaminen ei ole tuettu tällä laitteella.',
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'text/calendar',
      dialogTitle: type === 'registration' ? 'Ilmoittautumismuistutus' : 'Lisää kalenteriin',
      UTI: 'public.calendar-event',
    });
  } catch (e) {
    Alert.alert('Virhe', 'Kalenteritiedoston luonti epäonnistui.');
  }
}
