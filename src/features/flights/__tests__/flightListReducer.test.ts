import flights from '../../../../case-kit/flights.json';
import type { FlightDto, FlightListResponse } from '../../../api/types';
import { flightListReducer, initialFlightListState } from '../flightListReducer';

const all = flights as FlightDto[];

function response(page: number, items: FlightDto[], hasMore: boolean, total = 24): FlightListResponse {
  return {
    items,
    meta: { page, limit: 8, total, totalPages: 3, hasMore, sort: 'price', onlyDirect: false },
  };
}

type State = typeof initialFlightListState;
const run = (state: State, ...actions: Parameters<typeof flightListReducer>[1][]) =>
  actions.reduce(flightListReducer, state);

describe('flightListReducer', () => {
  it('2.3: varsayılan sorgu fiyat sıralaması, filtre kapalı; açılışta ilk sayfa yükleniyor', () => {
    expect(initialFlightListState).toMatchObject({
      query: { sort: 'price', onlyDirect: false },
      status: 'loading',
      items: [],
      page: 0,
      total: null,
    });
  });

  it('2.2: ilk sayfa listeyi kurar, sonraki sayfalar sona eklenir; hasMore servisten gelir', () => {
    const state = run(
      initialFlightListState,
      { type: 'loadSucceeded', response: response(1, all.slice(0, 8), true) },
      { type: 'loadStarted', page: 2 },
    );
    expect(state.status).toBe('loadingMore');
    expect(state.items).toHaveLength(8);

    const next = run(state, { type: 'loadSucceeded', response: response(2, all.slice(8, 16), false) });
    expect(next.items.map(f => f.id)).toEqual(all.slice(0, 16).map(f => f.id));
    expect(next).toMatchObject({ status: 'success', page: 2, hasMore: false, total: 24 });
  });

  it('2.3: sorgu değişince sayfalama ve sonuç sıfırlanır; aynı sorgu state değiştirmez', () => {
    const loaded = run(initialFlightListState, {
      type: 'loadSucceeded',
      response: response(1, all.slice(0, 8), true),
    });

    const changed = run(loaded, { type: 'queryChanged', query: { onlyDirect: true } });
    expect(changed).toMatchObject({
      query: { sort: 'price', onlyDirect: true },
      status: 'loading',
      items: [],
      page: 0,
      total: null,
      hasMore: false,
    });

    expect(run(loaded, { type: 'queryChanged', query: { sort: 'price' } })).toBe(loaded);
  });

  it('2.6: hata eldeki veriyi silmez; yeni yükleme hatayı temizler', () => {
    const loaded = run(initialFlightListState, {
      type: 'loadSucceeded',
      response: response(1, all.slice(0, 8), true),
    });
    const failed = run(loaded, { type: 'loadStarted', page: 2 }, { type: 'loadFailed', message: 'Hata' });
    expect(failed).toMatchObject({ status: 'error', error: 'Hata', page: 1 });
    expect(failed.items).toHaveLength(8);

    const retrying = run(failed, { type: 'loadStarted', page: 2 });
    expect(retrying).toMatchObject({ status: 'loadingMore', error: null });
    expect(retrying.items).toHaveLength(8);
  });
});
