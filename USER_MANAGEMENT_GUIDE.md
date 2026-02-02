# Kullanıcı ve Admin Yönetimi Rehberi

Bu dokümanda kullanıcı oluşturma, admin oluşturma ve kullanıcı yönetimi işlemlerinin nerede ve nasıl yapıldığı detaylı olarak açıklanmıştır.

---

## 📍 Kullanıcı Oluşturma İşlemleri

### **GUI Üzerinden (Admin Panel)**

**Konum:** Admin Panel → Users Sekmesi → "Add User" Butonu

**Adımlar:**
1. Admin Panel'e giriş yapın
2. Üst menüden **"Users"** sekmesine tıklayın
3. Sağ üst köşedeki **"Add User"** butonuna tıklayın
4. Dialog açılır:
   - **Kullanıcı Adı:** `kullanici.adi` formatında
   - **Şifre:** En az 6 karakter
   - **Admin Yetkisi Ver:** Checkbox (opsiyonel)

**Dosyalar:**
- **GUI Dialog:** `ui/components/create_user_dialog.py`
- **Handler:** `ui/views/admin_panel/handlers.py` → `_show_create_user_dialog()`
- **UI Component:** `ui/views/admin_panel/ui_components/header.py` → "Add User" butonu

---

### **Backend İşlemi**

**Dosya:** `web_security/user_passwords.py`

**Metod:** `add_new_user(username, password, is_admin=False)`

**İşlem Akışı:**
```python
from web_security.user_passwords import get_password_manager

pm = get_password_manager()
result = pm.add_new_user("yeni.kullanici", "sifre123", is_admin=False)
```

**Yapılan İşlemler:**
1. Kullanıcı adı normalize edilir (lowercase, trim)
2. Kullanıcı zaten var mı kontrol edilir
3. Şifre uzunluğu kontrol edilir (min 6 karakter)
4. Şifre hash'lenir (salt ile)
5. `data/user_passwords.json` dosyasına kaydedilir

**Veri Formatı:**
```json
{
  "yeni.kullanici": {
    "password_hash": "...",
    "salt": "...",
    "created_at": "2025-01-27T10:30:00",
    "updated_at": "2025-01-27T10:30:00",
    "is_default": false,
    "role": "user"  // veya "admin"
  }
}
```

---

## 👑 Admin Oluşturma İşlemleri

### **Yöntem 1: Yeni Kullanıcı Oluştururken**

**Konum:** Admin Panel → Users → "Add User" → "Admin Yetkisi Ver" checkbox'ını işaretle

**Adımlar:**
1. "Add User" dialogunu açın
2. Kullanıcı bilgilerini girin
3. **"Admin Yetkisi Ver"** checkbox'ını işaretleyin
4. "Kullanıcı Oluştur" butonuna tıklayın

**Backend:** `add_new_user()` metoduna `is_admin=True` parametresi gönderilir

---

### **Yöntem 2: Mevcut Kullanıcıyı Admin Yapma**

**Konum:** Admin Panel → Users → Kullanıcı seç → "Edit Role" butonu

**Adımlar:**
1. Admin Panel → Users sekmesine gidin
2. Admin yapmak istediğiniz kullanıcıyı seçin (checkbox)
3. Üst toolbar'dan **"Edit Role"** butonuna tıklayın
4. Dialog açılır:
   - **"Admin Yetkisi Ver"** checkbox'ını işaretleyin
   - "Kaydet" butonuna tıklayın

**Dosyalar:**
- **GUI Dialog:** `ui/components/edit_user_role_dialog.py`
- **Handler:** `ui/views/admin_panel/handlers.py` → `_show_edit_user_role_dialog()`
- **Backend:** `web_security/user_passwords.py` → `set_user_role()`

**Backend İşlemi:**
```python
from web_security.user_passwords import get_password_manager

pm = get_password_manager()
result = pm.set_user_role("kullanici.adi", is_admin=True)
```

---

### **Yöntem 3: Environment Variable (Acil Durumlar)**

**Konum:** `.env` dosyası veya sistem environment variables

**Değişken:** `CPM_SUPER_ADMINS`

**Format:**
```env
CPM_SUPER_ADMINS=admin1,admin2,admin3
```

