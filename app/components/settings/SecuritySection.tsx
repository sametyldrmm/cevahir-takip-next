"use client";

import { useState } from "react";

interface SecuritySectionProps {
  onPasswordChange: () => void;
}

export default function SecuritySection({
  onPasswordChange,
}: SecuritySectionProps) {
  return (
    <div className="bg-surface p-5 rounded-xl border border-outline-variant space-y-6">
      <div>
        <h3 className="text-xl font-bold text-on-surface mb-1">
          Güvenlik Ayarları
        </h3>
        <p className="text-sm text-on-surface-variant">
          Hesap güvenliğinizi yönetin
        </p>
      </div>

      <div className="bg-surface-container p-4 rounded-lg">
        <h4 className="text-base font-bold text-on-surface mb-1">
          Şifre Değiştir
        </h4>
        <p className="text-xs text-on-surface-variant mb-4">
          Hesap güvenliğiniz için düzenli olarak şifrenizi güncelleyin
        </p>
        <button
          onClick={onPasswordChange}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span>🔒</span>
          <span>Şifreyi Değiştir</span>
        </button>
      </div>
    </div>
  );
}









