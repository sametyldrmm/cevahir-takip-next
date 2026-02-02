"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi, User } from "@/lib/api/auth";
import { useNotification } from "../contexts/NotificationContext";

export default function SettingsView() {
  const { themeSetting, accentColor, setThemeSetting, setAccentColor } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            {[
              { name: "Mavi", value: "blue" },
              { name: "Yeşil", value: "green" },
              { name: "Mor", value: "purple" },
              { name: "Turuncu", value: "orange" },
            ].map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  accentColor === color.value
                    ? "border-primary bg-primary-container"
                    : "border-outline bg-surface hover:border-primary"
                }`}
              >
                <span className="text-sm font-medium text-on-surface">{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
