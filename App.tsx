import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/components/theme';
import { useFavoritesHydration } from './src/features/favorites/favoritesStore';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  // Kayıtlı favoriler yüklenmeden ekran gösterilmez; aksi halde erken bir favori
  // değişikliği boş state'i depolamaya yazıp mevcut kayıtları silebilirdi.
  const favoritesHydrated = useFavoritesHydration();

  return (
    <SafeAreaProvider>
      {favoritesHydrated ? (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
