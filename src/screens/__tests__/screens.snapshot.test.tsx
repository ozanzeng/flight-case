/**
 * Snapshot: detay (2.4) ve favoriler (2.5) ekranlarının görünümü. Davranış testlerine ek olarak.
 */
import { render, screen } from '@testing-library/react-native';

import flights from '../../../case-kit/flights.json';
import type { FlightDto } from '../../api/types';
import { useFavoritesStore } from '../../features/favorites/favoritesStore';
import { FavoritesScreen } from '../FavoritesScreen';
import { FlightDetailScreen } from '../FlightDetailScreen';

const byId = (id: string) => (flights as FlightDto[]).find(flight => flight.id === id)!;
// Ekranlar yalnızca navigate/params kullanır; snapshot için yeterli.
const navigation = { navigate: jest.fn() } as never;

beforeEach(() => useFavoritesStore.setState({ byId: {} }));

it('2.4: FL024 detayı (ertesi gün varış, bagaj dahil değil)', async () => {
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ item: byId('FL024') }) })) as never;
  await render(<FlightDetailScreen navigation={navigation} route={{ params: { flightId: 'FL024' } } as never} />);

  expect(await screen.findByLabelText('Varış: 16 Ekim 2026, 00:45 · AYT')).toBeTruthy();
  expect(screen.toJSON()).toMatchSnapshot();
});

it('2.5: favoriler ekranı — kalkış saatine göre sıralı liste', async () => {
  useFavoritesStore.setState({ byId: { FL009: byId('FL009'), FL004: byId('FL004') } });
  await render(<FavoritesScreen navigation={navigation} route={{} as never} />);

  expect(screen.toJSON()).toMatchSnapshot();
});

it('2.5: favoriler ekranı — boş durum', async () => {
  await render(<FavoritesScreen navigation={navigation} route={{} as never} />);

  expect(screen.getByText('Henüz favori uçuşun yok')).toBeTruthy();
  expect(screen.toJSON()).toMatchSnapshot();
});
