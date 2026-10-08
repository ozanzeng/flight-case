/**
 * Smoke: API katmanı gerçek case-kit sunucusuyla (server.js) uçtan uca konuşur.
 */
import { CASE_KIT_URL, debug, startCaseKit, stopCaseKit, useRealFetch } from '../../test-utils/caseKit';
import { ApiError, fetchFlightById, fetchFlights } from '../flightsApi';

jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  API_BASE_URL: require('../../test-utils/caseKit').CASE_KIT_URL,
}));
jest.setTimeout(30_000);

beforeAll(async () => {
  useRealFetch();
  await startCaseKit();
});
afterAll(stopCaseKit);
beforeEach(() => debug('/debug/reset'));

const query = { limit: 8, sort: 'price', onlyDirect: false } as const;

describe(`case-kit smoke (${CASE_KIT_URL})`, () => {
  it('BASLA.md doğrulaması: fiyat sırasında ilk üç kayıt FL004, FL009, FL006', async () => {
    const { items, meta } = await fetchFlights({ ...query, page: 1 });
    expect(items.slice(0, 3).map(f => f.id)).toEqual(['FL004', 'FL009', 'FL006']);
    expect(meta).toMatchObject({ page: 1, limit: 8, total: 24, hasMore: true });
  });

  it('üç sayfa 24 benzersiz uçuşu verir; son sayfada hasMore=false', async () => {
    const pages = await Promise.all([1, 2, 3].map(page => fetchFlights({ ...query, page })));
    const ids = pages.flatMap(p => p.items.map(f => f.id));
    expect(new Set(ids).size).toBe(24);
    expect(pages.map(p => p.meta.hasMore)).toEqual([true, true, false]);
  });

  it('onlyDirect=true sunucuda filtreler: 17 uçuş, hepsi direkt', async () => {
    const pages = await Promise.all([1, 2, 3].map(page => fetchFlights({ ...query, onlyDirect: true, page })));
    expect(pages[0].meta.total).toBe(17);
    expect(pages.flatMap(p => p.items).every(f => f.stops === 0)).toBe(true);
  });

  it('sort=duration sunucuda sıralar: süreler artan', async () => {
    const { items } = await fetchFlights({ ...query, sort: 'duration', page: 1 });
    const durations = items.map(f => f.durationMinutes);
    expect(durations).toEqual([...durations].sort((a, b) => a - b));
    expect(items[0].id).toBe('FL003');
  });

  it('detay: FL024 ertesi gün varır, bagajı 0', async () => {
    const flight = await fetchFlightById('FL024');
    expect(flight).toMatchObject({ arrivalAt: '2026-10-16T00:45:00+03:00', baggageKg: 0 });
  });

  it('hatalar ApiError olarak gelir: bilinmeyen id, fail-once, ulaşılamayan sunucu', async () => {
    await expect(fetchFlightById('FL999')).rejects.toMatchObject({ code: 'FLIGHT_NOT_FOUND' });

    await debug('/debug/fail-once');
    await expect(fetchFlights({ ...query, page: 1 })).rejects.toMatchObject({
      code: 'FLIGHTS_UNAVAILABLE',
      message: 'Uçuşlar yüklenemedi. Lütfen tekrar deneyin.',
    });
    await expect(fetchFlights({ ...query, page: 1 })).resolves.toHaveProperty('meta.total', 24);

    stopCaseKit();
    const error = await fetchFlights({ ...query, page: 1 }).catch(e => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('NETWORK_ERROR');
    await startCaseKit();
  });
});
