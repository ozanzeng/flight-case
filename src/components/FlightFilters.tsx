import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { FlightSort } from '../api/types';
import { colors } from './theme';

const SORT_OPTIONS: { value: FlightSort; label: string }[] = [
  { value: 'price', label: 'En düşük fiyat' },
  { value: 'duration', label: 'En kısa süre' },
];

type Props = {
  sort: FlightSort;
  onlyDirect: boolean;
  onSortChange: (sort: FlightSort) => void;
  onOnlyDirectChange: (onlyDirect: boolean) => void;
};

export function FlightFilters({ sort, onlyDirect, onSortChange, onOnlyDirectChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.directRow}>
        <Text style={styles.directLabel}>Yalnızca direkt</Text>
        {/* Switch durumu konumla da gösterir; ekran okuyucu açık/kapalı bilgisini okur. */}
        <Switch value={onlyDirect} onValueChange={onOnlyDirectChange} accessibilityLabel="Yalnızca direkt uçuşlar" />
      </View>

      <View style={styles.segment} accessibilityLabel="Sıralama">
        {SORT_OPTIONS.map(option => {
          const selected = option.value === sort;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSortChange(option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Sırala: ${option.label}`}
              accessibilityState={{ selected }}
              style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
            >
              {/* Seçim renk yanında onay işaretiyle de belirtilir. */}
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {selected ? `✓ ${option.label}` : option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  directRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  segmentTextSelected: {
    color: colors.surface,
  },
});
