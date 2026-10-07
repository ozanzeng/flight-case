import type { FlightDto, FlightListResponse, FlightSort } from '../../api/types';

/** Sunucuya gönderilen filtre ve sıralama. Uygulama istemcide yeniden filtreleme/sıralama yapmaz. */
export type FlightQuery = {
  sort: FlightSort;
  onlyDirect: boolean;
};

/** loading: ilk sayfa yükleniyor, loadingMore: sonraki sayfa yükleniyor (liste görünür kalır). */
type FlightListStatus = 'loading' | 'loadingMore' | 'success' | 'error';

type FlightListState = {
  query: FlightQuery;
  status: FlightListStatus;
  items: FlightDto[];
  /** Filtre sonrası toplam (meta.total). İlk yanıt gelene kadar null. */
  total: number | null;
  /** Son başarıyla yüklenen sayfa; henüz yoksa 0. */
  page: number;
  hasMore: boolean;
  error: string | null;
};

type FlightListAction =
  | { type: 'queryChanged'; query: Partial<FlightQuery> }
  | { type: 'loadStarted'; page: number }
  | { type: 'loadSucceeded'; response: FlightListResponse }
  | { type: 'loadFailed'; message: string };

const DEFAULT_QUERY: FlightQuery = { sort: 'price', onlyDirect: false };

export const initialFlightListState: FlightListState = {
  query: DEFAULT_QUERY,
  // Açılışta ilk sayfa hemen istenir; boş bir ara durum yok.
  status: 'loading',
  items: [],
  total: null,
  page: 0,
  hasMore: false,
  error: null,
};

export function flightListReducer(state: FlightListState, action: FlightListAction): FlightListState {
  switch (action.type) {
    case 'queryChanged': {
      const query = { ...state.query, ...action.query };
      if (query.sort === state.query.sort && query.onlyDirect === state.query.onlyDirect) return state;
      // Yeni sorgu: sayfalama başa döner, önceki sonucun hiçbir sayfası taşınmaz.
      return { ...initialFlightListState, query };
    }
    case 'loadStarted':
      return { ...state, status: action.page === 1 ? 'loading' : 'loadingMore', error: null };
    case 'loadSucceeded': {
      const { items, meta } = action.response;
      return {
        ...state,
        status: 'success',
        items: meta.page === 1 ? items : [...state.items, ...items],
        total: meta.total,
        page: meta.page,
        hasMore: meta.hasMore,
        error: null,
      };
    }
    case 'loadFailed':
      return { ...state, status: 'error', error: action.message };
  }
}
