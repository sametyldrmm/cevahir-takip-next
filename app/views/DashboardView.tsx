"use client";

import { useState, useEffect } from "react";
import { targetsApi, TargetStatistics, Target, CalendarDay } from "@/lib/api/targets";
import { useAuth } from "@/app/contexts/AuthContext";
import { StatsCards, TargetCard, HeaderCard, MonthlyCalendar } from "@/app/components/dashboard";
import LeaveEditPanel from "@/app/components/dashboard/LeaveEditPanel";
import { leavesApi, Leave } from "@/lib/api/leaves";
import EditTargetDialog from "@/app/components/dialogs/EditTargetDialog";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useRouter } from "next/navigation";

export default function DashboardView() {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const router = useRouter();
  const [stats, setStats] = useState<TargetStatistics | null>(null);
  const [todayTargets, setTodayTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditTarget, setShowEditTarget] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "completed" | "inProgress" | "pending" | null>(null);
  const [filteredTargets, setFilteredTargets] = useState<Target[]>([]);
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allTargets, setAllTargets] = useState<Target[]>([]);
  const [leaveEditMode, setLeaveEditMode] = useState(false);
  const [selectedLeaveDays, setSelectedLeaveDays] = useState<Date[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<Record<string, { type: string; note?: string }>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Tarih aralığını hesapla (takvim için 3 ay öncesi ve sonrası)
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];
        
        const [statistics, targets, calendar, allTargetsData, leavesData] = await Promise.all([
          targetsApi.getStatistics(),
          targetsApi.getTodayTargets(),
          targetsApi.getCalendarData(60),
          targetsApi.getMyTargets(),
          leavesApi.getByRange(startDateStr, endDateStr).catch(() => []),
        ]);
        setStats(statistics);
        setTodayTargets(targets);
        setCalendarData(calendar);
        setAllTargets(allTargetsData);
        
        // Leaves'i formatla
        const leavesMap: Record<string, { type: string; note?: string }> = {};
        leavesData.forEach((leave: Leave) => {
          leavesMap[leave.date] = {
            type: leave.leaveType,
            note: leave.note,
          };
        });
        setLeaves(leavesMap);
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const displayName = user?.displayName || user?.username || "Kullanıcı";

  const handleTargetUpdated = async (updatedTarget: Target) => {
    // Bugünkü hedefleri güncelle
    setTodayTargets((prev) =>
      prev.map((t) => (t.id === updatedTarget.id ? updatedTarget : t))
    );
    // İstatistikleri yeniden yükle
    try {
      const statistics = await targetsApi.getStatistics();
      setStats(statistics);
      // Bugünkü hedefleri de yeniden yükle
      const targets = await targetsApi.getTodayTargets();
      setTodayTargets(targets);
    } catch (error) {
      console.error("Failed to reload statistics:", error);
    }
  };

  const handleStatsCardClick = async (filter: "all" | "completed" | "inProgress" | "pending") => {
    setSelectedFilter(filter);
    try {
      setIsLoadingFiltered(true);
      const allTargets = await targetsApi.getMyTargets();
      
      // Filtreleme
      let filtered: Target[] = [];
      switch (filter) {
        case "all":
          filtered = allTargets;
          break;
        case "completed":
          filtered = allTargets.filter((t) => t.goalStatus === "REACHED");
          break;
        case "inProgress":
          filtered = allTargets.filter((t) => t.goalStatus === "PARTIAL");
          break;
        case "pending":
          filtered = allTargets.filter(
            (t) => t.goalStatus === "FAILED" || t.goalStatus === "NOT_SET" || !t.goalStatus
          );
          break;
      }
      
      setFilteredTargets(filtered);
    } catch (error) {
      console.error("Failed to load filtered targets:", error);
      setFilteredTargets([]);
    } finally {
      setIsLoadingFiltered(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedFilter(null);
    setFilteredTargets([]);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Tarih seçildiğinde o tarihteki hedefleri yükle
    const dateStr = date.toISOString().split("T")[0];
    targetsApi.getTargetsByDate(dateStr).then((targets) => {
      setTodayTargets(targets);
    });
  };

  const handleEditLeaves = () => {
    setLeaveEditMode(!leaveEditMode);
    if (leaveEditMode) {
      // Edit mode kapatılıyor - seçimleri temizle
      setSelectedLeaveDays([]);
      setSelectedLeaveType(null);
    }
  };

  const handleDayToggle = (date: Date) => {
    if (!selectedLeaveType) {
      showSuccess("Önce izin türünü seçin");
      return;
    }

    const dateStr = date.toISOString().split("T")[0];
    setSelectedLeaveDays((prev) => {
      const exists = prev.some((d) => d.toISOString().split("T")[0] === dateStr);
      if (exists) {
        return prev.filter((d) => d.toISOString().split("T")[0] !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleLeaveSave = async () => {
    // LeaveEditPanel içinde kaydetme yapılıyor, sadece state'i güncelle
    setLeaveEditMode(false);
    setSelectedLeaveDays([]);
    setSelectedLeaveType(null);
    
    // Leaves'i yeniden yükle
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];
      
      const leavesData = await leavesApi.getByRange(startDateStr, endDateStr);
      const leavesMap: Record<string, { type: string; note?: string }> = {};
      leavesData.forEach((leave: Leave) => {
        leavesMap[leave.date] = {
          type: leave.leaveType,
          note: leave.note,
        };
      });
      setLeaves(leavesMap);
    } catch (error) {
      console.error("Failed to reload leaves:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <HeaderCard displayName={displayName} />

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-on-surface-variant">Yükleniyor...</p>
        </div>
      ) : (
        <>
          {stats && (
            <StatsCards
              stats={{
                totalTargets: stats.totalTargets,
                completed: stats.completedTargets,
                inProgress: stats.partialTargets,
                pending: stats.pendingTargets,
              }}
              onCardClick={handleStatsCardClick}
            />
          )}

          {selectedFilter ? (
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  {selectedFilter === "all"
                    ? "Tüm Hedefler"
                    : selectedFilter === "completed"
                    ? "Başarıyla Tamamlanan Hedefler"
                    : selectedFilter === "inProgress"
                    ? "Kısmen Tamamlanan Hedefler"
                    : "Ulaşılamayan Hedefler"}
                </h3>
                <button
                  onClick={handleClearFilter}
                  className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-sm font-medium hover:bg-(--surface-container-highest) transition-colors"
                >
                  Filtreyi Temizle
                </button>
              </div>
              {isLoadingFiltered ? (
                <div className="text-center py-8">
                  <p className="text-on-surface-variant">Yükleniyor...</p>
                </div>
              ) : filteredTargets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-on-surface-variant">
                    Bu filtreye uygun hedef bulunamadı.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredTargets.map((target) => {
                    const statusLabels: Record<string, string> = {
                      REACHED: "Tamamlandı",
                      PARTIAL: "Kısmen",
                      FAILED: "Başarısız",
                      NOT_SET: "Belirlenmedi",
                    };
                    const statusColors: Record<string, string> = {
                      REACHED: "bg-success/20 text-success",
                      PARTIAL: "bg-warning/20 text-warning",
                      FAILED: "bg-error/20 text-error",
                      NOT_SET: "bg-surface-container-high text-on-surface-variant",
                    };

                    return (
                      <div
                        key={target.id}
                        className="p-4 bg-surface rounded-xl border border-outline-variant hover:border-(--primary) transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingTarget(target);
                          setShowEditTarget(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-on-surface mb-1">
                              {target.taskContent || "İş içeriği belirtilmemiş"}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {new Date(target.date).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          {target.goalStatus && (
                            <span
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                statusColors[target.goalStatus] || statusColors.NOT_SET
                              }`}
                            >
                              {statusLabels[target.goalStatus] || "Bilinmiyor"}
                            </span>
                          )}
                        </div>
                        {target.description && (
                          <p className="text-sm text-on-surface-variant mb-2">
                            {target.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-on-surface-variant">
                          {target.block && <span>Blok: {target.block}</span>}
                          {target.floors && <span>Katlar: {target.floors}</span>}
                          {target.workStart && target.workEnd && (
                            <span>
                              Çalışma: {target.workStart} - {target.workEnd}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hedef Takvimi Bölümü */}
              <div className="lg:col-span-2 space-y-6">
                <MonthlyCalendar
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  calendarData={calendarData}
                  targets={allTargets}
                  onEditLeaves={handleEditLeaves}
                  editMode={leaveEditMode}
                  selectedDays={selectedLeaveDays}
                  onDayToggle={handleDayToggle}
                  selectedLeaveType={selectedLeaveType}
                  leaves={leaves}
                />

                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-on-surface">
                      Bugünkü Hedefler {todayTargets.length > 0 && `(${todayTargets.length})`}
                    </h3>
                  </div>
                {todayTargets.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {todayTargets.map((target) => {
                      const statusLabels: Record<string, string> = {
                        REACHED: "Tamamlandı",
                        PARTIAL: "Kısmen",
                        FAILED: "Başarısız",
                        NOT_SET: "Belirlenmedi",
                      };
                      const statusColors: Record<string, string> = {
                        REACHED: "bg-success/20 text-success",
                        PARTIAL: "bg-warning/20 text-warning",
                        FAILED: "bg-error/20 text-error",
                        NOT_SET: "bg-surface-container-high text-on-surface-variant",
                      };

                      return (
                        <div
                          key={target.id}
                          className="p-4 bg-surface rounded-xl border border-outline-variant hover:border-(--primary) transition-colors cursor-pointer"
                          onClick={() => {
                            setEditingTarget(target);
                            setShowEditTarget(true);
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-on-surface mb-1">
                                {target.taskContent || "İş içeriği belirtilmemiş"}
                              </p>
                            </div>
                            {target.goalStatus && (
                              <span
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  statusColors[target.goalStatus] || statusColors.NOT_SET
                                }`}
                              >
                                {statusLabels[target.goalStatus] || "Bilinmiyor"}
                              </span>
                            )}
                          </div>
                          {target.description && (
                            <p className="text-sm text-on-surface-variant mb-2">
                              {target.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-xs text-on-surface-variant">
                            {target.block && <span>Blok: {target.block}</span>}
                            {target.floors && <span>Katlar: {target.floors}</span>}
                            {target.workStart && target.workEnd && (
                              <span>
                                Çalışma: {target.workStart} - {target.workEnd}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-center py-8">
                    Bugün için hedef bulunmamaktadır.
                  </p>
                )}
                </div>
              </div>

              {/* Sağ Bilgi Paneli */}
              <div className="space-y-6">
                {leaveEditMode ? (
                  <LeaveEditPanel
                    selectedDays={selectedLeaveDays}
                    onCancel={handleEditLeaves}
                    onSave={handleLeaveSave}
                    onSelectedDaysChange={setSelectedLeaveDays}
                    selectedLeaveType={selectedLeaveType}
                    onLeaveTypeChange={setSelectedLeaveType}
                  />
                ) : (
                  <>
                      {/* <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Hedef Takibi
                      </button> */}
                      <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                        <h4 className="text-base font-semibold text-on-surface mb-2 text-center">
                          {new Date().toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })} Hedefi
                        </h4>
                        <p className="text-sm text-on-surface-variant mb-2 text-center">
                          Bugün için hedef girişi yapabilirsiniz
                        </p>
                        <p className="text-xs text-on-surface-variant text-center">
                          Hedef girişi yapmak için sol menüden &apos;Hedef Girişi&apos; seçeneğini kullanabilirsiniz.
                        </p>
                      </div>
                  </>
                )}

                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
                  <h3 className="text-lg font-semibold text-on-surface mb-4 text-center">Özet</h3>
                {stats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-on-surface-variant">Başarı Oranı</span>
                        <span className="text-sm font-semibold text-on-surface">
                          {stats.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2.5">
                        <div
                          className="bg-primary rounded-full h-2.5 transition-all"
                          style={{ width: `${Math.min(stats.successRate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-on-surface-variant">Tamamlanan</span>
                        <span className="text-sm font-semibold text-success">
                          {stats.completedTargets}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-on-surface-variant">Kısmen</span>
                        <span className="text-sm font-semibold text-warning">
                          {stats.partialTargets}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-on-surface-variant">Tamamlanamayan</span>
                        <span className="text-sm font-semibold text-error">
                          {stats.failedTargets}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-on-surface-variant">Bekleyen</span>
                        <span className="text-sm font-semibold text-on-surface-variant">
                          {stats.pendingTargets}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-center py-4">
                    İstatistik yükleniyor...
                  </p>
                )}
                </div>
              </div>
            </div>
          )}
        </>
      )}


      <EditTargetDialog
        isOpen={showEditTarget}
        target={editingTarget}
        onClose={() => {
          setShowEditTarget(false);
          setEditingTarget(null);
        }}
        onTargetUpdated={async (updatedTarget) => {
          await handleTargetUpdated(updatedTarget);
          // Eğer filtrelenmiş hedefler gösteriliyorsa, listeyi güncelle
          if (selectedFilter) {
            setFilteredTargets((prev) =>
              prev.map((t) => (t.id === updatedTarget.id ? updatedTarget : t))
            );
          }
        }}
      />
    </div>
  );
}
