import { useCallback, useEffect, useReducer, useRef } from 'react';

import { PAGE_SIZE } from '../../api/config';
import { ApiError, fetchFlights } from '../../api/flightsApi';
import type { FlightSort } from '../../api/types';
import { flightListReducer, initialFlightListState, type FlightQuery } from './flightListReducer';

export function useFlightList() {
  const [state, dispatch] = useReducer(flightListReducer, initialFlightListState);
  // Ref, state güncellenmeden önce gelen ikinci tetiklemeyi de (ör. art arda onEndReached) eler.
  const inFlightRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const loadPage = useCallback((query: FlightQuery, page: number) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    dispatch({ type: 'loadStarted', page });
    fetchFlights({ page, limit: PAGE_SIZE, sort: query.sort, onlyDirect: query.onlyDirect }, controller.signal)
      .then(response => {
        // Sorgu değiştiyse istek iptal edilmiştir; geç gelen yanıt yeni sonuca karışmaz.
        if (controller.signal.aborted) return;
        dispatch({ type: 'loadSucceeded', response });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'loadFailed', message: toMessage(error) });
      })
      .finally(() => {
        if (controllerRef.current === controller) inFlightRef.current = false;
      });
  }, []);

  const { query } = state;
  useEffect(() => {
    // Açılışta ve her sorgu değişiminde ilk sayfadan başlanır; önceki istek iptal edilir.
    loadPage(query, 1);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      inFlightRef.current = false;
    };
  }, [loadPage, query]);

  const { status, hasMore, page } = state;
  const loadNextPage = useCallback(() => {
    // Yalnızca son yükleme başarılıysa ve servis devamı olduğunu söylüyorsa.
    if (status !== 'success' || !hasMore) return;
    loadPage(query, page + 1);
  }, [loadPage, query, status, hasMore, page]);

  const setSort = useCallback((sort: FlightSort) => dispatch({ type: 'queryChanged', query: { sort } }), []);
  const setOnlyDirect = useCallback(
    (onlyDirect: boolean) => dispatch({ type: 'queryChanged', query: { onlyDirect } }),
    [],
  );

  return { ...state, loadNextPage, setSort, setOnlyDirect };
}

export function toMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Beklenmeyen bir hata oluştu.';
}
