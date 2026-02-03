# Microsoft Teams Bildirimleri

Bu dokümanda CPM uygulamasının Microsoft Teams'e gönderdiği tüm bildirim türleri detaylı olarak açıklanmıştır.

## 📢 Bildirim Türleri

### 1. **Hatırlatma Bildirimi** (`send_reminder`)

**Ne zaman gönderilir:**
- Kullanıcıya özel hatırlatma gerektiğinde
- Manuel olarak tetiklenebilir

**Mesaj İçeriği:**
```
Merhaba {user_name}!

Proje: {project_name}
Hedef: {target_description}
Tarih: {date}

Günlük hedefinizi tamamlamayı unutmayın!
```

**Renk:** Turuncu (FF6B35)
**Buton:** "🎯 Hedef Uygulamasına Git"

---

### 2. **Günlük Özet** (`send_daily_summary`)

**Ne zaman gönderilir:**
- Günlük performans özeti gösterilirken
- Tamamlanan/toplam hedef sayısı ile

**Mesaj İçeriği:**
```
Merhaba {user_name}!

Günlük Performans:
• Tamamlanan Hedefler: {completed}/{total}
• Başarı Oranı: %{rate:.1f}
• Tarih: {date}

{encouragement}
```

**Renk:** 
- Yeşil (28A745) - %80+ başarı
- Sarı (FFC107) - %50-80 başarı
- Kırmızı (DC3545) - %50 altı başarı

**Teşvik Mesajları:**
- %80+ → "Harika bir gün!"
- %50-80 → "Devam edelim!"
- %50 altı → "Hedeflerinizi gözden geçirin!"

**Buton:** "Detayları Görüntüle"

---

### 3. **Deadline Uyarısı** (`send_deadline_alert`)

**Ne zaman gönderilir:**
- Proje deadline'ı yaklaştığında
- Kalan gün sayısına göre uyarı seviyesi belirlenir

**Mesaj İçeriği:**
```
Merhaba {user_name}!

Proje: {project_name}
Deadline: {deadline}
Kalan Süre: {days_left} gün

{urgency_level}
```

**Acil Seviyeleri:**
- **1 gün veya daha az** → "Acil!" (Kırmızı - DC3545)
- **2-3 gün** → "Dikkat!" (Turuncu - FF6B35)
- **4+ gün** → "Planlama" (Sarı - FFC107)

**Buton:** "Projeyi Görüntüle"

---

### 4. **Sabah Hatırlatması** (`send_morning_reminder`) ⏰

**Ne zaman gönderilir:**
- **Otomatik:** Her gün saat **09:00**'da (scheduler tarafından)
- **Sadece hafta içi:** Cumartesi ve Pazar gönderilmez
- **Duplicate kontrolü:** Gün içinde sadece 1 kez gönderilir

**Mesaj İçeriği:**
```
Günaydın

Bugünkü hedefinizi girmeyi unutmayınız

İyi çalışmalar
```

**Renk:** Sarı (FFC107) - Sabah rengi
**Buton:** "Hedef Uygulamasına Git"

**Özellikler:**
- Hafta sonu kontrolü yapılır
- Duplicate check ile günde sadece 1 kez gönderilir
- State dosyasına kaydedilir (`teams_notification_state.json`)

---

### 5. **Akşam Hatırlatması** (`send_evening_reminder`) 🌙

**Ne zaman gönderilir:**
- **Otomatik:** Her gün saat **17:45**'te (scheduler tarafından)
- **Sadece hafta içi:** Cumartesi ve Pazar gönderilmez
- **Cuma özel:** Cuma günü ise `send_friday_evening_reminder` çağrılır
- **Duplicate kontrolü:** Gün içinde sadece 1 kez gönderilir

**Mesaj İçeriği:**
```
İyi akşamlar

Bugünkü hedefinizi güncellemeyi unutmayınız
```

**Renk:** Mor (6F42C1) - Akşam rengi
**Buton:** "Hedef Uygulamasına Git"

**Özellikler:**
- Hafta sonu kontrolü yapılır
- Cuma günü özel mesaj gönderilir
- Duplicate check ile günde sadece 1 kez gönderilir

---

### 6. **Cuma Akşamı Hatırlatması** (`send_friday_evening_reminder`) 🎉

**Ne zaman gönderilir:**
- **Otomatik:** Cuma günü saat 17:45'te
- `send_evening_reminder` tarafından otomatik çağrılır
- **Duplicate kontrolü:** Gün içinde sadece 1 kez gönderilir

