import { Pressable, StyleSheet, Text } from 'react-native';

import type { FlightDto } from '../api/types';
import { useFavoritesStore, useIsFavorite } from '../features/favorites/favoritesStore';
import { colors } from './theme';

type Props = {
  flight: FlightDto;
};

export function FavoriteButton({ flight }: Props) {
  const isFavorite = useIsFavorite(flight.id);
  const toggle = useFavoritesStore(state => state.toggle);

  return (
    <Pressable
      onPress={() => toggle(flight)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? `${flight.flightNumber} uçuşunu favorilerden çıkar` : `${flight.flightNumber} uçuşunu favorilere ekle`
      }
      accessibilityState={{ selected: isFavorite }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {/* Durum renk yanında dolu/boş yıldız şekliyle de anlaşılır. */}
      <Text style={[styles.icon, isFavorite && styles.iconActive]}>{isFavorite ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 26,
    color: colors.textMuted,
  },
  iconActive: {
    color: colors.favorite,
  },
});
