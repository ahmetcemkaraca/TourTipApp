# TourTipApp - MVP Gereksinimleri

## Executive Summary

Bu doküman TourTipApp platformu için **Minimum Viable Product (MVP)** gereksinimlerini tanımlar. MVP, platformun temel işlevlerini test etmek ve kullanıcı geri bildirimi almak için gerekli minimum özellikleri içerir.

**MVP Hedefi**: Bir turistin tur/aktivite bulup rezervasyon yapabildiği ve ödeme yapabildiği, servis sağlayıcılarının da basit şekilde tur ekleyip rezervasyonları yönetebildiği temel bir platform.

---

## 1. MVP İçin Kapsam

### ✅ MVP'ye DAHİL Özellikler

#### 1.1 Kullanıcı Yönetimi (Basit)
- ✅ Email/şifre ile kayıt ve giriş
- ✅ Şifre sıfırlama
- ✅ Temel profil görüntüleme ve düzenleme
- ✅ Çıkış yapma
- ❌ OAuth (Google/Apple) → Sonraki versiyona
- ❌ 2FA → Sonraki versiyona
- ❌ Email doğrulama → Opsiyonel

#### 1.2 Servis Sağlayıcı Yönetimi (Basit)
- ✅ Servis sağlayıcı kaydı (manuel onay)
- ✅ Temel işletme profili (ad, açıklama, iletişim bilgileri)
- ✅ Basit dashboard (sadece rezervasyon listesi)
- ❌ Otomatik doğrulama sistemi → Manuel
- ❌ Gelişmiş dashboard (analytics, raporlar) → Sonraki versiyona

#### 1.3 Tur/Aktivite Listeleme (Basit)
- ✅ Tur oluşturma (başlık, açıklama, resim, fiyat, süre)
- ✅ Tur düzenleme ve silme
- ✅ Uygunluk takvimi (basit tarih seçimi)
- ✅ Kategori seçimi (Tur, Etkinlik, Aktivite)
- ❌ Gelişmiş medya yönetimi (çoklu resim galerisi) → Tek resim yeterli
- ❌ Dinamik fiyatlandırma → Sabit fiyat
- ❌ Kapasite yönetimi → Sonraki versiyona

#### 1.4 Tur Keşfi ve Arama (Basit)
- ✅ Anasayfada öne çıkan turlar
- ✅ Basit arama (başlık ve açıklamada arama)
- ✅ Kategori filtreleme
- ✅ Fiyat sıralama (düşükten yükseğe, yüksekten düşüğe)
- ❌ Gelişmiş filtreleme (tarih aralığı, süre, mesafe) → Sonraki versiyona
- ❌ Harita görünümü → Sonraki versiyona
- ❌ AI öneriler → Sonraki versiyona

#### 1.5 Tur Detayları ve Rezervasyon
- ✅ Tur detay sayfası (tüm bilgiler, resim, fiyat, açıklama)
- ✅ Tarih ve saat seçimi
- ✅ Kişi sayısı seçimi
- ✅ Toplam fiyat hesaplama
- ✅ Rezervasyon onayı
- ✅ Rezervasyon listesi (kullanıcı profili)
- ❌ Çoklu tur rezervasyonu (sepet) → Tek tek rezervasyon
- ❌ İtinerary planlaması → Sonraki versiyona

#### 1.6 Ödeme İşlemleri (Basit Stripe)
- ✅ Stripe ile kredi kartı ödemesi
- ✅ Ödeme onayı
- ✅ Basit fatura/makbuz
- ❌ Çoklu ödeme yöntemi → Sadece kart
- ❌ İade işlemleri → Manuel (admin tarafından)
- ❌ Bölünmüş ödeme → Sonraki versiyona

#### 1.7 Değerlendirme ve Yorumlar (Basit)
- ✅ 5 yıldız değerlendirme
- ✅ Yorum yazma
- ✅ Yorumları görüntüleme
- ❌ Fotoğraf ekleme → Sonraki versiyona
- ❌ Servis sağlayıcı yanıtı → Sonraki versiyona
- ❌ Moderasyon sistemi → Manuel moderasyon

