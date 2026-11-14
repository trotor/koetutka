import { Text } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import { runScreenshotScene } from '../dev/screenshot-scene';

export type FavoritesView = 'list' | 'month' | 'agenda';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  EventDetail: { id: string };
};

export type TabsParamList = {
  Browse: { view?: 'list' | 'map' } | undefined;
  Favorites: { view?: FavoritesView } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

const GREEN = '#2d5a27';

function tabIcon(symbol: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 22 }}>{symbol}</Text>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarLabel: 'Selaa', tabBarIcon: tabIcon('☰') }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Suosikit', tabBarIcon: tabIcon('★') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Asetukset', tabBarIcon: tabIcon('⚙') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (__DEV__) runScreenshotScene(navigationRef);
      }}
    >
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            presentation: 'modal',
            title: 'Kokeen tiedot',
            headerStyle: { backgroundColor: GREEN },
            headerTintColor: 'white',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
