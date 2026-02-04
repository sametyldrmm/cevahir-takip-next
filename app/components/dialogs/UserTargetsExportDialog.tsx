"use client";

import { useState } from "react";

interface UserTargetsExportDialogProps {
  isOpen: boolean;
  selectedUsers?: string[];
  onClose: () => void;
  onExportCompleted: (filePath: string) => void;
}

export default function UserTargetsExportDialog({
  isOpen,
  selectedUsers = [],
  onClose,
  onExportCompleted,
}: UserTargetsExportDialogProps) {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (selectedUsers.length === 0) {
      return;
    }

    setIsExporting(true);
    
    // Mock: Gerçek implementasyonda API çağrısı yapılacak
    await new Promise((resolve) => setTimeout(resolve, 1300));
    
    const usersStr = selectedUsers.slice(0, 3).join("_");
    const mockFilePath = `exports/user_targets_${usersStr}_${startDate}_${endDate}_${Date.now()}.xlsx`;
    
    setIsExporting(false);
    onExportCompleted(mockFilePath);
    onClose();
  };

  const handleClose = () => {
    const today = new Date();
    setStartDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0]
    );
    setEndDate(today.toISOString().split("T")[0]);
    setIsExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-lg w-full border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Kullanıcı Hedefleri Export</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {selectedUsers.length > 0 ? (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Seçili Kullanıcılar ({selectedUsers.length})
              </label>
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span
                      key={user}
                      className="px-3 py-1.5 bg-primary-container text-primary rounded-lg text-sm font-medium"
                    >
                      {user}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-error-container border border-error/30 rounded-lg">
              <p className="text-sm text-error font-medium">
                ⚠️ Lütfen önce kullanıcıları seçin
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="flex items-start gap-3 text-sm text-on-surface-variant">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="font-medium mb-1">Kullanıcı Bazlı Hedef Export</p>
                <p>
                  Seçili kullanıcıların belirtilen tarih aralığındaki tüm hedef verilerini içerir
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedUsers.length === 0}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Export Ediliyor...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Export Et</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
