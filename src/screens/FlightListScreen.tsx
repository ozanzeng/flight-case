import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FlightDto } from '../api/types';
import { FlightCard } from '../components/FlightCard';
import { colors } from '../components/theme';
import { useFlightList } from '../features/flights/useFlightList';
import type { RootStackScreenProps } from '../navigation/types';

export function FlightListScreen({ navigation }: RootStackScreenProps<'FlightList'>) {
  const { status, items, total, error } = useFlightList();
  const insets = useSafeAreaInsets();

  const openDetail = useCallback(
    (flight: FlightDto) => navigation.navigate('FlightDetail', { flightId: flight.id }),
    [navigation],
  );

  // Geçici: yükleniyor/hata durumları 2.6'da tamamlanacak.
  if (status === 'loading' && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (status === 'error' && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <FlightCard flight={item} onPress={openDetail} />}
      ListHeaderComponent={
        total !== null ? (
          <Text style={styles.total} accessibilityRole="header">
            {total} uçuş bulundu
          </Text>
        ) : null
      }
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
  total: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
  },
  separator: {
    height: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
