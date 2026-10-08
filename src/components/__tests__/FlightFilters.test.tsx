import { fireEvent, render, screen } from '@testing-library/react-native';

import { FlightFilters } from '../FlightFilters';

function setup(props: Partial<Parameters<typeof FlightFilters>[0]> = {}) {
  const onSortChange = jest.fn();
  const onOnlyDirectChange = jest.fn();
  const view = render(
    <FlightFilters
      sort="price"
      onlyDirect={false}
      onSortChange={onSortChange}
      onOnlyDirectChange={onOnlyDirectChange}
      {...props}
    />,
  );
  return { view, onSortChange, onOnlyDirectChange };
}

describe('FlightFilters (2.3)', () => {
  it('"Yalnızca direkt" ve iki sıralama seçeneği erişilebilir ad ve seçili durumla görünür', async () => {
    await setup().view;

    expect(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }).props.value).toBe(false);
    expect(screen.getByRole('button', { name: 'Sırala: En düşük fiyat', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sırala: En kısa süre', selected: false })).toBeTruthy();
    // Seçim yalnız renkle değil onay işaretiyle de belirtilir.
    expect(screen.getByText('✓ En düşük fiyat')).toBeTruthy();
    expect(screen.getByText('En kısa süre')).toBeTruthy();
  });

  it('kontroller değişikliği üst bileşene bildirir', async () => {
    const { view, onSortChange, onOnlyDirectChange } = setup();
    await view;

    await fireEvent.press(screen.getByRole('button', { name: 'Sırala: En kısa süre' }));
    await fireEvent(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }), 'valueChange', true);

    expect(onSortChange).toHaveBeenCalledWith('duration');
    expect(onOnlyDirectChange).toHaveBeenCalledWith(true);
  });

  it('seçili durum props ile gelir', async () => {
    await setup({ sort: 'duration', onlyDirect: true }).view;

    expect(screen.getByRole('switch', { name: 'Yalnızca direkt uçuşlar' }).props.value).toBe(true);
    expect(screen.getByRole('button', { name: 'Sırala: En kısa süre', selected: true })).toBeTruthy();
    expect(screen.getByText('✓ En kısa süre')).toBeTruthy();
  });

  it('snapshot', async () => {
    await setup().view;
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
