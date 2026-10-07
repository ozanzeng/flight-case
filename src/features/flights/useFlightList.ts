import { useCallback, useEffect, useReducer, useRef } from 'react';

import { PAGE_SIZE } from '../../api/config';
import { ApiError, fetchFlights } from '../../api/flightsApi';
import { flightListReducer, initialFlightListState } from './flightListReducer';

export function useFlightList() {
  const [state, dispatch] = useReducer(flightListReducer, initialFlightListState);
  // Ref, state güncellenmeden önce gelen ikinci tetiklemeyi de (ör. art arda onEndReached) eler.
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const loadPage = useCallback((page: number) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    dispatch({ type: 'loadStarted', page });
    fetchFlights({ page, limit: PAGE_SIZE, sort: 'price', onlyDirect: false }, controller.signal)
      .then(response => dispatch({ type: 'loadSucceeded', response }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'loadFailed', message: toMessage(error) });
      })
      .finally(() => {
        if (controllerRef.current === controller) inFlightRef.current = false;
      });
  }, []);

  useEffect(() => {
    loadPage(1);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      inFlightRef.current = false;
    };
  }, [loadPage]);

  const { status, hasMore, page } = state;
  const loadNextPage = useCallback(() => {
    // Yalnızca son yükleme başarılıysa ve servis devamı olduğunu söylüyorsa.
    if (status !== 'success' || !hasMore) return;
    loadPage(page + 1);
  }, [loadPage, status, hasMore, page]);

  return { ...state, loadNextPage };
}

export function toMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Beklenmeyen bir hata oluştu.';
}
