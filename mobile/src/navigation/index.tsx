import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  EventDetail: { id: string };
};

export type TabsParamList = {
  Browse: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

const GREEN = '#2d5a27';

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: GREEN },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Selaa' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Suosikit' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Asetukset' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
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
