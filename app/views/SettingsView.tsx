"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi, User } from "@/lib/api/auth";
import { useNotification } from "../contexts/NotificationContext";
import { usePushNotification } from "../hooks/usePushNotification";
import { apiClient } from "@/lib/api-client";

export default function SettingsView() {
  const { themeSetting, accentColor, setThemeSetting, setAccentColor } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isPermissionGranted: isPushPermissionGranted,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotification();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToggleLoading, setPushToggleLoading] = useState(false);
  const accentOptions = [
    { name: "Mavi", value: "blue" },
    { name: "Yeşil", value: "green" },
    { name: "Turuncu", value: "orange" },
  ] as const;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.getProfile();
        setProfile(userData);
      } catch (error) {
        console.error("Profile load error:", error);
        showError("Profil bilgileri yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece component mount olduğunda çalış
    void loadProfile();
  }, [user, showError]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-on-surface mb-6">Ayarlar</h2>
      <div className="space-y-6 max-w-2xl">
        {/* Profil Bilgileri */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Profil Bilgileri</h3>
          {isLoading ? (
            <p className="text-on-surface-variant">Yükleniyor...</p>
          ) : profile ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Kullanıcı Adı
                </label>
                <div className="px-4 py-2 bg-surface rounded-lg border border-outline text-on-surface">
                  {profile.username || "Belirtilmemiş"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  E-posta
                </label>
                <div className="px-4 py-2 bg-surface rounded-lg border border-outline text-on-surface">
                  {profile.email || "Belirtilmemiş"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Görünen Ad
                </label>
                <div className="px-4 py-2 bg-surface rounded-lg border border-outline text-on-surface">
                  {profile.displayName || "Belirtilmemiş"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">
                  Rol
                </label>
                <div className="px-4 py-2 bg-surface rounded-lg border border-outline">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                      profile.role === "ADMIN"
                        ? "bg-primary-container text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {profile.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant">Profil bilgileri yüklenemedi.</p>
          )}
        </div>

        {/* Tema Ayarları */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Tema</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={themeSetting === "auto"}
                onChange={(e) => setThemeSetting(e.target.value as "auto")}
                className="w-4 h-4"
              />
              <span className="text-on-surface">Otomatik (Sistem Teması)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={themeSetting === "light"}
                onChange={(e) => setThemeSetting(e.target.value as "light")}
                className="w-4 h-4"
              />
              <span className="text-on-surface">Açık Tema</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={themeSetting === "dark"}
                onChange={(e) => setThemeSetting(e.target.value as "dark")}
                className="w-4 h-4"
              />
              <span className="text-on-surface">Koyu Tema</span>
            </label>
          </div>
        </div>

        {/* Vurgu Rengi */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Vurgu Rengi</h3>
          <div className="grid grid-cols-4 gap-3">
            {accentOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  accentColor === color.value
                    ? "border-primary bg-primary-container"
                    : "border-outline bg-surface hover:border-(--primary)"
                }`}
              >
                <span className="text-sm font-medium text-on-surface">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bildirim Ayarları */}
        <div className="bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Bildirimler</h3>
          <div className="space-y-4">
            {/* WebSocket Bildirimleri (Her zaman açık) */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-on-surface mb-1">
                  Anlık Bildirimler (WebSocket)
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Site açıkken anlık bildirimler alırsınız
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-success font-medium">Aktif</span>
                <div className="w-12 h-6 bg-success rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Push Notification (OS Bildirimleri) */}
            <div className="flex items-center justify-between border-t border-outline-variant pt-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-on-surface mb-1">
                  OS Bildirimleri (Push)
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Site kapalıyken bile bildirim alırsınız (WhatsApp tarzı)
                </p>
                {!isPushSupported && (
                  <p className="text-xs text-error mt-1">
                    ⚠️ Tarayıcınız push notification desteklemiyor
                  </p>
                )}
                {isPushSupported && !isPushPermissionGranted && (
                  <p className="text-xs text-warning mt-1">
                    ⚠️ Bildirim izni verilmedi
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pushToggleLoading ? (
                  <div className="w-12 h-6 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setPushToggleLoading(true);
                      try {
                        if (isPushSubscribed) {
                          const success = await unsubscribePush();
                          if (success) {
                            showSuccess("OS bildirimleri kapatıldı");
                            // Dismissed flag'i temizle ki tekrar açabilsin
                            localStorage.removeItem("push-notification-dismissed");
                          } else {
                            showError("OS bildirimleri kapatılamadı");
                          }
                        } else {
                          const success = await subscribePush();
                          if (success) {
                            showSuccess("OS bildirimleri etkinleştirildi!");
                            localStorage.removeItem("push-notification-dismissed");
                          } else {
                            showError("OS bildirimleri etkinleştirilemedi");
                          }
                        }
                      } catch (error) {
                        showError("Bir hata oluştu");
                      } finally {
                        setPushToggleLoading(false);
                      }
                    }}
                    disabled={!isPushSupported || pushToggleLoading}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${isPushSubscribed && isPushPermissionGranted
                        ? "bg-success"
                        : "bg-gray-300 dark:bg-gray-600"
                      }
                      ${!isPushSupported ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${isPushSubscribed && isPushPermissionGranted
                          ? "translate-x-6"
                          : "translate-x-1"
                        }
                      `}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Test Butonu */}
            {isPushSubscribed && (
              <div className="border-t border-outline-variant pt-4">
                <button
                  onClick={async () => {
                    try {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription = await registration.pushManager.getSubscription();
                      
                      if (!subscription) {
                        showError("Push subscription bulunamadı");
                        return;
                      }
                      
                      const subscriptionData = {
                        endpoint: subscription.endpoint,
                        keys: {
                          p256dh: btoa(
                            String.fromCharCode(
                              ...new Uint8Array(subscription.getKey("p256dh")!)
                            )
                          ),
                          auth: btoa(
                            String.fromCharCode(
                              ...new Uint8Array(subscription.getKey("auth")!)
                            )
                          ),
                        },
                      };

                      const response = await apiClient.getClient().post("/push/test", subscriptionData);
                      
                      if (response.data.success) {
                        showSuccess("Test bildirimi gönderildi! Bildirimi kontrol edin.");
                      } else {
                        showError("Test bildirimi gönderilemedi");
                      }
                    } catch (error: any) {
                      console.error("Test push error:", error);
                      showError(error.response?.data?.message || "Test bildirimi gönderilemedi");
                    }
                  }}
                  className="w-full px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  🧪 Test Bildirimi Gönder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
