import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FlightDto } from '../api/types';
import { colors } from '../components/theme';
import { formatDuration, formatPrice, formatStops, formatTime } from '../domain/format';
import { useFlightDetail } from '../features/flights/useFlightDetail';
import type { RootStackScreenProps } from '../navigation/types';

export function FlightDetailScreen({ route }: RootStackScreenProps<'FlightDetail'>) {
  const state = useFlightDetail(route.params.flightId);

  // Geçici: yükleniyor/hata durumları 2.6'da tamamlanacak.
  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{state.message}</Text>
      </View>
    );
  }
  return <FlightDetail flight={state.flight} />;
}

function FlightDetail({ flight }: { flight: FlightDto }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
      <View>
        <Text style={styles.airline}>{flight.airline}</Text>
        <Text style={styles.muted}>{flight.flightNumber}</Text>
      </View>

      <View style={styles.section}>
        <Row label="Kalkış" value={`${formatTime(flight.departureAt)} · ${flight.origin.code}`} />
        <Row label="Varış" value={`${formatTime(flight.arrivalAt)} · ${flight.destination.code}`} />
        <Row label="Süre" value={formatDuration(flight.durationMinutes)} />
        <Row label="Aktarma" value={formatStops(flight.stops)} />
        <Row label="Fiyat" value={formatPrice(flight.priceMinor)} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  airline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  muted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 15,
    color: colors.textMuted,
  },
  value: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
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
