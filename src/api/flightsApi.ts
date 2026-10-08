import { API_BASE_URL } from './config';
import type {
  ApiErrorResponse,
  FlightDetailResponse,
  FlightDto,
  FlightListQuery,
  FlightListResponse,
} from './types';

type ApiErrorCode = ApiErrorResponse['error']['code'] | 'NETWORK_ERROR' | 'UNKNOWN';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sorgu metnini sabit anahtar sırasıyla üretir. Tanımsız alanlar gönderilmez;
 * sunucu varsayılanları uygular.
 */
function buildFlightsQuery(query: FlightListQuery): string {
  const pairs: [string, string][] = [];
  if (query.page !== undefined) pairs.push(['page', String(query.page)]);
  if (query.limit !== undefined) pairs.push(['limit', String(query.limit)]);
  if (query.sort !== undefined) pairs.push(['sort', query.sort]);
  if (query.onlyDirect !== undefined) pairs.push(['onlyDirect', String(query.onlyDirect)]);
  return pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK_ERROR', 'Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as Partial<ApiErrorResponse> | null)?.error;
    throw new ApiError(error?.code ?? 'UNKNOWN', error?.message ?? 'Beklenmeyen bir hata oluştu.');
  }
  return body as T;
}

export function fetchFlights(query: FlightListQuery, signal?: AbortSignal): Promise<FlightListResponse> {
  return request<FlightListResponse>(`/flights?${buildFlightsQuery(query)}`, signal);
}

export async function fetchFlightById(id: string, signal?: AbortSignal): Promise<FlightDto> {
  const { item } = await request<FlightDetailResponse>(`/flights/${encodeURIComponent(id)}`, signal);
  return item;
}
