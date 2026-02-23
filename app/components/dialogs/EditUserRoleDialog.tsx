"use client";

import { useState, useEffect } from "react";

interface EditUserRoleDialogProps {
  isOpen: boolean;
  userId: string;
  username: string;
  currentRole: "admin" | "user";
  currentUserTitle?: string;
  mode?: "role" | "title" | "both";
  onClose: () => void;
  onSubmit: (user: { userId: string; isAdmin?: boolean; userTitle?: string }) => void;
}

export default function EditUserRoleDialog({
  isOpen,
  userId,
  username,
  currentRole,
  currentUserTitle,
  mode = "both",
  onClose,
  onSubmit,
}: EditUserRoleDialogProps) {
  const [isAdmin, setIsAdmin] = useState(currentRole === "admin");
  const [userTitle, setUserTitle] = useState(currentUserTitle ?? "");

  useEffect(() => {
    setIsAdmin(currentRole === "admin");
  }, [currentRole]);

  useEffect(() => {
    setUserTitle(currentUserTitle ?? "");
  }, [currentUserTitle]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const payload: { userId: string; isAdmin?: boolean; userTitle?: string } = {
      userId,
    };

    if (mode === "role" || mode === "both") {
      payload.isAdmin = isAdmin;
    }
    if (mode === "title" || mode === "both") {
      payload.userTitle = userTitle.trim();
    }

    onSubmit(payload);
    onClose();
  };

  const dialogTitle =
    mode === "role"
      ? `Rol Değiştir: ${username}`
      : mode === "title"
        ? `Pozisyon Değiştir: ${username}`
        : `Kullanıcı Düzenle: ${username}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6 flex-none">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface">
            {dialogTitle}
          </h3>
        </div>

        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
          <p className="text-sm text-on-surface-variant">
            Kullanıcı bilgilerini düzenleyin:
          </p>

          {(mode === "title" || mode === "both") && (
            <div>
              <label
                htmlFor="user-title"
                className="block text-xs font-semibold text-on-surface-variant mb-2"
              >
                Pozisyon
              </label>
              <input
                id="user-title"
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Örn: İnşaat Mühendisi"
              />
            </div>
          )}

          {(mode === "role" || mode === "both") && (
            <>
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
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant flex-none">
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

