"use client";

import { useState } from "react";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    isAdmin: boolean;
  }) => void;
}

export default function CreateUserDialog({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: {
      username?: string;
      email?: string;
      password?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = "Kullanıcı adı gerekli";
    }

    if (!email.trim()) {
      newErrors.email = "E-posta gerekli";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!password.trim()) {
      newErrors.password = "Şifre gerekli";
    } else if (password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalı";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUserCreated({
      username: username.trim(),
      email: email.trim(),
      password: password,
      displayName: displayName.trim() || undefined,
      isAdmin,
    });
    handleClose();
  };

  const handleClose = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setDisplayName("");
    setIsAdmin(false);
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 flex-none">
          <h3 className="text-xl font-bold text-on-surface">Yeni Kullanıcı Ekle</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 flex-1 min-h-0 overflow-y-auto pr-1">
          <p className="text-sm text-on-surface-variant">Kullanıcı bilgilerini giriniz:</p>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Kullanıcı Adı <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              placeholder="kullanici.adi"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.username ? "border-error" : "border-outline"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-error">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              E-posta <span className="text-error">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="kullanici@example.com"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.email ? "border-error" : "border-outline"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Şifre <span className="text-error">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="En az 6 karakter"
              className={`w-full px-4 py-3 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.password ? "border-error" : "border-outline"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Görünen Ad
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe (opsiyonel)"
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface-container-high rounded-lg border border-outline-variant">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-5 h-5 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="isAdmin" className="flex-1 text-sm font-medium text-on-surface cursor-pointer">
              Admin yetkisi ver
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-6 mt-6 border-t border-outline-variant flex-none">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest) transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
