/**
 * Entegrasyon: uygulamanın tüm ekranları ve navigasyonu, gerçek case-kit sunucusuyla (server.js).
 * Senaryolar case-kit'in kendi /debug anahtarlarıyla üretilir.
 */
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { FlightListResponse } from '../api/types';
import { useFavoritesStore } from '../features/favorites/favoritesStore';
import { RootNavigator } from '../navigation/RootNavigator';
import type { RootStackParamList } from '../navigation/types';
import { debug, requestLog, serverGet, startCaseKit, stopCaseKit, useRealFetch } from '../test-utils/caseKit';

jest.mock('../api/config', () => ({
  ...jest.requireActual('../api/config'),
  API_BASE_URL: require('../test-utils/caseKit').CASE_KIT_URL,
}));
jest.setTimeout(30_000);

const navigation = createNavigationContainerRef<RootStackParamList>();
const WAIT = { timeout: 5000 };

beforeAll(async () => {
  useRealFetch();
  await startCaseKit();
});
afterAll(stopCaseKit);
beforeEach(async () => {
  await debug('/debug/reset');
  requestLog.length = 0;
  useFavoritesStore.setState({ byId: {} });
});

async function renderApp() {
  await render(
    <NavigationContainer ref={navigation}>
      <RootNavigator />
    </NavigationContainer>,
  );
}

const listRequests = () => requestLog.filter(url => url.includes('/flights?'));
const query = (url: string) => Object.fromEntries(new URL(url).searchParams);
/** Ekrandaki kartlar, yukarıdan aşağıya "Havayolu UçuşNo" olarak. */
const visibleCards = () =>
  screen.queryAllByRole('button', { name: / kalkış, / }).map(card => card.props.accessibilityLabel.split(',')[0]);
const card = (flightNumber: string) => screen.getByRole('button', { name: new RegExp(` ${flightNumber}, `) });
const spinners = () => screen.container.queryAll(node => node.type === 'ActivityIndicator');
const endReached = () => fireEvent(screen.getByText(/uçuş bulundu$/), 'endReached');
const goBack = () => act(async () => navigation.goBack());
const serverCards = async (path: string) =>
  (await serverGet<FlightListResponse>(path)).items.map(f => `${f.airline} ${f.flightNumber}`);

describe('2.1 Uçuş listesi', () => {
  it('uygulama listeyle açılır; kartta tüm alanlar ve meta.total görünür', async () => {
    await renderApp();

    expect(await screen.findByText('24 uçuş bulundu', {}, WAIT)).toBeTruthy();
    expect(navigation.getCurrentRoute()?.name).toBe('FlightList');
    expect(card('AE331').props.accessibilityLabel).toBe(
      'Anadolu Express AE331, SAW 07:30 kalkış, AYT 11:00 varış, 3 sa 30 dk, 1 aktarmalı, 1.199,00 TL',
    );
    expect(screen.getByText('Anadolu Express · AE331')).toBeTruthy();
    expect(screen.getByText('1.199,00 TL')).toBeTruthy();
    expect(screen.getByText('3 sa 30 dk · 1 aktarmalı')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle' })).toBeTruthy();
  });

  it('karta dokununca doğru uçuşun detayı açılır; favori aksiyonu navigasyonu tetiklemez', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    await fireEvent.press(screen.getByRole('button', { name: 'AE347 uçuşunu favorilere ekle' }));
    expect(navigation.getCurrentRoute()?.name).toBe('FlightList');
    expect(screen.getByRole('button', { name: 'AE347 uçuşunu favorilerden çıkar', selected: true })).toBeTruthy();

    await fireEvent.press(card('AE331'));
    expect(navigation.getCurrentRoute()).toMatchObject({ name: 'FlightDetail', params: { flightId: 'FL004' } });
    expect(await screen.findByText('AE331', {}, WAIT)).toBeTruthy();
    expect(screen.getByText('Anadolu Express')).toBeTruthy();
  });
});

