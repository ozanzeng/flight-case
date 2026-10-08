/**
 * Entegrasyon (2.5): <App /> açılışı. Kayıtlı favoriler yüklenmeden ekran gösterilmez ve
 * açılışta depolamaya yazılmaz; kayıtlı favori listede işaretli gelir. Liste gerçek case-kit'ten.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';

import App from '../../App';
import flights from '../../case-kit/flights.json';
import type { FlightDto } from '../api/types';
import { startCaseKit, stopCaseKit, useRealFetch } from '../test-utils/caseKit';

jest.mock('../api/config', () => ({
  ...jest.requireActual('../api/config'),
  API_BASE_URL: require('../test-utils/caseKit').CASE_KIT_URL,
}));
jest.setTimeout(30_000);

const fl004 = (flights as FlightDto[]).find(flight => flight.id === 'FL004')!;
const saved = JSON.stringify({ state: { byId: { FL004: fl004 } }, version: 0 });

beforeAll(async () => {
  useRealFetch();
  await startCaseKit();
  await AsyncStorage.setItem('favorites', saved);
  jest.clearAllMocks();
});
afterAll(stopCaseKit);

it('2.5: kayıtlı favoriler yüklenmeden ekran gösterilmez, açılışta depolamaya yazılmaz, favori işaretli gelir', async () => {
  // Depolama okuması biz bırakana kadar bekler.
  let finishRead!: () => void;
  const read = AsyncStorage.getItem as jest.Mock;
  const realRead = read.getMockImplementation()!;
  read.mockImplementationOnce(
    (key: string) => new Promise(resolve => (finishRead = () => resolve(realRead(key)))),
  );

  await render(<App />);

  // Kayıtlar okunurken liste ekranı (ve favori butonları) hiç yok; depolamaya yazılmamış.
  expect(screen.queryByRole('switch', { name: 'Yalnızca direkt uçuşlar' })).toBeNull();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  expect(screen.container.queryAll(node => node.type === 'ActivityIndicator')).toHaveLength(1);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();

  await act(async () => finishRead());

  expect(await screen.findByText('24 uçuş bulundu', {}, { timeout: 5000 })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilerden çıkar', selected: true })).toBeTruthy();
  expect(AsyncStorage.getItem).toHaveBeenCalledWith('favorites');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(await AsyncStorage.getItem('favorites')).toBe(saved);
});
