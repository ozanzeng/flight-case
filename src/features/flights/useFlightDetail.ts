import { useEffect, useState } from 'react';

import { fetchFlightById } from '../../api/flightsApi';
import type { FlightDto } from '../../api/types';
import { toMessage } from './useFlightList';

type DetailState =
  | { status: 'loading' }
  | { status: 'success'; flight: FlightDto }
  | { status: 'error'; message: string };

export function useFlightDetail(id: string) {
  const [state, setState] = useState<DetailState>({ status: 'loading' });

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
  }, [id]);

  return state;
}
