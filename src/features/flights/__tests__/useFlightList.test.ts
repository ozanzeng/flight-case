import { act, renderHook, waitFor } from '@testing-library/react-native';

import flights from '../../../../case-kit/flights.json';
import type { FlightDto, FlightListResponse } from '../../../api/types';
import { useFlightList } from '../useFlightList';

const all = flights as FlightDto[];
const direct = all.filter(flight => flight.stops === 0);

function page(items: FlightDto[], meta: Partial<FlightListResponse['meta']>): FlightListResponse {
  return {
    items,
    meta: { page: 1, limit: 8, total: 24, totalPages: 3, hasMore: true, sort: 'price', onlyDirect: false, ...meta },
  };
}

// fetch'i sahteleyip yanıtları testin istediği anda döndürüyoruz; API katmanı gerçek çalışır.
const requests: { url: string; respond: (body: FlightListResponse) => Promise<void> }[] = [];
const originalFetch = globalThis.fetch;

beforeEach(() => {
  requests.length = 0;
  globalThis.fetch = jest.fn(
    (url: string) =>
      new Promise(resolve => {
        requests.push({
          url,
          respond: body => act(async () => resolve({ ok: true, json: async () => body } as Response)),
        });
      }),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

const ids = (items: FlightDto[]) => items.map(flight => flight.id);

describe('useFlightList', () => {
  it('filtre değişince sayfalama başa döner ve eski sayfalar yeni sonuca karışmaz', async () => {
    const { result } = await renderHook(() => useFlightList());

    // Varsayılan sorgu: fiyat sıralaması, filtre kapalı, ilk sayfa.
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0].url).toBe('http://localhost:4000/flights?page=1&limit=8&sort=price&onlyDirect=false');
    await requests[0].respond(page(all.slice(0, 8), { page: 1 }));

    await act(async () => result.current.loadNextPage());
    expect(requests[1].url).toBe('http://localhost:4000/flights?page=2&limit=8&sort=price&onlyDirect=false');
    await requests[1].respond(page(all.slice(8, 16), { page: 2 }));
    expect(result.current.items).toHaveLength(16);
    expect(result.current.page).toBe(2);

    // Filtre açılır: önceki sonuç hemen temizlenir, istek yeniden ilk sayfadan başlar.
    await act(async () => result.current.setOnlyDirect(true));
    expect(result.current.items).toEqual([]);
    expect(result.current.page).toBe(0);
    expect(result.current.total).toBeNull();
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2].url).toBe('http://localhost:4000/flights?page=1&limit=8&sort=price&onlyDirect=true');

    await requests[2].respond(page(direct.slice(0, 8), { page: 1, total: 17, onlyDirect: true }));
    // Listede yalnızca yeni sonucun ilk sayfası var, sunucunun döndürdüğü sırayla.
    expect(ids(result.current.items)).toEqual(ids(direct.slice(0, 8)));
    expect(result.current.total).toBe(17);
    expect(result.current.page).toBe(1);

    // Sıralama değişimi de ilk sayfadan, mevcut filtreyle birlikte istenir.
    await act(async () => result.current.setSort('duration'));
    expect(result.current.items).toEqual([]);
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[3].url).toBe('http://localhost:4000/flights?page=1&limit=8&sort=duration&onlyDirect=true');
  });
});
