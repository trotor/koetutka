import { Tabs } from 'expo-router';

const GREEN = '#2d5a27';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Selaa',
          tabBarLabel: 'Selaa',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Suosikit',
          tabBarLabel: 'Suosikit',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Asetukset',
          tabBarLabel: 'Asetukset',
        }}
      />
    </Tabs>
  );
}
