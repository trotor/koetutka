import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useStore } from './src/lib/store';
import RootNavigator from './src/navigation';

export default function App() {
  const init = useStore((s) => s.initFromStorage);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor="#2d5a27" barStyle="light-content" />
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
