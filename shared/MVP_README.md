# Kotlin Multiplatform Module - MVP Durumu

## Durum: Geçici Olarak Devre Dışı

Bu Kotlin Multiplatform (KMM) shared module MVP 1.0 versiyonu için **geçici olarak devre dışı bırakılmıştır**.

### Neden?

1. **MVP Önceliği**: MVP 1.0, sadece web platformuna odaklanmaktadır
2. **Kaynak Optimizasyonu**: Mobil uygulamalar V2.0'da geliştirilecektir
3. **Basitlik**: İlk aşamada web üzerinden platform test edilecektir

### Ne Zaman Kullanılacak?

**MVP V2.0** (Mobil Geliştirme Fazı):
- Bu modül aktif olarak geliştirilecek
- Android ve iOS native uygulamalar için shared business logic içerecek
- API client, domain models, ve business logic burada olacak

### Mevcut Durum

- Sadece örnek `Greeting.kt` dosyası var (28 satır)
- Henüz gerçek iş mantığı eklenmemiş
- Build sistemi çalışıyor ancak boş

### Gelecek Plan

```kotlin
shared/
  src/
    commonMain/kotlin/
      - domain/models/          # Shared data models
      - data/repositories/      # Data repositories
      - network/               # API clients (Ktor)
      - utils/                 # Shared utilities
    androidMain/kotlin/        # Android-specific code
    iosMain/kotlin/            # iOS-specific code
```

---

**Versiyon**: MVP 1.0
**Durum**: Inactive
**Hedef Aktivasyon**: MVP 2.0 (Mobil Geliştirme)
