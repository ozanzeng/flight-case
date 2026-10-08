import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FlightCardList } from '../components/FlightCardList';
import { colors } from '../components/theme';
import { useFavoritesStore } from '../features/favorites/favoritesStore';
import type { RootStackScreenProps } from '../navigation/types';

export function FavoritesScreen({ navigation }: RootStackScreenProps<'Favorites'>) {
  const byId = useFavoritesStore(state => state.byId);

  // Liste filtresinden bağımsız; burada sıralama serbest olduğu için kalkış saatine göre
  // (sayısal zaman damgası, eşitlikte id — sunucunun eşitlik kuralıyla aynı).
  const favorites = Object.values(byId).sort(
    (a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt) || a.id.localeCompare(b.id),
  );

  // Kartlar memo'lu: onPress sabit kalmalı.
  const openDetail = useCallback(
    (flightId: string) => navigation.navigate('FlightDetail', { flightId }),
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

  return <FlightCardList flights={favorites} onOpenDetail={openDetail} />;
}

const styles = StyleSheet.create({
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
