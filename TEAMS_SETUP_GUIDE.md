# Microsoft Teams Webhook Kurulum Rehberi

Bu dokümanda Microsoft Teams webhook'larının şirket içinde nasıl kurulacağı ve kullanılacağı detaylı olarak açıklanmıştır.

## 🔍 Microsoft Teams Webhook Nedir?

**Microsoft Teams Incoming Webhook**, Teams kanallarına HTTP POST istekleri ile mesaj göndermenizi sağlayan bir özelliktir. Bu özellik sayesinde:

- ✅ Dış uygulamalar Teams kanallarına mesaj gönderebilir
- ✅ Otomatik bildirimler gönderilebilir
- ✅ Teams masaüstü, web ve mobil uygulamalarında görünür
- ✅ Şirket içi veya dışından erişilebilir (webhook URL'i varsa)

---

## 📱 Teams Uygulamasında Nasıl Görünür?

### **Evet, Teams masaüstü/mobil uygulamasında görünür!**

1. **Teams Masaüstü Uygulaması:**
   - Mesajlar seçilen kanalda normal bir mesaj olarak görünür
   - Mesaj kartı formatında (MessageCard) gösterilir
   - Renkli başlıklar ve butonlar ile görsel olarak zenginleştirilmiş

2. **Teams Web Uygulaması:**
   - Tarayıcıda Teams açıldığında aynı şekilde görünür
   - Masaüstü uygulaması ile aynı görünüm

3. **Teams Mobil Uygulaması:**
   - Mobil cihazlarda da aynı mesajlar görünür
   - Push notification alabilirsiniz (Teams ayarlarına göre)

---

## 🏢 Şirket İçinde Nasıl Kurulur?

### Adım 1: Teams'te Webhook Oluşturma

1. **Microsoft Teams'i açın** (web veya masaüstü uygulaması)

2. **Kanal seçin:**
   - Mesajların gönderileceği kanalı seçin
   - Örnek: "CPM Bildirimleri" kanalı

3. **Kanal ayarlarına gidin:**
   - Kanal adının yanındaki **"..." (üç nokta)** menüsüne tıklayın
   - **"Connectors"** (Bağlayıcılar) seçeneğini seçin

4. **Incoming Webhook ekleyin:**
   - Arama kutusuna **"Incoming Webhook"** yazın
   - **"Incoming Webhook"** seçeneğini bulun ve **"Configure"** (Yapılandır) butonuna tıklayın

5. **Webhook adı ve görsel ayarlayın:**
   - **Name:** Webhook için bir isim verin (örn: "CPM Bildirimleri")
   - **Upload image:** İsteğe bağlı bir görsel ekleyebilirsiniz
   - **"Create"** (Oluştur) butonuna tıklayın

6. **Webhook URL'ini kopyalayın:**
   - Oluşturulan webhook URL'i kopyalayın
   - Format: `https://outlook.office.com/webhook/{guid}@...`
   - ⚠️ **ÖNEMLİ:** Bu URL'yi güvenli bir yerde saklayın, paylaşmayın!

---

### Adım 2: Python Uygulamasında Yapılandırma

1. **Environment Variable ekleyin:**

   `.env` dosyasına veya sistem environment variable'larına ekleyin:

   ```env
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/{your-webhook-url}
   ```

2. **Uygulama URL'sini ayarlayın (opsiyonel):**

   ```env
   CPM_APP_URL=http://your-server-ip:8550
   ```

3. **Uygulamayı yeniden başlatın**

---

### Adım 3: Test Etme

Python uygulamasında test komutu:

```bash
python main.py --teams-test
```

veya Python kodunda:

```python
from services.teams_service import get_teams_service

teams = get_teams_service()
teams.test_connection()
```

---

## 🎯 Mesajlar Nerede Görünür?

### **Teams Kanalında:**

1. **Kanal seçimi:**
   - Webhook oluştururken seçtiğiniz kanalda görünür
   - Örnek: "CPM Bildirimleri" kanalı

2. **Mesaj formatı:**
   - Mesaj kartı (MessageCard) formatında görünür
   - Renkli başlıklar ve butonlar ile
   - Markdown formatında metin desteği

3. **Görünüm:**
   ```
   ┌─────────────────────────────────┐
   │ 🎯 CPM Sabah Hatırlatması       │
   │ Günlük Hedef Takip Sistemi      │
   ├─────────────────────────────────┤
   │ Günaydın                        │
   │                                 │
   │ Bugünkü hedefinizi girmeyi     │
   │ unutmayınız                     │
   │                                 │
   │ İyi çalışmalar                  │
   ├─────────────────────────────────┤
   │ [Hedef Uygulamasına Git]       │
   └─────────────────────────────────┘
   ```

---

## 🔐 Güvenlik ve Erişim

### **Webhook URL Güvenliği:**

1. **URL hassas bilgidir:**
   - Webhook URL'i herkese açık olursa, herkes o kanala mesaj gönderebilir
   - `.env` dosyasında saklayın ve `.gitignore`'a ekleyin

2. **Kanal erişimi:**
   - Webhook sadece oluşturulduğu kanala mesaj gönderebilir
   - Kanal erişim izinleri Teams'te yönetilir

3. **Şirket içi kullanım:**
   - Webhook URL'i internet üzerinden erişilebilir olmalıdır
   - Şirket firewall'u Teams webhook'larına izin vermelidir
   - `outlook.office.com` domain'ine erişim gerekir

---

## 📋 Kullanım Senaryoları

### Senaryo 1: Şirket İçi Kullanım

**Durum:** Şirket içi sunucuda Python uygulaması çalışıyor

**Kurulum:**
1. Teams'te webhook oluşturulur
2. `.env` dosyasına webhook URL eklenir
3. Python uygulaması Teams'e mesaj gönderir

**Sonuç:**
- Mesajlar Teams kanalında görünür
- Tüm kullanıcılar Teams uygulamasında görebilir
- Mobil uygulamada da görünür

---

### Senaryo 2: Dış Ağdan Erişim

**Durum:** Uygulama şirket dışından erişilebilir

**Gereksinimler:**
- Webhook URL'i internet üzerinden erişilebilir olmalı
- Teams webhook servisi (`outlook.office.com`) erişilebilir olmalı
- Firewall kuralları izin vermeli

---

## 🛠️ Teknik Detaylar

### **Webhook URL Formatı:**

```
https://outlook.office.com/webhook/{guid}@IncomingWebhook/{more-guid}/{webhook-id}
```

### **HTTP İsteği:**

```http
POST https://outlook.office.com/webhook/...
Content-Type: application/json

{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "FF6B35",
  "summary": "CPM Hatırlatma",
  "sections": [...],
  "potentialAction": [...]
}
```

### **Yanıt:**

```http
HTTP/1.1 200 OK
```

200 OK = Mesaj başarıyla gönderildi

---

## ⚙️ Teams Webhook Özellikleri

### **Desteklenen Formatlar:**

1. **MessageCard Formatı:**
   - Renkli başlıklar
   - Markdown metin desteği
   - Butonlar ve linkler
   - Görsel ekleme (opsiyonel)

2. **Action Buttons:**
   - Uygulama URL'sine yönlendirme
   - HTTP Action (API çağrısı)
   - OpenUri Action (web sayfası açma)

3. **Renkler:**
   - Hex renk kodları desteklenir
   - Örnek: `FF6B35` (Turuncu)

---

## 📱 Teams Uygulamasında Görünüm Örnekleri

### **Sabah Hatırlatması:**

```
Teams Kanalı: "CPM Bildirimleri"
─────────────────────────────────
🎯 CPM Sabah Hatırlatması
Günlük Hedef Takip Sistemi

Günaydın

Bugünkü hedefinizi girmeyi 
unutmayınız

İyi çalışmalar

[Hedef Uygulamasına Git] ← Buton
─────────────────────────────────
```

### **Günlük Özet:**

```
Teams Kanalı: "CPM Bildirimleri"
─────────────────────────────────
📊 CPM Günlük Özet
Günlük Performans Raporu

Merhaba Berk Cam!

Günlük Performans:
• Tamamlanan Hedefler: 8/10
• Başarı Oranı: %80.0
• Tarih: 27.01.2025

Harika bir gün!

[Detayları Görüntüle] ← Buton
─────────────────────────────────
```

---

## 🔧 Sorun Giderme

### **Mesajlar görünmüyor:**

1. **Webhook URL kontrolü:**
   ```bash
   # .env dosyasında kontrol edin
   echo $TEAMS_WEBHOOK_URL
   ```

2. **Bağlantı testi:**
   ```bash
   python main.py --teams-test
   ```

3. **Kanal kontrolü:**
   - Webhook'un oluşturulduğu kanalı kontrol edin
   - Kanal erişim izinlerini kontrol edin

4. **Firewall kontrolü:**
   - `outlook.office.com` domain'ine erişim var mı?
   - Şirket proxy'si webhook isteklerini engelliyor mu?

---

## 📚 Microsoft Teams Webhook Dokümantasyonu

Resmi Microsoft dokümantasyonu:
- [Incoming Webhooks](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [MessageCard Format](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)

---

## ✅ Özet

1. **Teams'te webhook oluşturulur** → Kanal seçilir
2. **Webhook URL kopyalanır** → `.env` dosyasına eklenir
3. **Python uygulaması mesaj gönderir** → HTTP POST isteği
4. **Mesaj Teams'te görünür** → Kanalda normal mesaj olarak
5. **Tüm kullanıcılar görebilir** → Masaüstü, web, mobil

**Sonuç:** Evet, Teams masaüstü/mobil uygulamasında görünür! 🎉







