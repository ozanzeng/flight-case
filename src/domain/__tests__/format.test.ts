import {
  formatBaggage,
  formatDate,
  formatDuration,
  formatPrice,
  formatStops,
  formatTime,
} from '../format';

describe('formatPrice (2.1)', () => {
  it('kuruşu "1.234,56 TL" biçiminde yazar', () => {
    expect(formatPrice(355000)).toBe('3.550,00 TL');
    expect(formatPrice(119900)).toBe('1.199,00 TL');
    expect(formatPrice(99905)).toBe('999,05 TL');
    expect(formatPrice(123456789)).toBe('1.234.567,89 TL');
  });
});

describe('formatTime (2.1)', () => {
  it('saati Europe/Istanbul olarak gösterir, cihaz saat diliminden bağımsız', () => {
    expect(formatTime('2026-10-15T06:15:00+03:00')).toBe('06:15');
    expect(formatTime('2026-10-16T00:45:00+03:00')).toBe('00:45');
    expect(formatTime('2026-10-15T03:15:00Z')).toBe('06:15');
  });
});

describe('formatDuration / formatStops (2.1)', () => {
  it('toplam süreyi ve direkt/aktarmalı bilgisini yazar', () => {
    expect(formatDuration(70)).toBe('1 sa 10 dk');
    expect(formatDuration(60)).toBe('1 sa');
    expect(formatDuration(45)).toBe('45 dk');
    expect(formatStops(0)).toBe('Direkt');
    expect(formatStops(1)).toBe('1 aktarmalı');
  });
});

describe('formatDate (2.4)', () => {
  it('takvim gününü Europe/Istanbul olarak yazar; FL024 ertesi gün varır', () => {
    expect(formatDate('2026-10-15T23:20:00+03:00')).toBe('15 Ekim 2026');
    expect(formatDate('2026-10-16T00:45:00+03:00')).toBe('16 Ekim 2026');
    // UTC'de hâlâ 15 Ekim olan an İstanbul'da 16 Ekim'dir.
    expect(formatDate('2026-10-15T21:45:00Z')).toBe('16 Ekim 2026');
  });
});

describe('formatBaggage (2.4)', () => {
  it('0 ve null farklı gösterilir', () => {
    expect(formatBaggage(0)).toBe('Bagaj dahil değil');
    expect(formatBaggage(null)).toBe('Bagaj bilgisi yok');
    expect(formatBaggage(20)).toBe('20 kg');
  });
});
