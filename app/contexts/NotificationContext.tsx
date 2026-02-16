"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
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

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return Cookies.get("accessToken") ?? null;
  });

  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => toast.success(message, options),
    [],
  );

  const showError = useCallback(
    (message: string, options?: ToastOptions) => toast.error(message, options),
    [],
  );

  const showWarning = useCallback(
    (message: string, options?: ToastOptions) =>
      toast(message, {
        ...options,
        icon: "⚠️",
      }),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncToken = () => {
      setAccessToken(Cookies.get("accessToken") ?? null);
    };

    syncToken();
    window.addEventListener("focus", syncToken);
    document.addEventListener("visibilitychange", syncToken);

    const intervalId = window.setInterval(syncToken, 1500);

    return () => {
      window.removeEventListener("focus", syncToken);
      document.removeEventListener("visibilitychange", syncToken);
      window.clearInterval(intervalId);
    };
  }, []);

  const showBrowserNotification = useCallback((notification: NotificationPayload) => {
    void (async () => {
      try {
        if (
          typeof window === "undefined" ||
          !("Notification" in window) ||
          Notification.permission !== "granted"
        ) {
          return;
        }

        const url =
          typeof notification.data === "object" && notification.data !== null
            ? String((notification.data as any).url ?? "")
            : "";

        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(notification.title, {
            body: notification.message,
            tag: `${notification.type}-${notification.timestamp}`,
            icon: "/favicon.png",
            badge: "/favicon.png",
            data: { url: url || "/" },
            requireInteraction: false,
            silent: false,
          });
          return;
        }

        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.png",
        });

        if (url) {
          browserNotification.onclick = () => {
            window.open(url, "_blank", "noopener,noreferrer");
          };
        }
      } catch {
        return;
      }
    })();
  }, []);

  // WebSocket bildirimlerini yönet
  useEffect(() => {
    if (!accessToken) {
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
      const iconByType: Record<string, string> = {
        "morning-reminder": "🌅",
        "evening-reminder": "🌆",
        "meeting-reminder": "⏰",
        test: "🧪",
      };

      toast(notification.message, {
        icon: iconByType[notification.type] ?? "🔔",
        duration: 6000,
      });

      if (notification.type === "meeting-reminder") {
        showBrowserNotification(notification);
      }
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
  }, [accessToken, showBrowserNotification]);

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
      setRealTimeNotifications((prev) => {
        const next = prev.filter((n) => new Date(n.timestamp) > fiveMinutesAgo);
        return next.length === prev.length ? prev : next;
      });
    }, 60000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, []);

  const contextValue = useMemo(
    () => ({
      showSuccess,
      showError,
      showWarning,
      realTimeNotifications,
    }),
    [showSuccess, showError, showWarning, realTimeNotifications],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
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









