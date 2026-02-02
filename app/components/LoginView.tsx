"use client";

import { useState } from "react";
import Image from "next/image";

interface LoginViewProps {
  onLogin: (username: string, password: string) => void;
  onGuest: () => void;
  onPasswordChange: () => void;
}

export default function LoginView({
  onLogin,
  onGuest,
  onPasswordChange,
}: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz!");
      return;
    }
    if (!password.trim()) {
      setError("Şifre boş olamaz!");
      return;
    }
    onLogin(username, password);
  };

  const getTurkishDate = () => {
    const now = new Date();
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    const days = [
      "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
    ];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const dayStr = days[now.getDay()];
    return { dateStr, dayStr };
  };

  const { dateStr, dayStr } = getTurkishDate();

  return (
    <div className="flex h-screen">
      {/* Sol: Arka plan görseli */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600">
          {/* Buraya dinamik görsel gelecek */}
        </div>
        <div className="absolute top-10 left-10 text-white">
          <div className="text-sm bg-black/30 px-3 py-1 rounded">{dateStr}</div>
          <div className="text-5xl font-bold mt-2">{dayStr}</div>
        </div>
      </div>

      {/* Sağ: Login formu */}
      <div className="flex-1 flex items-center justify-center bg-background p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-36 h-36 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-6xl">🏢</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-2">Hoş Geldiniz</h1>
            <p className="text-on-surface-variant">CPM Günlük Hedefler</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-on-surface-variant mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-outline rounded-lg bg-transparent text-on-surface focus:outline-none focus:border-primary"
                placeholder="Kullanıcı adınızı girin"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-outline rounded-lg bg-transparent text-on-surface focus:outline-none focus:border-primary"
                placeholder="Şifrenizi girin"
              />
            </div>

            {error && (
              <div className="text-error text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Giriş Yap
            </button>

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-sm text-on-surface-variant">veya</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <button
              type="button"
              onClick={onGuest}
              className="w-full border border-outline text-on-surface py-3 rounded-lg hover:bg-hover-bg transition-colors"
            >
              Misafir Olarak Devam Et
            </button>

            <button
              type="button"
              onClick={onPasswordChange}
              className="w-full text-primary text-sm py-2 hover:underline"
            >
              Şifrenizi mi unuttunuz?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}