describe('2.2 Sayfalama', () => {
  it('liste sonunda sonraki sayfa yüklenir, belirteç listeyi bloklamaz, hasMore=false olunca durur', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    expect(visibleCards()).toHaveLength(8);

    await endReached();
    await endReached(); // yükleme sürerken ikinci tetikleme istek üretmez
    // Belirteç listenin altında; mevcut kartlar görünür.
    expect(screen.getByLabelText('Daha fazla uçuş yükleniyor')).toBeTruthy();
    expect(visibleCards().length).toBeGreaterThanOrEqual(8);
    await waitFor(() => expect(screen.queryByLabelText('Daha fazla uçuş yükleniyor')).toBeNull(), WAIT);

    await endReached();
    await waitFor(() => expect(listRequests()).toHaveLength(3), WAIT);
    await waitFor(() => expect(screen.queryByLabelText('Daha fazla uçuş yükleniyor')).toBeNull(), WAIT);
    await endReached(); // hasMore=false

    expect(listRequests().map(url => query(url).page)).toEqual(['1', '2', '3']);
    expect(listRequests().every(url => query(url).limit === '8')).toBe(true);
  });
});

describe('2.3 Filtre ve sıralama', () => {
  it('varsayılan: filtre kapalı, en düşük fiyat; istek sunucuya bu parametrelerle gider', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    expect(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }).props.value).toBe(false);
    expect(screen.getByRole('button', { name: 'Sırala: En düşük fiyat', selected: true })).toBeTruthy();
    expect(query(listRequests()[0])).toMatchObject({ page: '1', sort: 'price', onlyDirect: 'false' });
  });

  it('filtre ve sıralama sunucuda uygulanır; değişince sayfalama başa döner; sıra sunucunun sırasıdır', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await endReached();
    await waitFor(() => expect(listRequests()).toHaveLength(2), WAIT);

    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);
    expect(await screen.findByText('17 uçuş bulundu', {}, WAIT)).toBeTruthy();
    expect(query(listRequests()[2])).toMatchObject({ page: '1', sort: 'price', onlyDirect: 'true' });
    expect(visibleCards()).toEqual(await serverCards('/flights?page=1&limit=8&sort=price&onlyDirect=true'));

    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await waitFor(() => expect(listRequests()).toHaveLength(4), WAIT);
    expect(query(listRequests()[3])).toMatchObject({ page: '1', sort: 'duration', onlyDirect: 'true' });
    await waitFor(() => expect(visibleCards()[0]).toBe('Toros Air TA512'), WAIT);
    expect(visibleCards()).toEqual(await serverCards('/flights?page=1&limit=8&sort=duration&onlyDirect=true'));
  });

  it('filtre sonucu boşsa açıklama ve "Filtreyi temizle" gösterilir; temizleyince filtre kapanır', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);
    await screen.findByText('17 uçuş bulundu', {}, WAIT);

    await debug('/debug/empty?value=on');
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    expect(await screen.findByText('Direkt uçuş bulunamadı', {}, WAIT)).toBeTruthy();

    await debug('/debug/empty?value=off');
    await fireEvent.press(screen.getByRole('button', { name: 'Filtreyi temizle' }));
    expect(await screen.findByText('24 uçuş bulundu', {}, WAIT)).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }).props.value).toBe(false);
    expect(screen.getByRole('button', { name: 'Sırala: En kısa süre', selected: true })).toBeTruthy();
  });
});

