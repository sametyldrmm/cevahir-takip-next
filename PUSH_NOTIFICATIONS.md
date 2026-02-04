# Browser Push Notifications - Kurulum ve Kullanım

Bu dokümantasyon, Next.js uygulamasında browser push notification sisteminin nasıl çalıştığını açıklar.

## 🎯 Özellikler

- ✅ Tarayıcı arka planda olsa bile bildirim gönderme
- ✅ Service Worker tabanlı push notification sistemi
- ✅ Kullanıcı izni yönetimi
- ✅ Otomatik abonelik prompt'u
- ✅ Modern Web Push API kullanımı

## 📁 Dosya Yapısı

```
cevahir-takip-next/
├── public/
│   └── sw.js                    # Service Worker (push notification handler)
├── app/
│   ├── hooks/
│   │   └── usePushNotification.ts  # Push notification hook
│   ├── components/
│   │   └── PushNotificationPrompt.tsx  # İzin isteme component'i
│   └── layout.tsx               # PushNotificationPrompt entegrasyonu
└── next.config.ts                # Service Worker headers config
```

## 🚀 Nasıl Çalışır?

### 1. Service Worker Kaydı

Service Worker (`public/sw.js`) tarayıcıda arka planda çalışır ve:
- Push event'lerini yakalar
- Bildirimleri gösterir
- Bildirim tıklamalarını handle eder

### 2. Push Subscription

Kullanıcı izin verdiğinde:
1. Service Worker kaydedilir
2. Push subscription oluşturulur (VAPID key ile)
3. Subscription backend'e gönderilir (TODO: Backend entegrasyonu)

### 3. Bildirim Gönderme

Backend'den push notification gönderildiğinde:
- Service Worker push event'ini yakalar
- Bildirim gösterilir
- Kullanıcı bildirime tıklarsa uygulama açılır

## ⚙️ Kurulum

### 1. Environment Variables

`.env.local` dosyasına VAPID public key ekle:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key-here
```

**VAPID Key Nasıl Oluşturulur?**

```bash
# web-push kütüphanesi ile
npx web-push generate-vapid-keys
```

### 2. Backend Entegrasyonu (NestJS)

NestJS tarafında push notification gönderme endpoint'i oluştur:

```typescript
// Örnek: NestJS Controller
@Post('/push/send')
async sendPushNotification(@Body() data: { userId: string, title: string, body: string }) {
  // Kullanıcının subscription'ını DB'den al
  // web-push ile bildirim gönder
}
```

## 📱 Kullanım

### Component'ten Kullanım

```tsx
"use client";

import { usePushNotification } from "@/app/hooks/usePushNotification";

export function MyComponent() {
  const { subscribe, isSubscribed, isSupported } = usePushNotification();

  return (
    <button onClick={subscribe} disabled={!isSupported || isSubscribed}>
      Bildirimleri Etkinleştir
    </button>
  );
}
```

### Hook API

```typescript
const {
  isSupported,        // Browser push notification destekliyor mu?
  isSubscribed,       // Kullanıcı abone mi?
  isPermissionGranted, // İzin verilmiş mi?
  isLoading,          // İşlem devam ediyor mu?
  subscribe,          // Abone ol
  unsubscribe,        // Aboneliği iptal et
  requestPermission,  // İzin iste
  subscription,       // Mevcut subscription objesi
} = usePushNotification();
```

## 🔔 Otomatik Prompt

`PushNotificationPrompt` component'i otomatik olarak:
- Sayfa yüklendikten 3 saniye sonra gösterilir
- Sadece desteklenen browser'larda gösterilir
- Kullanıcı "Daha Sonra" dediyse tekrar gösterilmez (localStorage)

## 🛠️ Backend'den Bildirim Gönderme

### NestJS Örneği

```typescript
import * as webpush from 'web-push';

// VAPID keys ayarla
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Bildirim gönder
async function sendNotification(subscription: any, payload: any) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        url: payload.url || '/',
      },
    })
  );
}
```

## 🔒 Güvenlik

- ✅ HTTPS gereklidir (production'da)
- ✅ VAPID keys ile authentication
- ✅ Service Worker scope kontrolü
- ✅ User permission kontrolü

## 📝 Notlar

- **Development**: `localhost` üzerinde çalışır (HTTPS gerekmez)
- **Production**: HTTPS zorunludur
- **Browser Support**: Chrome, Firefox, Edge, Safari (iOS 16.4+)

## 🐛 Troubleshooting

### Service Worker kaydedilmiyor

- Tarayıcı console'da hata kontrolü yap
- `next.config.ts` içinde headers kontrolü yap
- Service Worker dosyasının `/sw.js` path'inde olduğundan emin ol

### Bildirimler gelmiyor

- VAPID keys doğru mu kontrol et
- Backend'den gönderilen payload formatını kontrol et
- Browser console'da Service Worker loglarını kontrol et

### İzin istenmiyor

- Browser notification izinleri kontrol et
- `PushNotificationPrompt` component'inin render edildiğinden emin ol
- localStorage'da `push-notification-dismissed` kontrol et

## 🔗 Kaynaklar

- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push npm](https://www.npmjs.com/package/web-push)









