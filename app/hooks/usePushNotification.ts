"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getVapidPublicKey,
  isPushNotificationSupported,
} from "@/lib/push-notification";

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

// VAPID key backend'den alınacak

export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Browser desteğini kontrol et
  useEffect(() => {
    const checkSupport = () => {
      const supported = isPushNotificationSupported();
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
        // VAPID public key'i backend'den al
        const vapidPublicKey = await getVapidPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }

      setSubscription(sub);
      setIsSubscribed(true);

      // Subscription'ı backend'e kaydet
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
          auth: arrayBufferToBase64(sub.getKey("auth")!),
        },
      };

      // Backend API'ye subscription gönder
      try {
        const success = await subscribeToPushNotifications();
        
        if (success) {
          console.log("[Push] Subscription successful:", subscriptionData);
          return true;
        } else {
          console.error("[Push] Backend subscription failed");
          // Local subscription'ı iptal et
          await sub.unsubscribe();
          setSubscription(null);
          setIsSubscribed(false);
          return false;
        }
      } catch (error: any) {
        console.error("[Push] Backend subscription error:", error);
        console.error("[Push] Error details:", error.response?.data);
        
        // Local subscription'ı iptal et
        try {
          await sub.unsubscribe();
        } catch (unsubError) {
          console.error("[Push] Unsubscribe error:", unsubError);
        }
        setSubscription(null);
        setIsSubscribed(false);
        return false;
      }
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
        // Backend'e unsubscribe bildir
        await unsubscribeFromPushNotifications(sub.endpoint);
        
        // Local subscription'ı iptal et
        await sub.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);

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