describe('2.4 Uçuş detayı', () => {
  it('kalkış/varış tarihi ve bagaj: FL024 ertesi gün varır, bagaj 0 → "Bagaj dahil değil"', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);
    await screen.findByText('17 uçuş bulundu', {}, WAIT);

    await fireEvent.press(card('AE383'));
    expect(await screen.findByLabelText('Kalkış: 15 Ekim 2026, 23:20 · SAW', {}, WAIT)).toBeTruthy();
    expect(screen.getByLabelText('Varış: 16 Ekim 2026, 00:45 · AYT')).toBeTruthy();
    expect(screen.getByLabelText('Bagaj: Bagaj dahil değil')).toBeTruthy();
    expect(screen.getByLabelText('Fiyat: 1.520,00 TL')).toBeTruthy();
  });

  it('bagaj null → "Bagaj bilgisi yok", sayı → kg', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    await fireEvent.press(card('MK126'));
    expect(await screen.findByLabelText('Bagaj: Bagaj bilgisi yok', {}, WAIT)).toBeTruthy();
    await goBack();

    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await waitFor(() => expect(visibleCards()[2]).toBe('Mavi Kanat MK118'), WAIT);
    await fireEvent.press(card('MK118'));
    expect(await screen.findByLabelText('Bagaj: 20 kg', {}, WAIT)).toBeTruthy();
  });

  it('detayda favori ekleme/çıkarma çalışır ve listeye anında yansır', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await fireEvent.press(card('AE331'));
    await screen.findByText('AE331', {}, WAIT);

    await fireEvent.press(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle' }));
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilerden çıkar', selected: true })).toBeTruthy();
    await goBack();
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilerden çıkar', selected: true })).toBeTruthy();
  });

  it('listeye dönülünce filtre, sıralama ve yüklenmiş sayfalar korunur (yeniden istek yok)', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);
    await screen.findByText('17 uçuş bulundu', {}, WAIT);
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await waitFor(() => expect(visibleCards()[0]).toBe('Toros Air TA512'), WAIT);
    await endReached();
    await waitFor(() => expect(screen.queryByLabelText('Daha fazla uçuş yükleniyor')).toBeNull(), WAIT);
    const cardsBefore = visibleCards();
    const requestsBefore = listRequests().length;

    await fireEvent.press(card('MK134'));
    await screen.findByText('MK134', {}, WAIT);
    await goBack();

    expect(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }).props.value).toBe(true);
    expect(screen.getByRole('button', { name: 'Sırala: En kısa süre', selected: true })).toBeTruthy();
    expect(screen.getByText('17 uçuş bulundu')).toBeTruthy();
    expect(visibleCards()).toEqual(cardsBefore);
    expect(listRequests()).toHaveLength(requestsBefore);
  });
});

describe('2.5 Favoriler', () => {
  it('ayrı ekranda listelenir, detay açılır, çıkarılır; işaretler tutarlı; son favoride boş durum', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    await fireEvent.press(screen.getByRole('button', { name: 'AE347 uçuşunu favorilere ekle' }));
    await fireEvent.press(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Favoriler' }));
    expect(navigation.getCurrentRoute()?.name).toBe('Favorites');
    expect(visibleCards()).toEqual(['Anadolu Express AE331', 'Anadolu Express AE347']); // kalkış saatine göre

    // Favoriler → detay: işaret dolu; detayda çıkarınca favoriler ve liste anında güncellenir.
    await fireEvent.press(card('AE331'));
    await screen.findByText('AE331', {}, WAIT);
    await fireEvent.press(screen.getByRole('button', { name: 'AE331 uçuşunu favorilerden çıkar', selected: true }));
    await goBack();
    expect(visibleCards()).toEqual(['Anadolu Express AE347']);
    await goBack();
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle', selected: false })).toBeTruthy();

    // Favoriler ekranı liste filtresinden bağımsız: aktarmalı AE347 direkt filtresi açıkken de görünür.
    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);
    await screen.findByText('17 uçuş bulundu', {}, WAIT);
    await fireEvent.press(screen.getByRole('button', { name: 'Favoriler' }));
    expect(visibleCards()).toEqual(['Anadolu Express AE347']);

    // Son favori favoriler ekranından çıkarılınca boş durum.
    await fireEvent.press(screen.getByRole('button', { name: 'AE347 uçuşunu favorilerden çıkar' }));
    expect(screen.getByText('Henüz favori uçuşun yok')).toBeTruthy();
  });
});

