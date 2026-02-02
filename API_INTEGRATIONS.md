# Python Kodundaki API ve Servis Entegrasyonları

Bu dokümanda Python kodunda kullanılan tüm API ve servis bağlantıları listelenmiştir.

## 🔌 API ve Servis Bağlantıları

### 1. **Microsoft Teams Webhook API** ⭐ (Dış API)

**Dosya:** `services/teams_service.py`

**Ne yapıyor:**
- Microsoft Teams kanallarına bildirim gönderiyor
- HTTP POST istekleri ile webhook URL'ine mesaj gönderiyor
- Mesaj formatı: Microsoft Teams MessageCard formatı

**Kullanım:**
```python
from services.teams_service import get_teams_service

teams = get_teams_service()
teams.send_reminder(user_name, project_name, target_description)
teams.send_daily_summary(user_name, completed, total)
teams.send_morning_reminder()
teams.send_evening_reminder()
```

**Environment Variable:**
- `TEAMS_WEBHOOK_URL` - Teams webhook URL'i (gerekli)

**Endpoint:**
- POST `{TEAMS_WEBHOOK_URL}` - Teams webhook endpoint'i

**Mesaj Türleri:**
- Hatırlatma bildirimleri
- Günlük özet bildirimleri
- Deadline uyarıları
- Sabah hatırlatmaları
- Akşam hatırlatmaları
- Cuma akşamı hatırlatmaları

---

### 2. **Flet Web Server** (Kendi Sunucusu)

**Dosya:** `runners/web.py`

**Ne yapıyor:**
- Flet framework'ün kendi web sunucusunu çalıştırıyor
- Web arayüzü sunuyor (port 8550)
- WebSocket bağlantıları yönetiyor

**Port:** 8550 (varsayılan)
**Host:** 0.0.0.0 (varsayılan)

**Environment Variables:**
- `CPM_PORT` - Web server portu (varsayılan: 8550)
- `CPM_HOST` - Web server host (varsayılan: 0.0.0.0)
- `CPM_SERVER_IP` - Sunucu IP adresi

---

### 3. **Flask Download Server** (Excel İndirme Sunucusu)

**Dosya:** `flask_download_server.py`

**Ne yapıyor:**
- Excel dosyalarını indirmek için ayrı bir Flask server
- CORS desteği ile
- Rate limiting ile korumalı

**Port:** 5001 (varsayılan)
**Host:** 0.0.0.0 (varsayılan)

**Endpoints:**
- `GET /` - Ana sayfa
- `GET /download/<filename>` - Excel dosyası indir
- `GET /list` - Tüm dosyaları listele
- `GET /health` - Sağlık kontrolü
- `POST /set-exports-dir` - Exports dizinini ayarla
- `GET /missing-data-report/<year_month>` - Eksik veri raporu

**Environment Variables:**
- `FLASK_HOST` - Flask server host (varsayılan: 0.0.0.0)
- `FLASK_PORT` - Flask server portu (varsayılan: 5001)
- `FLASK_DEBUG` - Debug modu (varsayılan: False)
- `CPM_EXPORTS_DIR` - Exports dizini
- `CPM_ALLOWED_ORIGINS` - CORS izin verilen origin'ler

**Güvenlik:**
- Rate limiting (30 istek/dakika)
- CORS kontrolü
- IP bazlı erişim kontrolü
- Token bazlı authentication (opsiyonel)

---

### 4. **SQLite Database** (Veritabanı)

**Dosya:** `core/database/`

**Ne yapıyor:**
- Yerel SQLite veritabanı kullanıyor
- Hedef kayıtları saklıyor
- Kullanıcı bilgilerini saklıyor
- Proje bilgilerini saklıyor

**Database File:** `data/Gunluk_Hedefler.db`

**Environment Variable:**
- `DATABASE_URL` - Veritabanı bağlantı URL'i (varsayılan: sqlite:///data/Gunluk_Hedefler.db)

---

## 📋 Özet Tablo

| Servis | Tip | Port | Environment Variable | Durum |
|--------|-----|------|---------------------|-------|
| **Microsoft Teams** | Dış API | - | `TEAMS_WEBHOOK_URL` | ⚠️ Opsiyonel |
| **Flet Web Server** | Kendi Sunucusu | 8550 | `CPM_PORT`, `CPM_HOST` | ✅ Aktif |
| **Flask Download** | Kendi Sunucusu | 5001 | `FLASK_PORT`, `FLASK_HOST` | ✅ Aktif |
| **SQLite Database** | Veritabanı | - | `DATABASE_URL` | ✅ Aktif |

---

## 🔄 Next.js Entegrasyonu İçin Öneriler

### 1. **Microsoft Teams API**
Next.js'te API route'ları oluşturup Teams webhook'una proxy yapabilirsiniz:

```typescript
// app/api/teams/send-reminder/route.ts
export async function POST(request: Request) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  // Teams webhook'a istek gönder
}
```

### 2. **Flask Download Server**
Next.js'te API route'ları oluşturup Flask server'a proxy yapabilirsiniz:

```typescript
// app/api/download/[filename]/route.ts
export async function GET(request: Request, { params }: { params: { filename: string } }) {
  const flaskUrl = `http://localhost:5001/download/${params.filename}`;
  // Flask server'a proxy yap
}
```

### 3. **Database**
Next.js'te API route'ları oluşturup Python backend'e bağlanabilirsiniz veya direkt SQLite'a erişebilirsiniz:

```typescript
// app/api/targets/route.ts
export async function GET() {
  // Python backend API'ye istek gönder veya direkt SQLite'a bağlan
}
```

---

## 🔐 Güvenlik Notları

1. **Teams Webhook URL:** Hassas bilgi - `.env` dosyasında saklanmalı
2. **CORS:** Flask server CORS kontrolü yapıyor
3. **Rate Limiting:** Flask server rate limiting kullanıyor
4. **IP Filtering:** Internal IP kontrolü yapılıyor

---

## 📝 Environment Variables Özeti

```env
# Teams
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Flet Web Server
CPM_PORT=8550
CPM_HOST=0.0.0.0
CPM_SERVER_IP=localhost

# Flask Download Server
FLASK_PORT=5001
FLASK_HOST=0.0.0.0
CPM_EXPORTS_DIR=./exports
CPM_ALLOWED_ORIGINS=http://localhost:8550,http://localhost:3000

# Database
DATABASE_URL=sqlite:///data/Gunluk_Hedefler.db
```







