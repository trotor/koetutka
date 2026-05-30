import RNFS from 'react-native-fs';
import Share from 'react-native-share';
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
    const path = `${RNFS.CachesDirectoryPath}/${filename}`;

    await RNFS.writeFile(path, ics, 'utf8');

    await Share.open({
      url: `file://${path}`,
      filename,
      type: 'text/calendar',
      title: type === 'registration' ? 'Ilmoittautumismuistutus' : 'Lisää kalenteriin',
      saveToFiles: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (!message.toLowerCase().includes('cancel') && !message.includes('User did not share')) {
      Alert.alert('Virhe', 'Kalenteritiedoston luonti epäonnistui.');
    }
  }
}
