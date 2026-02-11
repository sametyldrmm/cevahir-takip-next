"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import MainLayout from "@/app/components/MainLayout";
import { useNotification } from "@/app/contexts/NotificationContext";
import { apiClient } from "@/lib/api-client";
import { projectsApi, Project as ApiProject } from "@/lib/api/projects";
import { usersApi, User as ApiUser } from "@/lib/api/users";
import {
  reportsApi,
  AutoMailIntervalPreset,
  AutoMailIntervalUnit,
  AutoMailSchedule,
  AutoMailReportPeriod,
  AutoMailReportType,
} from "@/lib/api/reports";

interface MailGroup {
  id: string;
  name: string;
  emails: string[];
}

const autoMailReportTypeOptions: Array<{ type: AutoMailReportType; label: string }> = [
  { type: "PERFORMANCE", label: "Performans Raporları" },
  { type: "TARGETS", label: "Hedef Raporları" },
  { type: "MISSING_TARGETS", label: "Hedef Eksiklikleri" },
];

const intervalPresetLabels: Record<AutoMailIntervalPreset, string> = {
  "1D": "Günlük",
  "1W": "Haftalık",
  "1M": "Aylık",
  CUSTOM: "Özel",
};

type UiIntervalPreset = "1D" | "1W" | "1M" | "1Y";

const uiIntervalPresetOptions: Array<{ value: UiIntervalPreset; label: string }> = [
  { value: "1D", label: "Günlük" },
  { value: "1W", label: "Haftalık" },
  { value: "1M", label: "Aylık" },
  { value: "1Y", label: "Yıllık" },
];

const allowedIntervalsByReportType: Partial<
  Record<AutoMailReportType, UiIntervalPreset[]>
> =
  {
    PERFORMANCE: ["1D", "1W", "1M", "1Y"],
    TARGETS: ["1D", "1W"],
    MISSING_TARGETS: ["1D", "1W", "1M", "1Y"],
  };

const allowedPeriodsByReportType: Partial<
  Record<AutoMailReportType, AutoMailReportPeriod[]>
> = {
  PERFORMANCE: ["monthly", "yearly"],
  TARGETS: ["daily", "weekly"],
  MISSING_TARGETS: ["daily", "weekly", "monthly", "yearly"],
};

const periodLabels: Record<AutoMailReportPeriod, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
  yearly: "Yıllık",
};

function getUiIntervalPresetForPeriod(period: AutoMailReportPeriod): UiIntervalPreset {
  if (period === "daily") return "1D";
  if (period === "weekly") return "1W";
  if (period === "monthly") return "1M";
  return "1Y";
}

const reportPeriodDays: Record<AutoMailReportPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

const cadenceDaysByUiIntervalPreset: Record<UiIntervalPreset, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
};

function intersectIntervals(selected: AutoMailReportType[]): Set<UiIntervalPreset> {
  const initial: UiIntervalPreset[] = ["1D", "1W", "1M", "1Y"];

  const base = selected.length
    ? selected.reduce<Set<UiIntervalPreset> | null>((acc, reportType) => {
        const allowed = allowedIntervalsByReportType[reportType] ?? initial;
        const allowedSet = new Set<UiIntervalPreset>(allowed);
        if (!acc) return allowedSet;
        return new Set([...acc].filter((x) => allowedSet.has(x)));
      }, null) ?? new Set(initial)
    : new Set(initial);

  return base;
}

function getAllowedUiIntervals(params: {
  reportTypes: AutoMailReportType[];
  reportPeriod: AutoMailReportPeriod;
}): Set<UiIntervalPreset> {
  const base = intersectIntervals(params.reportTypes);
  const maxDays = reportPeriodDays[params.reportPeriod];
  return new Set<UiIntervalPreset>(
    [...base].filter((preset) => cadenceDaysByUiIntervalPreset[preset] <= maxDays),
  );
}

function toNormalizedEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

export default function MailSettingsPage() {
  return (
    <MainLayout>
      <MailSettingsView />
    </MainLayout>
  );
}

