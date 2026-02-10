"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { usersApi } from "@/lib/api/users";

interface PasswordChangeDialogProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  onPasswordChanged: () => void;
}

export default function PasswordChangeDialog({
  isOpen,
  userId,
  onClose,
  onPasswordChanged,
}: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});

  if (!isOpen) return null;

  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: unknown }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) return message;
      if (Array.isArray(message)) {
        const first = message.find(
          (item) => typeof item === "string" && item.trim(),
        );
        if (typeof first === "string") return first;
      }
    }
    return undefined;
  };

  const handleSubmit = async () => {
    const newErrors: {
      current?: string;
      new?: string;
      confirm?: string;
    } = {};

    if (!currentPassword.trim()) {
      newErrors.current = "Mevcut şifre gerekli";
    }

    if (!newPassword.trim()) {
      newErrors.new = "Yeni şifre gerekli";
    } else if (newPassword.length < 6) {
      newErrors.new = "Şifre en az 6 karakter olmalı";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirm = "Şifre onayı gerekli";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = "Şifreler eşleşmiyor";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await usersApi.updateUser(userId, { password: newPassword });
      onPasswordChanged();
      handleClose();
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error) ?? "Şifre değiştirilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">
            Şifre Değiştir
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {submitError && (
            <div className="px-4 py-3 rounded-lg border border-error bg-error/10 text-error text-sm">
              {submitError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Mevcut Şifre
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, current: undefined }));
                  setSubmitError(null);
                }}
              placeholder="Mevcut şifrenizi girin"
              className={`w-full px-4 py-3 pl-10 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                errors.current ? "border-error" : "border-outline"
              }`}
              disabled={isSubmitting}
              />
              <span className="absolute left-3 top-2.5 text-on-surface-variant">
                🔒
              </span>
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-on-surface-variant hover:text-(--on-surface)"
                disabled={isSubmitting}
              >
                {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.current && (
              <p className="mt-1 text-sm text-red-500">{errors.current}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, new: undefined }));
                  setSubmitError(null);
                }}
              placeholder="Yeni şifrenizi girin"
              className={`w-full px-4 py-3 pl-10 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                errors.new ? "border-error" : "border-outline"
              }`}
              disabled={isSubmitting}
              />
              <span className="absolute left-3 top-2.5 text-on-surface-variant">
                🔐
              </span>
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-on-surface-variant hover:text-(--on-surface)"
                disabled={isSubmitting}
              >
                {showNewPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.new && (
              <p className="mt-1 text-sm text-red-500">{errors.new}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirm: undefined }));
                  setSubmitError(null);
                }}
              placeholder="Yeni şifrenizi tekrar girin"
              className={`w-full px-4 py-3 pl-10 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                errors.confirm ? "border-error" : "border-outline"
              }`}
              disabled={isSubmitting}
              />
              <span className="absolute left-3 top-2.5 text-on-surface-variant">
                🔒
              </span>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-on-surface-variant hover:text-(--on-surface)"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirm && (
              <p className="mt-1 text-sm text-red-500">{errors.confirm}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </div>
      </div>
    </div>
  );
}

