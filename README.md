# Uçuş Keşfi — React Native case

İstanbul → Antalya uçuşlarını listeleyen, filtreleyip sıralayan ve favorilere kaydeden
React Native + TypeScript (Expo) uygulaması.

> Kurulum, doğrulanan platform, harcanan süre ve bilinen eksikler bölümleri eklenecek.

## Sürümler

| | Sürüm |
|---|---|
| Expo SDK | 57 (`expo@57.0.27`) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0.3 (`strict`) |
| Node | 22.22.3 |
| Paket yöneticisi | npm 10.9.8 — kilit dosyası `package-lock.json` |

Kullanılan kütüphaneler: React Navigation 7 (`@react-navigation/native`, `native-stack`),
zustand 5, `@react-native-async-storage/async-storage` 2.2. Testler: Jest 29 (`jest-expo`),
React Native Testing Library 14; E2E için isteğe bağlı Maestro.

## Mimari kararlar

```
src/
  api/          Veri erişimi: fetch, sorgu metni, ApiError. HTTP çağrısı yalnızca burada.
  domain/       İş kuralları: fiyat, saat/tarih (Europe/Istanbul), süre, bagaj metinleri.
  features/     State: liste (reducer + hook), detay (hook), favoriler (zustand store).
  components/   Tekrar kullanılan UI: kart, favori butonu, filtreler, hata mesajı.
  screens/      Liste, detay, favoriler ekranları.
  navigation/   Stack navigator ve route tipleri.
```

- **Expo (Expo Go):** Kurulumu en hızlı yol; özel native kod gerekmiyor, kullanılan tüm
  kütüphaneler Expo Go'da hazır.
- **Navigasyon — React Navigation native-stack:** Üç ekran var (liste, detay, favoriler).
  Detay listenin üstüne açıldığı için liste ekranı arkada açık kalır; geri dönüldüğünde filtre,
  sıralama, yüklenmiş sayfalar ve kaydırma konumu ek kod olmadan korunur (2.4). Favoriler ekranına
  liste başlığındaki "Favoriler" butonuyla gidilir. Expo Router'ın dosya tabanlı yönlendirmesi
  bu ölçekte bir şey kazandırmadığı için seçilmedi.
- **Liste state'i — `useReducer` + hook (`useFlightList`):** State yalnızca liste ekranını
  ilgilendirir, global olması gerekmez. Saf reducer kolay test edilir. Durum tek bir `status`
  alanındadır (`loading | loadingMore | success | error`), bu yüzden yükleniyor, hata ve boş
  durumları aynı anda oluşamaz (2.6). Aynı sayfanın iki kez istenmemesi bir ref ile, sırasız
  yanıtlar `AbortController` ile önlenir (2.2, P1).
- **Favoriler — zustand + `persist` + AsyncStorage:** Favori işareti liste, detay ve favoriler
  ekranında aynı anda tutarlı olmalı; küçük bir global store bunun için yeterli. Redux Toolkit
  bu ölçekte gereksiz bağımlılık ve kalıp kod olurdu. AsyncStorage basit anahtar-değer kaydı için
  yeterli ve Expo Go'da hazır.
  - Uçuşun **tamamı** saklanır (yalnızca kimlik değil): favoriler ekranı ağ isteği olmadan açılır,
    ayrıca yükleniyor/hata durumu gerektirmez; veri sabit olduğu için bayatlama riski yok.
  - Kayıtlı favoriler okunana kadar uygulama ekranları gösterilmez; okuma sırasında depolamaya
    yazılmaz. Böylece açılışta boş state mevcut kayıtların üzerine yazılamaz (2.5).
- **Ekran modeli:** Servis tipleri `case-kit/flight.types.ts`'ten olduğu gibi alındı
  (`src/api/types.ts`). Ekranlar ayrı bir view model eşlemesi yerine bu DTO'yu, `domain/format.ts`
  içindeki saf formatlayıcılarla (fiyat `3.550,00 TL`, saat/tarih, süre, bagaj `0`/`null`
  metinleri) ve store'daki favori bayrağıyla kullanır; sorgu modeli `FlightQuery`
  (`sort`, `onlyDirect`). Ayrı bir eşleme katmanı bu ölçekte gereksiz soyutlama olurdu;
  gösterim kuralları tek yerde ve birim testli.
