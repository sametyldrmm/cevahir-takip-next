"use client";

import { useState } from "react";
import { reportsApi } from "@/lib/api/reports";
import { useNotification } from "@/app/contexts/NotificationContext";
// MOCK DATA - Test modu için yorum satırında tutuluyor
// import { mockProjects } from "@/app/data/mockData";

interface PerformanceReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCompleted: (filePath: string) => void;
}

export default function PerformanceReportDialog({
  isOpen,
  onClose,
  onExportCompleted,
}: PerformanceReportDialogProps) {
  const { showError } = useNotification();
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (reportType === "monthly") {
        const result = await reportsApi.createPerformanceExport({
          year: selectedYear,
          month: selectedMonth,
        });

        if (result.success && result.downloadUrl) {
          // Dosyayı indir (CSV raporlardaki gibi)
          const link = document.createElement("a");
          link.href = result.downloadUrl;
          link.download = result.downloadUrl.split('/').pop() || 'performance.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          onExportCompleted(result.downloadUrl);
          onClose();
        } else {
          showError(result.message || "Export başarısız");
        }
      } else {
        // Yıllık proje raporu - şimdilik sadece aylık destekleniyor
        showError("Yıllık proje raporu henüz desteklenmiyor. Lütfen aylık rapor seçin.");
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
    setReportType("monthly");
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedProject("all");
    setIsExporting(false);
    onClose();
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-lg w-full border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success-container flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">Performans Raporu</h3>
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType("monthly")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === "monthly"
                    ? "bg-success-container border-success text-success"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-(--surface-container-high)"
                }`}
              >
                <div className="font-semibold mb-1">Aylık Takım</div>
                <div className="text-xs opacity-75">Aylık performans</div>
              </button>
              <button
                onClick={() => setReportType("yearly")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === "yearly"
                    ? "bg-success-container border-success text-success"
                    : "bg-surface border-outline-variant text-on-surface hover:bg-(--surface-container-high)"
                }`}
              >
                <div className="font-semibold mb-1">Yıllık Proje</div>
                <div className="text-xs opacity-75">Yıllık performans</div>
              </button>
            </div>
          </div>

          {reportType === "monthly" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Yıl
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Ay
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Yıl
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Proje (opsiyonel)
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="all">Tüm Projeler</option>
                  {/* MOCK DATA - Test modu için yorum satırında
                  {mockProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                  */}
                  {/* API entegrasyonu yapılacak - placeholder */}
                  <option value="">Proje listesi API entegrasyonu henüz tamamlanmadı</option>
                </select>
              </div>
            </div>
          )}

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="text-xl">📥</span>
              <span>Excel dosyası S3&apos;e yüklenecek ve indirilecek</span>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <div className="flex items-start gap-3 text-sm text-on-surface-variant">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="font-medium mb-1">
                  {reportType === "monthly"
                    ? "Aylık Takım Raporu"
                    : "Yıllık Proje Raporu"}
                </p>
                <p>
                  {reportType === "monthly"
                    ? "Seçilen ay için tüm takım üyelerinin performans verilerini içerir"
                    : "Seçilen yıl için proje bazlı performans analizini içerir"}
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
            disabled={isExporting}
            className="px-5 py-2.5 bg-success text-on-success rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-success border-t-transparent rounded-full animate-spin"></div>
                <span>Rapor Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Raporu Export Et</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
