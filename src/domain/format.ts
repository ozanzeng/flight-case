/**
 * Ekranda gösterilen metinlerin tek kaynağı. Cihazın yerel ayarlarından ve
 * saat diliminden bağımsız, deterministik çıktı üretir.
 */

// Europe/Istanbul 2016'dan beri yaz saati uygulamadan sabit UTC+3'tür.
// Intl/ICU desteğine güvenmek yerine sabit ofset kullanıyoruz; servis de +03:00 döner.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function toIstanbul(iso: string): Date {
  // Dönen Date'in UTC alanları İstanbul duvar saatini taşır.
  return new Date(Date.parse(iso) + ISTANBUL_OFFSET_MS);
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/** 355000 → "3.550,00 TL" */
export function formatPrice(priceMinor: number): string {
  const lira = Math.floor(priceMinor / 100);
  const kurus = priceMinor % 100;
  const grouped = String(lira).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped},${pad2(kurus)} TL`;
}

/** "2026-10-15T06:15:00+03:00" → "06:15" (Europe/Istanbul) */
export function formatTime(iso: string): string {
  const date = toIstanbul(iso);
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

/** 70 → "1 sa 10 dk", 60 → "1 sa", 45 → "45 dk" */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}

export function formatStops(stops: number): string {
  return stops === 0 ? 'Direkt' : `${stops} aktarmalı`;
}
