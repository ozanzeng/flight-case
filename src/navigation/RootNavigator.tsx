import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../components/theme';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { FlightDetailScreen } from '../screens/FlightDetailScreen';
import { FlightListScreen } from '../screens/FlightListScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FlightList"
        component={FlightListScreen}
        options={({ navigation }) => ({
          title: 'İstanbul → Antalya',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('Favorites')}
              accessibilityRole="button"
              accessibilityLabel="Favoriler"
              hitSlop={8}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Favoriler</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="FlightDetail" component={FlightDetailScreen} options={{ title: 'Uçuş Detayı' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoriler' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
