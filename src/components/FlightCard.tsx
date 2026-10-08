import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FlightDto } from '../api/types';
import { formatDuration, formatPrice, formatStops, formatTime } from '../domain/format';
import { FavoriteButton } from './FavoriteButton';
import { colors } from './theme';

type Props = {
  flight: FlightDto;
  onPress: (flightId: string) => void;
};

// memo: liste state'i değişince (sonraki sayfa, yükleniyor) değişmeyen kartlar yeniden render
// edilmez. Uçuş nesnelerinin referansı sabit kalır (reducer yeni sayfayı sona ekler), onPress de
// listenin kökünde sabit tutulur. Ölçüm: src/screens/__tests__/FlightListScreen.render.test.tsx
export const FlightCard = memo(function FlightCard({ flight, onPress }: Props) {
  const departure = formatTime(flight.departureAt);
  const arrival = formatTime(flight.arrivalAt);
  const duration = formatDuration(flight.durationMinutes);
  const stops = formatStops(flight.stops);
  const price = formatPrice(flight.priceMinor);

  const accessibilityLabel = [
    `${flight.airline} ${flight.flightNumber}`,
    `${flight.origin.code} ${departure} kalkış`,
    `${flight.destination.code} ${arrival} varış`,
    duration,
    stops,
    price,
  ].join(', ');

  return (
    // Kart gövdesi ve favori butonu kardeş öğeler: favori dokunuşu navigasyonu tetiklemez,
    // ekran okuyucu ikisine ayrı ayrı odaklanabilir.
    <View style={styles.card}>
      <Pressable
        onPress={() => onPress(flight.id)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Uçuş detayını açar"
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.row}>
          <Text style={styles.airline} numberOfLines={1}>
            {flight.airline} · {flight.flightNumber}
          </Text>
          <Text style={styles.price}>{price}</Text>
        </View>

        <View style={styles.route}>
          <View>
            <Text style={styles.time}>{departure}</Text>
            <Text style={styles.code}>{flight.origin.code}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.arrival}>
            <Text style={styles.time}>{arrival}</Text>
            <Text style={styles.code}>{flight.destination.code}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          {duration} · {stops}
        </Text>
      </Pressable>

      <FavoriteButton flight={flight} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 4,
  },
  body: {
    flex: 1,
    gap: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  airline: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.textMuted,
  },
  arrival: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  code: {
    fontSize: 13,
    color: colors.textMuted,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
