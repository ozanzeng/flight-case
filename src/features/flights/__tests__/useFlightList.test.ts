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
type PendingRequest = {
  url: string;
  respond: (body: FlightListResponse) => Promise<void>;
  fail: (message: string) => Promise<void>;
};
const requests: PendingRequest[] = [];
const originalFetch = globalThis.fetch;

beforeEach(() => {
  requests.length = 0;
  globalThis.fetch = jest.fn(
    (url: string) =>
      new Promise(resolve => {
        requests.push({
          url,
          respond: body => act(async () => resolve({ ok: true, json: async () => body } as Response)),
          fail: message =>
            act(async () =>
              resolve({
                ok: false,
                json: async () => ({ error: { code: 'FLIGHTS_UNAVAILABLE', message } }),
              } as Response),
            ),
        });
      }),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

const ids = (items: FlightDto[]) => items.map(flight => flight.id);

describe('useFlightList', () => {
  it('2.3: filtre değişince sayfalama başa döner ve eski sayfalar yeni sonuca karışmaz', async () => {
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

  it('2.2: aynı sayfa iki kez istenmez, yükleme sürerken istek gitmez, hasMore=false olunca durur', async () => {
    const { result } = await renderHook(() => useFlightList());
    await waitFor(() => expect(requests).toHaveLength(1));

    // İlk sayfa beklenirken sona gelinmesi istek üretmez.
    await act(async () => result.current.loadNextPage());
    expect(requests).toHaveLength(1);
    await requests[0].respond(page(all.slice(0, 8), { page: 1 }));

    // Aynı anda iki tetikleme (art arda onEndReached) tek istek üretir.
    await act(async () => {
      result.current.loadNextPage();
      result.current.loadNextPage();
    });
    expect(requests).toHaveLength(2);
    expect(result.current.status).toBe('loadingMore');
    expect(result.current.items).toHaveLength(8);
    await act(async () => result.current.loadNextPage());
    expect(requests).toHaveLength(2);
    await requests[1].respond(page(all.slice(8, 16), { page: 2 }));

    await act(async () => result.current.loadNextPage());
    await requests[2].respond(page(all.slice(16, 24), { page: 3, hasMore: false }));
    await act(async () => result.current.loadNextPage());

    expect(requests.map(r => new URL(r.url).searchParams.get('page'))).toEqual(['1', '2', '3']);
    expect(new Set(ids(result.current.items)).size).toBe(24);
  });

  it('2.3: sorgu değişince geç dönen eski yanıt yeni sonuca karışmaz', async () => {
    const { result } = await renderHook(() => useFlightList());
    await waitFor(() => expect(requests).toHaveLength(1));
    await requests[0].respond(page(all.slice(0, 8), { page: 1 }));
    await act(async () => result.current.loadNextPage());

    await act(async () => result.current.setOnlyDirect(true));
    await waitFor(() => expect(requests).toHaveLength(3));
    await requests[1].respond(page(all.slice(8, 16), { page: 2 })); // eski sorgunun 2. sayfası geç döner
    expect(result.current.items).toEqual([]);

    await requests[2].respond(page(direct.slice(0, 8), { page: 1, total: 17, onlyDirect: true }));
    expect(ids(result.current.items)).toEqual(ids(direct.slice(0, 8)));
  });

  it('2.6: sonraki sayfa hatası eldeki veriyi silmez; Tekrar dene aynı sayfayı ister ve başarıya döner', async () => {
    const { result } = await renderHook(() => useFlightList());
    await waitFor(() => expect(requests).toHaveLength(1));
    await requests[0].respond(page(all.slice(0, 8), { page: 1 }));

    await act(async () => result.current.loadNextPage());
    await requests[1].fail('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.');
    expect(result.current).toMatchObject({ status: 'error', error: 'Uçuşlar yüklenemedi. Lütfen tekrar deneyin.' });
    expect(result.current.items).toHaveLength(8);

    // Hata varken sona gelinmesi otomatik istek üretmez; yalnızca Tekrar dene.
    await act(async () => result.current.loadNextPage());
    expect(requests).toHaveLength(2);
    await act(async () => result.current.retry());
    expect(requests[2].url).toContain('page=2');
    await requests[2].respond(page(all.slice(8, 16), { page: 2 }));
    expect(result.current.status).toBe('success');
    expect(ids(result.current.items)).toEqual(ids(all.slice(0, 16)));
  });
});
