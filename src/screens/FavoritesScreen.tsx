import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FlightDto } from '../api/types';
import { FlightCard } from '../components/FlightCard';
import { colors } from '../components/theme';
import { useFavoritesStore } from '../features/favorites/favoritesStore';
import type { RootStackScreenProps } from '../navigation/types';

export function FavoritesScreen({ navigation }: RootStackScreenProps<'Favorites'>) {
  const byId = useFavoritesStore(state => state.byId);
  const insets = useSafeAreaInsets();

  // Liste filtresinden bağımsız; burada sıralama serbest olduğu için kalkış saatine göre.
  const favorites = useMemo(
    () =>
      Object.values(byId).sort(
        (a, b) => a.departureAt.localeCompare(b.departureAt) || a.id.localeCompare(b.id),
      ),
    [byId],
  );

  const openDetail = useCallback(
    (flight: FlightDto) => navigation.navigate('FlightDetail', { flightId: flight.id }),
    [navigation],
  );

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Henüz favori uçuşun yok</Text>
        <Text style={styles.emptyText}>Uçuş listesinde ☆ simgesine dokunarak favorilere ekleyebilirsin.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <FlightCard flight={item} onPress={openDetail} />}
      ItemSeparatorComponent={Separator}
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
    />
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
