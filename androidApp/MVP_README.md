# Android App - MVP Durumu

## Durum: Geçici Olarak Devre Dışı

Android uygulaması MVP 1.0 versiyonu için **geçici olarak devre dışı bırakılmıştır**.

### Neden?

1. **MVP Önceliği**: MVP 1.0, sadece **web platformu** (Next.js) üzerine odaklanmaktadır
2. **Kaynak Optimizasyonu**: Mobil uygulamalar MVP V2.0'da geliştirilecektir
3. **Hızlı Test**: Web üzerinden platform önce test edilip doğrulanacaktır

### Ne Zaman Geliştirilecek?

**MVP V2.0 - Mobil Geliştirme Fazı**:
- Kotlin Multiplatform shared module ile entegrasyon
- Jetpack Compose UI implementasyonu
- Firebase SDK entegrasyonu
- Offline-first mimari

### Mevcut Durum

- Sadece `MainActivity.kt` ve tema dosyaları var
- Henüz UI implementasyonu yok
- Boş scaffold durumunda

### Gelecek Teknoloji Stack

```
UI Framework:     Jetpack Compose + Material Design 3
Architecture:     MVVM + Clean Architecture
Networking:       Ktor (KMM shared)
Local DB:         SQLDelight (KMM shared)
DI:               Koin
Navigation:       Compose Navigation
Auth:             Firebase Auth SDK
```

### Hedef Özellikler (V2.0)

- [ ] Kullanıcı girişi (Firebase Auth)
- [ ] Tur listesi ve arama
- [ ] Tur detayları
- [ ] Rezervasyon yapma
- [ ] Stripe ile ödeme
- [ ] Push notifications
- [ ] Profil yönetimi
- [ ] Offline support

---

**Versiyon**: MVP 1.0
**Durum**: Inactive
**Hedef Aktivasyon**: MVP 2.0
