import { apiClient } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * VAPID public key'i backend'den al
 */
export async function getVapidPublicKey(): Promise<string> {
  try {
    const response = await apiClient.getClient().get<{ publicKey: string }>(
      '/push/vapid-key',
    );
    return response.data.publicKey;
  } catch (error) {
    console.error('[Push] VAPID key alınamadı:', error);
    throw error;
  }
}

/**
 * Push notification izni iste ve subscription kaydet
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    // 1. Tarayıcı desteği kontrol et
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Tarayıcı push notification desteklemiyor');
      return false;
    }

    // 2. Notification izni iste
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification izni verilmedi:', permission);
      return false;
    }

    // 3. Service Worker'ı kaydet
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // 4. VAPID public key'i al
    const vapidPublicKey = await getVapidPublicKey();

    // 5. Push subscription oluştur
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // 6. Subscription'ı backend'e kaydet
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    if (!p256dhKey || !authKey) {
      throw new Error('Push subscription keys bulunamadı');
    }

    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dhKey as ArrayBuffer),
        auth: arrayBufferToBase64(authKey as ArrayBuffer),
      },
    };

    console.log('[Push] Subscription data:', {
      endpoint: pushSubscription.endpoint,
      hasKeys: !!pushSubscription.keys,
      p256dhLength: pushSubscription.keys.p256dh.length,
      authLength: pushSubscription.keys.auth.length,
    });

    const response = await apiClient.getClient().post('/push/subscribe', pushSubscription);
    
    console.log('[Push] Push subscription başarıyla kaydedildi', response.data);
    return true;
  } catch (error: any) {
    console.error('[Push] Subscription hatası:', error);
    console.error('[Push] Error response:', error.response?.data);
    console.error('[Push] Subscription data:', pushSubscription);
    throw error; // Hatayı yukarı fırlat ki hook'ta gösterilebilsin
  }
}

/**
 * Push subscription'ı iptal et
 */
export async function unsubscribeFromPushNotifications(
  endpoint: string,
): Promise<boolean> {
  try {
    await apiClient.getClient().post('/push/unsubscribe', { endpoint });
    console.log('[Push] Push subscription iptal edildi');
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının push subscription'larını listele
 */
export async function getPushSubscriptions() {
  try {
    const response = await apiClient
      .getClient()
      .get<{ subscriptions: any[] }>('/push/subscriptions');
    return response.data.subscriptions;
  } catch (error) {
    console.error('[Push] Subscriptions alınamadı:', error);
    return [];
  }
}

/**
 * VAPID public key'i Uint8Array'e çevir (Web Push API için)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * ArrayBuffer'ı base64 string'e çevir
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Push notification izin durumunu kontrol et
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Push notification desteği var mı kontrol et
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}
