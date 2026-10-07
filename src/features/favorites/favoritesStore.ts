import { create } from 'zustand';

import type { FlightDto } from '../../api/types';

// Favori işaretinin tek kaynağı. Şimdilik yalnızca bellekte; kalıcılık 2.5'te eklenecek.
type FavoritesState = {
  byId: Record<string, FlightDto>;
  toggle: (flight: FlightDto) => void;
};

export const useFavoritesStore = create<FavoritesState>(set => ({
  byId: {},
  toggle: flight =>
    set(state => {
      const byId = { ...state.byId };
      if (byId[flight.id]) delete byId[flight.id];
      else byId[flight.id] = flight;
      return { byId };
    }),
}));

export const useIsFavorite = (id: string) => useFavoritesStore(state => id in state.byId);