#### 1.8 Bildirimler (Temel)
- ✅ Email bildirimleri (rezervasyon onayı, hatırlatma)
- ❌ Push notification → Sonraki versiyona
- ❌ SMS bildirimleri → Sonraki versiyona
- ❌ In-app messaging → Sonraki versiyona

---

### ❌ MVP'den ÇIKARTILAN Özellikler (Sonraki Versiyonlar İçin)

#### Platform Özellikleri (V2+)
- ❌ **Loyalty/Sadakat Programı**: Puan sistemi, ödüller
- ❌ **AI/ML Özellikleri**: Kişiselleştirilmiş öneriler, chatbot
- ❌ **Gelişmiş Analytics**: BigQuery entegrasyonu, detaylı raporlar
- ❌ **Social Features**: Sosyal medya entegrasyonu, paylaşım
- ❌ **CMS Sistemi**: Blog, içerik yönetimi
- ❌ **Admin Dashboard**: Gelişmiş yönetim paneli
- ❌ **Marketplace**: Restorant, hediyelik eşya, taksi entegrasyonu
- ❌ **Insurance**: Sigorta sistemi
- ❌ **Multi-city Support**: Çoklu şehir desteği
- ❌ **Multi-language**: i18n (sadece Türkçe)

#### Teknik Özellikler (V2+)
- ❌ **Kotlin Multiplatform**: Android ve iOS native app'ler
- ❌ **Offline Support**: Offline-first yaklaşım
- ❌ **Real-time Updates**: WebSocket, Firestore real-time
- ❌ **Advanced Security**: 2FA, biometric auth
- ❌ **PWA Features**: Gelişmiş PWA özellikleri
- ❌ **SEO Optimization**: Gelişmiş SEO

#### Cloud Functions (Gereksiz)
- ❌ `ai-functions.ts` - AI/ML işlemleri
- ❌ `loyalty-functions.ts` - Sadakat programı
- ❌ `marketplace-functions.ts` - Marketplace özellikleri
- ❌ `bigquery-functions.ts` - Analytics export
- ❌ `social-functions.ts` - Sosyal özellikler
- ❌ `cms-functions.ts` - İçerik yönetimi
- ❌ `insurance-functions.ts` - Sigorta
- ❌ `gift-functions.ts` - Hediye sistemi
- ❌ `taxi-functions.ts` - Taksi entegrasyonu
- ❌ `restaurant-functions.ts` - Restoran rezervasyonu

---

## 2. MVP Teknik Kapsam

### 2.1 Platform Öncelikleri

#### Yüksek Öncelik (MVP V1.0)
1. **Web Platform (Next.js)**: Tam işlevsel
2. **Firebase Backend**: Authentication, Firestore, Storage, Cloud Functions
3. **Stripe Payments**: Basit ödeme işlemleri

#### Düşük Öncelik (MVP sonrası)
1. **Android App**: V2.0
2. **iOS App**: V2.0
3. **Kotlin Multiplatform**: V2.0

### 2.2 Teknoloji Stack (MVP)

#### Frontend
```
- Next.js 15 (Web only)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI (basit componentler)
```

#### Backend
```
- Firebase Authentication (email/password only)
- Cloud Firestore (database)
- Firebase Storage (resim yükleme)
- Cloud Functions (minimal: auth, booking, payment, email)
- Stripe (ödeme)
```

#### DevOps
```
- Firebase Hosting
- GitHub Actions (basit CI/CD)
- Tek environment (production)
```

### 2.3 Firebase Collections (MVP)

