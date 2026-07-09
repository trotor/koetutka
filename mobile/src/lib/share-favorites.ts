import Share from 'react-native-share';
import { Alert } from 'react-native';
import { buildFavoritesShareText, type Event } from '@koetutka/shared';

/** Avaa järjestelmän jakovalikon suosikkilistan tiivistelmällä. */
export async function shareFavoritesList(events: Event[]): Promise<void> {
  if (events.length === 0) return;
  try {
    await Share.open({
      title: 'Suosikkikokeet',
      message: buildFavoritesShareText(events),
      failOnCancel: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (!message.toLowerCase().includes('cancel') && !message.includes('User did not share')) {
      Alert.alert('Virhe', 'Jakaminen epäonnistui.');
    }
  }
}
