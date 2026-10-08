import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FlightDto } from '../../api/types';

// Favori işaretinin tek kaynağı: liste, detay ve favoriler ekranı aynı store'u okur.
// Uçuşun tamamı saklanır; favoriler ekranı ağ isteği olmadan açılır.
type FavoritesState = {
  byId: Record<string, FlightDto>;
  toggle: (flight: FlightDto) => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    set => ({
      byId: {},
      toggle: flight =>
        set(state => {
          const byId = { ...state.byId };
          if (byId[flight.id]) delete byId[flight.id];
          else byId[flight.id] = flight;
          return { byId };
        }),
    }),
    {
      name: 'favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ byId: state.byId }),
      // Yükleme useFavoritesHydration ile açıkça başlatılır; okuma sırasında depolamaya yazılmaz.
      skipHydration: true,
    },
  ),
);

export const useIsFavorite = (id: string) => useFavoritesStore(state => id in state.byId);

/**
 * Kayıtlı favorileri depolamadan yükler. Yükleme bitene kadar false döner; uygulama bu sürede
 * ekranları göstermez. Böylece kayıtlar okunmadan yapılan bir değişiklik boş state'i depolamaya
 * yazıp mevcut favorileri silemez.
 */
export function useFavoritesHydration() {
  const [hydrated, setHydrated] = useState(() => useFavoritesStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    // rehydrate hata durumunda da çözülür (persist hatayı kendi yakalar).
    Promise.resolve(useFavoritesStore.persist.rehydrate()).then(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
