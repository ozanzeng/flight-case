import type { ReactElement } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FlightDto } from '../api/types';
import { FlightCard } from './FlightCard';
import { colors } from './theme';

type Props = {
  flights: FlightDto[];
  /** Karta dokununca; kartlar memo'lu olduğundan çağıran tarafta sabit referanslı olmalı. */
  onOpenDetail: (flightId: string) => void;
  header?: ReactElement | null;
  footer?: ReactElement | null;
  onEndReached?: () => void;
};

/** Uçuş kartlarının listesi (uçuş listesi ve favoriler ekranı). */
export function FlightCardList({ flights, onOpenDetail, header, footer, onEndReached }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      data={flights}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => <FlightCard flight={item} onPress={onOpenDetail} />}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ItemSeparatorComponent={Separator}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReached ? 0.5 : undefined}
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
    />
  );
}

const keyExtractor = (item: FlightDto) => item.id;
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
});