**Mesaj İçeriği:**
```
İyi Haftasonları

Bugünkü hedefinizi güncellemeyi unutmayınız
```

**Renk:** Yeşil (28A745) - Haftasonu rengi
**Buton:** "Hedef Uygulamasına Git"

---

### 7. **Test Mesajı** (`test_connection`)

**Ne zaman gönderilir:**
- Teams webhook bağlantısını test etmek için
- Manuel olarak çağrılabilir

**Mesaj İçeriği:**
```
🧪 CPM Teams Test

Webhook Bağlantı Testi

Bu bir test mesajıdır. Teams webhook bağlantısı başarılı!
```

**Renk:** Microsoft Mavi (0078D4)

---

## ⚙️ Teknik Detaylar

### Rate Limiting
- **Minimum aralık:** 5 dakika (aynı mesaj türü için)
- **Duplicate check:** Dosya bazlı (`teams_notification_state.json`)
- **Günlük limit:** Her mesaj türü için günde 1 kez

### Mesaj Formatı
- **Format:** Microsoft Teams MessageCard
- **Markdown:** Destekleniyor
- **Action Button:** Her mesajda uygulama URL'sine yönlendiren buton var

### Zamanlama (Scheduler)
- **Sabah:** 09:00 (her gün, hafta içi)
- **Akşam:** 17:45 (her gün, hafta içi)
- **Cuma:** Özel akşam mesajı

### Güvenlik
- **Timeout:** 10 saniye
- **Retry:** 3 deneme
- **Retry Delay:** 2 saniye

---

## 📝 Mesaj Şablonları

Tüm mesaj şablonları `config/teams_config.py` dosyasında tanımlıdır:

```python
MESSAGE_TEMPLATES = {
    "reminder": {...},
    "daily_summary": {...},
    "deadline_alert": {...},
    "morning_reminder": {...},
    "evening_reminder": {...},
    "friday_evening_reminder": {...}
}
```

---

## 🔧 Kullanım Örnekleri

### Python'da Kullanım:
```python
from services.teams_service import get_teams_service

teams = get_teams_service()

# Hatırlatma gönder
teams.send_reminder("Berk Cam", "TURKCELL ADC5", "Modelleme çalışması")

# Günlük özet gönder
teams.send_daily_summary("Berk Cam", 8, 10)

# Deadline uyarısı gönder
from datetime import datetime
deadline = datetime(2025, 2, 15)
teams.send_deadline_alert("Berk Cam", "TURKCELL ADC5", deadline)

# Sabah hatırlatması (otomatik scheduler tarafından)
teams.send_morning_reminder()

# Akşam hatırlatması (otomatik scheduler tarafından)
teams.send_evening_reminder()

# Test bağlantısı
teams.test_connection()
```

---

## 📊 Bildirim Akışı

```
Scheduler Service
    ↓
09:00 → send_morning_reminder()
    ↓
Teams Service
    ↓
Microsoft Teams Webhook
    ↓
Teams Kanalı
```

```
Scheduler Service
    ↓
17:45 → send_evening_reminder()
    ↓
Cuma mı? → send_friday_evening_reminder()
    ↓
Teams Service
    ↓
Microsoft Teams Webhook
    ↓
Teams Kanalı
```

---

## 🎨 Renk Paleti

| Bildirim | Renk Kodu | Açıklama |
|----------|-----------|----------|
| Hatırlatma | `FF6B35` | Turuncu |
| Günlük Özet (Başarılı) | `28A745` | Yeşil |
| Günlük Özet (Orta) | `FFC107` | Sarı |
| Günlük Özet (Düşük) | `DC3545` | Kırmızı |
| Deadline (Acil) | `DC3545` | Kırmızı |
| Deadline (Dikkat) | `FF6B35` | Turuncu |
| Deadline (Planlama) | `FFC107` | Sarı |
| Sabah | `FFC107` | Sarı |
| Akşam | `6F42C1` | Mor |
| Cuma Akşamı | `28A745` | Yeşil |
| Test | `0078D4` | Microsoft Mavi |

---

## ⚠️ Önemli Notlar

1. **Hafta Sonu:** Sabah ve akşam hatırlatmaları hafta sonu gönderilmez
2. **Duplicate Check:** Her mesaj türü için günde sadece 1 kez gönderilir
3. **Rate Limiting:** Aynı mesaj türü için minimum 5 dakika aralık
4. **Webhook URL:** `TEAMS_WEBHOOK_URL` environment variable'ından okunur
5. **Uygulama URL:** Mesajlardaki butonlar bu URL'ye yönlendirir (varsayılan: `http://localhost:8550`)









