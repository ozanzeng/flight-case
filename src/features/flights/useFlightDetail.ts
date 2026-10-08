import { useCallback, useEffect, useState } from 'react';

import { fetchFlightById } from '../../api/flightsApi';
import type { FlightDto } from '../../api/types';
import { toMessage } from './useFlightList';

type DetailState =
  | { status: 'loading' }
  | { status: 'success'; flight: FlightDto }
  | { status: 'error'; message: string };

export function useFlightDetail(id: string) {
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  // Artırıldığında istek yeniden yapılır ("Tekrar dene").
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchFlightById(id, controller.signal)
      .then(flight => setState({ status: 'success', flight }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: toMessage(error) });
      });
    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);

  return { state, retry };
}
