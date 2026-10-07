import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FlightDto } from '../api/types';
import { FlightCard } from '../components/FlightCard';
import { FlightFilters } from '../components/FlightFilters';
import { colors } from '../components/theme';
import { useFlightList } from '../features/flights/useFlightList';
import type { RootStackScreenProps } from '../navigation/types';

export function FlightListScreen({ navigation }: RootStackScreenProps<'FlightList'>) {
  const { query, status, items, total, error, loadNextPage, setSort, setOnlyDirect } = useFlightList();
  const insets = useSafeAreaInsets();

  const openDetail = useCallback(
    (flight: FlightDto) => navigation.navigate('FlightDetail', { flightId: flight.id }),
    [navigation],
  );

  const renderContent = () => {
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
    if (status === 'success' && items.length === 0 && query.onlyDirect) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Direkt uçuş bulunamadı</Text>
          <Text style={styles.emptyText}>
            "Yalnızca direkt" filtresine uyan uçuş yok. Filtreyi kaldırarak aktarmalı uçuşları da görebilirsin.
          </Text>
          <Pressable onPress={() => setOnlyDirect(false)} accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>Filtreyi temizle</Text>
          </Pressable>
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
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.5}
        // Sonraki sayfa yüklenirken belirteç listenin altında; mevcut kartlar görünür kalır.
        ListFooterComponent={
          status === 'loadingMore' ? (
            <ActivityIndicator style={styles.footer} accessibilityLabel="Daha fazla uçuş yükleniyor" />
          ) : null
        }
        contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <FlightFilters
        sort={query.sort}
        onlyDirect={query.onlyDirect}
        onSortChange={setSort}
        onOnlyDirectChange={setOnlyDirect}
      />
      {renderContent()}
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  footer: {
    paddingVertical: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
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
  button: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
