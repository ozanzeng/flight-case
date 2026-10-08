# Testler

P0 maddelerinin (2.1–2.6) her biri birden fazla seviyede doğrulanır. 2.7'nin istediği iki
zorunlu test de bu paketin içindedir (aşağıda **2.7** ile işaretli).

| Seviye | Araç | Nerede | Ne doğrular |
|---|---|---|---|
| Unit | Jest | `src/domain`, `src/features/**/__tests__` | Formatlayıcılar, liste reducer'ı, liste hook'u, favori store'u |
| Bileşen | Jest + Testing Library | `src/components/__tests__` | Kart, filtreler, hata mesajı |
| Snapshot | Jest | `__snapshots__` | Kart, filtreler, hata mesajı, detay (FL024), favoriler (dolu/boş) — davranış testlerine **ek** |
| Smoke | Jest + gerçek case-kit | `src/api/__tests__/caseKit.smoke.test.ts` | API katmanı ↔ `case-kit/server.js` sözleşmesi |
| Entegrasyon | Jest + gerçek case-kit | `src/__tests__/app.*.test.tsx` | Tüm ekranlar ve navigasyon; senaryolar case-kit `/debug` anahtarlarıyla |
| E2E | Maestro | `e2e/` | Gerçek simülatörde Expo Go üzerinde uygulama; senaryolar case-kit `/debug` anahtarlarıyla |

Smoke ve entegrasyon testleri `case-kit/server.js`'i Jest worker'ına özel bir portta (4101, 4102, …)
kendisi açıp kapatır; 4000'deki sunucuya dokunmaz.

## Çalıştırma

```bash
npm test                 # unit + bileşen + snapshot + smoke + entegrasyon (53 test)
```

