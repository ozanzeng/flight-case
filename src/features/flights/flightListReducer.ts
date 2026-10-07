import type { FlightDto, FlightListResponse } from '../../api/types';

/** loading: ilk sayfa yükleniyor, loadingMore: sonraki sayfa yükleniyor (liste görünür kalır). */
export type FlightListStatus = 'idle' | 'loading' | 'loadingMore' | 'success' | 'error';

export type FlightListState = {
  status: FlightListStatus;
  items: FlightDto[];
  /** Filtre sonrası toplam (meta.total). İlk yanıt gelene kadar null. */
  total: number | null;
  /** Son başarıyla yüklenen sayfa; henüz yoksa 0. */
  page: number;
  hasMore: boolean;
  error: string | null;
};

export type FlightListAction =
  | { type: 'loadStarted'; page: number }
  | { type: 'loadSucceeded'; response: FlightListResponse }
  | { type: 'loadFailed'; message: string };

export const initialFlightListState: FlightListState = {
  status: 'idle',
  items: [],
  total: null,
  page: 0,
  hasMore: false,
  error: null,
};

export function flightListReducer(state: FlightListState, action: FlightListAction): FlightListState {
  switch (action.type) {
    case 'loadStarted':
      return { ...state, status: action.page === 1 ? 'loading' : 'loadingMore', error: null };
    case 'loadSucceeded': {
      const { items, meta } = action.response;
      return {
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
