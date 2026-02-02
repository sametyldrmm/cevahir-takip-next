"use client";

import { useState } from "react";

interface MissingTargetsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCompleted: (filePath: string) => void;
}

export default function MissingTargetsExportDialog({
  isOpen,
  onClose,
  onExportCompleted,
}: MissingTargetsExportDialogProps) {
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
    setIsExporting(true);
    
    // Mock: Gerçek implementasyonda API çağrısı yapılacak
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    const dateStr = periodType === "daily" ? selectedDate : `${startDate}_${endDate}`;
    const mockFilePath = `exports/missing_targets_${periodType}_${dateStr}_${Date.now()}.xlsx`;
    
    setIsExporting(false);
    onExportCompleted(mockFilePath);
    onClose();
  };

  const handleClose = () => {
    setPeriodType("daily");
    setSelectedDate(new Date().toISOString().split("T")[0]);
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
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Eksik Hedefler Export</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-3">
              Dönem Tipi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPeriodType("daily")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  periodType === "daily"
                    ? "bg-warning/20 border-warning text-warning"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Günlük
              </button>
              <button
                onClick={() => setPeriodType("weekly")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  periodType === "weekly"
                    ? "bg-warning/20 border-warning text-warning"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setPeriodType("monthly")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  periodType === "monthly"
                    ? "bg-warning/20 border-warning text-warning"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setPeriodType("yearly")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  periodType === "yearly"
                    ? "bg-warning/20 border-warning text-warning"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Yıllık
              </button>
            </div>
          </div>

          {periodType === "daily" ? (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Tarih
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Başlangıç
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
                  Bitiş
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3 text-sm text-warning">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="font-medium mb-1">Eksik Hedef Raporu</p>
                <p>
                  Seçilen dönem için hedef girişi yapılmamış kullanıcıları ve tarihleri listeler
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-5 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all font-medium disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 bg-warning text-on-warning rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-warning border-t-transparent rounded-full animate-spin"></div>
                <span>Rapor Oluşturuluyor...</span>
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
