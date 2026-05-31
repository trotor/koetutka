import { Image, Text, useWindowDimensions, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

const banner = require('../../assets/banner.jpg');

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

// Banner has aspect ratio 1536:270 ≈ 5.69:1
const BANNER_ASPECT = 1536 / 270;

function BannerHeader() {
  const { width } = useWindowDimensions();
  const height = width / BANNER_ASPECT;
  return (
    <View style={{ width: '100%', height, backgroundColor: GREEN }}>
      <Image
        source={banner}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}

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
        headerTitle: () => null,
        headerBackground: () => <BannerHeader />,
        headerStyle: { height: undefined },
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
