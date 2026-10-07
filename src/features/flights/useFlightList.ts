import { useEffect, useReducer } from 'react';

import { PAGE_SIZE } from '../../api/config';
import { ApiError, fetchFlights } from '../../api/flightsApi';
import { flightListReducer, initialFlightListState } from './flightListReducer';

export function useFlightList() {
  const [state, dispatch] = useReducer(flightListReducer, initialFlightListState);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'loadStarted' });
    fetchFlights({ page: 1, limit: PAGE_SIZE, sort: 'price', onlyDirect: false }, controller.signal)
      .then(response => dispatch({ type: 'loadSucceeded', response }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'loadFailed', message: toMessage(error) });
      });
    return () => controller.abort();
  }, []);

  return state;
}

export function toMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Beklenmeyen bir hata oluştu.';
}