describe('2.6 Yüklenme, boş ve hata durumları', () => {
  it('ilk istekte yükleniyor; hata olunca yalnızca mesaj ve Tekrar dene; Tekrar dene başarıya döner', async () => {
    await debug('/debug/fail-once');
    await renderApp();
    expect(spinners()).toHaveLength(1); // ilk istek: yalnızca yükleniyor

    expect(await screen.findByText('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.', {}, WAIT)).toBeTruthy();
    expect(spinners()).toHaveLength(0);
    expect(screen.queryByText(/uçuş bulundu$/)).toBeNull();
    expect(screen.queryByText('Uçuş bulunamadı')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(await screen.findByText('24 uçuş bulundu', {}, WAIT)).toBeTruthy();
    expect(screen.queryByText('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.')).toBeNull();
  });

  it('servis boş liste dönerse yalnızca "Uçuş bulunamadı"', async () => {
    await debug('/debug/empty?value=on');
    await renderApp();

    expect(await screen.findByText('Uçuş bulunamadı', {}, WAIT)).toBeTruthy();
    expect(spinners()).toHaveLength(0);
    expect(screen.queryByText(/uçuş bulundu$/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tekrar dene' })).toBeNull();
  });

  it('sonraki sayfa hatası eldeki veriyi silmez; listenin altında Tekrar dene başarıya döner', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);
    const firstPage = visibleCards();

    await debug('/debug/fail-once');
    await endReached();
    expect(await screen.findByText('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.', {}, WAIT)).toBeTruthy();
    expect(visibleCards()).toEqual(firstPage);
    expect(screen.queryByLabelText('Daha fazla uçuş yükleniyor')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    await waitFor(() => expect(visibleCards()).toContain('Anadolu Express AE383'), WAIT);
    expect(visibleCards().slice(0, 8)).toEqual(firstPage);
    expect(listRequests().map(url => query(url).page)).toEqual(['1', '2', '2']);
  });

  it('detay isteği hata verirse mesaj ve Tekrar dene; tekrar deneme detayı açar', async () => {
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    await debug('/debug/fail-once');
    await fireEvent.press(card('AE331'));
    expect(await screen.findByText('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.', {}, WAIT)).toBeTruthy();
    expect(spinners()).toHaveLength(0);

    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(await screen.findByLabelText('Bagaj: Bagaj dahil değil', {}, WAIT)).toBeTruthy();
  });
});

describe('P1 Sırasız yanıt dayanıklılığı', () => {
  /** Geç kalan eski yanıtlar (race: 300–3000 ms) gelene kadar bekler. */
  const waitForLateResponses = () => act(async () => new Promise(resolve => setTimeout(resolve, 3500)));
  const directSwitch = () => screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' });

  it('race modunda filtre/sıralama hızlı değişince ekranda yalnızca son seçimin sonucu kalır', async () => {
    await debug('/debug/mode?value=race');
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    // Yanıt beklemeden beş hızlı değişiklik; son seçim: yalnızca direkt + en düşük fiyat.
    await fireEvent(directSwitch(), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await fireEvent(directSwitch(), 'valueChange', false);
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En düşük fiyat' }));
    await fireEvent(directSwitch(), 'valueChange', true);

    const expected = await serverCards('/flights?page=1&limit=8&sort=price&onlyDirect=true');
    await waitFor(() => expect(screen.getByText('17 uçuş bulundu')).toBeTruthy(), WAIT);
    expect(visibleCards()).toEqual(expected);

    await waitForLateResponses();
    expect(screen.getByText('17 uçuş bulundu')).toBeTruthy();
    expect(visibleCards()).toEqual(expected);
    expect(listRequests().slice(1).map(url => query(url))).toEqual([
      expect.objectContaining({ page: '1', sort: 'price', onlyDirect: 'true' }),
      expect.objectContaining({ page: '1', sort: 'duration', onlyDirect: 'true' }),
      expect.objectContaining({ page: '1', sort: 'duration', onlyDirect: 'false' }),
      expect.objectContaining({ page: '1', sort: 'price', onlyDirect: 'false' }),
      expect.objectContaining({ page: '1', sort: 'price', onlyDirect: 'true' }),
    ]);
  });

  it('race modunda son seçim filtresiz + en kısa süre olduğunda da geç yanıtlar üzerine yazmaz', async () => {
    await debug('/debug/mode?value=race');
    await renderApp();
    await screen.findByText('24 uçuş bulundu', {}, WAIT);

    await fireEvent(directSwitch(), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En düşük fiyat' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await fireEvent(directSwitch(), 'valueChange', false);

    const expected = await serverCards('/flights?page=1&limit=8&sort=duration&onlyDirect=false');
    await waitFor(() => expect(visibleCards()).toEqual(expected), WAIT);
    expect(screen.getByText('24 uçuş bulundu')).toBeTruthy();

    await waitForLateResponses();
    expect(screen.getByText('24 uçuş bulundu')).toBeTruthy();
    expect(visibleCards()).toEqual(expected);
  });
});
