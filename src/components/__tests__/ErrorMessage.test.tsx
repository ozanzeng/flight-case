import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage (2.6)', () => {
  it('anlaşılır mesajı ve "Tekrar dene" aksiyonunu gösterir', async () => {
    const onRetry = jest.fn();
    await render(<ErrorMessage message="Uçuşlar yüklenemedi. Lütfen tekrar deneyin." onRetry={onRetry} />);

    expect(screen.getByText('Uçuşlar yüklenemedi. Lütfen tekrar deneyin.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('snapshot', async () => {
    await render(<ErrorMessage message="Uçuşlar yüklenemedi. Lütfen tekrar deneyin." onRetry={jest.fn()} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
