"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface ExcelExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCompleted: (filePath: string) => void;
}

export default function ExcelExportDialog({
  isOpen,
  onClose,
  onExportCompleted,
}: ExcelExportDialogProps) {
  const [exportType, setExportType] = useState<"daily" | "weekly">("daily");
  const [dateRange, setDateRange] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedWeek, setSelectedWeek] = useState<string>("current");
  const [filename, setFilename] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Hafta seçeneklerini oluştur
  const getWeekOptions = () => {
    const options: Array<{ value: string; label: string }> = [];
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
    currentWeekStart.setHours(0, 0, 0, 0);

    // Güncel hafta
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // Cuma
    options.push({
      value: "current",
      label: `Bu Hafta (${currentWeekStart.getDate().toString().padStart(2, '0')}.${(currentWeekStart.getMonth() + 1).toString().padStart(2, '0')}.${currentWeekStart.getFullYear()} - ${currentWeekEnd.getDate().toString().padStart(2, '0')}.${(currentWeekEnd.getMonth() + 1).toString().padStart(2, '0')}.${currentWeekEnd.getFullYear()})`,
    });

    // Geçmiş 52 hafta
    for (let i = 1; i <= 52; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - 7 * i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // Cuma
      options.push({
        value: `last${i}`,
        label: `${i} Hafta Öncesi (${weekStart.getDate().toString().padStart(2, '0')}.${(weekStart.getMonth() + 1).toString().padStart(2, '0')}.${weekStart.getFullYear()} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}.${weekEnd.getFullYear()})`,
      });
    }

    return options;
  };

  // Hafta seçimine göre tarihleri hesapla
  const calculateWeekDates = (weekValue: string) => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
    currentWeekStart.setHours(0, 0, 0, 0);

    let weekStart: Date;
    if (weekValue === "current") {
      weekStart = new Date(currentWeekStart);
    } else {
      const weekNum = parseInt(weekValue.replace("last", ""));
      weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - 7 * weekNum);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Cuma

    return {
      start: weekStart.toISOString().split("T")[0],
      end: weekEnd.toISOString().split("T")[0],
    };
  };

  // Hafta seçimi değiştiğinde tarihleri güncelle
  useEffect(() => {
    if (exportType === "weekly") {
      const weekDates = calculateWeekDates(selectedWeek);
      setStartDate(weekDates.start);
      setEndDate(weekDates.end);
    }
  }, [selectedWeek, exportType]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const payload: any = {
        exportType: exportType === "daily" ? "daily" : "weekly",
      };

      if (filename) {
        payload.filename = filename;
      }

      if (exportType === "daily") {
        if (dateRange === "single") {
          payload.targetDate = selectedDate;
        } else {
          payload.exportType = "date_range";
          payload.startDate = startDate;
          payload.endDate = endDate;
        }
      } else {
        // Haftalık export için hafta seçimine göre tarihleri hesapla
        const weekDates = calculateWeekDates(selectedWeek);
        payload.startDate = weekDates.start;
        payload.endDate = weekDates.end;
      }

      const response = await apiClient.getClient().post("/reports/excel-export", payload);
      
      if (response.data.success && response.data.downloadUrl) {
        // Dosyayı indir (CSV raporlardaki gibi)
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = response.data.downloadUrl.split('/').pop() || 'export.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        onExportCompleted(response.data.downloadUrl);
        onClose();
      } else {
        throw new Error(response.data.message || "Export başarısız");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      setIsExporting(false);
      const errorMessage = error.response?.data?.message || error.message || "Export sırasında bir hata oluştu. Lütfen tekrar deneyin.";
      alert(errorMessage);
    }
  };

  const handleClose = () => {
    setExportType("daily");
    setDateRange("single");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setSelectedWeek("current");
    setFilename("");
    setIsExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-lg w-full border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Excel Export</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Export Türü */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-3">
              Export Türü
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="daily"
                  checked={exportType === "daily"}
                  onChange={() => setExportType("daily")}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-on-surface">Günlük Export</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="weekly"
                  checked={exportType === "weekly"}
                  onChange={() => setExportType("weekly")}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-on-surface">Haftalık Export</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="text-xl">📥</span>
              <span>Excel dosyası S3'e yüklenecek ve indirilecek</span>
            </div>
          </div>

          {/* Dosya Adı */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Dosya Adı (opsiyonel)
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            <p className="mt-2 text-xs text-on-surface-variant">
              Boş bırakırsanız otomatik ad oluşturulur
            </p>
          </div>

          {/* Tarih/Hafta Seçimi - Sadece günlük export için */}
          {exportType === "daily" && (
            <>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-3">
                  Tarih/Hafta Seçimi
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      value="single"
                      checked={dateRange === "single"}
                      onChange={() => setDateRange("single")}
                      className="w-4 h-4 text-primary focus:ring-primary"
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
                      className="w-4 h-4 text-primary focus:ring-primary"
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

          {/* Haftalık export için hafta seçimi */}
          {exportType === "weekly" && (
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Hafta Seçimi
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(e.target.value);
                  const weekDates = calculateWeekDates(e.target.value);
                  setStartDate(weekDates.start);
                  setEndDate(weekDates.end);
                }}
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                {getWeekOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-on-surface-variant">
                Geçmiş 52 hafta (1 yıl) ve güncel hafta seçilebilir
              </p>
            </div>
          )}
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
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Export Ediliyor...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>
                  {exportType === "daily" ? "Günlük Rapor İndir" : "Haftalık Rapor İndir"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