E2E (ek kurulum: Java 17+ ve [Maestro](https://maestro.mobile.dev)):

```bash
cd case-kit && node server.js            # 1. terminal — mock servis (4000)
npx expo start --ios                     # 2. terminal — uygulama simülatörde açık olmalı
npm run test:e2e -- -e APP_URL=exp://127.0.0.1:8081   # Metro adresi (varsayılan 8081)
```

## Madde → test eşleşmesi

### 2.1 Uçuş listesi
| Gereksinim | Testler |
|---|---|
| Uygulama listeyle açılır | Entegrasyon: *uygulama listeyle açılır…* · E2E `2.1` |
| Kartta havayolu, uçuş no, kalkış/varış kodu, saatler, süre, direkt/aktarmalı, fiyat, favori | Bileşen: *FlightCard … tüm alanlar* · Unit: `format` (fiyat, saat, süre, aktarma) · Entegrasyon · E2E `2.1` · Snapshot |
| Toplam sonuç sayısı (`meta.total`) | Entegrasyon: *24 uçuş bulundu* · E2E `2.1` |
| Karta dokununca doğru uçuşun detayı | Bileşen: *doğru uçuşla detay aksiyonu* · Entegrasyon: *route params FL004* · E2E `2.1` |
| Favori aksiyonu detay navigasyonunu tetiklemez | Bileşen · Entegrasyon · E2E `2.1` |

### 2.2 Sayfalama
| Gereksinim | Testler |
|---|---|
| `page`/`limit=8` ile sayfa sayfa | Entegrasyon: istek URL'lerinde `page=1,2,3`, `limit=8` · Smoke: 3 sayfa = 24 benzersiz uçuş |
| Liste sonunda sonraki sayfa; `hasMore=false` olunca durur | Unit (reducer, hook) · Entegrasyon · E2E `2.2` (AE383 → AE371, sonra belirteç yok) |
| Aynı sayfa iki kez istenmez; yükleme sürerken istek gitmez | Unit (hook): art arda iki tetikleme → tek istek · Entegrasyon |
| Belirteç ekranı bloklamaz, liste görünür kalır | Unit (reducer: `loadingMore`'da kartlar korunur) · Entegrasyon: belirteç + kartlar birlikte · Simülatör ekran görüntüsü (yavaş mod) |

> E2E notu: Sonraki sayfa belirteci case-kit'in en uzun gecikmesi olan 3 sn içinde kaybolur;
> Maestro'nun iOS hiyerarşi okuması bu pencereyi güvenilir yakalayamadığından bu tek nokta
> E2E'de değil, entegrasyon testinde doğrulanır.

### 2.3 Filtre ve sıralama
| Gereksinim | Testler |
|---|---|
| "Yalnızca direkt" ve "En düşük fiyat"/"En kısa süre" | Bileşen: *FlightFilters* · Entegrasyon · E2E `2.3` · Snapshot |
| Varsayılan: filtre kapalı, en düşük fiyat | Unit (reducer) · Bileşen · Entegrasyon · E2E `2.3` |
| Sunucu tarafında (`onlyDirect`, `sort`); istemcide yeniden sıralama yok | Smoke (sunucu filtreler/sıralar) · Entegrasyon: istek parametreleri ve ekrandaki sıra = sunucu yanıtı · E2E `2.3` |
| Değişince sayfalama başa döner; eski veri karışmaz | **2.7** Unit (hook): *filtre değişince sayfalama başa döner…* · Unit (reducer) · Unit (hook): *geç dönen eski yanıt karışmaz* · Entegrasyon |
| Boş sonuçta açıklama ve "Filtreyi temizle" | Entegrasyon (`/debug/empty`) · E2E `2.3` |

### 2.4 Uçuş detayı
| Gereksinim | Testler |
|---|---|
| Kalkış/varış tarihi (FL024 ertesi gün) | Unit: `formatDate` · Entegrasyon · E2E `2.4` · Snapshot (FL024) |
| Bagaj: `0` → "Bagaj dahil değil", `null` → "Bagaj bilgisi yok" | Unit: `formatBaggage` · Entegrasyon (FL024, MK126, MK118) · E2E `2.4` |
| Detayda favori ekleme/çıkarma | Entegrasyon · E2E `2.4` |
| Listeye dönünce filtre, sıralama, yüklenmiş sayfalar korunur | Entegrasyon: geri dönüşte yeniden istek yok, kartlar aynı · E2E `2.4` |

### 2.5 Favoriler
| Gereksinim | Testler |
|---|---|
| Ayrı ekran; detay açılır; favoriden çıkarılır | Entegrasyon · E2E `2.5` · Snapshot |
| Liste, detay ve favoriler ekranında işaretler anında tutarlı | Entegrasyon · E2E `2.5` |
| Son favori çıkarılınca boş durum | Entegrasyon · E2E `2.5` · Snapshot |
| Uygulama kapatılıp açılınca korunur | **2.7** Unit (store): *ekleme ve çıkarma … yeniden açılınca geri yüklenir* · E2E `2.5` (`stopApp` + yeniden açılış) |
| Açılışta kayıtlar yüklenmeden boş state depolamaya yazılmaz | **2.7** Unit (store): *yüklerken depolamaya yazmaz* · Entegrasyon `app.hydration`: okuma bitene kadar ekran yok, `setItem` hiç çağrılmaz |
| Liste filtresinden bağımsız | Entegrasyon · E2E `2.5` |

### 2.6 Yüklenme, boş ve hata durumları
| Gereksinim | Testler |
|---|---|
| İlk istekte yükleniyor | Entegrasyon (tek belirteç) · Unit (reducer başlangıcı) |
| Servis boş liste dönerse "Uçuş bulunamadı" | Entegrasyon (`/debug/empty`) · E2E `2.6` |
| Hata: anlaşılır mesaj ve "Tekrar dene"; başarıya döner; eldeki veriyi silmez | Bileşen: *ErrorMessage* · Unit (reducer, hook) · Smoke (`/debug/fail-once` → `FLIGHTS_UNAVAILABLE`) · Entegrasyon (ilk sayfa, sonraki sayfa, detay) · E2E `2.6` · Snapshot |
| Yükleniyor, hata ve boş durumu üst üste gösterilmez | Entegrasyon: her durumda diğerlerinin yokluğu · E2E `2.6` |

### P1
| Gereksinim | Testler |
|---|---|
| Üçüncü test: servis hatasında "Tekrar dene" ile başarılı liste (ekran etkileşimi) | Entegrasyon: *2.6 › ilk istekte yükleniyor; hata olunca … Tekrar dene başarıya döner* · E2E `2.6` |
| Sırasız yanıt: hızlı filtre/sıralama değişiminde geç dönen eski yanıt yeni sonucun üzerine yazmaz | Unit (hook): yanıtlar ters sırayla, eski istekler iptal · Entegrasyon: case-kit `race` modunda iki senaryo, 3,5 sn geç yanıt beklemesi · E2E `P1-sirasiz-yanit` (`race` modu) |

## Son çalıştırma

- `npm test`: 11 dosya, **53 test**, 6 snapshot — hepsi geçti.
- `maestro test e2e`: **7/7 akış** geçti — iPhone 18 Pro simülatörü, iOS 27.0, Expo Go (SDK 57).
- Testlerin davranışa bağlı olduğu, uygulama kodu bilerek bozularak denendi (bagaj 0/null karışması,
  "Tekrar dene"nin yanlış sayfayı istemesi, favorilerin liste filtresine bağlanması, filtre
  değişiminde sıfırlamanın kaldırılması, favorilerin depolamaya yazılmaması, sorgu değişiminde
  süren isteğin iptal edilmemesi, iptal edilen isteğin yanıtının yok sayılmaması): her birinde
  ilgili testler kırıldı.
