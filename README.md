# Uçuş Keşfi — React Native case

İstanbul → Antalya uçuşlarını listeleyen, filtreleyip sıralayan ve favorilere kaydeden
React Native + TypeScript (Expo) uygulaması.

> Kurulum, mimari kararlar, harcanan süre ve bilinen eksikler bölümleri eklenecek.

## Testler

### Test komutu

```bash
npm test
```

Ek kurulum gerekmez. Smoke ve entegrasyon testleri `case-kit/server.js`'i kendileri açıp kapatır
(Jest worker'ına özel 4101, 4102, … portlarında); 4000'de çalışan mock servise dokunmaz.

Son çalıştırma: 11 dosya, **50 test**, 6 snapshot — hepsi geçti.

### Case'in test yükümlülükleri (2.7) ve karşılanması

| Yükümlülük | Karşılayan test |
|---|---|
| **1.** Filtre/sıralama parametrelerinin doğru üretilmesi **veya** sayfalama state'inin filtre değişiminde sıfırlanması | `src/features/flights/__tests__/useFlightList.test.ts` → *2.3: filtre değişince sayfalama başa döner ve eski sayfalar yeni sonuca karışmaz*. İki sayfa yüklendikten sonra filtre açılır: liste, sayfa ve toplam hemen sıfırlanır; yeni istek `page=1&limit=8&sort=price&onlyDirect=true` URL'iyle gider; sonuçta yalnızca yeni sorgunun sayfası vardır. Sıralama değişiminde `sort=duration` ile yine 1. sayfadan istenir. İki seçeneği de kapsar. |
| **2.** Favori ekleme/çıkarma ile depolamadan geri yükleme | `src/features/favorites/__tests__/favoritesStore.test.ts` → *açılışta kayıtlı favorileri depolamadan geri yükler; yüklerken depolamaya yazmaz* ve *ekleme ve çıkarma depolamaya yazılır; uygulama yeniden açılınca son durum geri yüklenir*. AsyncStorage'ın resmi Jest sahtesiyle; "yeniden açılış" store modülünün baştan yüklenmesiyle (`jest.isolateModules`) yapılır. |
| Yalnızca snapshot yeterli değildir | Zorunlu testlerin ikisi de davranış testidir (işlem yapıp sonucunu doğrular). Snapshot testleri yalnızca bunlara **ek** olarak vardır. |

Testlerin gerçekten davranışa bağlı olduğu, uygulama kodu bilerek bozularak denendi: filtre
değişiminde sıfırlama kaldırıldığında 1. test, favoriler depolamaya yazılmadığında 2. test kırıldı.

### P1 — Üçüncü test

> "Servis hatasında 'Tekrar dene' ile başarılı listenin görünmesi. En az bir bileşen/ekran
> etkileşim testi içersin."

**Yapıldı.** `src/__tests__/app.caseKit.test.tsx` → *2.6 Yüklenme, boş ve hata durumları ›
ilk istekte yükleniyor; hata olunca yalnızca mesaj ve Tekrar dene; Tekrar dene başarıya döner*. Uygulamanın ekranları navigasyonla
birlikte çizilir ve gerçek case-kit sunucusuna bağlanır. `/debug/fail-once` ile ilk istek hata
verir. Test, ekranda yalnızca hata mesajı ile "Tekrar dene" olduğunu (yükleniyor ve boş durumu
olmadığını) doğrular, butona basar ve "24 uçuş bulundu" listesinin geldiğini doğrular. Aynı
dosyada sonraki sayfa hatası ve detay hatası için de "Tekrar dene" etkileşim testleri vardır.

### Ek testler

Case'in istediklerine ek olarak P0 maddelerinin (2.1–2.6) her biri birden çok seviyede test edilir:

| Seviye | Araç | Kapsam |
|---|---|---|
| Unit | Jest | Formatlayıcılar (fiyat, saat, tarih, süre, bagaj 0/null), liste reducer'ı, liste hook'u |
| Bileşen | Jest + Testing Library | Kart, filtreler, hata mesajı |
| Snapshot | Jest | Kart, filtreler, hata mesajı, detay (FL024), favoriler (dolu/boş) |
| Smoke | Jest + gerçek case-kit | API katmanı ↔ `server.js` sözleşmesi (BASLA.md'deki FL004/FL009/FL006 doğrulaması dahil) |
| Entegrasyon | Jest + gerçek case-kit | Tüm ekranlar ve navigasyon; senaryolar case-kit `/debug` anahtarlarıyla |
| E2E | Maestro | Gerçek simülatörde Expo Go ile 2.1–2.6 akışları (`e2e/`) |

Hangi gereksinimin hangi testlerle doğrulandığı madde madde [`TESTS.md`](TESTS.md) dosyasındadır.

### E2E (isteğe bağlı)

Ek kurulum gerektirir: Java 17+ ve [Maestro](https://maestro.mobile.dev). Son çalıştırmada 6/6
akış geçti (iPhone 18 Pro simülatörü, iOS 27.0, Expo Go SDK 57).

```bash
cd case-kit && node server.js     # 1. terminal: mock servis (4000)
npx expo start --ios              # 2. terminal: uygulama simülatörde açık olmalı
npm run test:e2e -- -e APP_URL=exp://127.0.0.1:8081   # 3. terminal; Metro adresi
```

"Sonraki sayfa yüklenirken belirteç listeyi bloklamaz" anı, case-kit'in en uzun gecikmesi
(3 sn) içinde kaldığı için Maestro ile güvenilir yakalanamıyor; bu nokta entegrasyon testinde
doğrulanır.
