import { fireEvent, render, screen } from '@testing-library/react-native';

import flights from '../../../case-kit/flights.json';
import type { FlightDto } from '../../api/types';
import { useFavoritesStore } from '../../features/favorites/favoritesStore';
import { FlightCard } from '../FlightCard';

const fl004 = (flights as FlightDto[]).find(flight => flight.id === 'FL004')!;

beforeEach(() => useFavoritesStore.setState({ byId: {} }));

describe('FlightCard (2.1)', () => {
  it('havayolu, uçuş no, havalimanı kodları, saatler, süre, aktarma, fiyat ve favori aksiyonunu gösterir', async () => {
    await render(<FlightCard flight={fl004} onPress={jest.fn()} />);

    expect(screen.getByText('Anadolu Express · AE331')).toBeTruthy();
    expect(screen.getByText('SAW')).toBeTruthy();
    expect(screen.getByText('AYT')).toBeTruthy();
    expect(screen.getByText('07:30')).toBeTruthy();
    expect(screen.getByText('11:00')).toBeTruthy();
    expect(screen.getByText('3 sa 30 dk · 1 aktarmalı')).toBeTruthy();
    expect(screen.getByText('1.199,00 TL')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle' })).toBeTruthy();
  });

  it('karta dokununca doğru uçuşla detay aksiyonu çağrılır', async () => {
    const onPress = jest.fn();
    await render(<FlightCard flight={fl004} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Anadolu Express · AE331'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(fl004);
  });

  it('favori aksiyonu detay navigasyonunu tetiklemez; durumu adı ve seçili bilgisiyle değişir', async () => {
    const onPress = jest.fn();
    await render(<FlightCard flight={fl004} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'AE331 uçuşunu favorilere ekle' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(useFavoritesStore.getState().byId.FL004).toEqual(fl004);
    expect(screen.getByRole('button', { name: 'AE331 uçuşunu favorilerden çıkar', selected: true })).toBeTruthy();
    // Durum yalnız renkle değil, yıldız şekliyle de görünür.
    expect(screen.getByText('★')).toBeTruthy();
  });

  it('snapshot', async () => {
    await render(<FlightCard flight={fl004} onPress={jest.fn()} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
