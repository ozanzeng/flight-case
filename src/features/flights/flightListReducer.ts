import type { FlightDto, FlightListResponse } from '../../api/types';

export type FlightListStatus = 'idle' | 'loading' | 'success' | 'error';

export type FlightListState = {
  status: FlightListStatus;
  items: FlightDto[];
  /** Filtre sonrası toplam (meta.total). İlk yanıt gelene kadar null. */
  total: number | null;
  error: string | null;
};

export type FlightListAction =
  | { type: 'loadStarted' }
  | { type: 'loadSucceeded'; response: FlightListResponse }
  | { type: 'loadFailed'; message: string };

export const initialFlightListState: FlightListState = {
  status: 'idle',
  items: [],
  total: null,
  error: null,
};

export function flightListReducer(state: FlightListState, action: FlightListAction): FlightListState {
  switch (action.type) {
    case 'loadStarted':
      return { ...state, status: 'loading', error: null };
    case 'loadSucceeded':
      return {
        status: 'success',
        items: action.response.items,
        total: action.response.meta.total,
        error: null,
      };
    case 'loadFailed':
      return { ...state, status: 'error', error: action.message };
  }
}
