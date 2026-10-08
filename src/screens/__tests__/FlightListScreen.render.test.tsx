/**
 * Render ölçümü: liste state'i değişince (sonraki sayfa yükleniyor / eklendi, favori değişti)
 * ekrandaki kartlar yeniden render edilmemeli.
 *
 * Sayaç: kart her render'da kalkış saatini bir kez formatlar (formatTime(departureAt)). Kalkış
 * zamanları uçuş başına benzersiz olduğundan bu çağrılar kart başına render sayısını verir.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import flights from '../../../case-kit/flights.json';
import type { FlightDto, FlightListResponse } from '../../api/types';
import { formatTime } from '../../domain/format';
import { useFavoritesStore } from '../../features/favorites/favoritesStore';
import { FlightListScreen } from '../FlightListScreen';

jest.mock('../../domain/format', () => {
  const actual = jest.requireActual('../../domain/format');
  return { ...actual, formatTime: jest.fn(actual.formatTime) };
});

const all = flights as FlightDto[];
const idByDeparture = new Map(all.map(flight => [flight.departureAt, flight.id]));
const page1 = all.slice(0, 8);
const page2 = all.slice(8, 16);

/** Son sıfırlamadan beri render edilen kartlar: { FL001: 1, … } */
function cardRenders(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [iso] of (formatTime as jest.Mock).mock.calls) {
    const id = idByDeparture.get(iso);
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

function response(page: number, items: FlightDto[]): FlightListResponse {
  return { items, meta: { page, limit: 8, total: 24, totalPages: 3, hasMore: true, sort: 'price', onlyDirect: false } };
}

const pending: ((body: FlightListResponse) => Promise<void>)[] = [];
beforeEach(() => {
  pending.length = 0;
  (formatTime as jest.Mock).mockClear();
  useFavoritesStore.setState({ byId: {} });
  globalThis.fetch = jest.fn(
    () =>
      new Promise(resolve =>
        pending.push(body => act(async () => resolve({ ok: true, json: async () => body } as Response))),
      ),
  ) as never;
});

const navigation = { navigate: jest.fn() } as never;

async function renderFirstPage() {
  await render(<FlightListScreen navigation={navigation} route={{} as never} />);
  await waitFor(() => expect(pending).toHaveLength(1));
  await pending[0](response(1, page1));
  await screen.findByText('24 uçuş bulundu');
  expect(Object.keys(cardRenders()).sort()).toEqual(page1.map(f => f.id).sort());
  (formatTime as jest.Mock).mockClear();
}

it('sayaç geçerli: kalkış zamanları uçuş başına benzersiz', () => {
  expect(idByDeparture.size).toBe(all.length);
});

it('sonraki sayfa yüklenirken ve eklenince mevcut kartlar yeniden render edilmez', async () => {
  await renderFirstPage();

  await fireEvent(screen.getByText('24 uçuş bulundu'), 'endReached'); // status: loadingMore
  expect(cardRenders()).toEqual({});

  await pending[1](response(2, page2)); // 2. sayfa eklendi
  const rendered = Object.keys(cardRenders());
  expect(rendered.length).toBeGreaterThan(0);
  expect(rendered.every(id => page2.some(f => f.id === id))).toBe(true);
});

it('bir kartta favori değişince hiçbir kart yeniden render edilmez (yalnızca o kartın butonu)', async () => {
  await renderFirstPage();

  await fireEvent.press(screen.getByRole('button', { name: `${page1[0].flightNumber} uçuşunu favorilere ekle` }));

  expect(screen.getByRole('button', { name: `${page1[0].flightNumber} uçuşunu favorilerden çıkar` })).toBeTruthy();
  expect(cardRenders()).toEqual({});
});
