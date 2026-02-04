# Mock Data Testing Guide

Bu dokümantasyon, mock data kullanımı ve test modu hakkında bilgi içerir.

## Mock Data Nedir?

Mock data, backend API'si olmadan frontend geliştirme ve test yapmak için kullanılan sahte verilerdir. Bu veriler `app/data/mockData.ts` dosyasında saklanmaktadır.

## Mock Data Kullanımı

**ÖNEMLİ:** Mock data artık varsayılan olarak **KULLANILMIYOR**. Tüm view'lar gerçek API'leri kullanıyor.

Mock data'yı aktif etmek için:

1. `.env.local` dosyasına şunu ekleyin:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

2. Uygulamayı yeniden başlatın:
```bash
npm run dev
```

## Test Modu

Test modu, geliştirme ortamında ekstra loglama ve test özelliklerini aktif eder.

Test modunu aktif etmek için:

```bash
NEXT_PUBLIC_TEST_MODE=true npm run dev
```

veya `.env.local` dosyasına:
```bash
NEXT_PUBLIC_TEST_MODE=true
```

## Mock Data Dosyası

Mock data dosyası: `app/data/mockData.ts`

Bu dosya şunları içerir:
- `mockUsers`: Örnek kullanıcılar
- `mockProjects`: Örnek projeler
- `mockTargets`: Örnek hedefler
- `mockUserStats`: Kullanıcı istatistikleri
- Helper fonksiyonlar: `getUserStats()`, `getTargetsByDate()`, vb.

## Mock Data Kullanılan Yerler

Mock data şu dosyalarda kullanılıyor (şu anda yorum satırına alınmış veya test modu ile kontrol ediliyor):

1. `app/views/TeamTrackingView.tsx` - Takım takibi (API entegrasyonu yapılacak)
2. `app/views/ReportsView.tsx` - Raporlama (API entegrasyonu yapılacak)
3. `app/components/dialogs/CreateProjectDialog.tsx` - Proje oluşturma dialog'u
4. `app/components/dialogs/EditProjectDialog.tsx` - Proje düzenleme dialog'u
5. `app/components/dialogs/PerformanceReportDialog.tsx` - Performans raporu dialog'u

## API Entegrasyonu Tamamlanan Yerler

Aşağıdaki view'lar artık gerçek API'leri kullanıyor:

- ✅ `TargetFormView` - `/me/targets` endpoint'leri
- ✅ `DashboardView` - `/me/targets/statistics` ve `/me/targets/today`
- ✅ `SettingsView` - `/auth/me`
- ✅ `AdminPanelView` - `/projects` endpoint'leri

## Entegrasyon Testi

Entegrasyon testi yapmak için:

1. Backend'in çalıştığından emin olun (NestJS)
2. `.env.local` dosyasında `NEXT_PUBLIC_API_URL` ayarını kontrol edin
3. Mock data'yı **KAPALI** tutun (varsayılan)
4. Uygulamayı başlatın ve test edin

Mock data ile test yapmak için:

1. `.env.local` dosyasına `NEXT_PUBLIC_USE_MOCK_DATA=true` ekleyin
2. Backend'e ihtiyaç olmadan test yapabilirsiniz

## Notlar

- Mock data dosyası korunmuştur ve silinmemiştir
- Mock data kullanımları yorum satırına alınmıştır veya conditional olarak kontrol edilmektedir
- Production'da mock data kullanılmamalıdır
- Test modu sadece development ortamında kullanılmalıdır









