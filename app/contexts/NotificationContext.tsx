"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from "react";
import toast, {
  ToastOptions,
  Toaster,
} from "react-hot-toast";
import { getNotificationClient, NotificationPayload } from "@/lib/websocket/notification-client";
import { NotificationContainer } from "@/app/components/NotificationToast";
import Cookies from "js-cookie";

type NotificationContextType = {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
  realTimeNotifications: NotificationPayload[];
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [realTimeNotifications, setRealTimeNotifications] = useState<NotificationPayload[]>([]);

  // Token kontrolü (circular dependency'yi önlemek için)
  const isAuthenticated = typeof window !== "undefined" && !!Cookies.get("accessToken");

  const showSuccess = (message: string, options?: ToastOptions) =>
    toast.success(message, options);

  const showError = (message: string, options?: ToastOptions) =>
    toast.error(message, options);

  const showWarning = (message: string, options?: ToastOptions) =>
    toast(message, {
      ...options,
      icon: "⚠️",
    });

  // WebSocket bildirimlerini yönet
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const client = getNotificationClient();
    
    // Bağlantıyı başlat
    client.connect();

    // Bildirim listener'ı
    const handleNotification = (notification: NotificationPayload) => {
      console.log("[Notification] Yeni bildirim:", notification);
      
      // Real-time bildirim listesine ekle
      setRealTimeNotifications((prev) => {
        // Aynı bildirimi tekrar ekleme (timestamp kontrolü)
        const exists = prev.some(
          (n) => n.timestamp === notification.timestamp && n.type === notification.type
        );
        if (exists) return prev;
        return [...prev, notification];
      });

      // Toast bildirimi de göster
      toast(notification.message, {
        icon: notification.type === "morning-reminder" ? "🌅" : "🌆",
        duration: 6000,
      });
    };

    // Connected listener
    const handleConnected = (data: any) => {
      console.log("[Notification] WebSocket bağlandı:", data);
    };

    // Error listener
    const handleError = (error: any) => {
      console.error("[Notification] WebSocket hatası:", error);
    };

    // Event listener'ları ekle
    client.on("notification", handleNotification);
    client.on("connected", handleConnected);
    client.on("error", handleError);

    // Cleanup
    return () => {
      client.off("notification", handleNotification);
      client.off("connected", handleConnected);
      client.off("error", handleError);
      client.disconnect();
    };
  }, [isAuthenticated]);

  // Bildirim kaldırma
  const removeNotification = useCallback((timestamp: string) => {
    setRealTimeNotifications((prev) =>
      prev.filter((n) => n.timestamp !== timestamp)
    );
  }, []);

  // Eski bildirimleri temizle (5 dakikadan eski)
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      setRealTimeNotifications((prev) =>
        prev.filter(
          (n) => new Date(n.timestamp) > fiveMinutesAgo
        )
      );
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        realTimeNotifications,
      }}
    >
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
      {/* Real-time bildirimler (WhatsApp tarzı) */}
      {realTimeNotifications.length > 0 && (
        <NotificationContainer
          notifications={realTimeNotifications}
          onRemove={removeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification NotificationProvider içinde kullanılmalı");
  }
  return ctx;
}









