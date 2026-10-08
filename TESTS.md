# Testler

P0 maddelerinin (2.1–2.6) her biri birden fazla seviyede doğrulanır. 2.7'nin istediği iki
zorunlu test de bu paketin içindedir (aşağıda **2.7** ile işaretli).

| Seviye | Araç | Nerede | Ne doğrular |
|---|---|---|---|
| Unit | Jest | `src/domain`, `src/features/**/__tests__` | Formatlayıcılar, liste reducer'ı, liste hook'u, favori store'u |
| Bileşen | Jest + Testing Library | `src/components/__tests__` | Kart, filtreler, hata mesajı |
| Render ölçümü | Jest + Testing Library | `src/screens/__tests__/FlightListScreen.render.test.tsx` | Kart başına render sayacı: sonraki sayfa yüklenirken/eklenince mevcut kartlar, favori değişince hiçbir kart yeniden render edilmez (memo + sabit `onPress`) |
| Snapshot | Jest | `__snapshots__` | Kart, filtreler, hata mesajı, detay (FL024), favoriler (dolu/boş) — davranış testlerine **ek** |
| Smoke | Jest + gerçek case-kit | `src/api/__tests__/caseKit.smoke.test.ts` | API katmanı ↔ `case-kit/server.js` sözleşmesi |
| Entegrasyon | Jest + gerçek case-kit | `src/__tests__/app.*.test.tsx` | Tüm ekranlar ve navigasyon; senaryolar case-kit `/debug` anahtarlarıyla |
| E2E | Maestro | `e2e/` | iOS simülatörü ve Android emülatöründe Expo Go üzerinde uygulama; senaryolar case-kit `/debug` anahtarlarıyla |

Smoke ve entegrasyon testleri `case-kit/server.js`'i Jest worker'ına özel bir portta (4101, 4102, …)
kendisi açıp kapatır; 4000'deki sunucuya dokunmaz.

## Test dosyaları

| Dosya | Seviye | Test | Kapsam |
|---|---|---|---|
| `src/domain/__tests__/format.test.ts` | Unit | 5 | Fiyat, saat, süre/aktarma, tarih, bagaj metinleri |
| `src/features/flights/__tests__/flightListReducer.test.ts` | Unit | 4 | Varsayılan sorgu, sayfa ekleme, sorgu değişiminde sıfırlama, hata eldeki veriyi silmez |
| `src/features/flights/__tests__/useFlightList.test.ts` | Unit (hook) | 5 | **2.7-1**, çift istek yok, geç yanıt karışmaz, Tekrar dene, P1 sırasız yanıt |
| `src/features/favorites/__tests__/favoritesStore.test.ts` | Unit (store) | 2 | **2.7-2**: geri yükleme, yüklerken yazmama, ekleme/çıkarma kalıcılığı |
| `src/components/__tests__/FlightCard.test.tsx` | Bileşen + snapshot | 4 | Kart alanları, detay aksiyonu, favori zinciri (bas → store → işaret → geri al) |
| `src/components/__tests__/FlightFilters.test.tsx` | Bileşen + snapshot | 4 | Erişilebilir ad, seçili durum, onay işareti, değişiklik bildirimi |
| `src/components/__tests__/ErrorMessage.test.tsx` | Bileşen + snapshot | 2 | Mesaj ve "Tekrar dene" |
| `src/screens/__tests__/FlightListScreen.render.test.tsx` | Render ölçümü | 3 | Kart başına render sayacı |
| `src/screens/__tests__/screens.snapshot.test.tsx` | Snapshot | 3 | Detay (FL024), favoriler dolu/boş |
| `src/api/__tests__/caseKit.smoke.test.ts` | Smoke | 6 | Gerçek case-kit sözleşmesi |
| `src/__tests__/app.caseKit.test.tsx` | Entegrasyon | 17 | 2.1–2.6 ve P1, gerçek case-kit ile |
| `src/__tests__/app.hydration.test.tsx` | Entegrasyon | 1 | `<App />` açılışı: favoriler yüklenmeden ekran yok, depolamaya yazılmaz |
| `e2e/*.yaml` | E2E | 7 akış | 2.1–2.6 ve P1; aynı akışlar iOS ve Android'de |

## Çalıştırma

```bash
npm test                 # unit + bileşen + render ölçümü + snapshot + smoke + entegrasyon (56 test)
```