#### Gerekli Collections
```
users/
  - uid
  - email
  - displayName
  - role (user/provider)
  - createdAt

providers/
  - providerId
  - businessName
  - description
  - contactEmail
  - contactPhone
  - approved (boolean)
  - createdAt

tours/
  - tourId
  - providerId
  - title
  - description
  - imageUrl
  - price
  - duration
  - category
  - availability[]
  - createdAt

bookings/
  - bookingId
  - userId
  - tourId
  - providerId
  - date
  - numberOfPeople
  - totalPrice
  - status (pending/confirmed/cancelled)
  - paymentIntentId
  - createdAt

reviews/
  - reviewId
  - userId
  - tourId
  - rating (1-5)
  - comment
  - createdAt
```

#### Gereksiz Collections (Kaldırılacak)
- ❌ loyalty_points
- ❌ marketplace_items
- ❌ restaurant_bookings
- ❌ taxi_rides
- ❌ insurance_policies
- ❌ gifts
- ❌ cms_posts
- ❌ social_posts

---

## 3. Cloud Functions (MVP)

### ✅ Gerekli Functions

1. **auth-functions.ts**
   - User creation trigger
   - Provider verification

2. **booking-functions.ts**
   - Create booking
   - Update booking status
   - Get user bookings
   - Get provider bookings

3. **stripe-functions.ts**
   - Create payment intent
   - Confirm payment
   - Handle webhook

4. **email-functions.ts**
   - Send booking confirmation
   - Send reminder (1 day before)

5. **notification-functions.ts**
   - Basic email notifications only

### ❌ Gereksiz Functions (Silinecek)

- ai-functions.ts
- loyalty-functions.ts
- marketplace-functions.ts
- bigquery-functions.ts
- social-functions.ts
- cms-functions.ts
- admin-functions.ts
- insurance-functions.ts
- gift-functions.ts
- taxi-functions.ts
- restaurant-functions.ts

---

## 4. React Components (MVP)

### ✅ Gerekli Components

#### Pages
- `/` - Anasayfa (öne çıkan turlar)
- `/tours` - Tur listesi
- `/tours/[id]` - Tur detayı
- `/booking/[id]` - Rezervasyon sayfası
- `/checkout` - Ödeme sayfası
- `/profile` - Kullanıcı profili
- `/auth/login` - Giriş
- `/auth/signup` - Kayıt
- `/provider/dashboard` - Sağlayıcı paneli
- `/provider/tours` - Tur yönetimi
- `/provider/bookings` - Rezervasyon yönetimi

#### Components
- Navbar
- Footer
- TourCard
- SearchBar
- FilterBar (basit)
- BookingForm
- ReviewList
- RatingStars

### ❌ Gereksiz Components (Silinecek/Basitleştirilecek)

- Marketplace components
- Restaurant booking components
- Taxi service components
- Insurance components
- Gift shop components
- Social media components
- Advanced analytics dashboards
- CMS components
- Loyalty program UI
- AI chatbot
- Multi-cart system

---

## 5. Kullanıcı Akışları (MVP)

### 5.1 Turist Akışı (User Journey)

```
1. Anasayfayı ziyaret et
   ↓
2. Turları gör (öne çıkanlar)
   ↓
3. Kategori seç VEYA arama yap
   ↓
4. Tur listesini gör
   ↓
5. Tura tıkla
   ↓
6. Tur detaylarını gör
   ↓
7. Tarih ve kişi sayısı seç
   ↓
8. Rezervasyon yap
   ↓
9. Ödeme yap (Stripe)
   ↓
10. Onay emaili al
    ↓
11. Turun gerçekleşmesini bekle
    ↓
12. Tur sonrası değerlendirme yap
```

### 5.2 Servis Sağlayıcı Akışı (Provider Journey)

```
1. Kayıt ol (provider olarak)
   ↓
2. Onay bekle (manuel)
   ↓
3. Dashboard'a giriş yap
   ↓
4. Yeni tur ekle
   ↓
5. Tur bilgilerini doldur
   ↓
6. Uygunluk takvimini ayarla
   ↓
7. Yayınla
   ↓
8. Rezervasyonları gör
   ↓
9. Rezervasyonları onayla/iptal et
   ↓
10. Değerlendirmeleri gör
```

---

## 6. MVP Başarı Kriterleri

