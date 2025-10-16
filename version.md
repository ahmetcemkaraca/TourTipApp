# Uygulama Versiyonu Güncellemesi

## 2025-08-18 00:05:55

### Önemli Değişiklikler ve Yeni Özellikler:

*   **AI Geliştirme Kuralları Kapsamlı Yenilendi:** `.cursor/rules/` klasöründeki tüm mdc dosyaları güçlendirildi ve detaylandırıldı.
*   **Master Proje Kuralları (project.instructions.mdc):** Copilot talimatları entegre edildi; AI self-check mekanizmaları, soft-block koruyucuları ve çelişki tespit sistemi eklendi.
*   **Platform-Spesifik Kurallar Optimize Edildi:** Android Kotlin, iOS Swift, Node.js Backend, Web TypeScript React kuralları TourTrip.app domain gereksinimleri ile genişletildi.
*   **AI Tutarlılık Kontrol Sistemi:** `ai-consistency-checker.instructions.mdc` dosyası oluşturularak yapay zeka tutarlılığı için kapsamlı kontrol protokolleri tanımlandı.
*   **Güvenlik, DevOps ve QA Kuralları Güçlendirildi:** Endüstri standartlarında güvenlik blokları, CI/CD pipeline kuralları ve test stratejileri eklendi.
*   **TourTrip.app Domain Kuralları:** `tourtrip-domain.instructions.mdc` ile seyahat endüstrisine özel iş kuralları, offline-first mimarisi ve çok para birimli ödeme sistemleri tanımlandı.
*   **TourTrip.app Website Kuralları:** ✨ YENİ: `tourtrip-website.instructions.mdc` ile backend entegrasyonu, çoklu sistem uyumluluğu ve website-spesifik geliştirme standartları eklendi.
*   **Rol Bazlı Kural Sistematiği:** `alwaysApply: false` ve `globs` kullanımı ile bağlama duyarlı kural aktivasyonu sağlandı.
*   **Comprehensive Self-Check Protokolleri:** Her platform için detaylı kod kalitesi, güvenlik ve performans kontrol listeleri eklendi.

### Teknik Geliştirmeler:

*   **Çelişki Tespit Mekanizması:** AI'ın kullanıcı isteklerindeki güvenlik/mimari çelişkileri tespit etmesi ve alternatif çözümler sunması.
*   **Soft-Block Koruyucuları:** Güvenlik açıkları, test atlamaları ve kötü pratiklere karşı otomatik engelleme sistemleri.
*   **Quality Gates:** Her kod değişikliği için zorunlu kalite kontrolleri (lint, test, güvenlik, performans).
*   **Emergency Stop Conditions:** Kritik güvenlik ihlalleri için AI durdurma mekanizmaları.

### Rollback Planı:

*   Mevcut mdc dosyalarının yedekleri `.cursor/rules.backup/` klasöründe saklandı (manuel).
*   Git commit hash: `[current-commit]` - geri alma için `git revert` kullanılabilir.
*   Eski kurallar daha basitti; yeni kurallar daha kapsamlı ve kısıtlayıcı.

---

## 2025-08-17 23:33:54

### Önemli Değişiklikler ve Yeni Özellikler:

*   **Uygulama İnceleme Raporu Oluşturuldu:** Uygulama yapısı ve temel bileşenleri incelenerek `docs/.ai/application_report.md` dosyasına YAML formatında detaylı bir rapor eklendi.
*   **Rapor Güncellendi:** Uygulamanın amacı, paket adından yola çıkarak "tur, seyahat ve gezi odaklı bir işlevselliğe sahip olacağı" şeklinde güncellendi.
*   **`.ai` Dizini Oluşturuldu:** Rapor dosyası için `docs/.ai` dizini oluşturuldu.