- **Saat dilimi:** Saat ve tarih cihazın saat diliminden bağımsız, sabit UTC+3 ofsetiyle
  hesaplanır (Türkiye 2016'dan beri yaz saati uygulamıyor; servis de `+03:00` döner). Böylece
  Hermes'in Intl/ICU desteğine bağlı kalınmaz ve çıktı her cihazda aynıdır.
- **Optimizasyon:** `useCallback`/`useMemo` yalnızca işlevsel olarak gereken yerde var
  (`loadPage`, bir efektin bağımlılığı). Ölçülmemiş memoizasyon eklenmedi.

## Testler

### Test komutu

```bash
npm test
```

Ek kurulum gerekmez. Smoke ve entegrasyon testleri `case-kit/server.js`'i kendileri açıp kapatır
(Jest worker'ına özel 4101, 4102, … portlarında); 4000'de çalışan mock servise dokunmaz.

Son çalıştırma: 11 dosya, **53 test**, 6 snapshot — hepsi geçti.

### Case'in test yükümlülükleri (2.7) ve karşılanması

| Yükümlülük | Karşılayan test |
|---|---|
| **1.** Filtre/sıralama parametrelerinin doğru üretilmesi **veya** sayfalama state'inin filtre değişiminde sıfırlanması | `src/features/flights/__tests__/useFlightList.test.ts` → *2.3: filtre değişince sayfalama başa döner ve eski sayfalar yeni sonuca karışmaz*. İki sayfa yüklendikten sonra filtre açılır: liste, sayfa ve toplam hemen sıfırlanır; yeni istek `page=1&limit=8&sort=price&onlyDirect=true` URL'iyle gider; sonuçta yalnızca yeni sorgunun sayfası vardır. Sıralama değişiminde `sort=duration` ile yine 1. sayfadan istenir. İki seçeneği de kapsar. |
| **2.** Favori ekleme/çıkarma ile depolamadan geri yükleme | `src/features/favorites/__tests__/favoritesStore.test.ts` → *açılışta kayıtlı favorileri depolamadan geri yükler; yüklerken depolamaya yazmaz* ve *ekleme ve çıkarma depolamaya yazılır; uygulama yeniden açılınca son durum geri yüklenir*. AsyncStorage'ın resmi Jest sahtesiyle; "yeniden açılış" store modülünün baştan yüklenmesiyle (`jest.isolateModules`) yapılır. |
| Yalnızca snapshot yeterli değildir | Zorunlu testlerin ikisi de davranış testidir (işlem yapıp sonucunu doğrular). Snapshot testleri yalnızca bunlara **ek** olarak vardır. |

Testlerin gerçekten davranışa bağlı olduğu, uygulama kodu bilerek bozularak denendi: filtre
değişiminde sıfırlama kaldırıldığında 1. test, favoriler depolamaya yazılmadığında 2. test kırıldı.

### Ek testler

Case'in istediklerine ek olarak P0 maddelerinin (2.1–2.6) her biri birden çok seviyede test edilir:

| Seviye | Araç | Kapsam |
|---|---|---|
| Unit | Jest | Formatlayıcılar (fiyat, saat, tarih, süre, bagaj 0/null), liste reducer'ı, liste hook'u |
| Bileşen | Jest + Testing Library | Kart, filtreler, hata mesajı |
| Snapshot | Jest | Kart, filtreler, hata mesajı, detay (FL024), favoriler (dolu/boş) |
| Smoke | Jest + gerçek case-kit | API katmanı ↔ `server.js` sözleşmesi (BASLA.md'deki FL004/FL009/FL006 doğrulaması dahil) |
| Entegrasyon | Jest + gerçek case-kit | Tüm ekranlar ve navigasyon; senaryolar case-kit `/debug` anahtarlarıyla |
| E2E | Maestro | Gerçek simülatörde Expo Go ile 2.1–2.6 ve P1 akışları (`e2e/`) |

Hangi gereksinimin hangi testlerle doğrulandığı madde madde [`TESTS.md`](TESTS.md) dosyasındadır.

### E2E (isteğe bağlı)

Ek kurulum gerektirir: Java 17+ ve [Maestro](https://maestro.mobile.dev). Son çalıştırmada 7/7
akış geçti (iPhone 18 Pro simülatörü, iOS 27.0, Expo Go SDK 57).

```bash
cd case-kit && node server.js     # 1. terminal: mock servis (4000)
npx expo start --ios              # 2. terminal: uygulama simülatörde açık olmalı
npm run test:e2e -- -e APP_URL=exp://127.0.0.1:8081   # 3. terminal; Metro adresi
```

"Sonraki sayfa yüklenirken belirteç listeyi bloklamaz" anı, case-kit'in en uzun gecikmesi
(3 sn) içinde kaldığı için Maestro ile güvenilir yakalanamıyor; bu nokta entegrasyon testinde
doğrulanır.

## P1

İki madde de yapıldı.

### 1. Üçüncü test — "Tekrar dene" ile başarılı listenin görünmesi

`src/__tests__/app.caseKit.test.tsx` → *2.6 Yüklenme, boş ve hata durumları › ilk istekte
yükleniyor; hata olunca yalnızca mesaj ve Tekrar dene; Tekrar dene başarıya döner*.

Ekran etkileşim testidir: uygulamanın ekranları navigasyonla birlikte çizilir ve gerçek case-kit
sunucusuna bağlanır. `/debug/fail-once` ile ilk istek hata verir; test ekranda yalnızca hata
mesajı ile "Tekrar dene" olduğunu (yükleniyor ve boş durumu olmadığını) doğrular, butona basar ve
"24 uçuş bulundu" listesinin geldiğini doğrular. Aynı dosyada sonraki sayfa ve detay hataları için
de "Tekrar dene" etkileşim testleri vardır; E2E'de `e2e/2.6-durumlar.yaml` aynı akışı gerçek
simülatörde çalıştırır.

### 2. Sırasız yanıt dayanıklılığı

**Nasıl çözüldü:** Liste isteği `AbortController` ile yapılır. Filtre veya sıralama değişince
React efekti temizlenirken süren istek iptal edilir; her istek kendi sinyaline bakar ve iptal
edildiyse yanıtını (başarı ya da hata) state'e yazmaz (`src/features/flights/useFlightList.ts`).
Böylece hangi sırayla dönerse dönsün yalnızca son seçimin yanıtı ekrana gelir.

**Nasıl doğrulandı:**

1. *Sorunun gerçekten oluştuğu:* `GET /debug/mode?value=race` açıkken art arda gönderilen beş
   istekten en son gönderilen ilk, ilk gönderilen en son döndü (curl ile gözlendi).
2. *Unit (deterministik):* `useFlightList.test.ts` → *P1: filtre/sıralama hızlı değişince geç ve
   sırasız dönen eski yanıtlar yeni sonucun üzerine yazmaz*. Üç hızlı değişiklik yapılır; eski
   iki isteğin iptal edildiği, yalnızca sonuncusunun açık kaldığı doğrulanır. Yanıtlar **ters
   sırayla** döndürülür (önce en yenisi, sonra eskiler); ekranda yalnızca son sorgunun sonucu kalır.
3. *Entegrasyon (gerçek case-kit, race modu):* `app.caseKit.test.tsx` → *P1 Sırasız yanıt
   dayanıklılığı* altında iki test. Yanıt beklemeden beş hızlı filtre/sıralama değişikliği yapılır;
   son seçimin sonucu ekrandaki kartlarla birebir karşılaştırılır, ardından geç kalan yanıtlar
   için 3,5 sn beklenip ekranın değişmediği tekrar doğrulanır.
4. *E2E (gerçek simülatör, race modu):* `e2e/P1-sirasiz-yanit.yaml`. Maestro beş hızlı dokunuş
   yapar; son seçimin sonucu ("17 uçuş bulundu", ilk kart EH204) görünür, geç yanıtlar için 6 sn
   (case-kit `?simulate=slow` ile) beklendikten sonra ekran aynı kalır, hiç aktarmalı uçuş görünmez.
5. *Testlerin koruma kaldırılınca kırıldığı:* sorgu değişiminde iptal kaldırıldığında unit ve race
   modundaki entegrasyon testleri (3 turda 3) kırıldı; iptal edilen isteğin yanıtını yok sayan
   kontrol kaldırıldığında unit testleri kırıldı.

