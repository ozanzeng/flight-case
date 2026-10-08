import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ErrorMessage } from '../components/ErrorMessage';
import { FlightCardList } from '../components/FlightCardList';
import { FlightFilters } from '../components/FlightFilters';
import { colors } from '../components/theme';
import { useFlightList } from '../features/flights/useFlightList';
import type { RootStackScreenProps } from '../navigation/types';

export function FlightListScreen({ navigation }: RootStackScreenProps<'FlightList'>) {
  const { query, status, items, total, error, loadNextPage, retry, setSort, setOnlyDirect } = useFlightList();

  // Kartlar memo'lu: onPress sabit kalmazsa her liste güncellemesinde tüm kartlar yeniden render
  // edilir (ölçüm: src/screens/__tests__/FlightListScreen.render.test.tsx).
  const openDetail = useCallback(
    (flightId: string) => navigation.navigate('FlightDetail', { flightId }),
    [navigation],
  );

  const renderContent = () => {
    // Ekranda aynı anda tek durum: ilk yükleme, ilk sayfa hatası, boş sonuç veya liste.
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
          <ErrorMessage message={error ?? ''} onRetry={retry} />
        </View>
      );
    }
    if (status === 'success' && items.length === 0 && !query.onlyDirect) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Uçuş bulunamadı</Text>
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
      <FlightCardList
        flights={items}
        onOpenDetail={openDetail}
        onEndReached={loadNextPage}
        header={
          total !== null ? (
            <Text style={styles.total} accessibilityRole="header">
              {total} uçuş bulundu
            </Text>
          ) : null
        }
        // Sonraki sayfa yüklenirken ya da hata verdiğinde liste görünür kalır; altta yalnızca biri gösterilir.
        footer={
          status === 'loadingMore' ? (
            <ActivityIndicator style={styles.footer} accessible accessibilityLabel="Daha fazla uçuş yükleniyor" />
          ) : status === 'error' ? (
            <View style={styles.footer}>
              <ErrorMessage message={error ?? ''} onRetry={retry} />
            </View>
          ) : null
        }
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  total: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
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