### 6.1 Teknik Kriterler
- ✅ Web sitesi çalışıyor (build hatasız)
- ✅ Kullanıcı kaydı ve girişi çalışıyor
- ✅ Tur listeleme ve arama çalışıyor
- ✅ Rezervasyon oluşturma çalışıyor
- ✅ Stripe ödeme çalışıyor
- ✅ Email bildirimleri gönderiliyor
- ✅ Servis sağlayıcı paneli çalışıyor

### 6.2 İş Kriterleri
- 5 test servis sağlayıcı
- 20 test tur
- 10 test rezervasyon
- 5 test ödeme
- 5 test değerlendirme

---

## 7. MVP Geliştirme Takvimi

### Faz 1: Temizlik ve Düzeltme (1 hafta)
- Gereksiz dosyaları sil
- Build hatalarını düzelt
- Dependencies'leri düzenle
- Firebase yapılandırmasını düzelt

### Faz 2: Core Features (3 hafta)
- Authentication tamamla
- Tur listeleme ve detay sayfaları
- Rezervasyon workflow
- Stripe ödeme entegrasyonu

### Faz 3: Provider Portal (2 hafta)
- Provider kaydı ve dashboard
- Tur yönetimi
- Rezervasyon yönetimi

### Faz 4: Test ve Deploy (1 hafta)
- Manuel test
- Bug fix
- Production deploy

**Toplam: 7 hafta**

---

## 8. Değişiklik Özeti

### Kaldırılacak Dosyalar (Toplam ~40-50 dosya)

#### Cloud Functions
- functions/src/ai-functions.ts
- functions/src/loyalty-functions.ts
- functions/src/marketplace-functions.ts
- functions/src/bigquery-functions.ts
- functions/src/social-functions.ts
- functions/src/cms-functions.ts
- functions/src/admin-functions.ts
- functions/src/insurance-functions.ts
- functions/src/gift-functions.ts
- functions/src/taxi-functions.ts
- functions/src/restaurant-functions.ts

#### Components
- src/components/marketplace/
- src/components/restaurant/
- src/components/taxi/
- src/components/insurance/
- src/components/gift-shop/
- src/components/social/
- src/components/loyalty/
- src/components/cms/
- src/components/admin/ (gelişmiş kısımlar)

#### Services
- src/lib/ai-service.ts
- src/lib/loyalty-service.ts
- src/lib/marketplace-service.ts
- src/lib/restaurant-service.ts
- src/lib/taxi-service.ts
- src/lib/insurance-service.ts
- src/lib/gift-service.ts
- src/lib/social-service.ts

#### Mobile (şimdilik)
- shared/ (Kotlin Multiplatform)
- androidApp/
- iosApp/

### Basitleştirilecek Dosyalar

- src/lib/firestore-collections.ts (gereksiz collection'ları kaldır)
- functions/src/index.ts (gereksiz function export'ları kaldır)
- src/components/provider/provider-dashboard.tsx (sadece basit istatistikler)
- src/components/provider/provider-analytics.tsx (sil veya çok basitleştir)

---

## 9. Sonraki Adımlar

1. ✅ Bu dökümanı oku ve onayla
2. 🔄 Gereksiz dosyaları sil
3. 🔄 Build hatalarını düzelt
4. 🔄 Core features'ı tamamla
5. 🔄 Test et
6. 🔄 Deploy et

---

## 10. Notlar

- Bu MVP, platformun temel işlevselliğini test etmek için tasarlanmıştır
- Kullanıcı geri bildirimine göre özellikler eklenecek veya çıkartılacaktır
- Mobil uygulamalar V2.0'da geliştirilecektir
- Advanced features (AI, loyalty, marketplace) V2.0+ versiyonlarda eklenecektir

**Hedef**: Basit, çalışan, test edilebilir bir platform
**Değil**: Her şeyi içeren karmaşık bir süper uygulama

---

**Son Güncelleme**: 2025-11-14
**Versiyon**: MVP 1.0
**Hazırlayan**: Claude Code Analysis
