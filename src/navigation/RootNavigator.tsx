import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FlightDetailScreen } from '../screens/FlightDetailScreen';
import { FlightListScreen } from '../screens/FlightListScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FlightList" component={FlightListScreen} options={{ title: 'İstanbul → Antalya' }} />
      <Stack.Screen name="FlightDetail" component={FlightDetailScreen} options={{ title: 'Uçuş Detayı' }} />
    </Stack.Navigator>
  );
}
