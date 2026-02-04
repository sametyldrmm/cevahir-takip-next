"use client";

import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { reportsApi, Report, ReportType } from "@/lib/api/reports";
import { projectsApi, Project as ApiProject } from "@/lib/api/projects";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useAuth } from "@/app/contexts/AuthContext";
import ExcelExportDialog from "@/app/components/dialogs/ExcelExportDialog";
import MissingTargetsExportDialog from "@/app/components/dialogs/MissingTargetsExportDialog";
import PerformanceReportDialog from "@/app/components/dialogs/PerformanceReportDialog";

export default function ReportsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>("TARGETS");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filename, setFilename] = useState("");
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [showExcelExportDialog, setShowExcelExportDialog] = useState(false);
  const [showMissingTargetsDialog, setShowMissingTargetsDialog] = useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return undefined;
  };

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projs = await projectsApi.getMyProjects();
        setProjects(projs);
      } catch (error: unknown) {
        console.error("Failed to load projects:", error);
        // Projeler yüklenemezse boş array kullan, rapor oluşturma devam edebilir
        setProjects([]);
        // 403 hatası ise kullanıcıya bilgi ver
        if (isAxiosError(error) && error.response?.status === 403) {
          showError("Projeler yüklenirken yetkilendirme hatası oluştu. Lütfen tekrar giriş yapın.");
        }
      }
    };
    loadProjects();
  }, [showError]);

  // Raporları yükle
  useEffect(() => {
    loadReports();
  }, []);

  // Rapor durumlarını polling ile kontrol et - arka planda çalışan raporlar için
  useEffect(() => {
    const interval = setInterval(() => {
      const processingReports = reports.filter(
        (r) => r.status === "STARTED" || r.status === "PROCESSING"
      );
      if (processingReports.length > 0) {
        // Arka planda status güncellemelerini kontrol et
        loadReports();
      }
    }, 3000); // 3 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [reports]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await reportsApi.getMyReports();
      setReports(data);
    } catch (error: unknown) {
      showError("Raporlar yüklenirken bir hata oluştu");
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      setIsCreating(true);
      const parameters: Record<string, unknown> = {};
      
      if (selectedProjects.length > 0) {
        parameters.projectIds = selectedProjects;
      }
      if (startDate) {
        parameters.startDate = startDate;
      }
      if (endDate) {
        parameters.endDate = endDate;
      }

      // Rapor oluşturma isteğini gönder - backend'de asenkron olarak işlenecek
      const newReport = await reportsApi.createReport({
        type: selectedType,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        filename: filename || undefined,
      });

      // Rapor listesine ekle (status: STARTED veya PROCESSING olacak)
      setReports((prev) => [newReport, ...prev]);
      
      // Dialog'u kapat ve formu sıfırla
      setShowCreateDialog(false);
      setSelectedType("TARGETS");
      setSelectedProjects([]);
      setStartDate("");
      setEndDate("");
      setFilename("");
      
      // Başarı mesajı göster - kullanıcı sayfayı kapatabilir, arka planda işlem devam edecek
      showSuccess("Rapor oluşturma isteği gönderildi. Rapor arka planda hazırlanacak ve durumu otomatik güncellenecek.");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Rapor oluşturulurken bir hata oluştu");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const download = await reportsApi.getDownloadUrl(report.id);
      
      // Yeni pencerede indir
      const link = document.createElement("a");
      link.href = download.downloadUrl;
      link.download = download.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess("Rapor indiriliyor...");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Rapor indirilirken bir hata oluştu");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      STARTED: "Başlatıldı",
      PROCESSING: "Oluşturuluyor",
      READY: "İndirilebilir",
      FAILED: "Başarısız",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      STARTED: "bg-primary/20 text-primary",
      PROCESSING: "bg-warning/20 text-warning",
      READY: "bg-success/20 text-success",
      FAILED: "bg-error/20 text-error",
    };
    return colors[status] || "bg-surface-container-high text-on-surface-variant";
  };

  const reportTypeLabels: Record<string, string> = {
    TARGETS: "Hedef Raporu",
    PROJECTS: "Proje Raporu",
    USERS: "Kullanıcı Raporu",
    TEAM: "Takım Raporu",
    PERFORMANCE: "Performans Raporu",
    MISSING_TARGETS: "Hedef Eksiklikleri Raporu",
  };

  const getReportTypeLabel = (type: string): string => {
    return reportTypeLabels[type] || type;
  };

  // Excel export için callback (hala senkron)
  const handleExcelExportCompleted = (filePath: string) => {
    if (filePath) {
      showSuccess("Excel export başarıyla oluşturuldu ve indirildi");
    }
  };

  // Performans raporu callback (asenkron - Report entity oluşturur)
  const handlePerformanceReportCreated = (report: Report) => {
    setReports((prev) => [report, ...prev]);
    loadReports(); // Rapor listesini yenile
  };

  const handleMissingTargetsReportCreated = (report: Report) => {
    setReports((prev) => [report, ...prev]);
    loadReports(); // Rapor listesini yenile
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Raporlama</h2>
            <p className="text-on-surface-variant">
              Hedef verilerinizi Excel formatında export edin ve indirin. Raporlar arka planda hazırlanır, sayfayı kapatabilirsiniz.
            </p>
          </div>
        </div>

        {/* Hızlı Erişim Butonları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* RAPORLAR Bölümü */}
          <div className="bg-surface-container p-4 rounded-lg border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase mb-3">
              RAPORLAR
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowPerformanceDialog(true)}
                className="w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📈</span>
                  <div>
                    <div className="font-semibold text-on-surface">Performans Raporları</div>
                    <div className="text-xs text-on-surface-variant">
                      Aylık takım performans raporları
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setShowMissingTargetsDialog(true)}
                className="w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="font-semibold text-on-surface">Hedef Eksiklikleri</div>
                    <div className="text-xs text-on-surface-variant">
                      Eksik hedef girişleri raporu
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* DIŞA AKTARMA Bölümü */}
          <div className="bg-surface-container p-4 rounded-lg border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase mb-3">
              DIŞA AKTARMA
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowExcelExportDialog(true)}
                className="w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <div className="font-semibold text-on-surface">Excel Export</div>
                    <div className="text-xs text-on-surface-variant">
                      Günlük veya haftalık Excel export
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* CSV RAPORLAR Bölümü (Mevcut) */}
          <div className="bg-surface-container p-4 rounded-lg border border-outline-variant">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase mb-3">
              CSV RAPORLAR
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="w-full px-4 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                + Yeni Rapor Oluştur
              </button>
              <p className="text-xs text-on-surface-variant mt-2">
                Hedef, proje, kullanıcı ve takım raporları
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rapor Listesi */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-surface-container p-6 rounded-lg border border-outline-variant text-center">
            <p className="text-on-surface-variant">Yükleniyor...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-surface-container p-6 rounded-lg border border-outline-variant text-center">
            <p className="text-on-surface-variant">Henüz rapor oluşturulmamış</p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-surface-container p-6 rounded-lg border border-outline-variant"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-on-surface">
                      {getReportTypeLabel(report.type)}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-2">
                    Oluşturulma: {new Date(report.createdAt).toLocaleString("tr-TR")}
                  </p>
                  {report.status === "READY" && report.fileName && (
                    <p className="text-sm text-on-surface-variant">
                      Dosya: {report.fileName}
                    </p>
                  )}
                  {report.status === "FAILED" && report.errorMessage && (
                    <p className="text-sm text-error mt-2">
                      Hata: {report.errorMessage}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {report.status === "READY" && (
                    <button
                      onClick={() => handleDownload(report)}
                      className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      İndir
                    </button>
                  )}
                  {(report.status === "STARTED" || report.status === "PROCESSING") && (
                    <div className="px-4 py-2 bg-surface-container-high rounded-lg text-on-surface-variant flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Arka planda hazırlanıyor...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rapor Oluşturma Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-2xl w-full border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-on-surface">
                {reportTypeLabels[selectedType]} Oluştur
              </h3>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedType("TARGETS");
                }}
                className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* Rapor Tipi */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Rapor Tipi <span className="text-error">*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ReportType)}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  {Object.entries(reportTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proje Seçimi */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Projeler (Opsiyonel)
                </label>
                {projects.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-outline rounded-lg p-3 bg-surface">
                    {projects.map((project) => {
                      const isSelected = selectedProjects.includes(project.id);
                      return (
                        <label
                          key={project.id}
                          className="flex items-center gap-2 p-2 hover:bg-(--surface-container-high) rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects([...selectedProjects, project.id]);
                              } else {
                                setSelectedProjects(
                                  selectedProjects.filter((id) => id !== project.id)
                                );
                              }
                            }}
                            className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-sm text-on-surface">{project.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-outline rounded-lg p-3 bg-surface-container-high">
                    <p className="text-sm text-on-surface-variant">
                      Proje bulunamadı veya yüklenemedi. Rapor tüm projeler için oluşturulacak.
                    </p>
                  </div>
                )}
              </div>

              {/* Tarih Aralığı */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Başlangıç Tarihi (Opsiyonel)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Bitiş Tarihi (Opsiyonel)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Dosya Adı */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Dosya Adı (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Dosya Adı (opsiyonel)"
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <p className="mt-2 text-xs text-on-surface-variant">
                  Boş bırakırsanız otomatik ad oluşturulur
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-outline-variant">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedType("TARGETS");
                  setSelectedProjects([]);
                  setStartDate("");
                  setEndDate("");
                  setFilename("");
                }}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest) transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleCreateReport}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isCreating ? "Gönderiliyor..." : "Rapor Oluştur"}
              </button>
            </div>
            {isCreating && (
              <p className="mt-3 text-xs text-on-surface-variant text-center">
                Rapor oluşturma isteği gönderiliyor...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Excel Export Dialog */}
      <ExcelExportDialog
        isOpen={showExcelExportDialog}
        onClose={() => setShowExcelExportDialog(false)}
        onExportCompleted={handleExcelExportCompleted}
      />

      {/* Missing Targets Export Dialog */}
      <MissingTargetsExportDialog
        isOpen={showMissingTargetsDialog}
        onClose={() => setShowMissingTargetsDialog(false)}
        onReportCreated={handleMissingTargetsReportCreated}
      />

      {/* Performance Report Dialog */}
      <PerformanceReportDialog
        isOpen={showPerformanceDialog}
        onClose={() => setShowPerformanceDialog(false)}
        onReportCreated={handlePerformanceReportCreated}
      />
    </div>
  );
}