E2E (ek kurulum: Java 17+ ve [Maestro](https://maestro.mobile.dev)):

```bash
cd case-kit && node server.js            # 1. terminal — mock servis (4000)
npx expo start --ios                     # 2. terminal — uygulama simülatörde açık olmalı
npm run test:e2e -- -e APP_URL=exp://127.0.0.1:8081                              # iOS simülatörü
npm run test:e2e -- -e APP_ID=host.exp.exponent -e APP_URL=exp://10.0.2.2:8081   # Android emülatörü
```

## Madde → test eşleşmesi

### 2.1 Uçuş listesi
| Gereksinim | Testler |
|---|---|
| Uygulama listeyle açılır | Entegrasyon: *uygulama listeyle açılır…* · E2E `2.1` |
| Kartta havayolu, uçuş no, kalkış/varış kodu, saatler, süre, direkt/aktarmalı, fiyat, favori | Bileşen: *FlightCard … tüm alanlar* · Unit: `format` (fiyat, saat, süre, aktarma) · Entegrasyon · E2E `2.1` · Snapshot |
| Toplam sonuç sayısı (`meta.total`) | Entegrasyon: *24 uçuş bulundu* · E2E `2.1` |
| Karta dokununca doğru uçuşun detayı | Bileşen: *doğru uçuşla detay aksiyonu* · Entegrasyon: *route params FL004* · E2E `2.1` |
| Favori aksiyonu detay navigasyonunu tetiklemez | Bileşen: *favori zinciri* (`onPress` çağrılmaz) · Entegrasyon · E2E `2.1` |

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
| Liste, detay ve favoriler ekranında işaretler anında tutarlı | Bileşen: *favori zinciri* · Entegrasyon · E2E `2.5` |
| Son favori çıkarılınca boş durum | Entegrasyon · E2E `2.5` · Snapshot |
| Uygulama kapatılıp açılınca korunur | **2.7** Unit (store): *ekleme ve çıkarma … yeniden açılınca geri yüklenir* · E2E `2.5` (`stopApp` + yeniden açılış) |
| Açılışta kayıtlar yüklenmeden boş state depolamaya yazılmaz | **2.7** Unit (store): *yüklerken depolamaya yazmaz* · Entegrasyon `app.hydration`: okuma bitene kadar ekran yok, `setItem` hiç çağrılmaz |
| Liste filtresinden bağımsız | Entegrasyon · E2E `2.5` |
| Favorilerden dönünce liste kaldığı yerden devam eder (iOS hatası düzeltmesi) | E2E `2.5` |

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

### Liste performansı (kod incelemesi sonrası)
| Gereksinim | Testler |
|---|---|
| Sonraki sayfa yüklenirken/eklenince mevcut kartlar yeniden render edilmez | Render ölçümü (kart başına sayaç) — `memo` ya da sabit `onPress` kaldırılınca kırılır |
| Favori değişince kartlar yeniden render edilmez (yalnızca o buton) | Render ölçümü |

## Son çalıştırma

- `npm test`: 12 dosya, **56 test**, 6 snapshot — hepsi geçti.
- `maestro test e2e`: **iOS'ta 7/7** (iPhone 18 Pro simülatörü, iOS 27.0) ve **Android'de 7/7**
  (`medium_phone` emülatörü, Android 16 / API 36) akış geçti — Expo Go (SDK 57).
- Testlerin davranışa bağlı olduğu, uygulama kodu bilerek bozularak denendi (bagaj 0/null karışması,
  "Tekrar dene"nin yanlış sayfayı istemesi, favorilerin liste filtresine bağlanması, filtre
  değişiminde sıfırlamanın kaldırılması, favorilerin depolamaya yazılmaması, sorgu değişiminde
  süren isteğin iptal edilmemesi, iptal edilen isteğin yanıtının yok sayılmaması, kartın `memo`'suz
  olması, karta verilen `onPress`'in her render'da yeniden oluşması): her birinde ilgili testler
  kırıldı.

## Test güncellemeleri

Testler maddelerle birlikte adım adım eklendi ve değişti. Her adımda tüm paket yeniden çalıştırıldı.

| Adım | Ne değişti | Neden |
|---|---|---|
| **2.7** zorunlu testler | `useFlightList.test.ts` (filtre değişiminde sıfırlama + istek URL'i) ve `favoritesStore.test.ts` (ekleme/çıkarma, geri yükleme, yüklerken yazmama) eklendi. TypeScript 6 için `tsconfig`'e `jest` tipleri eklendi. | Case'in iki zorunlu testi. |
| **2.1–2.6** ek testler | Unit (`format`, reducer, hook'a çift istek / geç yanıt / Tekrar dene), bileşen + snapshot (kart, filtreler, hata mesajı, detay, favoriler), smoke (gerçek `server.js`), entegrasyon (tüm ekranlar, gerçek case-kit, `/debug` senaryoları, `<App />` açılışı) ve Maestro E2E akışları eklendi. Ortak test altyapısı: `jest.setup.js` (AsyncStorage ve safe-area resmi sahteleri), `src/test-utils/caseKit.ts` (worker'a özel portta gerçek case-kit). | Her maddenin her gereksiniminin birden çok seviyede doğrulanması. |
| E2E'nin bulduğu hata | Sonraki sayfa belirteci iOS erişilebilirlik ağacında yoktu (`accessible` eksikti); uygulamada düzeltildi. 2.2 E2E akışı, Maestro'nun 3 sn'lik pencereyi yakalayamadığı belirteç anı yerine sayfaların sırayla gelip sonda durmasını doğrulayacak şekilde güncellendi. | Etiket VoiceOver'da da etkisizdi. |
| **P1** | Hook'a deterministik sırasız yanıt testi (yanıtlar ters sırayla, eski istekler iptal); entegrasyona case-kit `race` modunda iki senaryo; `e2e/P1-sirasiz-yanit.yaml` eklendi. | P1-2'nin doğrulanması. |
| Ölçülmemiş memoizasyonun kaldırılması | Uygulamada kazanç sağlamayan `useCallback`/`useMemo` kaldırıldı; testler değişmeden geçti. Favoriler sıralaması sayısal zamana alındı; sıra testleri değişmeden geçti. | Case §5: ölçülmemiş optimizasyon olmasın; §6: sayısal alanla sırala. |
| Liste performansı (Vercel React Native kuralları) | `FlightListScreen.render.test.tsx` eklendi. Önce mevcut kodda çalıştırıldı ve kırıldı (sonraki sayfa yüklenirken 8 kartın hepsi, favori değişince diğer kartlar yeniden render ediliyordu); `memo` + sabit `onPress` ile geçti. | Optimizasyonun ölçülerek yapılması. |
| Kod incelemesi düzeltmeleri | Kart tekrar `flight` prop'u alıyor; favori butonu store'u kendisi okuyor. `FlightCard.test.tsx`: her zaman doğru olan bir kontrol kaldırıldı, favori zinciri (bas → store'a yazıldı → işaret değişti → geri al) uçtan uca test ediliyor. Render ölçümü, `formatPrice` üzerine kurulu sayaçtan kart başına sayaca (`formatTime(departureAt)`, benzersizliği testte kontrol edilir) geçti. Snapshot'lar güncellenmeden geçti; ekran çıktısı değişmedi. | İnceleme bulguları: kaybolabilen favori dokunuşu, tekrarlanan kod, kırılgan ölçüm. |
| Android doğrulaması | E2E akışları iki platformda çalışacak hale getirildi: uygulama kimliği dışarıdan verilir (`APP_ID`; Expo Go Android'de `host.exp.exponent`), geri dönüş platforma göre seçilir (`subflows/back.yaml`: iOS'ta başlıktaki geri butonu, Android'de sistem geri tuşu), Android'de açılışta çıkan Expo Go geliştirici menüsü kapatılır, kapanmakta olan sürece giden bağlantı kaybolabildiği için uygulama açılışı `retry` ile yeniden denenir. Her akış başında favoriler temizlenir (`subflows/clearFavorites.yaml`), böylece başlangıç durumu cihazdaki eski verilerden bağımsızdır. Uygulama kodu değişmedi. | Uygulamanın iki platformda da doğrulanması: Android'de 7/7, değişikliklerden sonra iOS'ta yeniden 7/7. |
| iOS: favorilerden dönüşte liste başa dönüyordu | Başlıktaki "Favoriler" butonuna dokunmak iOS'un `scrollsToTop` davranışını tetikleyip listeyi en başa kaydırıyordu (video karelerinden tespit edildi). `FlightCardList`'te `scrollsToTop={false}`. `e2e/2.5-favoriler.yaml`'a regresyon adımı eklendi: aşağı kaydırılmış listeden favorilere gidip dönünce aynı kart görünür. Snapshot'a yalnızca bu prop eklendi. | Kullanıcının bulduğu hata; Android'de yoktu. |

