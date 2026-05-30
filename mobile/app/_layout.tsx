import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  const init = useStore((s) => s.initFromStorage);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="event/[id]"
          options={{ presentation: 'modal', headerShown: true, title: 'Kokeen tiedot' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
