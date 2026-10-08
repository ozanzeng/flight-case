# Uçuş Keşfi — React Native case

İstanbul → Antalya uçuşlarını listeleyen, sunucu tarafında filtreleyip sıralayan, sayfa sayfa
yükleyen ve beğenilen uçuşları kalıcı olarak favorilere kaydeden React Native + TypeScript (Expo)
uygulaması. Veri `case-kit/` içindeki mock servisten gelir.

| Kapsam | Durum |
|---|---|
| P0 — 2.1 liste · 2.2 sayfalama · 2.3 filtre/sıralama · 2.4 detay · 2.5 favoriler · 2.6 durumlar · 2.7 testler | ✅ Tamamlandı |
| P1 — üçüncü test · sırasız yanıt dayanıklılığı | ✅ Tamamlandı ([nasıl doğrulandı](#6-p1)) |

**İçindekiler:** [1. Kurulum ve çalıştırma](#1-kurulum-ve-çalıştırma) ·
[2. Doğrulanan platform](#2-doğrulanan-platform) · [3. Testler](#3-testler) ·
[4. Mimari kararlar](#4-mimari-kararlar) · [5. Harcanan süre](#5-harcanan-süre) ·
[6. P1](#6-p1) · [7. Bilinen eksikler](#7-bilinen-eksikler) ·
[8. AI araçlarının kullanımı](#8-ai-araçlarının-kullanımı)

---

## 1. Kurulum ve çalıştırma

### Gereksinimler

- **Node 22.13+** ve npm. Mock servis Node 18+ ile çalışır; testlerde kullanılan React Native
  Testing Library 14 ise Node `^22.13 || >=24` ister.
- **iOS:** macOS, Xcode ve bir iOS simülatörü. Expo Go simülatöre ilk açılışta otomatik kurulur;
  ayrıca hesap, API anahtarı ya da native derleme gerekmez.

### Adımlar

```bash
git clone https://github.com/ozanzeng/flight-case.git
cd flight-case
npm install
```

**1. terminal — mock servis** (bağımlılığı yok, `npm install` gerekmez):

```bash
cd case-kit
node server.js
```

Doğrulama: ilk üç kayıt `FL004`, `FL009`, `FL006` olmalı.

```bash
curl "http://localhost:4000/flights?page=1&limit=8&sort=price"
```

**2. terminal — uygulama:**

```bash
npx expo start --ios
```

Uygulama simülatörde Expo Go içinde açılır. İlk açılışta Expo'nun geliştirici menüsü çıkarsa
"Continue" ile kapatılır.

### Servis adresi

| Ortam | Adres | Not |
|---|---|---|
| iOS simülatörü | `http://localhost:4000` | Varsayılan |
| Android emülatörü | `http://10.0.2.2:4000` | Otomatik seçilir (doğrulanmadı, bkz. [7](#7-bilinen-eksikler)) |
| Fiziksel cihaz | `http://<bilgisayarın-LAN-IP'si>:4000` | `EXPO_PUBLIC_API_URL=http://<IP>:4000 npx expo start` |

### Sorun giderme

- **`npx expo start --ios` App Store'u açıyor ya da QR kodda kalıyor:** Aktif geliştirici dizini
  Xcode yerine Command Line Tools'u gösteriyordur.
  `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` ile düzelir (ya da komutun
  önüne `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` eklenir).
- **Xcode 27'de simülatör penceresi görünmüyor:** "Simulator" uygulamasının yerini DeviceHub aldı.
  Simülatörü DeviceHub'daki **Start** ile başlatmak gerekir; komut satırından (`simctl boot`)
  başlatılan cihaz DeviceHub'da tıklanabilir görünmeyebilir.

---

## 2. Doğrulanan platform

| | |
|---|---|
| Platform | **iOS** |
| Cihaz | iPhone 18 Pro simülatörü, iOS 27.0 |
| Çalışma ortamı | Expo Go (SDK 57) |
| Geliştirme ortamı | macOS, Xcode 27.0, Node 22.22.3 |

Bütün maddeler bu simülatörde elle ve Maestro E2E akışlarıyla doğrulandı. Android doğrulanmadı.

---

## 3. Testler

```bash
npm test
```

Ek kurulum gerekmez. Smoke ve entegrasyon testleri `case-kit/server.js`'i kendileri açıp kapatır
(Jest worker'ına özel 4101, 4102, … portlarında); 4000'de çalışan servise dokunmaz.
Son çalıştırma: **12 dosya, 56 test, 6 snapshot — hepsi geçti.**

### Case'in test yükümlülükleri (2.7)

| Yükümlülük | Karşılayan test |
|---|---|
| **1.** Filtre/sıralama parametrelerinin doğru üretilmesi **veya** sayfalama state'inin filtre değişiminde sıfırlanması | `src/features/flights/__tests__/useFlightList.test.ts` → *2.3: filtre değişince sayfalama başa döner ve eski sayfalar yeni sonuca karışmaz*. İki sayfa yüklendikten sonra filtre açılır: liste, sayfa ve toplam hemen sıfırlanır; yeni istek `page=1&limit=8&sort=price&onlyDirect=true` URL'iyle gider; sonuçta yalnızca yeni sorgunun sayfası vardır. Sıralama değişiminde de `sort=duration` ile 1. sayfadan istenir. İki seçeneği de kapsar. |
| **2.** Favori ekleme/çıkarma ile depolamadan geri yükleme | `src/features/favorites/__tests__/favoritesStore.test.ts` → *açılışta kayıtlı favorileri depolamadan geri yükler; yüklerken depolamaya yazmaz* ve *ekleme ve çıkarma depolamaya yazılır; uygulama yeniden açılınca son durum geri yüklenir*. AsyncStorage'ın resmi Jest sahtesiyle; "yeniden açılış" store modülünün baştan yüklenmesiyle (`jest.isolateModules`) yapılır. |
| Yalnızca snapshot yeterli değildir | Zorunlu testlerin ikisi de davranış testidir (işlem yapıp sonucunu doğrular). Snapshot testleri yalnızca **ek** olarak vardır. |

Testlerin davranışa gerçekten bağlı olduğu, uygulama kodu bilerek bozularak denendi: filtre
değişiminde sıfırlama kaldırıldığında 1. test, favoriler depolamaya yazılmadığında 2. test kırıldı.

### Ek testler

Case'in istediklerine ek olarak P0 maddelerinin her biri birden çok seviyede test edilir:

| Seviye | Araç | Kapsam |
|---|---|---|
| Unit | Jest | Formatlayıcılar (fiyat, saat, tarih, süre, bagaj 0/null), liste reducer'ı, liste hook'u |
| Bileşen | Jest + Testing Library | Kart, filtreler, hata mesajı |
| Render ölçümü | Jest + Testing Library | Liste state'i değişince mevcut kartların yeniden render edilmediği (kart başına sayaç) |
| Snapshot | Jest | Kart, filtreler, hata mesajı, detay (FL024), favoriler (dolu/boş) |
| Smoke | Jest + gerçek case-kit | API katmanı ↔ `server.js` sözleşmesi (BASLA.md'deki FL004/FL009/FL006 doğrulaması dahil) |
| Entegrasyon | Jest + gerçek case-kit | Tüm ekranlar ve navigasyon; senaryolar case-kit `/debug` anahtarlarıyla |
| E2E | Maestro | Gerçek simülatörde Expo Go ile 2.1–2.6 ve P1 akışları (`e2e/`) |

Hangi gereksinimin hangi testlerle doğrulandığı madde madde ve test güncellemelerinin geçmişi
[`TESTS.md`](TESTS.md) dosyasındadır.

### E2E (isteğe bağlı)

Ek kurulum gerektirir: Java 17+ ve [Maestro](https://maestro.mobile.dev). Son çalıştırmada
**7/7 akış** geçti (iPhone 18 Pro simülatörü, iOS 27.0, Expo Go SDK 57).

```bash
cd case-kit && node server.js                          # 1. terminal: mock servis (4000)
npx expo start --ios                                   # 2. terminal: uygulama simülatörde açık
npm run test:e2e -- -e APP_URL=exp://127.0.0.1:8081    # 3. terminal: Metro adresi
```

---

## 4. Mimari kararlar

### Sürümler

| | Sürüm |
|---|---|
| Expo SDK | 57 (`expo@57.0.27`) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0.3 (`strict`) |
| Node | 22.22.3 (en az 22.13) |
| Paket yöneticisi | npm 10.9.8 — kilit dosyası `package-lock.json` |

Kütüphaneler: React Navigation 7 (`native`, `native-stack`), zustand 5,
`@react-native-async-storage/async-storage` 2.2. Testler: Jest 29 (`jest-expo`), React Native
Testing Library 14; E2E için isteğe bağlı Maestro.

### Klasör yapısı

```
src/
  api/          Veri erişimi: fetch, sorgu metni, ApiError. HTTP çağrısı yalnızca burada.
  domain/       İş kuralları: fiyat, saat/tarih (Europe/Istanbul), süre, bagaj metinleri.
  features/     State: liste (reducer + hook), detay (hook), favoriler (zustand store).
  components/   Tekrar kullanılan UI: kart, kart listesi, favori butonu, filtreler, hata mesajı.
  screens/      Liste, detay, favoriler ekranları.
  navigation/   Stack navigator ve route tipleri.
```

### Kararlar ve gerekçeleri

- **Expo (Expo Go):** Kurulumu en hızlı yol; özel native kod gerekmiyor, kullanılan tüm
  kütüphaneler Expo Go'da hazır.
- **Navigasyon — React Navigation native-stack:** Üç ekran var (liste, detay, favoriler).
  Detay listenin üstüne açıldığı için liste ekranı arkada açık kalır; geri dönüldüğünde filtre,
  sıralama, yüklenmiş sayfalar ve kaydırma konumu ek kod olmadan korunur (2.4). Favoriler ekranına
  liste başlığındaki "Favoriler" butonuyla gidilir. Expo Router'ın dosya tabanlı yönlendirmesi
  bu ölçekte bir şey kazandırmadığı için seçilmedi.
- **Liste state'i — `useReducer` + hook (`useFlightList`):** State yalnızca liste ekranını
  ilgilendirir, global olması gerekmez; saf reducer kolay test edilir. Durum tek bir `status`
  alanındadır (`loading | loadingMore | success | error`), bu yüzden yükleniyor, hata ve boş
  durumları aynı anda oluşamaz (2.6). Aynı sayfanın iki kez istenmemesi bir ref ile, sırasız
  yanıtlar `AbortController` ile önlenir (2.2, P1).
- **Favoriler — zustand + `persist` + AsyncStorage:** Favori işareti liste, detay ve favoriler
  ekranında aynı anda tutarlı olmalı; küçük bir global store bunun için yeterli. Redux Toolkit
  bu ölçekte gereksiz bağımlılık ve kalıp kod olurdu. AsyncStorage basit anahtar-değer kaydı için
  yeterli ve Expo Go'da hazır.
  - Uçuşun **tamamı** saklanır (yalnızca kimlik değil): favoriler ekranı ağ isteği olmadan açılır,
    ayrıca yükleniyor/hata durumu gerektirmez; mock veri sabit olduğu için bayatlama riski yok.
  - Kayıtlı favoriler okunana kadar uygulama ekranları gösterilmez ve okuma sırasında depolamaya
    yazılmaz. Böylece açılışta boş state mevcut kayıtların üzerine yazılamaz (2.5).
  - Favori butonu durumunu store'dan kendisi okur; favori değişince yalnızca o buton render edilir.
- **Ekran modeli:** Servis tipleri `case-kit/flight.types.ts`'ten olduğu gibi alındı
  (`src/api/types.ts`). Ekranlar ayrı bir view model eşlemesi yerine bu DTO'yu, `domain/format.ts`
  içindeki saf formatlayıcılarla (fiyat `3.550,00 TL`, saat/tarih, süre, bagaj `0`/`null`
  metinleri) ve store'daki favori bayrağıyla kullanır; sorgu modeli `FlightQuery`
  (`sort`, `onlyDirect`). Ayrı bir eşleme katmanı bu ölçekte gereksiz soyutlama olurdu;
  gösterim kuralları tek yerde ve birim testli.
- **Saat dilimi:** Saat ve tarih cihazın saat diliminden bağımsız, sabit UTC+3 ofsetiyle
  hesaplanır (Türkiye 2016'dan beri yaz saati uygulamıyor; servis de `+03:00` döner). Böylece
  Hermes'in Intl/ICU desteğine bağlı kalınmaz ve çıktı her cihazda aynıdır. Sıralama gereken tek
  yerde (favoriler) sayısal zaman damgası kullanılır, formatlanmış metin değil.
- **Liste performansı (ölçülerek):** React Compiler kapalı (`app.json`'da
  `experiments.reactCompiler` yok). Ölçüm testi (`FlightListScreen.render.test.tsx`, kart başına
  render sayar) memo'suz kodda, sonraki sayfa yüklenmeye başlayınca ekrandaki tüm kartların
  yeniden render edildiğini gösterdi. Ölçümün gerekli gösterdiği iki şey yapıldı:
  - `FlightCard` `memo` ile sarılı. Uçuş nesnelerinin referansı sabit kalır (reducer yeni sayfayı
    sona ekler), bu yüzden kart `flight` prop'uyla doğrudan memo'lanır.
  - Karta verilen `onPress` listenin kökünde `useCallback` ile sabit.

  Sonuç: sonraki sayfa yüklenirken/eklenince mevcut kartlar yeniden render edilmez; `memo` ya da
  sabit `onPress` kaldırıldığında ölçüm testi kırılır. Ölçümde etkisi görülmeyen
  `renderItem`/stil memoizasyonu eklenmedi. Liste en fazla 24 uçuş olduğundan FlatList yeterli;
  FlashList eklenmedi. Bunların dışında `useCallback`/`useMemo` yalnızca işlevsel olarak gereken
  yerde var (`loadPage`, bir efektin bağımlılığı).

---

## 5. Harcanan süre

Toplam **yaklaşık 4 saat** (6 saatlik sınırın içinde). Süreler git kayıtlarına göre yaklaşıktır.

| Aşama | Süre |
|---|---|
| Dokümanları okuma (BASLA.md, case, case-kit README) | ~20 dk |
| Kurulum: Expo projesi, Xcode/simülatör ayarı | ~30 dk |
| P0 2.1–2.6 | ~1 sa 20 dk |
| 2.7 zorunlu testler | ~10 dk |
| Ek testler (unit, smoke, entegrasyon, snapshot, Maestro E2E) | ~30 dk |
| P1 ve teknik beklenti/veri sözleşmesi denetimleri | ~25 dk |
| Kod incelemesi, liste performansı ölçümü, README | ~50 dk |

---

## 6. P1

İki madde de yapıldı.

### 1. Üçüncü test — "Tekrar dene" ile başarılı listenin görünmesi

`src/__tests__/app.caseKit.test.tsx` → *2.6 Yüklenme, boş ve hata durumları › ilk istekte
yükleniyor; hata olunca yalnızca mesaj ve Tekrar dene; Tekrar dene başarıya döner*.

Ekran etkileşim testidir: uygulamanın ekranları navigasyonla birlikte çizilir ve gerçek case-kit
sunucusuna bağlanır. `/debug/fail-once` ile ilk istek hata verir; test ekranda yalnızca hata
mesajı ile "Tekrar dene" olduğunu (yükleniyor ve boş durumu olmadığını) doğrular, butona basar ve
"24 uçuş bulundu" listesinin geldiğini doğrular. Aynı dosyada sonraki sayfa ve detay hataları için
de "Tekrar dene" etkileşim testleri vardır; `e2e/2.6-durumlar.yaml` aynı akışı gerçek simülatörde
çalıştırır.

### 2. Sırasız yanıt dayanıklılığı

**Nasıl çözüldü:** Liste isteği `AbortController` ile yapılır. Filtre veya sıralama değişince
React efekti temizlenirken süren istek iptal edilir; her istek kendi sinyaline bakar ve iptal
edildiyse yanıtını (başarı ya da hata) state'e yazmaz (`src/features/flights/useFlightList.ts`).
Böylece yanıtlar hangi sırayla dönerse dönsün yalnızca son seçimin yanıtı ekrana gelir.

**Nasıl doğrulandı:**

1. *Sorunun gerçekten oluştuğu:* `GET /debug/mode?value=race` açıkken art arda gönderilen beş
   istekten en son gönderilen ilk, ilk gönderilen en son döndü (curl ile gözlendi).
2. *Unit (deterministik):* `useFlightList.test.ts` → *P1: filtre/sıralama hızlı değişince geç ve
   sırasız dönen eski yanıtlar yeni sonucun üzerine yazmaz*. Üç hızlı değişiklik yapılır; eski
   iki isteğin iptal edildiği, yalnızca sonuncusunun açık kaldığı doğrulanır. Yanıtlar **ters
   sırayla** döndürülür; ekranda yalnızca son sorgunun sonucu kalır.
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

---

## 7. Bilinen eksikler

- **Android doğrulanmadı.** Emülatör adresi (`10.0.2.2:4000`) yapılandırıldı ama uygulama Android'de
  çalıştırılmadı; testler ve E2E yalnızca iOS'ta koşuldu.
- **Çok uzun listeler (binlerce kayıt) için ayarlanmadı.** Mock veri 24 uçuş. Yüzlerce kayda kadar
  sorun beklenmez: sayfalama, FlatList sanallaştırması ve memo sayesinde yeni sayfanın maliyeti
  sabittir. Binlerce kayıtta zorlanacak noktalar: sayfa boyutu 8 (sona inmek için çok istek),
  `onEndReachedThreshold` 0,5 (hızlı kaydırmada geç kalabilir), `getItemLayout` olmaması ve yüklenen
  tüm uçuşların bellekte kalması (bu ölçekte FlashList düşünülmeli), her favori değişikliğinde
  favori listesinin tamamının yeniden yazılması. Büyük veriyle ölçülmedi.
- **Detay her açılışta servisten yeniden istenir;** önbellek yok.
- **Favoriler uçuşun eklendiği andaki kopyasını saklar.** Servisteki veri değişirse (ör. fiyat)
  favoriler ekranındaki kopya güncellenmez; mock veri sabit olduğu için bu case'te etkisi yok.
- **Depolama okunamazsa** (bozuk kayıt) favoriler boş başlar ve ilk favori değişikliği bozuk kaydın
  üzerine yazar.
- **Saat dilimi sabit UTC+3 varsayar.** Europe/Istanbul kuralı değişirse `domain/format.ts`
  güncellenmelidir.
- **E2E'de doğrulanamayan tek an:** sonraki sayfa yüklenirken belirtecin listeyi bloklamaması,
  case-kit'in en uzun gecikmesi (3 sn) içinde bittiğinden Maestro ile güvenilir yakalanamıyor;
  entegrasyon testinde ve simülatörde elle doğrulandı.
- **Node sürümü:** Case "Node 18+" diyor; uygulama ve mock servis için bu yeterli, ancak test
  kütüphanesi (RNTL 14) Node 22.13+ gerektiriyor.

---

## 8. AI araçlarının kullanımı

Geliştirme bir AI kodlama asistanıyla (**Claude Code**) yapıldı. Kod, testler ve belgeler (bu
README dahil) asistanla birlikte yazıldı; kurulum sorunlarının (Xcode/simülatör) çözümünde ve
kod incelemesinde de kullanıldı.

Çıktı şöyle kontrol edildi:

- **Madde madde ilerleme:** Her madde ayrı yapıldı ve commit'lendi; her maddeden sonra
  değişiklikler case metnindeki cümlelerle eşleştirilerek kapsam denetiminden geçirildi, istenmeyen
  her şey kaldırıldı.
- **Otomatik doğrulama:** TypeScript tip kontrolü (kullanılmayan kod taramasıyla), 56 Jest testi
  (gerçek case-kit sunucusuyla smoke ve entegrasyon dahil), gerçek simülatörde 7 Maestro E2E akışı.
- **Testlerin kendisinin doğrulanması:** Uygulama kodu bilerek bozuldu ve ilgili testlerin kırıldığı
  görüldü.
- **Elle kontrol:** Her madde iOS simülatöründe ve case-kit'in `/debug` senaryolarıyla
  (`fail-once`, `empty`, `slow`, `race`) denendi; davranışlar servisin ham yanıtlarıyla
  karşılaştırıldı.
