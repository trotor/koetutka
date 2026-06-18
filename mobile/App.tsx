import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useStore } from './src/lib/store';
import RootNavigator from './src/navigation';
import { WhatsNewModal } from './src/components/WhatsNewModal';

export default function App() {
  const init = useStore((s) => s.initFromStorage);
  const checkWhatsNew = useStore((s) => s.checkWhatsNew);

  useEffect(() => {
    void init().then(() => checkWhatsNew());
  }, [init, checkWhatsNew]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor="#2d5a27" barStyle="light-content" />
        <RootNavigator />
        <WhatsNewModal />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
