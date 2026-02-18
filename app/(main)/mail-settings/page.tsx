"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import MainLayout from "@/app/components/MainLayout";
import { useNotification } from "@/app/contexts/NotificationContext";
import { useAuth } from "@/app/contexts/AuthContext";
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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    rowKey: string;
    schedule: AutoMailSchedule;
    title: string;
    detail: string;
  } | null>(null);

  type ScheduleEditDraft = {
    rowKey: string;
    scheduleId: string | null;
    reportType: AutoMailReportType;
    reportPeriod: AutoMailReportPeriod;
    selectedMailGroupIds: Set<string>;
    selectedUserIds: Set<string>;
    selectedProjectIds: Set<string>;
    groupsFilterText: string;
    usersFilterText: string;
    projectsFilterText: string;
    uiIntervalPreset: UiIntervalPreset;
    autoMailIntervalPreset: AutoMailIntervalPreset;
    autoMailCustomEvery: number;
    autoMailCustomUnit: AutoMailIntervalUnit;
    hour: number;
    minute: number;
    dayOfWeek: number;
    dayOfMonth: number;
  };

  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ScheduleEditDraft | null>(null);
  const [isRowSaving, setIsRowSaving] = useState(false);

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
        const items = isAdmin
          ? await projectsApi.getAllProjects()
          : await projectsApi.getMyProjects();
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
  }, [isAdmin, showError]);

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

  const editSelectedEmails = useMemo(() => {
    if (!editDraft) return [];
    const normalizedEmails = new Set<string>();

    for (const u of users) {
      if (!editDraft.selectedUserIds.has(u.id)) continue;
      const normalized = toNormalizedEmail(u.email);
      if (!normalized) continue;
      normalizedEmails.add(normalized);
    }

    return [...normalizedEmails].sort((a, b) => a.localeCompare(b, "tr-TR"));
  }, [editDraft, users]);

  const editFilteredGroups = useMemo(() => {
    const needle = (editDraft?.groupsFilterText ?? "").trim().toLowerCase();
    if (!needle) return mailGroups;
    return mailGroups.filter((g) => g.name.toLowerCase().includes(needle));
  }, [editDraft?.groupsFilterText, mailGroups]);

  const editFilteredUsers = useMemo(() => {
    const needle = (editDraft?.usersFilterText ?? "").trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const haystack = `${u.displayName ?? ""} ${u.username ?? ""} ${u.email ?? ""} ${u.userTitle ?? ""}`
        .trim()
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [editDraft?.usersFilterText, users]);

  const editFilteredProjects = useMemo(() => {
    const needle = (editDraft?.projectsFilterText ?? "").trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) => {
      const haystack = `${p.name ?? ""} ${p.code ?? ""}`.trim().toLowerCase();
      return haystack.includes(needle);
    });
  }, [editDraft?.projectsFilterText, projects]);

  const editAllowedPeriodsForSelectedReport = useMemo(() => {
    if (!editDraft) return [];
    return allowedPeriodsByReportType[editDraft.reportType] ?? [];
  }, [editDraft?.reportType]);

  const editAllowedUiIntervals = useMemo(() => {
    if (!editDraft) return new Set<UiIntervalPreset>(["1D", "1W", "1M", "1Y"]);
    return getAllowedUiIntervals({
      reportTypes: [editDraft.reportType],
      reportPeriod: editDraft.reportPeriod,
    });
  }, [editDraft?.reportPeriod, editDraft?.reportType]);

  const applyEditUiIntervalPreset = useCallback((nextPreset: UiIntervalPreset) => {
    setEditDraft((prev) => {
      if (!prev) return prev;

      if (nextPreset === "1Y") {
        return {
          ...prev,
          uiIntervalPreset: nextPreset,
          autoMailIntervalPreset: "CUSTOM",
          autoMailCustomEvery: 12,
          autoMailCustomUnit: "MONTH",
        };
      }

      return {
        ...prev,
        uiIntervalPreset: nextPreset,
        autoMailIntervalPreset: nextPreset,
      };
    });
  }, []);

  useEffect(() => {
    if (!editDraft) return;

    const allowedPeriods = editAllowedPeriodsForSelectedReport;
    if (!allowedPeriods.includes(editDraft.reportPeriod)) {
      const nextPeriod = allowedPeriods[0];
      if (nextPeriod) {
        setEditDraft((prev) => (prev ? { ...prev, reportPeriod: nextPeriod } : prev));
      }
      return;
    }

    if (editAllowedUiIntervals.has(editDraft.uiIntervalPreset)) return;

    const fallbackOrder: UiIntervalPreset[] = ["1Y", "1M", "1W", "1D"];
    const fallback =
      fallbackOrder.find((p) => editAllowedUiIntervals.has(p)) ??
      uiIntervalPresetOptions.find((o) => editAllowedUiIntervals.has(o.value))?.value ??
      "1W";
    applyEditUiIntervalPreset(fallback);
  }, [
    applyEditUiIntervalPreset,
    editAllowedPeriodsForSelectedReport,
    editAllowedUiIntervals,
    editDraft,
  ]);

  const toggleEditSelectedGroup = (groupId: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selectedMailGroupIds);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return { ...prev, selectedMailGroupIds: next };
    });
  };

  const toggleEditSelectedUser = (userId: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selectedUserIds);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { ...prev, selectedUserIds: next };
    });
  };

  const toggleEditSelectedProject = (projectId: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selectedProjectIds);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return { ...prev, selectedProjectIds: next };
    });
  };

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

  const closeRowEditor = () => {
    setExpandedRowKey(null);
    setEditDraft(null);
    setIsRowSaving(false);
  };

  const toNormalizedReportTypes = (reportTypes: string[] | undefined) => {
    return (reportTypes ?? []).map((type) => {
      if (type === "TARGETS") return "TARGETS" as AutoMailReportType;
      if (type === "PERFORMANCE") return "PERFORMANCE" as AutoMailReportType;
      if (type === "MISSING_TARGETS") return "MISSING_TARGETS" as AutoMailReportType;
      return type as AutoMailReportType;
    });
  };

  const buildEditDraft = (
    rowKey: string,
    schedule: AutoMailSchedule,
  ): ScheduleEditDraft | null => {
    const scheduleReportTypes = toNormalizedReportTypes(schedule.reportTypes as string[]);
    const primaryReportType = scheduleReportTypes[0];
    if (!primaryReportType) return null;

    const allowedPeriods = allowedPeriodsByReportType[primaryReportType] ?? [];
    const periodFromSchedule =
      schedule.periodByReportType?.[primaryReportType] ?? null;
    const reportPeriod = allowedPeriods.includes(periodFromSchedule as AutoMailReportPeriod)
      ? (periodFromSchedule as AutoMailReportPeriod)
      : (allowedPeriods[0] ?? null);
    if (!reportPeriod) return null;

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

    let nextUiInterval: UiIntervalPreset = "1W";
    let nextIntervalPreset: AutoMailIntervalPreset = "1W";
    let nextCustomEvery = 1;
    let nextCustomUnit: AutoMailIntervalUnit = "WEEK";

    if (isYearlyCustom) {
      nextUiInterval = "1Y";
      nextIntervalPreset = "CUSTOM";
      nextCustomEvery = 12;
      nextCustomUnit = "MONTH";
    } else if (isDailyCustom) {
      nextUiInterval = "1D";
      nextIntervalPreset = "1D";
      nextCustomEvery = 1;
      nextCustomUnit = "DAY";
    } else if (isWeeklyCustom) {
      nextUiInterval = "1W";
      nextIntervalPreset = "1W";
      nextCustomEvery = 1;
      nextCustomUnit = "WEEK";
    } else if (isMonthlyCustom) {
      nextUiInterval = "1M";
      nextIntervalPreset = "1M";
      nextCustomEvery = 1;
      nextCustomUnit = "MONTH";
    } else if (
      schedule.intervalPreset === "1D" ||
      schedule.intervalPreset === "1W" ||
      schedule.intervalPreset === "1M"
    ) {
      nextUiInterval = schedule.intervalPreset as UiIntervalPreset;
      nextIntervalPreset = schedule.intervalPreset;
      nextCustomEvery = 1;
      nextCustomUnit = "WEEK";
    }

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
      if (mappedUserId) nextSelectedUserIds.add(mappedUserId);
    }

    return {
      rowKey,
      scheduleId:
        typeof schedule.id === "string" && schedule.id.trim() ? schedule.id : null,
      reportType: primaryReportType,
      reportPeriod,
      selectedMailGroupIds: new Set(schedule.mailGroupIds ?? []),
      selectedUserIds: nextSelectedUserIds,
      selectedProjectIds:
        primaryReportType === "TARGETS"
          ? new Set(schedule.projectIds ?? [])
          : new Set(),
      groupsFilterText: "",
      usersFilterText: "",
      projectsFilterText: "",
      uiIntervalPreset: nextUiInterval,
      autoMailIntervalPreset: nextIntervalPreset,
      autoMailCustomEvery: nextCustomEvery,
      autoMailCustomUnit: nextCustomUnit,
      hour: schedule.hour ?? 9,
      minute: schedule.minute ?? 0,
      dayOfWeek: schedule.dayOfWeek ?? 1,
      dayOfMonth: schedule.dayOfMonth ?? 1,
    };
  };

  const toggleRowEditor = (rowKey: string, schedule: AutoMailSchedule) => {
    if (expandedRowKey === rowKey) {
      closeRowEditor();
      return;
    }

    const draft = buildEditDraft(rowKey, schedule);
    if (!draft) {
      showError("Ayar düzenleme ekranı açılamadı. Lütfen tekrar deneyin.");
      return;
    }

    setExpandedRowKey(rowKey);
    setEditDraft(draft);
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

      showSuccess("Otomatik mail ayarları kaydedildi");

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

  const saveEditedSchedule = async () => {
    if (!editDraft) return;
    if (!editDraft.scheduleId) {
      showError("Güncellenecek ayar bulunamadı");
      return;
    }

    try {
      setIsRowSaving(true);

      const allowedPeriods = allowedPeriodsByReportType[editDraft.reportType] ?? [];
      if (!allowedPeriods.includes(editDraft.reportPeriod)) {
        showError("Seçilen rapor dönemi bu rapor tipi için desteklenmiyor");
        return;
      }

      const mailGroupIds = [...editDraft.selectedMailGroupIds];
      const emails = editSelectedEmails;

      if (mailGroupIds.length === 0 && emails.length === 0) {
        showError("Lütfen en az bir mail grubu veya kullanıcı seçin");
        return;
      }

      if (editDraft.autoMailIntervalPreset === "CUSTOM") {
        const isYearly =
          editDraft.autoMailCustomEvery === 12 && editDraft.autoMailCustomUnit === "MONTH";
        const isDaily =
          editDraft.autoMailCustomEvery === 1 && editDraft.autoMailCustomUnit === "DAY";
        if (!isYearly && !isDaily) {
          showError("Seçilen gönderim aralığı desteklenmiyor");
          return;
        }
      }

      const reportDays = reportPeriodDays[editDraft.reportPeriod];
      const scheduleDays = cadenceDaysByUiIntervalPreset[editDraft.uiIntervalPreset];

      if (!(typeof reportDays === "number" && typeof scheduleDays === "number")) {
        showError("Seçilen rapor dönemi veya gönderim aralığı desteklenmiyor");
        return;
      }

      if (scheduleDays > reportDays) {
        showError("Gönderim aralığı rapor döneminden daha seyrek olamaz");
        return;
      }

      const payload = {
        reportTypes: [editDraft.reportType],
        mailGroupIds: mailGroupIds.length ? mailGroupIds : undefined,
        emails: emails.length ? emails : undefined,
        projectIds:
          editDraft.reportType === "TARGETS"
            ? [...editDraft.selectedProjectIds]
            : undefined,
        intervalPreset: editDraft.autoMailIntervalPreset,
        customEvery:
          editDraft.autoMailIntervalPreset === "CUSTOM"
            ? editDraft.autoMailCustomEvery
            : undefined,
        customUnit:
          editDraft.autoMailIntervalPreset === "CUSTOM"
            ? editDraft.autoMailCustomUnit
            : undefined,
        hour: editDraft.hour,
        minute: editDraft.minute,
        dayOfWeek:
          editDraft.uiIntervalPreset === "1W" || editDraft.autoMailIntervalPreset === "1W"
            ? editDraft.dayOfWeek
            : undefined,
        dayOfMonth:
          editDraft.uiIntervalPreset === "1M" || editDraft.autoMailIntervalPreset === "1M"
            ? editDraft.dayOfMonth
            : undefined,
      };

      await reportsApi.updateAutoMailSchedule(editDraft.scheduleId, payload);
      showSuccess("Otomatik mail ayarları güncellendi");

      await loadSchedules();
      closeRowEditor();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ??
          "Otomatik mail ayarları kaydedilirken bir hata oluştu",
      );
    } finally {
      setIsRowSaving(false);
    }
  };

  const getScheduleDeleteKey = (schedule: AutoMailSchedule) => {
    if (typeof schedule.id === "string" && schedule.id.trim()) return schedule.id;
    return "unknown";
  };

  const deleteSchedule = async (schedule: AutoMailSchedule, rowKey: string) => {
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
      if (expandedRowKey === rowKey) closeRowEditor();

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
              Yeni Ayar Oluştur
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Seçilen rapor tipleri belirlenen aralıkla otomatik gönderilir
            </p>
          </div>
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
                  const isExpanded = expandedRowKey === row.key;
                  const canInteract = !(isSaving || isDeleting || isRowSaving);

                  return [
                    <tr key={`${row.key}-row`} className="border-b border-outline-variant">
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
                            onClick={() => toggleRowEditor(row.key, row.schedule)}
                            disabled={!canInteract}
                            className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
                          >
                            {isExpanded ? "Kapat" : "Düzenle"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                rowKey: row.key,
                                schedule: row.schedule,
                                title: "Otomatik mail ayarını sil",
                                detail: row.reportTypesText,
                              })
                            }
                            disabled={isSaving || isDeleting || isRowSaving}
                            className="px-3 py-2 rounded-lg border border-error text-error hover:bg-red-100 transition-colors disabled:opacity-60"
                          >
                            {isDeleting ? "Siliniyor..." : "Sil"}
                          </button>
                        </div>
                      </td>
                    </tr>,
                    isExpanded ? (
                      <tr key={`${row.key}-edit`} className="border-b border-outline-variant">
                        <td colSpan={5} className="px-4 py-4 bg-surface">
                          {editDraft?.rowKey !== row.key ? (
                            <div className="text-sm text-on-surface-variant">
                              Düzenleme formu yüklenemedi.
                            </div>
                          ) : (
                            <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-on-surface">
                                    Ayarı Düzenle
                                  </div>
                                  <div className="text-xs text-on-surface-variant mt-1">
                                    Değişiklikleri bu satırdan kaydedin.
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={closeRowEditor}
                                  disabled={isRowSaving}
                                  className="px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
                                >
                                  Kapat
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                                  <label className="block text-sm font-semibold text-on-surface">
                                    Rapor Tipi
                                  </label>
                                  <select
                                    value={editDraft.reportType}
                                    onChange={(e) => {
                                      const nextType = e.target.value as AutoMailReportType;
                                      const nextPeriod =
                                        (allowedPeriodsByReportType[nextType] ?? [])[0] ??
                                        editDraft.reportPeriod;
                                      const desiredInterval = getUiIntervalPresetForPeriod(nextPeriod);
                                      setEditDraft((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          reportType: nextType,
                                          reportPeriod: nextPeriod,
                                          selectedProjectIds:
                                            nextType === "TARGETS"
                                              ? prev.selectedProjectIds
                                              : new Set(),
                                          projectsFilterText: "",
                                          uiIntervalPreset: desiredInterval,
                                          autoMailIntervalPreset:
                                            desiredInterval === "1Y" ? "CUSTOM" : desiredInterval,
                                          autoMailCustomEvery: desiredInterval === "1Y" ? 12 : 1,
                                          autoMailCustomUnit: desiredInterval === "1Y" ? "MONTH" : "WEEK",
                                        };
                                      });
                                    }}
                                    disabled={isRowSaving}
                                    className="mt-2 w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                                  >
                                    {autoMailReportTypeOptions.map((opt) => (
                                      <option key={opt.type} value={opt.type}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                                  <label className="block text-sm font-semibold text-on-surface">
                                    Rapor Dönemi
                                  </label>
                                  <select
                                    value={editDraft.reportPeriod}
                                    onChange={(e) => {
                                      const nextPeriod = e.target.value as AutoMailReportPeriod;
                                      const desiredInterval = getUiIntervalPresetForPeriod(nextPeriod);
                                      setEditDraft((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              reportPeriod: nextPeriod,
                                              uiIntervalPreset: desiredInterval,
                                              autoMailIntervalPreset:
                                                desiredInterval === "1Y" ? "CUSTOM" : desiredInterval,
                                              autoMailCustomEvery: desiredInterval === "1Y" ? 12 : 1,
                                              autoMailCustomUnit:
                                                desiredInterval === "1Y" ? "MONTH" : "WEEK",
                                            }
                                          : prev,
                                      );
                                    }}
                                    disabled={isRowSaving}
                                    className="mt-2 w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                                  >
                                    {editAllowedPeriodsForSelectedReport.map((p) => (
                                      <option key={p} value={p}>
                                        {periodLabels[p]}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                                  <div className="text-sm font-semibold text-on-surface">
                                    Gönderim Aralığı
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    {uiIntervalPresetOptions.map((option) => {
                                      const isAllowed = editAllowedUiIntervals.has(option.value);
                                      const isDisabled = isRowSaving || !isAllowed;
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
                                            name={`edit-interval-${row.key}`}
                                            checked={editDraft.uiIntervalPreset === option.value}
                                            onChange={() => applyEditUiIntervalPreset(option.value)}
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

                                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                                  <div className="text-sm font-semibold text-on-surface mb-3">
                                    Zamanlama
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs text-on-surface-variant mb-1">
                                        Saat
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={editDraft.hour}
                                        onChange={(e) =>
                                          setEditDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  hour: parseInt(e.target.value) || 0,
                                                }
                                              : prev,
                                          )
                                        }
                                        disabled={isRowSaving}
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
                                        value={editDraft.minute}
                                        onChange={(e) =>
                                          setEditDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  minute: parseInt(e.target.value) || 0,
                                                }
                                              : prev,
                                          )
                                        }
                                        disabled={isRowSaving}
                                        className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                                      />
                                    </div>
                                  </div>

                                  {(editDraft.uiIntervalPreset === "1W" ||
                                    editDraft.autoMailIntervalPreset === "1W") && (
                                    <div className="mb-3">
                                      <label className="block text-xs text-on-surface-variant mb-1">
                                        Haftanın Günü
                                      </label>
                                      <select
                                        value={editDraft.dayOfWeek}
                                        onChange={(e) =>
                                          setEditDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  dayOfWeek: parseInt(e.target.value),
                                                }
                                              : prev,
                                          )
                                        }
                                        disabled={isRowSaving}
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

                                  {(editDraft.uiIntervalPreset === "1M" ||
                                    editDraft.autoMailIntervalPreset === "1M") && (
                                    <div>
                                      <label className="block text-xs text-on-surface-variant mb-1">
                                        Ayın Günü
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={editDraft.dayOfMonth}
                                        onChange={(e) =>
                                          setEditDraft((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  dayOfMonth: parseInt(e.target.value) || 1,
                                                }
                                              : prev,
                                          )
                                        }
                                        disabled={isRowSaving}
                                        className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <label className="block text-sm font-semibold text-on-surface">
                                      Mail Grupları
                                    </label>
                                    <span className="text-xs text-on-surface-variant">
                                      {editDraft.selectedMailGroupIds.size} seçili
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <input
                                      value={editDraft.groupsFilterText}
                                      onChange={(e) =>
                                        setEditDraft((prev) =>
                                          prev ? { ...prev, groupsFilterText: e.target.value } : prev,
                                        )
                                      }
                                      disabled={isRowSaving || isMailGroupsLoading}
                                      className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                                      placeholder="Grup ara"
                                    />
                                  </div>

                                  <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-outline bg-surface">
                                    {isMailGroupsLoading ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Yükleniyor...
                                      </div>
                                    ) : editFilteredGroups.length === 0 ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Grup bulunamadı.
                                      </div>
                                    ) : (
                                      editFilteredGroups.map((g) => {
                                        const isChecked = editDraft.selectedMailGroupIds.has(g.id);
                                        return (
                                          <label
                                            key={g.id}
                                            className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleEditSelectedGroup(g.id)}
                                              disabled={isRowSaving}
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
                                      {editDraft.selectedUserIds.size} seçili
                                    </span>
                                  </div>

                                  <div className="mt-3">
                                    <input
                                      value={editDraft.usersFilterText}
                                      onChange={(e) =>
                                        setEditDraft((prev) =>
                                          prev ? { ...prev, usersFilterText: e.target.value } : prev,
                                        )
                                      }
                                      disabled={isRowSaving || isUsersLoading}
                                      className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                                      placeholder="İsim / kullanıcı adı / e-posta ara"
                                    />
                                  </div>

                                  <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-outline bg-surface">
                                    {isUsersLoading ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Yükleniyor...
                                      </div>
                                    ) : editFilteredUsers.length === 0 ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Kullanıcı bulunamadı.
                                      </div>
                                    ) : (
                                      editFilteredUsers.map((u) => {
                                        const isChecked = editDraft.selectedUserIds.has(u.id);
                                        return (
                                          <label
                                            key={u.id}
                                            className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleEditSelectedUser(u.id)}
                                              disabled={isRowSaving}
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

                              {editDraft.reportType === "TARGETS" && (
                                <div className="mt-4 rounded-lg border border-outline-variant bg-surface p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <label className="block text-sm font-semibold text-on-surface">
                                      Projeler
                                    </label>
                                    <span className="text-xs text-on-surface-variant">
                                      {editDraft.selectedProjectIds.size
                                        ? `${editDraft.selectedProjectIds.size} seçili`
                                        : "Tümü"}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-xs text-on-surface-variant">
                                    Proje seçmezseniz rapor tüm projeler için oluşturulur.
                                  </div>

                                  <div className="mt-3">
                                    <input
                                      value={editDraft.projectsFilterText}
                                      onChange={(e) =>
                                        setEditDraft((prev) =>
                                          prev
                                            ? { ...prev, projectsFilterText: e.target.value }
                                            : prev,
                                        )
                                      }
                                      disabled={isRowSaving || isProjectsLoading}
                                      className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
                                      placeholder="Proje ara"
                                    />
                                  </div>

                                  <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-outline bg-surface">
                                    {isProjectsLoading ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Yükleniyor...
                                      </div>
                                    ) : editFilteredProjects.length === 0 ? (
                                      <div className="p-4 text-sm text-on-surface-variant">
                                        Proje bulunamadı.
                                      </div>
                                    ) : (
                                      editFilteredProjects.map((p) => {
                                        const isChecked = editDraft.selectedProjectIds.has(p.id);
                                        return (
                                          <label
                                            key={p.id}
                                            className="flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => toggleEditSelectedProject(p.id)}
                                              disabled={isRowSaving}
                                              className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="min-w-0">
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

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="text-xs text-on-surface-variant">
                                  {editDraft.selectedMailGroupIds.size} grup •{" "}
                                  {editDraft.selectedUserIds.size} kullanıcı •{" "}
                                  {editSelectedEmails.length} e-posta
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={closeRowEditor}
                                    disabled={isRowSaving}
                                    className="px-4 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60"
                                  >
                                    Vazgeç
                                  </button>
                                  <button
                                    type="button"
                                    onClick={saveEditedSchedule}
                                    disabled={isRowSaving}
                                    className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
                                  >
                                    {isRowSaving ? "Kaydediliyor..." : "Kaydet"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null,
                  ];
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

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            if (scheduleBeingDeletedId) return;
            setDeleteConfirm(null);
          }}
        >
          <div
            className="bg-surface-container rounded-xl p-6 shadow-2xl max-w-md w-full border border-outline-variant"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-on-surface mb-2">
              {deleteConfirm.title}
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Bu ayarı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="mb-6 p-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface">
              {deleteConfirm.detail}
            </div>
            <div className="flex gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={scheduleBeingDeletedId !== null}
                className="flex-1 px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest)! transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const deletingKey = getScheduleDeleteKey(deleteConfirm.schedule);
                  if (scheduleBeingDeletedId === deletingKey) return;
                  await deleteSchedule(deleteConfirm.schedule, deleteConfirm.rowKey);
                  setDeleteConfirm(null);
                }}
                disabled={scheduleBeingDeletedId !== null}
                className="flex-1 px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {scheduleBeingDeletedId === getScheduleDeleteKey(deleteConfirm.schedule)
                  ? "Siliniyor..."
                  : "Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
