import { Platform, Settings } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList, FavoritesView } from '../navigation';
import { useStore } from '@/lib/store';

/**
 * Vain kehitysbuildissa: avaa käynnistysparametrin mukaisen näkymän, jotta
 * kauppakuvat voi kaapata simulaattorista ilman napautuksia.
 *
 *   xcrun simctl launch <udid> com.koetutka -koetutkaShot favorites:month
 *
 * Arvot: browse, map, favorites:<list|month|agenda>, settings, event:<id>.
 */
export function runScreenshotScene(nav: NavigationContainerRefWithCurrent<RootStackParamList>) {
  const shot: string | undefined =
    Platform.OS === 'ios' ? Settings.get('koetutkaShot') : undefined;
  if (!shot) return;
  const [scene, arg] = shot.split(':');
  if (scene === 'map') {
    nav.navigate('Tabs', { screen: 'Browse', params: { view: 'map' } });
  } else if (scene === 'favorites') {
    nav.navigate('Tabs', { screen: 'Favorites', params: { view: (arg as FavoritesView) || 'list' } });
  } else if (scene === 'settings') {
    nav.navigate('Tabs', { screen: 'Settings' });
  } else if (scene === 'event' && arg) {
    const open = () => nav.navigate('EventDetail', { id: arg });
    // Koetiedot tarvitsevat ladatun datan.
    if (useStore.getState().events.length) open();
    else {
      const unsub = useStore.subscribe((s) => {
        if (s.events.length) {
          unsub();
          open();
        }
      });
    }
  }
}
