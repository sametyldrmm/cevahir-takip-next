"use client";

import { useState } from "react";

interface ProfileFieldsProps {
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  position?: string;
  biography?: string;
  onDisplayNameChange?: (name: string) => void;
  onEmailChange?: (email: string) => void;
  onPhoneChange?: (phone: string) => void;
  onPositionChange?: (position: string) => void;
  onBiographyChange?: (biography: string) => void;
}

export default function ProfileFields({
  username,
  displayName,
  email,
  phone,
  position,
  biography,
  onDisplayNameChange,
  onEmailChange,
  onPhoneChange,
  onPositionChange,
  onBiographyChange,
}: ProfileFieldsProps) {
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(displayName);

  const handleSaveDisplayName = () => {
    onDisplayNameChange?.(editDisplayName);
    setIsEditingDisplayName(false);
  };

  const handleCancelDisplayName = () => {
    setEditDisplayName(displayName);
    setIsEditingDisplayName(false);
  };

  return (
    <div className="space-y-4">
      {/* Username Field */}
      <div className="bg-surface-container p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">
              Kullanıcı Adı
            </label>
            <p className="text-xs text-on-surface-variant">
              Sistem kullanıcı adınız
            </p>
          </div>
          <input
            type="text"
            value={username}
            readOnly
            className="px-3 py-2 bg-surface-container-high text-on-surface-variant rounded-lg border border-outline-variant cursor-not-allowed"
          />
        </div>
      </div>

      {/* Display Name Field */}
      <div className="bg-surface-container p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">
              Ad Soyad
            </label>
            <p className="text-xs text-on-surface-variant">
              Dashboard ve menüde görünecek isim
            </p>
          </div>
          {isEditingDisplayName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="px-3 py-2 bg-surface border border-primary rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSaveDisplayName}
                className="p-2 text-primary hover:bg-primary-container rounded transition-colors"
              >
                ✓
              </button>
              <button
                onClick={handleCancelDisplayName}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface">{displayName}</span>
              <button
                onClick={() => setIsEditingDisplayName(true)}
                className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="bg-surface-container p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">
              E-posta
            </label>
            <p className="text-xs text-on-surface-variant">
              İletişim e-posta adresiniz
            </p>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange?.(e.target.value)}
            placeholder="email@example.com"
            className="px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Phone Field */}
      {phone !== undefined && (
        <div className="bg-surface-container p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">
                Telefon
              </label>
              <p className="text-xs text-on-surface-variant">
                İletişim telefon numaranız
              </p>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange?.(e.target.value)}
              placeholder="+90 555 123 45 67"
              className="px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Position Field */}
      {position !== undefined && (
        <div className="bg-surface-container p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">
                Pozisyon
              </label>
              <p className="text-xs text-on-surface-variant">
                İş pozisyonunuz
              </p>
            </div>
            <select
              value={position}
              onChange={(e) => onPositionChange?.(e.target.value)}
              className="px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seçiniz</option>
              <option value="BIM Mimarı">BIM Mimarı</option>
              <option value="BIM Uzmanı">BIM Uzmanı</option>
              <option value="BIM Koordinatörü">BIM Koordinatörü</option>
              <option value="BIM Yöneticisi">BIM Yöneticisi</option>
              <option value="Görselleştirme Uzmanı">Görselleştirme Uzmanı</option>
              <option value="Dizayn Ofis Mimarı">Dizayn Ofis Mimarı</option>
            </select>
          </div>
        </div>
      )}

      {/* Biography Field */}
      {biography !== undefined && (
        <div className="bg-surface-container p-4 rounded-lg">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-1">
              Biyografi
            </label>
            <p className="text-xs text-on-surface-variant mb-2">
              Hakkınızda kısa bilgi
            </p>
            <textarea
              value={biography}
              onChange={(e) => onBiographyChange?.(e.target.value)}
              placeholder="Hakkınızda..."
              rows={4}
              className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}









