"use client";

import { useState } from "react";

interface LoginBackgroundsProps {
  images: string[];
  currentFixedBg?: string;
  isAdmin: boolean;
  onImageSelect?: (imageName: string) => void;
  onImageDelete?: (imageName: string) => void;
  onImageUpload?: (file: File) => void;
}

export default function LoginBackgrounds({
  images,
  currentFixedBg,
  isAdmin,
  onImageSelect,
  onImageDelete,
  onImageUpload,
}: LoginBackgroundsProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-surface p-5 rounded-xl border border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-1">
            Giriş Ekranı Arka Planları
          </h3>
          <p className="text-sm text-on-surface-variant">
            Login ekranı arka plan görsellerini yönetin (Admin Only)
          </p>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-2 border border-outline rounded-lg text-on-surface hover:bg-(--surface-container-high) transition-colors"
        >
          {isEditMode ? "İptal" : "Düzenle"}
        </button>
      </div>

      {images.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant">
          <span className="text-4xl block mb-2">🖼️</span>
          <p>Henüz arka plan görseli eklenmemiş</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image}
              className="relative aspect-video bg-surface-container-low rounded-lg border border-outline-variant overflow-hidden group"
            >
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              {currentFixedBg === image && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-on-primary rounded text-xs">
                  Aktif
                </div>
              )}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onImageSelect?.(image)}
                    className="px-3 py-1 bg-primary text-on-primary rounded text-xs hover:opacity-90"
                  >
                    Seç
                  </button>
                  <button
                    onClick={() => onImageDelete?.(image)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditMode && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-on-surface mb-2">
            Yeni Görsel Yükle
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageUpload?.(file);
              }
            }}
            className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}









