"use client";

import { useState, useEffect } from "react";

interface EditUserRoleDialogProps {
  isOpen: boolean;
  userId: string;
  username: string;
  currentRole: "admin" | "user";
  onClose: () => void;
  onRoleUpdated: (user: { userId: string; isAdmin: boolean }) => void;
}

export default function EditUserRoleDialog({
  isOpen,
  userId,
  username,
  currentRole,
  onClose,
  onRoleUpdated,
}: EditUserRoleDialogProps) {
  const [isAdmin, setIsAdmin] = useState(currentRole === "admin");

  useEffect(() => {
    setIsAdmin(currentRole === "admin");
  }, [currentRole]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onRoleUpdated({ userId, isAdmin });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            Yetki Düzenle: {username}
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Kullanıcı yetkisini düzenleyin:
          </p>

          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
            <input
              type="checkbox"
              id="admin-checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-5 h-5 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="admin-checkbox"
              className="text-sm font-medium text-on-surface cursor-pointer"
            >
              Admin Yetkisi Ver
            </label>
          </div>

          <p className="text-xs text-on-surface-variant italic">
            Not: Admin yetkisi olan kullanıcılar tüm projelere ve yönetim
            araçlarına erişebilir.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

