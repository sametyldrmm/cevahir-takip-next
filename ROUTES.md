# CPM Next.js - URL Routes (Erişim URL'leri)

Bu dosya, uygulamadaki tüm sayfaların URL'lerini ve erişim bilgilerini içerir.

## 🔐 Authentication Routes

### Login Sayfası
- **URL:** `/login`
- **Açıklama:** Kullanıcı giriş sayfası
- **Erişim:** Herkes erişebilir
- **Yönlendirme:** Giriş yapıldıktan sonra `/dashboard` sayfasına yönlendirir

## 📊 Main Application Routes

### Dashboard (Ana Sayfa)
- **URL:** `/dashboard`
- **Açıklama:** Kullanıcı dashboard'u - İstatistikler ve takvim görünümü
- **Erişim:** Giriş yapmış kullanıcılar
- **Özellikler:**
  - Kullanıcı istatistikleri
  - Takvim görünümü
  - Günlük hedefler özeti

### Hedef Girişi (Target Form)
- **URL:** `/target-form`
- **Açıklama:** Günlük hedef giriş formu
- **Erişim:** Giriş yapmış kullanıcılar
- **Özellikler:**
  - Proje seçimi
  - Tarih seçimi
  - İş içeriği girişi
  - Saat/dakika girişi

### Takım Takibi (Team Tracking)
- **URL:** `/team-tracking`
- **Açıklama:** Takım üyelerinin hedeflerini görüntüleme
- **Erişim:** Giriş yapmış kullanıcılar
- **Özellikler:**
  - Takım üyeleri listesi
  - Proje bazlı filtreleme
  - Kullanıcı bazlı filtreleme
  - Tarih bazlı filtreleme

### Admin Panel
- **URL:** `/admin-panel`
- **Açıklama:** Yönetici paneli - Proje ve kullanıcı yönetimi
- **Erişim:** Sadece admin kullanıcılar
- **Özellikler:**
  - Proje yönetimi (ekleme, düzenleme, silme, arşivleme)
  - Kullanıcı yönetimi
  - Veri yönetimi

### Ayarlar (Settings)
- **URL:** `/settings`
- **Açıklama:** Kullanıcı ayarları ve profil yönetimi
- **Erişim:** Giriş yapmış kullanıcılar
- **Özellikler:**
  - Tema ayarları (Light/Dark/Auto)
  - Vurgu rengi seçimi (Mavi/Turuncu/Yeşil)
  - Profil bilgileri
  - Bildirim ayarları

## 🔄 Route Yapısı

```
/
├── /login                    # Giriş sayfası
└── /dashboard                # Dashboard (ana sayfa)
    ├── /target-form          # Hedef girişi
    ├── /team-tracking        # Takım takibi
    ├── /admin-panel          # Admin paneli (sadece admin)
    └── /settings             # Ayarlar
```

## 📝 Notlar

1. **Authentication:** Tüm main route'lar authentication gerektirir. Giriş yapmamış kullanıcılar otomatik olarak `/login` sayfasına yönlendirilir.

2. **Admin Panel:** `/admin-panel` sayfasına sadece admin kullanıcılar erişebilir. Normal kullanıcılar erişmeye çalışırsa `/dashboard` sayfasına yönlendirilir.

3. **LocalStorage:** Kullanıcı bilgileri localStorage'da saklanır:
   - `isLoggedIn`: "true" / "false"
   - `currentUser`: Kullanıcı adı
   - `isAdmin`: "true" / "false"

4. **Sidebar Navigation:** Sidebar'dan tıklanan menü öğeleri ilgili route'a yönlendirir.

## 🚀 Geliştirme Ortamı

Geliştirme sunucusunu başlatmak için:
```bash
cd cevahir-takip-next
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır.

## 🔗 Örnek URL'ler

- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- Hedef Girişi: `http://localhost:3000/target-form`
- Takım Takibi: `http://localhost:3000/team-tracking`
- Admin Panel: `http://localhost:3000/admin-panel`
- Ayarlar: `http://localhost:3000/settings`










