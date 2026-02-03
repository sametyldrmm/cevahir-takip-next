"use client";

import { useState } from "react";
import { reportsApi } from "@/lib/api/reports";
import { useNotification } from "@/app/contexts/NotificationContext";

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
  const { showError } = useNotification();
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [dateRange, setDateRange] = useState<"single" | "range">("single");
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
    
    try {
      let exportStartDate = startDate;
      let exportEndDate = endDate;

      if (periodType === "daily" && dateRange === "single") {
        exportStartDate = selectedDate;
        exportEndDate = selectedDate;
      }

      const result = await reportsApi.createMissingTargetsExport({
        startDate: exportStartDate,
        endDate: exportEndDate,
        periodType,
      });

      if (result.success && result.downloadUrl) {
        // Dosyayı indir (CSV raporlardaki gibi)
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = result.downloadUrl.split('/').pop() || 'missing_targets.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        onExportCompleted(result.downloadUrl);
        onClose();
      } else {
        showError(result.message || "Export başarısız");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Export sırasında bir hata oluştu";
      showError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setPeriodType("daily");
    setDateRange("single");
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
            <h3 className="text-xl font-bold text-on-surface">Hedef Giriş Eksikleri Export</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-3">
              Rapor Tipi
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="daily"
                  checked={periodType === "daily"}
                  onChange={() => setPeriodType("daily")}
                  className="w-4 h-4 text-warning focus:ring-warning"
                />
                <span className="text-on-surface">Günlük</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="weekly"
                  checked={periodType === "weekly"}
                  onChange={() => setPeriodType("weekly")}
                  className="w-4 h-4 text-warning focus:ring-warning"
                />
                <span className="text-on-surface">Haftalık</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="monthly"
                  checked={periodType === "monthly"}
                  onChange={() => setPeriodType("monthly")}
                  className="w-4 h-4 text-warning focus:ring-warning"
                />
                <span className="text-on-surface">Aylık</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="periodType"
                  value="yearly"
                  checked={periodType === "yearly"}
                  onChange={() => setPeriodType("yearly")}
                  className="w-4 h-4 text-warning focus:ring-warning"
                />
                <span className="text-on-surface">Yıllık</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="text-xl">📥</span>
              <span>Excel dosyası S3&apos;e yüklenecek ve indirilecek</span>
            </div>
          </div>

          {periodType === "daily" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-3">
                  Günlük Seçimi
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      value="single"
                      checked={dateRange === "single"}
                      onChange={() => setDateRange("single")}
                      className="w-4 h-4 text-warning focus:ring-warning"
                    />
                    <span className="text-on-surface">Tek Gün</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      value="range"
                      checked={dateRange === "range"}
                      onChange={() => setDateRange("range")}
                      className="w-4 h-4 text-warning focus:ring-warning"
                    />
                    <span className="text-on-surface">Tarih Aralığı</span>
                  </label>
                </div>
              </div>

              {dateRange === "single" ? (
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
            </>
          )}

          {periodType !== "daily" && (
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
            disabled={isExporting}
            className="px-5 py-2.5 bg-error text-on-error rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin"></div>
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
