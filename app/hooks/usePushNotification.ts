"use client";

import { useState, useEffect, useCallback } from "react";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UsePushNotificationReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscription: PushSubscription | null;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Browser desteğini kontrol et
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (supported) {
        checkPermission();
        checkSubscription();
      } else {
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  // Notification iznini kontrol et
  const checkPermission = useCallback(() => {
    if ("Notification" in window) {
      const permission = Notification.permission;
      setIsPermissionGranted(permission === "granted");
    }
  }, []);

  // Mevcut subscription'ı kontrol et
  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error("[Push] Subscription check error:", error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Notification izni iste
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      return "denied";
    }

    if (Notification.permission === "granted") {
      setIsPermissionGranted(true);
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      setIsPermissionGranted(permission === "granted");
      return permission;
    } catch (error) {
      console.error("[Push] Permission request error:", error);
      return "denied";
    }
  }, []);

  // Push notification'a abone ol
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("[Push] Push notifications not supported");
      return false;
    }

    // Önce izin kontrolü
    if (Notification.permission !== "granted") {
      const permission = await requestPermission();
      if (permission !== "granted") {
        console.warn("[Push] Notification permission denied");
        return false;
      }
    }

    try {
      setIsLoading(true);

      // Service Worker'ı kaydet/yükle
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      await registration.update(); // Güncellemeleri kontrol et

      // Mevcut subscription var mı kontrol et
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        // Yeni subscription oluştur
        if (!VAPID_PUBLIC_KEY) {
          console.error("[Push] VAPID public key not configured");
          return false;
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }

      setSubscription(sub);
      setIsSubscribed(true);

      // Subscription'ı backend'e gönder
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      // TODO: Backend API'ye subscription gönder
      // await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscriptionData),
      // });

      console.log("[Push] Subscription successful:", subscriptionData);
      return true;
    } catch (error) {
      console.error("[Push] Subscription error:", error);
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission]);

  // Push notification aboneliğini iptal et
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);

        // TODO: Backend API'ye unsubscribe bildir
        // await fetch('/api/push/unsubscribe', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ endpoint: sub.endpoint }),
        // });

        console.log("[Push] Unsubscribed successfully");
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Push] Unsubscribe error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    subscription,
  };
}

// Helper: VAPID key'i Uint8Array'e çevir
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper: ArrayBuffer'ı base64'e çevir
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

