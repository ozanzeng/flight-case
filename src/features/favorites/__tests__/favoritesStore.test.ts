import AsyncStorage from '@react-native-async-storage/async-storage';

import flights from '../../../../case-kit/flights.json';
import type { FlightDto } from '../../../api/types';

const [fl004, fl009] = ['FL004', 'FL009'].map(id => (flights as FlightDto[]).find(flight => flight.id === id)!);
const STORAGE_KEY = 'favorites';

/** Uygulamanın yeniden açılması: store modülü baştan yüklenir, depolama aynı kalır. */
function openApp() {
  let module!: typeof import('../favoritesStore');
  jest.isolateModules(() => {
    jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
    module = require('../favoritesStore');
  });
  return module.useFavoritesStore;
}

async function storedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? Object.keys(JSON.parse(raw).state.byId).sort() : [];
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('favoritesStore', () => {
  it('2.5: açılışta kayıtlı favorileri depolamadan geri yükler; yüklerken depolamaya yazmaz', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { byId: { FL004: fl004 } }, version: 0 }));
    jest.clearAllMocks();

    const store = openApp();
    expect(store.getState().byId).toEqual({});

    await store.persist.rehydrate();

    expect(store.getState().byId).toEqual({ FL004: fl004 });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(await storedIds()).toEqual(['FL004']);
  });

  it('2.5: ekleme ve çıkarma depolamaya yazılır; uygulama yeniden açılınca son durum geri yüklenir', async () => {
    const store = openApp();
    await store.persist.rehydrate();

    store.getState().toggle(fl004);
    store.getState().toggle(fl009);
    await new Promise(setImmediate);
    expect(await storedIds()).toEqual(['FL004', 'FL009']);

    store.getState().toggle(fl004);
    await new Promise(setImmediate);
    expect(await storedIds()).toEqual(['FL009']);

    const reopened = openApp();
    await reopened.persist.rehydrate();
    expect(reopened.getState().byId).toEqual({ FL009: fl009 });
  });
});