function MailSettingsView() {
  const { showError, showSuccess } = useNotification();

  const [mailGroups, setMailGroups] = useState<MailGroup[]>([]);
  const [isMailGroupsLoading, setIsMailGroupsLoading] = useState(false);
  const [autoMailGroupsFilterText, setAutoMailGroupsFilterText] = useState("");
  const [selectedMailGroupIds, setSelectedMailGroupIds] = useState<Set<string>>(
    new Set(),
  );

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [autoMailUsersFilterText, setAutoMailUsersFilterText] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );

  const [selectedReportTypes, setSelectedReportTypes] = useState<
    Set<AutoMailReportType>
  >(new Set());

  const [selectedReportPeriod, setSelectedReportPeriod] =
    useState<AutoMailReportPeriod | null>(null);

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectsFilterText, setProjectsFilterText] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    new Set(),
  );

  const [uiIntervalPreset, setUiIntervalPreset] =
    useState<UiIntervalPreset>("1W");
  const [autoMailIntervalPreset, setAutoMailIntervalPreset] =
    useState<AutoMailIntervalPreset>("1W");
  const [autoMailCustomEvery, setAutoMailCustomEvery] = useState(1);
  const [autoMailCustomUnit, setAutoMailCustomUnit] =
    useState<AutoMailIntervalUnit>("WEEK");
  
  // Zamanlama ayarları
  const [hour, setHour] = useState<number>(9); // Varsayılan 09:00
  const [minute, setMinute] = useState<number>(0);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Varsayılan Pazartesi
  const [dayOfMonth, setDayOfMonth] = useState<number>(1); // Varsayılan ayın 1'i

  const [schedules, setSchedules] = useState<AutoMailSchedule[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleBeingDeletedId, setScheduleBeingDeletedId] = useState<
    string | null
  >(null);

  const [editingSchedule, setEditingSchedule] = useState<AutoMailSchedule | null>(
    null,
  );

  const [tableFilterText, setTableFilterText] = useState("");
  const [tableSortKey, setTableSortKey] = useState<
    "reportTypes" | "interval" | "groups" | "emails"
  >("reportTypes");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">(
    "asc",
  );
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 10;

  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return undefined;
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setAutoMailGroupsFilterText("");
    setSelectedMailGroupIds(new Set());
    setAutoMailUsersFilterText("");
    setSelectedUserIds(new Set());
    setSelectedReportTypes(new Set());
    setSelectedReportPeriod(null);
    setProjectsFilterText("");
    setSelectedProjectIds(new Set());
    setUiIntervalPreset("1W");
    setAutoMailIntervalPreset("1W");
    setAutoMailCustomEvery(1);
    setAutoMailCustomUnit("WEEK");
    setHour(9);
    setMinute(0);
    setDayOfWeek(1);
    setDayOfMonth(1);
  };

  useEffect(() => {
    const loadGroups = async (): Promise<void> => {
      try {
        setIsMailGroupsLoading(true);
        const response = await apiClient.getClient().get<MailGroup[]>(
          "/mail-groups",
        );
        setMailGroups(response.data);
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? "Mail grupları yüklenemedi");
      } finally {
        setIsMailGroupsLoading(false);
      }
    };

    const loadUsers = async (): Promise<void> => {
      try {
        setIsUsersLoading(true);
        const apiUsers = await usersApi.getAllUsers();
        setUsers(apiUsers.filter((u) => u.isActive));
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? "Kullanıcılar yüklenemedi");
      } finally {
        setIsUsersLoading(false);
      }
    };

    const loadProjects = async (): Promise<void> => {
      try {
        setIsProjectsLoading(true);
        const items = await projectsApi.getMyProjects();
        setProjects(items.filter((p) => p.isActive));
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 403) {
          showError(
            "Projeler yüklenirken yetkilendirme hatası oluştu. Lütfen tekrar giriş yapın.",
          );
          setProjects([]);
          return;
        }
        showError(getApiErrorMessage(error) ?? "Projeler yüklenemedi");
      } finally {
        setIsProjectsLoading(false);
      }
    };

    void Promise.all([loadGroups(), loadUsers(), loadProjects()]);
  }, [showError]);

  const loadSchedules = async () => {
    try {
      setIsSchedulesLoading(true);
      const items = await reportsApi.getAutoMailSchedules();
      setSchedules(items);
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ??
          "Otomatik mail ayarları yüklenirken bir hata oluştu",
      );
    } finally {
      setIsSchedulesLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, []);

  const filteredGroups = useMemo(() => {
    const needle = autoMailGroupsFilterText.trim().toLowerCase();
    if (!needle) return mailGroups;
    return mailGroups.filter((g) => g.name.toLowerCase().includes(needle));
  }, [autoMailGroupsFilterText, mailGroups]);

  const filteredUsers = useMemo(() => {
    const needle = autoMailUsersFilterText.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const haystack = `${u.displayName ?? ""} ${u.username ?? ""} ${u.email ?? ""} ${u.userTitle ?? ""}`
        .trim()
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [autoMailUsersFilterText, users]);

  const filteredProjects = useMemo(() => {
    const needle = projectsFilterText.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) => {
      const haystack = `${p.name ?? ""} ${p.code ?? ""}`.trim().toLowerCase();
      return haystack.includes(needle);
    });
  }, [projects, projectsFilterText]);

  const selectedEmails = useMemo(() => {
    const normalizedEmails = new Set<string>();

    for (const u of users) {
      if (!selectedUserIds.has(u.id)) continue;
      const normalized = toNormalizedEmail(u.email);
      if (!normalized) continue;
      normalizedEmails.add(normalized);
    }

    return [...normalizedEmails].sort((a, b) => a.localeCompare(b, "tr-TR"));
  }, [selectedUserIds, users]);

  const toggleSelectedGroup = (groupId: string) => {
    setSelectedMailGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectedProject = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const applyUiIntervalPreset = useCallback((nextPreset: UiIntervalPreset) => {
    setUiIntervalPreset(nextPreset);

    if (nextPreset === "1Y") {
      setAutoMailIntervalPreset("CUSTOM");
      setAutoMailCustomEvery(12);
      setAutoMailCustomUnit("MONTH");
      return;
    }

    setAutoMailIntervalPreset(nextPreset);
  }, []);

  const selectedReportType = useMemo<AutoMailReportType | null>(() => {
    return [...selectedReportTypes][0] ?? null;
  }, [selectedReportTypes]);

  const allowedPeriodsForSelectedReport = useMemo(() => {
    if (!selectedReportType) return [];
    return allowedPeriodsByReportType[selectedReportType] ?? [];
  }, [selectedReportType]);

  useEffect(() => {
    if (!selectedReportType) {
      if (selectedReportPeriod !== null) setSelectedReportPeriod(null);
      return;
    }

    if (
      selectedReportPeriod &&
      allowedPeriodsForSelectedReport.includes(selectedReportPeriod)
    ) {
      return;
    }

    setSelectedReportPeriod(allowedPeriodsForSelectedReport[0] ?? null);
  }, [allowedPeriodsForSelectedReport, selectedReportPeriod, selectedReportType]);

  const allowedUiIntervals = useMemo(() => {
    if (!selectedReportPeriod) {
      return intersectIntervals([...selectedReportTypes]);
    }

    return getAllowedUiIntervals({
      reportTypes: [...selectedReportTypes],
      reportPeriod: selectedReportPeriod,
    });
  }, [selectedReportPeriod, selectedReportTypes]);

  useEffect(() => {
    if (!allowedUiIntervals.has(uiIntervalPreset)) {
      const desired = selectedReportPeriod
        ? getUiIntervalPresetForPeriod(selectedReportPeriod)
        : "1W";

      if (allowedUiIntervals.has(desired)) {
        applyUiIntervalPreset(desired);
        return;
      }

      const fallbackOrder: UiIntervalPreset[] = ["1Y", "1M", "1W", "1D"];
      const fallback =
        fallbackOrder.find((p) => allowedUiIntervals.has(p)) ??
        uiIntervalPresetOptions.find((o) => allowedUiIntervals.has(o.value))?.value ??
        "1W";
      applyUiIntervalPreset(fallback);
    }
  }, [
    allowedUiIntervals,
    applyUiIntervalPreset,
    uiIntervalPreset,
    selectedReportPeriod,
  ]);

  const toggleSelectedReportType = (type: AutoMailReportType) => {
    if (isSaving) return;

    const next = new Set(selectedReportTypes);
    if (next.has(type)) {
      next.delete(type);
      setSelectedReportTypes(next);
      setSelectedReportPeriod(null);
      setSelectedProjectIds(new Set());
      setProjectsFilterText("");
      return;
    }

    if (next.size >= 1) {
      showError("Aynı anda sadece 1 rapor tipi seçebilirsiniz");
      return;
    }

    next.add(type);
    setSelectedReportTypes(next);

    if (type !== "TARGETS") {
      setSelectedProjectIds(new Set());
      setProjectsFilterText("");
    }

    const nextPeriod = allowedPeriodsByReportType[type]?.[0] ?? null;
    setSelectedReportPeriod(nextPeriod);

    const nextInterval = nextPeriod ? getUiIntervalPresetForPeriod(nextPeriod) : "1W";
    applyUiIntervalPreset(nextInterval);
  };

  const startEditingSchedule = (schedule: AutoMailSchedule) => {
    try {
      console.log("Editing schedule:", schedule);
      
      if (!schedule) {
        showError("Düzenlenecek ayar bulunamadı");
        return;
      }

      setEditingSchedule(schedule);

      // Backend'den gelen reportTypes'ı AutoMailReportType'a dönüştür
      // Backend ReportType kullanıyor: 'TARGETS' | 'PROJECTS' | 'USERS' | 'TEAM'
      // Frontend AutoMailReportType bekliyor: 'PERFORMANCE' | 'TARGETS' | 'MISSING_TARGETS'
      const scheduleReportTypes = (schedule.reportTypes ?? []).map((type: string) => {
        // Backend'den gelen ReportType'ı AutoMailReportType'a map et
        if (type === 'TARGETS') return 'TARGETS' as AutoMailReportType;
        if (type === 'PERFORMANCE') return 'PERFORMANCE' as AutoMailReportType;
        if (type === 'MISSING_TARGETS') return 'MISSING_TARGETS' as AutoMailReportType;
        // Eğer farklı bir tip gelirse, olduğu gibi bırak (hata verecek ama)
        return type as AutoMailReportType;
      });
      
      console.log("Original reportTypes:", schedule.reportTypes);
      console.log("Mapped reportTypes:", scheduleReportTypes);
      
      if (scheduleReportTypes.length === 0) {
        showError("Bu ayarda rapor tipi bulunamadı");
        return;
      }
      
      if (scheduleReportTypes.length > 1) {
        showError("Bu ayarda birden fazla rapor tipi var. İlk rapor tipi ile düzenlenebilir.");
      }
      const primaryReportType = scheduleReportTypes[0] ?? null;
      if (!primaryReportType) {
        showError("Rapor tipi belirlenemedi");
        return;
      }
      
      setSelectedReportTypes(new Set([primaryReportType]));
      
      // periodByReportType'dan period'u al, yoksa varsayılanı kullan
      let nextPeriod: AutoMailReportPeriod | null = null;
      
      console.log("primaryReportType:", primaryReportType);
      console.log("schedule.periodByReportType:", schedule.periodByReportType);
      console.log("allowedPeriodsByReportType:", allowedPeriodsByReportType);
      
      if (schedule.periodByReportType && schedule.periodByReportType[primaryReportType]) {
        nextPeriod = schedule.periodByReportType[primaryReportType] as AutoMailReportPeriod;
        console.log("Period from periodByReportType:", nextPeriod);
      } else {
        // Varsayılan period'u al
        const defaultPeriods = allowedPeriodsByReportType[primaryReportType];
        nextPeriod = defaultPeriods?.[0] ?? null;
        console.log("Default period:", nextPeriod, "from periods:", defaultPeriods);
      }
      
      if (!nextPeriod) {
        const errorMsg = `Rapor tipi ${primaryReportType} için geçerli bir dönem bulunamadı. Lütfen yeni bir ayar oluşturun.`;
        console.error(errorMsg);
        showError(errorMsg);
        return;
      }
      
      console.log("Setting selectedReportPeriod to:", nextPeriod);
      setSelectedReportPeriod(nextPeriod);
    setSelectedMailGroupIds(new Set(schedule.mailGroupIds ?? []));
    setSelectedProjectIds(
      primaryReportType === "TARGETS" ? new Set(schedule.projectIds ?? []) : new Set(),
    );
    setProjectsFilterText("");

    const isYearlyCustom =
      schedule.intervalPreset === "CUSTOM" &&
      schedule.customEvery === 12 &&
      schedule.customUnit === "MONTH";

    const isDailyCustom =
      schedule.intervalPreset === "CUSTOM" &&
      schedule.customEvery === 1 &&
      schedule.customUnit === "DAY";

    const isWeeklyCustom =
      schedule.intervalPreset === "CUSTOM" &&
      schedule.customEvery === 1 &&
      schedule.customUnit === "WEEK";

    const isMonthlyCustom =
      schedule.intervalPreset === "CUSTOM" &&
      schedule.customEvery === 1 &&
      schedule.customUnit === "MONTH";

    if (isYearlyCustom) {
      setUiIntervalPreset("1Y");
      setAutoMailIntervalPreset("CUSTOM");
      setAutoMailCustomEvery(12);
      setAutoMailCustomUnit("MONTH");
    } else if (isDailyCustom) {
      setUiIntervalPreset("1D");
      setAutoMailIntervalPreset("1D");
      setAutoMailCustomEvery(1);
      setAutoMailCustomUnit("DAY");
    } else if (isWeeklyCustom) {
      setUiIntervalPreset("1W");
      setAutoMailIntervalPreset("1W");
      setAutoMailCustomEvery(1);
      setAutoMailCustomUnit("WEEK");
    } else if (isMonthlyCustom) {
      setUiIntervalPreset("1M");
      setAutoMailIntervalPreset("1M");
      setAutoMailCustomEvery(1);
      setAutoMailCustomUnit("MONTH");
    } else if (schedule.intervalPreset === "CUSTOM") {
      showError("Bu ayarda artık desteklenmeyen özel aralık var. Aralık yeniden seçilmeli.");
      setUiIntervalPreset("1W");
      setAutoMailIntervalPreset("1W");
      setAutoMailCustomEvery(1);
      setAutoMailCustomUnit("WEEK");
    } else {
      // intervalPreset değerini kontrol et ve dönüştür
      const preset = schedule.intervalPreset;
      if (preset === "1D" || preset === "1W" || preset === "1M") {
        setUiIntervalPreset(preset as UiIntervalPreset);
        setAutoMailIntervalPreset(preset);
      } else {
        // Varsayılan değer
        setUiIntervalPreset("1W");
        setAutoMailIntervalPreset("1W");
      }
      setAutoMailCustomEvery(1);
      setAutoMailCustomUnit("WEEK");
    }

    // Zamanlama ayarlarını yükle
    setHour(schedule.hour ?? 9);
    setMinute(schedule.minute ?? 0);
    setDayOfWeek(schedule.dayOfWeek ?? 1);
    setDayOfMonth(schedule.dayOfMonth ?? 1);

    const scheduleEmails = (schedule.emails ?? [])
      .map((e) => toNormalizedEmail(e))
      .filter((e): e is string => !!e);

    const userIdByEmail = new Map<string, string>();
    for (const u of users) {
      const normalized = toNormalizedEmail(u.email);
      if (!normalized) continue;
      userIdByEmail.set(normalized, u.id);
    }

    const nextSelectedUserIds = new Set<string>();

    for (const email of scheduleEmails) {
      const mappedUserId = userIdByEmail.get(email);
      if (mappedUserId) {
        nextSelectedUserIds.add(mappedUserId);
      }
    }

    setSelectedUserIds(nextSelectedUserIds);

    window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error in startEditingSchedule:", error);
      showError("Ayar düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const saveSchedule = async () => {
    try {
      setIsSaving(true);

      if (selectedReportTypes.size !== 1) {
        showError("Lütfen 1 rapor tipi seçin");
        return;
      }

      if (!selectedReportType || !selectedReportPeriod) {
        showError("Lütfen rapor dönemi seçin");
        return;
      }

      const allowedPeriods = allowedPeriodsByReportType[selectedReportType] ?? [];
      if (!allowedPeriods.includes(selectedReportPeriod)) {
        showError("Seçilen rapor dönemi bu rapor tipi için desteklenmiyor");
        return;
      }

      const mailGroupIds = [...selectedMailGroupIds];
      const emails = selectedEmails;

      if (mailGroupIds.length === 0 && emails.length === 0) {
        showError("Lütfen en az bir mail grubu veya kullanıcı seçin");
        return;
      }

      if (autoMailIntervalPreset === "CUSTOM") {
        const isYearly = autoMailCustomEvery === 12 && autoMailCustomUnit === "MONTH";
        const isDaily = autoMailCustomEvery === 1 && autoMailCustomUnit === "DAY";
        if (!isYearly && !isDaily) {
          showError("Seçilen gönderim aralığı desteklenmiyor");
          return;
        }
      }

      const reportDays = reportPeriodDays[selectedReportPeriod];
      const scheduleDays = cadenceDaysByUiIntervalPreset[uiIntervalPreset];

      if (!(typeof reportDays === "number" && typeof scheduleDays === "number")) {
        showError("Seçilen rapor dönemi veya gönderim aralığı desteklenmiyor");
        return;
      }

      if (scheduleDays > reportDays) {
        showError("Gönderim aralığı rapor döneminden daha seyrek olamaz");
        return;
      }

      const periodByReportType: Partial<
        Record<AutoMailReportType, AutoMailReportPeriod>
      > = {
        [selectedReportType]: selectedReportPeriod,
      };

      const payload = {
        reportTypes: [...selectedReportTypes],
        mailGroupIds: mailGroupIds.length ? mailGroupIds : undefined,
        emails: emails.length ? emails : undefined,
        projectIds:
          selectedReportTypes.has("TARGETS") && selectedProjectIds.size
            ? [...selectedProjectIds]
            : undefined,
        intervalPreset: autoMailIntervalPreset,
        customEvery: autoMailIntervalPreset === "CUSTOM" ? autoMailCustomEvery : undefined,
        customUnit: autoMailIntervalPreset === "CUSTOM" ? autoMailCustomUnit : undefined,
        periodByReportType,
        hour,
        minute,
        // Haftalık için dayOfWeek, aylık için dayOfMonth
        dayOfWeek: (uiIntervalPreset === "1W" || autoMailIntervalPreset === "1W") ? dayOfWeek : undefined,
        dayOfMonth: (uiIntervalPreset === "1M" || autoMailIntervalPreset === "1M") ? dayOfMonth : undefined,
      };

      await reportsApi.upsertAutoMailSchedule(payload);

      showSuccess(
        editingSchedule
          ? "Otomatik mail ayarları güncellendi"
          : "Otomatik mail ayarları kaydedildi",
      );

      resetForm();
      await loadSchedules();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ??
          "Otomatik mail ayarları kaydedilirken bir hata oluştu",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSchedule = async (schedule: AutoMailSchedule) => {
    const scheduleId =
      typeof schedule.id === "string" && schedule.id.trim() ? schedule.id : null;

    try {
      setScheduleBeingDeletedId(scheduleId ?? "unknown");
      if (scheduleId) {
        try {
          await reportsApi.deleteAutoMailSchedule(scheduleId);
        } catch {
          await reportsApi.deleteAutoMailSchedule();
        }
      } else {
        await reportsApi.deleteAutoMailSchedule();
      }

      showSuccess("Otomatik mail ayarı silindi");

      if (editingSchedule && (editingSchedule.id ?? null) === scheduleId) {
        resetForm();
      }

      await loadSchedules();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ?? "Otomatik mail ayarı silinemedi",
      );
    } finally {
      setScheduleBeingDeletedId(null);
    }
  };

  const scheduleRows = useMemo(() => {
    const groupNameById = new Map(mailGroups.map((g) => [g.id, g.name]));

    return schedules.map((s) => {
      const reportTypeLabels = autoMailReportTypeOptions.reduce<Record<string, string>>(
        (acc, item) => {
          acc[item.type] = item.label;
          return acc;
        },
        {},
      );

      const reportTypesText = (s.reportTypes ?? [])
        .map((t) => {
          const label = reportTypeLabels[t] ?? t;
          const period = s.periodByReportType?.[t];
          if (!period) return label;
          return `${label} (${periodLabels[period] ?? period})`;
        })
        .join(", ");

      const isYearly =
        s.intervalPreset === "CUSTOM" &&
        s.customEvery === 12 &&
        s.customUnit === "MONTH";

      const intervalText = isYearly
        ? "Yıllık"
        : s.intervalPreset === "CUSTOM"
          ? `Özel (${s.customEvery ?? 1} ${s.customUnit ?? "WEEK"})`
          : intervalPresetLabels[s.intervalPreset];

      const groupsText = (s.mailGroupIds ?? [])
        .map((id) => groupNameById.get(id) ?? id)
        .join(", ");

      const emailsText = (s.emails ?? []).join(", ");

      return {
        key: s.id ?? `${reportTypesText}-${intervalText}-${groupsText}-${emailsText}`,
        reportTypesText: reportTypesText || "-",
        intervalText: intervalText || "-",
        groupsText: groupsText || "-",
        emailsText: emailsText || "-",
        schedule: s,
      };
    });
  }, [mailGroups, schedules]);

  useEffect(() => {
    setTablePage(1);
  }, [tableFilterText, tableSortDirection, tableSortKey]);

  const visibleRows = useMemo(() => {
    const needle = tableFilterText.trim().toLowerCase();
    const filtered = needle
      ? scheduleRows.filter((row) => {
          const haystack = `${row.reportTypesText} ${row.intervalText} ${row.groupsText} ${row.emailsText}`
            .trim()
            .toLowerCase();
          return haystack.includes(needle);
        })
      : scheduleRows;

    const sorted = [...filtered].sort((a, b) => {
      const getValue = (row: (typeof filtered)[number]) => {
        switch (tableSortKey) {
          case "interval":
            return row.intervalText;
          case "groups":
            return row.groupsText;
          case "emails":
            return row.emailsText;
          case "reportTypes":
          default:
            return row.reportTypesText;
        }
      };

      const left = getValue(a);
      const right = getValue(b);
      const cmp = left.localeCompare(right, "tr-TR");
      return tableSortDirection === "asc" ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / tablePageSize));
    const safePage = Math.min(Math.max(1, tablePage), totalPages);
    const startIndex = (safePage - 1) * tablePageSize;
    const pageItems = sorted.slice(startIndex, startIndex + tablePageSize);

    return {
      totalItems: sorted.length,
      totalPages,
      page: safePage,
      items: pageItems,
    };
  }, [scheduleRows, tableFilterText, tablePage, tablePageSize, tableSortDirection, tableSortKey]);

  useEffect(() => {
    if (tablePage !== visibleRows.page) {
      setTablePage(visibleRows.page);
    }
  }, [tablePage, visibleRows.page]);

  const toggleSort = (key: "reportTypes" | "interval" | "groups" | "emails") => {
    if (key === tableSortKey) {
      setTableSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setTableSortKey(key);
    setTableSortDirection("asc");
  };

  const isEditing = !!editingSchedule;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">
          Otomatik Mail Ayarları
        </h2>
        <p className="text-on-surface-variant">
          Raporları belirli aralıklarla otomatik olarak mail ile gönderin.
        </p>
      </div>

      <div className="bg-surface-container rounded-xl p-6 border border-outline-variant shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">
              {isEditing ? "Ayarı Düzenle" : "Yeni Ayar Oluştur"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Seçilen rapor tipleri belirlenen aralıkla otomatik gönderilir
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
            >
              Vazgeç
            </button>
          )}
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-on-surface">
                  Rapor Tipleri
                </div>
                <span className="text-xs text-on-surface-variant">
                  {selectedReportTypes.size} seçili
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {autoMailReportTypeOptions.map(({ type, label }) => {
                  const isChecked = selectedReportTypes.has(type);
                  const isDisabled =
                    isSaving || (!isChecked && selectedReportTypes.size >= 1);

                  return (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 rounded-lg border border-outline-variant ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-(--surface-container-high) cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectedReportType(type)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-on-surface">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="text-sm font-semibold text-on-surface">Rapor Dönemi</div>

              {!selectedReportType ? (
                <div className="mt-3 text-sm text-on-surface-variant">
                  Önce rapor tipi seçin.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {allowedPeriodsForSelectedReport.map((period) => {
                    const isChecked = selectedReportPeriod === period;
                    const isDisabled = isSaving;

                    return (
                      <label
                        key={period}
                        className={`flex items-center gap-2 ${
                          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="autoMailReportPeriod"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedReportPeriod(period);
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-sm text-on-surface">
                          {periodLabels[period]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="text-sm font-semibold text-on-surface">
                Gönderim Aralığı
              </div>

              <div className="mt-3 space-y-2">
                {uiIntervalPresetOptions.map((option) => {
                  const isAllowed = allowedUiIntervals.has(option.value);
                  const isDisabled = isSaving || !isAllowed;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="autoMailInterval"
                        checked={uiIntervalPreset === option.value}
                        onChange={() => applyUiIntervalPreset(option.value)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-on-surface">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Zamanlama Ayarları */}
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="text-sm font-semibold text-on-surface mb-3">
                Zamanlama
              </div>

              {/* Saat ve Dakika - Tüm aralıklar için */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    Saat
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hour}
                    onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    Dakika
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Haftalık için: Haftanın Günü */}
              {(uiIntervalPreset === "1W" || autoMailIntervalPreset === "1W") && (
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    Haftanın Günü
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                  >
                    <option value={0}>Pazar</option>
                    <option value={1}>Pazartesi</option>
                    <option value={2}>Salı</option>
                    <option value={3}>Çarşamba</option>
                    <option value={4}>Perşembe</option>
                    <option value={5}>Cuma</option>
                    <option value={6}>Cumartesi</option>
                  </select>
                </div>
              )}

              {/* Aylık için: Ayın Günü */}
              {(uiIntervalPreset === "1M" || autoMailIntervalPreset === "1M") && (
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    Ayın Günü
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                  />
                  <div className="text-xs text-on-surface-variant mt-1">
                    (1-31 arası, ayın son günü için 31 seçin)
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-on-surface">
                  Alıcı Özeti
                </div>
                <span className="text-xs text-on-surface-variant">
                  {selectedEmails.length} e-posta
                </span>
              </div>
              <div className="mt-3 text-xs text-on-surface-variant">
                {selectedMailGroupIds.size} grup • {selectedUserIds.size} kullanıcı
              </div>
            </div>
          </div>

          {selectedReportTypes.has("TARGETS") && (
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-on-surface">
                  Projeler
                </label>
                <span className="text-xs text-on-surface-variant">
                  {selectedProjectIds.size ? `${selectedProjectIds.size} seçili` : "Tümü"}
                </span>
              </div>

              <div className="mt-2 text-xs text-on-surface-variant">
                Proje seçmezseniz rapor tüm projeler için oluşturulur.
              </div>

              <div className="mt-3">
                <input
                  value={projectsFilterText}
                  onChange={(e) => setProjectsFilterText(e.target.value)}
                  disabled={isSaving || isProjectsLoading}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                  placeholder="Proje ara"
                />
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-outline bg-surface">
                {isProjectsLoading ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Yükleniyor...
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Proje bulunamadı.
                  </div>
                ) : (
                  [...filteredProjects]
                    .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"))
                    .map((p) => {
                      const isChecked = selectedProjectIds.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectedProject(p.id)}
                            disabled={isSaving}
                            className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-on-surface truncate">
                              {p.name}
                            </div>
                            {p.code && (
                              <div className="text-xs text-on-surface-variant truncate">
                                {p.code}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-on-surface">
                  Mail Grupları
                </label>
                <span className="text-xs text-on-surface-variant">
                  {selectedMailGroupIds.size} seçili
                </span>
              </div>

              <div className="mt-3">
                <input
                  value={autoMailGroupsFilterText}
                  onChange={(e) => setAutoMailGroupsFilterText(e.target.value)}
                  disabled={isSaving || isMailGroupsLoading}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                  placeholder="Grup ara"
                />
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-outline bg-surface">
                {isMailGroupsLoading ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Yükleniyor...
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Mail grubu bulunamadı.
                  </div>
                ) : (
                  [...filteredGroups]
                    .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"))
                    .map((g) => {
                      const isChecked = selectedMailGroupIds.has(g.id);
                      return (
                        <label
                          key={g.id}
                          className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectedGroup(g.id)}
                            disabled={isSaving}
                            className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-on-surface truncate">
                              {g.name}
                            </div>
                            <div className="text-xs text-on-surface-variant truncate">
                              {g.emails.length} e-posta
                            </div>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-on-surface">
                  Kullanıcılar
                </label>
                <span className="text-xs text-on-surface-variant">
                  {selectedUserIds.size} seçili
                </span>
              </div>

              <div className="mt-3">
                <input
                  value={autoMailUsersFilterText}
                  onChange={(e) => setAutoMailUsersFilterText(e.target.value)}
                  disabled={isSaving || isUsersLoading}
                  className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                  placeholder="İsim / kullanıcı adı / e-posta ara"
                />
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-outline bg-surface">
                {isUsersLoading ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Yükleniyor...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-sm text-on-surface-variant">
                    Kullanıcı bulunamadı.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isChecked = selectedUserIds.has(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectedUser(u.id)}
                          disabled={isSaving}
                          className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-on-surface truncate">
                            {`${u.displayName || u.username || "Kullanıcı"}${u.userTitle ? ` - ${u.userTitle}` : ""}`}
                          </div>
                          <div className="text-xs text-on-surface-variant truncate">
                            {u.email}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={saveSchedule}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-container rounded-xl p-6 border border-outline-variant shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-on-surface">
              Kaydedilen Ayarlar
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Mevcut otomatik mail gönderim ayarlarını düzenleyin veya silin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={tableFilterText}
              onChange={(e) => setTableFilterText(e.target.value)}
              disabled={isSchedulesLoading}
              className="w-64 px-4 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
              placeholder="Tabloda ara"
            />
            <button
              type="button"
              onClick={loadSchedules}
              disabled={isSchedulesLoading}
              className="px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
            >
              {isSchedulesLoading ? "Yükleniyor..." : "Yenile"}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-outline-variant">
          <table className="min-w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-on-surface">
                <th className="px-4 py-3 border-b border-outline-variant">
                  <button
                    type="button"
                    onClick={() => toggleSort("reportTypes")}
                    className="font-semibold hover:underline"
                  >
                    Rapor Tipleri
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-outline-variant">
                  <button
                    type="button"
                    onClick={() => toggleSort("interval")}
                    className="font-semibold hover:underline"
                  >
                    Aralık
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-outline-variant">
                  <button
                    type="button"
                    onClick={() => toggleSort("groups")}
                    className="font-semibold hover:underline"
                  >
                    Mail Grupları
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-outline-variant">
                  <button
                    type="button"
                    onClick={() => toggleSort("emails")}
                    className="font-semibold hover:underline"
                  >
                    E-postalar
                  </button>
                </th>
                <th className="px-4 py-3 border-b border-outline-variant w-[180px]">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-container">
              {isSchedulesLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              ) : visibleRows.totalItems === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-on-surface-variant"
                  >
                    Kayıtlı ayar bulunamadı.
                  </td>
                </tr>
              ) : (
                visibleRows.items.map((row) => {
                  const deletingKey =
                    typeof row.schedule.id === "string" && row.schedule.id.trim()
                      ? row.schedule.id
                      : "unknown";
                  const isDeleting = scheduleBeingDeletedId === deletingKey;

                  return (
                    <tr key={row.key} className="border-b border-outline-variant">
                      <td className="px-4 py-3 text-on-surface">
                        {row.reportTypesText}
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        {row.intervalText}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        <span className="line-clamp-2">{row.groupsText}</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        <span className="line-clamp-2">{row.emailsText}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log("Düzenle butonuna tıklandı, schedule:", row.schedule);
                              startEditingSchedule(row.schedule);
                            }}
                            disabled={isSaving || isDeleting}
                            className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(row.schedule)}
                            disabled={isSaving || isDeleting}
                            className="px-3 py-2 rounded-lg border border-error text-error hover:bg-error/10 transition-colors disabled:opacity-60"
                          >
                            {isDeleting ? "Siliniyor..." : "Sil"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-on-surface-variant">
            {visibleRows.totalItems} kayıt • Sayfa {visibleRows.page} / {visibleRows.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={isSchedulesLoading || visibleRows.page <= 1}
              className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() =>
                setTablePage((p) => Math.min(visibleRows.totalPages, p + 1))
              }
              disabled={isSchedulesLoading || visibleRows.page >= visibleRows.totalPages}
              className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