**Kontrol:** `config/admin_users.py` → `is_admin_user()` metodu

**Not:** Bu yöntem sadece acil durumlar veya CI/CD için kullanılır. Normal kullanım için JSON dosyası kullanılır.

---

## 👥 Kullanıcıyı Takıma Ekleme İşlemleri

### **Mevcut Durum**

Bu sistemde **"takım"** kavramı **proje bazlı** çalışmaktadır. Kullanıcılar direkt olarak takımlara eklenmez, bunun yerine:

1. **Kullanıcılar hedef girerken proje seçerler**
2. Bu şekilde otomatik olarak o projeye bağlanırlar
3. Sistem kullanıcının hangi projelerde çalıştığını takip eder

---

### **Proje Modeli**

**Dosya:** `core/models.py`

**Proje Modeli:**
```python
@dataclass
class Project:
    id: str
    name: str
    team_members: List[str] = field(default_factory=list)  # Kullanıcı listesi
    # ... diğer alanlar
```

**Not:** `team_members` alanı mevcut ama aktif kullanılmıyor gibi görünüyor.

---

### **Kullanıcının Projelerini Görüntüleme**

**Metod:** `services/target/helpers.py` → `get_user_projects(username)`

**Ne Yapar:**
- Kullanıcının bugünkü kayıtlarından projeleri çıkarır
- Hem default hem "other" projeleri dahil eder
- Kullanıcının çalıştığı tüm projeleri listeler

**Kullanım:**
```python
from services.target.helpers import TargetServiceHelpersMixin

helper = TargetServiceHelpersMixin()
projects = helper.get_user_projects("kullanici.adi")
```

---

### **Proje Oluşturma**

**Konum:** Admin Panel → Projects Sekmesi → "Create Project" Butonu

**Dosyalar:**
- **GUI Dialog:** `ui/components/create_project_dialog.py`
- **Handler:** `ui/views/admin_panel/handlers.py` → `_show_create_project_dialog()`
- **Backend:** `services/project_service.py` → `add_project()`

**Proje Bilgileri:**
- Proje ID
- Proje Adı
- Açıklama
- Kategori (Türkiye, Yurtdışı, vb.)
- Şirket
- Lokasyon

**Not:** Proje oluştururken kullanıcı atama özelliği yok. Kullanıcılar hedef girerken proje seçiyorlar.

---

## 📊 Veri Depolama

### **Kullanıcı Bilgileri**

**Dosya:** `data/user_passwords.json`

**Format:**
```json
{
  "kullanici.adi": {
    "password_hash": "sha256_hash",
    "salt": "random_salt",
    "created_at": "2025-01-27T10:30:00",
    "updated_at": "2025-01-27T10:30:00",
    "is_default": false,
    "role": "user"  // veya "admin"
  }
}
```

---

### **Proje Bilgileri**

**Dosya:** `data/projects.json`

**Format:**
```json
[
  {
    "id": "project_1",
    "name": "Proje Adı",
    "archived": false,
    "category": "turkiye",
    "team_members": [],  // Mevcut ama kullanılmıyor
    "created_by": "admin",
    "created_date": "2025-01-27 10:30:00"
  }
]
```

---

## 🔐 Yetkilendirme Kontrolü

### **Admin Kontrolü**

**Dosya:** `config/admin_users.py`

**Metod:** `is_admin_user(username)`

**Kontrol Sırası:**
1. Environment Variable (`CPM_SUPER_ADMINS`)
2. JSON Dosyası (`data/user_passwords.json` → `role == 'admin'`)

**Kullanım:**
```python
from config.admin_users import is_admin_user

if is_admin_user("kullanici.adi"):
    # Admin işlemleri
```

---

## 🛠️ API Metodları

### **UserPasswordManager Metodları**

**Dosya:** `web_security/user_passwords.py`

**Metodlar:**
- `add_new_user(username, password, is_admin=False)` - Yeni kullanıcı ekle
- `set_user_role(username, is_admin)` - Kullanıcı rolünü güncelle
- `delete_user(username)` - Kullanıcıyı sil
- `get_user_info(username)` - Kullanıcı bilgilerini getir
- `reset_to_default(username)` - Şifreyi varsayılan şifreye sıfırla

---

## 📝 Özet Tablo

| İşlem | GUI Konumu | Backend Dosyası | Backend Metod | Veri Dosyası |
|-------|------------|-----------------|---------------|--------------|
| **Kullanıcı Oluşturma** | Admin Panel → Users → Add User | `web_security/user_passwords.py` | `add_new_user()` | `data/user_passwords.json` |
| **Admin Oluşturma (Yeni)** | Admin Panel → Users → Add User → Admin checkbox | `web_security/user_passwords.py` | `add_new_user(is_admin=True)` | `data/user_passwords.json` |
| **Admin Oluşturma (Mevcut)** | Admin Panel → Users → Edit Role | `web_security/user_passwords.py` | `set_user_role()` | `data/user_passwords.json` |
| **Kullanıcıyı Takıma Ekleme** | ❌ Direkt özellik yok | - | - | - |
| **Proje Oluşturma** | Admin Panel → Projects → Create Project | `services/project_service.py` | `add_project()` | `data/projects.json` |

---

## ⚠️ Önemli Notlar

1. **Kullanıcıyı Takıma Ekleme:** Bu sistemde direkt "kullanıcıyı takıma ekle" özelliği yok. Kullanıcılar hedef girerken proje seçiyorlar ve bu şekilde projeye bağlanıyorlar.

2. **Proje Takım Üyeleri:** Proje modelinde `team_members` alanı var ama aktif kullanılmıyor. Kullanıcıların projelere bağlanması hedef kayıtları üzerinden yapılıyor.

3. **Admin Yetkisi:** Admin yetkisi olan kullanıcılar:
   - Tüm projelere erişebilir
   - Admin Panel'e erişebilir
   - Kullanıcı ve proje yönetimi yapabilir

4. **Veri Güvenliği:** Şifreler salt ile hash'lenerek saklanır. Düz metin şifre saklanmaz.

5. **Kullanıcı Normalizasyonu:** Tüm kullanıcı adları lowercase ve trim edilerek saklanır.

---

## 🔄 İşlem Akış Şemaları

### **Kullanıcı Oluşturma Akışı:**

```
Admin Panel → Users Tab
    ↓
"Add User" Button Click
    ↓
create_user_dialog.py → Dialog Açılır
    ↓
Kullanıcı Bilgileri Girilir
    ↓
"Kullanıcı Oluştur" Button Click
    ↓
user_passwords.py → add_new_user()
    ↓
Şifre Hash'lenir
    ↓
user_passwords.json → Kaydedilir
    ↓
Başarı Mesajı Gösterilir
```

### **Admin Oluşturma Akışı:**

```
Admin Panel → Users Tab
    ↓
Kullanıcı Seçilir (Checkbox)
    ↓
"Edit Role" Button Click
    ↓
edit_user_role_dialog.py → Dialog Açılır
    ↓
"Admin Yetkisi Ver" Checkbox İşaretlenir
    ↓
"Kaydet" Button Click
    ↓
user_passwords.py → set_user_role()
    ↓
user_passwords.json → Güncellenir
    ↓
Başarı Mesajı Gösterilir
```

---

## 📚 İlgili Dosyalar

### **GUI Dosyaları:**
- `ui/components/create_user_dialog.py` - Kullanıcı oluşturma dialogu
- `ui/components/edit_user_role_dialog.py` - Rol düzenleme dialogu
- `ui/views/admin_panel/handlers.py` - Event handler'lar
- `ui/views/admin_panel/ui_components/header.py` - Toolbar butonları
- `ui/views/admin_panel/ui_components/users_table.py` - Kullanıcı tablosu

### **Backend Dosyaları:**
- `web_security/user_passwords.py` - Kullanıcı yönetimi servisi
- `config/admin_users.py` - Admin kontrolü
- `services/user_service.py` - Kullanıcı servisi
- `services/project_service.py` - Proje servisi
- `services/target/helpers.py` - Kullanıcı projeleri helper'ı

### **Veri Dosyaları:**
- `data/user_passwords.json` - Kullanıcı şifreleri ve rolleri
- `data/projects.json` - Proje bilgileri







