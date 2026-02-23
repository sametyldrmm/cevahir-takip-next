'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi, Project } from '@/lib/api/projects';
import {
  targetsApi,
  AllowedTimeWindow,
  CreateTargetDto,
  GoalStatus,
  Target,
} from '@/lib/api/targets';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useDialog } from '@/app/components/dialogs';
import { Dialog } from '@/app/components/dialogs';
import EditTargetDialog from '@/app/components/dialogs/EditTargetDialog';
import { formatDateTime } from '@/lib/date-time';

const GOAL_STATUS_MAP: Record<string, GoalStatus> = {
  Belirlenmedi: 'NOT_SET',
  'Hedefime ulaştım': 'REACHED',
  'Hedefime kısmen ulaştım': 'PARTIAL',
  'Hedefime ulaşamadım': 'FAILED',
};

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  NOT_SET: 'Belirlenmedi',
  REACHED: 'Tamamlandı',
  PARTIAL: 'Kısmen',
  FAILED: 'Başarısız',
};

const GOAL_STATUS_BADGE_CLASSES: Record<GoalStatus, string> = {
  REACHED: 'bg-(--success)/20 text-success',
  PARTIAL: 'bg-(--warning)/20 text-warning',
  FAILED: 'bg-(--error)/20 text-error',
  NOT_SET: 'bg-surface-container-high text-on-surface-variant',
};

type ProjectTargetDraft = {
  date: string;
  taskContent: string;
  goalStatusLabel: string;
  block: string;
  floors: string;
  description: string;
  workStart: string;
  workEnd: string;
  meetingStart: string;
  meetingEnd: string;
};

const pad2 = (value: number) => String(value).padStart(2, '0');
const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const getTodayIsoDate = () => getLocalDateKey(new Date());

const getLocalMinutesOfDay = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const toMinutesOfDay = (hhmm: string) => {
  const parts = hhmm.split(':').map((v) => Number.parseInt(v, 10));
  if (parts.length !== 2) return null;
  const [hours, minutes] = parts;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const isMinutesInWindow = (nowMinutes: number, window: AllowedTimeWindow) => {
  const start = toMinutesOfDay(window.start);
  const end = toMinutesOfDay(window.end);
  if (start === null || end === null) return false;
  if (start <= end) return nowMinutes >= start && nowMinutes <= end;
  return nowMinutes >= start || nowMinutes <= end;
};

const parseAllowedWindowsFromMessage = (message: string): AllowedTimeWindow[] => {
  const matches = Array.from(message.matchAll(/(\d{2}:\d{2})-(\d{2}:\d{2})/g));
  return matches.map((match) => ({ start: match[1], end: match[2] }));
};

const createEmptyDraft = (date: string): ProjectTargetDraft => ({
  date,
  taskContent: '',
  goalStatusLabel: 'Devam ediyor',
  block: '',
  floors: '',
  description: '',
  workStart: '',
  workEnd: '',
  meetingStart: '',
  meetingEnd: '',
});

const createDefaultDraft = (): ProjectTargetDraft =>
  createEmptyDraft(getTodayIsoDate());

const MAX_SET_TIMEOUT_MS = 2_147_483_647;
const MEETING_REMINDER_OFFSET_MS = 5 * 60 * 1000;

const parseMeetingLocalDateTime = (dateIso: string, timeHHMM: string) => {
  const dateParts = dateIso.split('-').map((v) => Number.parseInt(v, 10));
  if (dateParts.length !== 3 || dateParts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const timeParts = timeHHMM.split(':').map((v) => Number.parseInt(v, 10));
  if (timeParts.length !== 2 || timeParts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const [year, month, day] = dateParts;
  const [hours, minutes] = timeParts;
  if (
    year < 1970 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export default function TargetFormView() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [allowedTimeWindows, setAllowedTimeWindows] = useState<
    AllowedTimeWindow[] | null
  >(null);
  const [allowedTimeWindowsText, setAllowedTimeWindowsText] = useState<
    string | null
  >(null);
  const [isWithinAllowedTimeWindow, setIsWithinAllowedTimeWindow] =
    useState(true);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [draftsByProjectId, setDraftsByProjectId] = useState<
    Record<string, ProjectTargetDraft>
  >({});

  const [myTargets, setMyTargets] = useState<Target[]>([]);
  const [isMyTargetsLoading, setIsMyTargetsLoading] = useState(false);
  const [isDeletingTargetId, setIsDeletingTargetId] = useState<string | null>(
    null,
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProjectId, setIsSubmittingProjectId] = useState<
    string | null
  >(null);

  const { showSuccess, showError, showWarning } = useNotification();
  const dialog = useDialog();

  const isSubmittingAny = isSubmittingProjectId !== null;

  const meetingReminderTimeoutByKey = useRef<Map<string, number>>(new Map());

  const triggerMeetingReminder = useCallback(
    (params: {
      projectId: string;
      projectName: string;
      dateIso: string;
      meetingStart: string;
      isSoon: boolean;
    }) => {
      const message = params.isSoon
        ? `${params.projectName} toplantısı birazdan başlıyor (${params.meetingStart})`
        : `${params.projectName} toplantısı 5 dakika sonra başlıyor (${params.meetingStart})`;

      void (async () => {
        try {
          if (
            typeof window === 'undefined' ||
            !('Notification' in window) ||
            Notification.permission !== 'granted' ||
            !('serviceWorker' in navigator)
          ) {
            return;
          }
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Toplantı Hatırlatma', {
            body: message,
            tag: `meeting-reminder-${params.projectId}-${params.dateIso}`,
            icon: '/favicon.png',
            badge: '/favicon.png',
            data: { url: '/target-form' },
            requireInteraction: false,
            silent: false,
          });
        } catch {
          return;
        }
      })();

      showWarning(message, { duration: 8000 });
    },
    [showWarning],
  );

  const clearMeetingReminder = useCallback(
    (params: { projectId: string; dateIso: string }) => {
      const key = `${params.projectId}|${params.dateIso}`;
      const existing = meetingReminderTimeoutByKey.current.get(key);
      if (existing !== undefined) {
        window.clearTimeout(existing);
        meetingReminderTimeoutByKey.current.delete(key);
      }
    },
    [],
  );

  const clearProjectMeetingReminders = useCallback(
    (projectId: string) => {
      for (const [key, timeoutId] of meetingReminderTimeoutByKey.current.entries()) {
        if (!key.startsWith(`${projectId}|`)) continue;
        window.clearTimeout(timeoutId);
        meetingReminderTimeoutByKey.current.delete(key);
      }
    },
    [],
  );

  const scheduleMeetingReminder = useCallback(
    (params: {
      projectId: string;
      projectName: string;
      dateIso: string;
      meetingStart: string;
    }) => {
      const meetingDateTime = parseMeetingLocalDateTime(
        params.dateIso,
        params.meetingStart,
      );
      if (!meetingDateTime) return;

      const now = Date.now();
      const meetingTimeMs = meetingDateTime.getTime();
      if (meetingTimeMs <= now) return;

      const reminderAtMs = meetingTimeMs - MEETING_REMINDER_OFFSET_MS;

      const key = `${params.projectId}|${params.dateIso}`;
      const existing = meetingReminderTimeoutByKey.current.get(key);
      if (existing !== undefined) {
        window.clearTimeout(existing);
        meetingReminderTimeoutByKey.current.delete(key);
      }

      if (reminderAtMs <= now) {
        triggerMeetingReminder({
          projectId: params.projectId,
          projectName: params.projectName,
          dateIso: params.dateIso,
          meetingStart: params.meetingStart,
          isSoon: true,
        });
        return;
      }

      const delay = reminderAtMs - now;
      if (delay > MAX_SET_TIMEOUT_MS) return;

      const timeoutId = window.setTimeout(() => {
        triggerMeetingReminder({
          projectId: params.projectId,
          projectName: params.projectName,
          dateIso: params.dateIso,
          meetingStart: params.meetingStart,
          isSoon: false,
        });
        meetingReminderTimeoutByKey.current.delete(key);
      }, delay);

      meetingReminderTimeoutByKey.current.set(key, timeoutId);
    },
    [triggerMeetingReminder],
  );

  useEffect(() => {
    const timeouts = meetingReminderTimeoutByKey.current;
    return () => {
      for (const timeoutId of timeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      timeouts.clear();
    };
  }, []);

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const data = isAdmin
          ? await projectsApi.getAllProjects()
          : await projectsApi.getMyProjects();
        setProjects(data);
      } catch (error: any) {
        showError('Projeler yüklenirken bir hata oluştu');
        console.error('Projects load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [isAdmin, showError]);

  const normalizeDateKey = useCallback((value: string | undefined) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const candidate = trimmed.split('T')[0]?.split(' ')[0];
    if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return getLocalDateKey(parsed);
      return candidate;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return getLocalDateKey(parsed);

    return null;
  }, []);

  const todayKey = getLocalDateKey(new Date());
  const yesterdayKey = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return getLocalDateKey(date);
  })();

  const canEditTargetStatus = (target: Target) => {
    if (isAdmin) return true;
    if (!user?.id) return false;
    if (target.userId !== user.id) return false;

    const targetDateKey = normalizeDateKey(target.date);
    if (!targetDateKey) return false;

    
    const statusNotSet = !target.goalStatus || target.goalStatus === 'NOT_SET';
    if (targetDateKey === todayKey && statusNotSet) return true;
    if (targetDateKey === yesterdayKey && statusNotSet) return true;

    return false;
  };

  const loadMyTargets = useCallback(async () => {
    try {
      setIsMyTargetsLoading(true);
      const data = await targetsApi.getMyTargets();
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setMyTargets(data);
    } catch (error) {
      showError('Hedefler yüklenirken bir hata oluştu');
      console.error('My targets load error:', error);
    } finally {
      setIsMyTargetsLoading(false);
    }
  }, [showError]);

  const confirmDeleteTarget = useCallback(
    (target: Target) => {
      if (!isAdmin) return;
      dialog.showConfirm(
        'Hedefi Sil',
        'Bu hedefi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        () => {
          void (async () => {
            try {
              setIsDeletingTargetId(target.id);
              await targetsApi.deleteTarget(target.id);
              showSuccess('Hedef başarıyla silindi');
              if (editingTarget?.id === target.id) {
                setShowEditDialog(false);
                setEditingTarget(null);
              }
              await loadMyTargets();
            } catch (error) {
              showError('Hedef silinirken bir hata oluştu');
              console.error('Target delete error:', error);
            } finally {
              setIsDeletingTargetId(null);
            }
          })();
        },
      );
    },
    [
      dialog,
      editingTarget?.id,
      isAdmin,
      loadMyTargets,
      showError,
      showSuccess,
    ],
  );

  useEffect(() => {
    void loadMyTargets();
  }, [loadMyTargets]);

  useEffect(() => {
    if (isAdmin) {
      setAllowedTimeWindows(null);
      setAllowedTimeWindowsText(null);
      setIsWithinAllowedTimeWindow(true);
      return;
    }

    const loadAllowedWindows = async () => {
      try {
        const response = await targetsApi.getAllowedTimeWindows();
        setAllowedTimeWindows(response.windows);
        setAllowedTimeWindowsText(
          response.windows.length > 0
            ? response.windows.map((w) => `${w.start}-${w.end}`).join(', ')
            : null,
        );
      } catch (error) {
        console.error('Allowed windows load error:', error);
      }
    };
    void loadAllowedWindows();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setIsWithinAllowedTimeWindow(true);
      return;
    }

    if (!allowedTimeWindows || allowedTimeWindows.length === 0) {
      setIsWithinAllowedTimeWindow(true);
      return;
    }

    const check = () => {
      const nowMinutes = getLocalMinutesOfDay();
      setIsWithinAllowedTimeWindow(
        allowedTimeWindows.some((window) => isMinutesInWindow(nowMinutes, window)),
      );
    };

    check();
    const intervalId = window.setInterval(check, 30_000);
    return () => window.clearInterval(intervalId);
  }, [allowedTimeWindows, isAdmin]);

  const createTargetPayload = (
    projectId: string,
    draft: ProjectTargetDraft,
  ): CreateTargetDto => ({
    date: draft.date,
    projectId,
    taskContent: draft.taskContent.trim(),
    block: draft.block.trim() || undefined,
    floors: draft.floors.trim() || undefined,
    goalStatus: GOAL_STATUS_MAP[draft.goalStatusLabel] || 'NOT_SET',
    description: draft.description.trim() || undefined,
    workStart: draft.workStart || undefined,
    workEnd: draft.workEnd || undefined,
    meetingStart: draft.meetingStart || undefined,
    meetingEnd: draft.meetingEnd || undefined,
  });

  const handleProjectSave = async (project: Project) => {
    const draft = draftsByProjectId[project.id] ?? createDefaultDraft();

    if (!draft.date) {
      showError('Lütfen tarih seçin');
      return;
    }

    if (!draft.taskContent.trim()) {
      showError('Lütfen iş içeriğini girin');
      return;
    }

    setIsSubmittingProjectId(project.id);

    try {
      await targetsApi.createTarget(createTargetPayload(project.id, draft));
      showSuccess(`${project.name} hedefi kaydedildi!`);
      if (draft.meetingStart) {
        scheduleMeetingReminder({
          projectId: project.id,
          projectName: project.name,
          dateIso: draft.date,
          meetingStart: draft.meetingStart,
        });
      }
      setDraftsByProjectId((prev) => ({
        ...prev,
        [project.id]: createEmptyDraft(draft.date),
      }));
      void loadMyTargets();
    } catch (error: any) {
      const status: number | undefined = error.response?.status;
      const rawMessage = error.response?.data?.message;
      const message =
        (typeof rawMessage === 'string' && rawMessage.trim()) ||
        'Hedef kaydedilirken bir hata oluştu';

      if (!isAdmin && status === 400) {
        try {
          const existingTargets = await targetsApi.getTargetsByDate(draft.date);
          const existing = existingTargets.find((t) => t.projectId === project.id);
          if (existing) {
            showWarning(message);
            setEditingTarget(existing);
            setShowEditDialog(true);
            return;
          }
        } catch (lookupError) {
          console.error('Existing target lookup error:', lookupError);
        }
        showError(message);
        console.error('Target save error:', error);
        return;
      }

      if (!isAdmin && status === 403 && typeof message === 'string') {
        const parsed = parseAllowedWindowsFromMessage(message);
        if (parsed.length > 0) {
          setAllowedTimeWindows(parsed);
          setAllowedTimeWindowsText(parsed.map((w) => `${w.start}-${w.end}`).join(', '));
          setIsWithinAllowedTimeWindow(false);
        }
        showError(message);
        console.error('Target save error:', error);
        return;
      }

      showError(message);
      console.error('Target save error:', error);
    } finally {
      setIsSubmittingProjectId(null);
    }
  };

  const handleProjectSelectionChange = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds((prev) =>
        prev.includes(projectId) ? prev : [...prev, projectId],
      );
      setDraftsByProjectId((prev) =>
        prev[projectId]
          ? prev
          : { ...prev, [projectId]: createDefaultDraft() },
      );
      return;
    }

    clearProjectMeetingReminders(projectId);
    setSelectedProjectIds((prev) => prev.filter((id) => id !== projectId));
    setDraftsByProjectId((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const updateProjectDraft = (
    projectId: string,
    patch: Partial<ProjectTargetDraft>,
  ) => {
    setDraftsByProjectId((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] ?? createDefaultDraft()), ...patch },
    }));
  };

  const selectedProjects = selectedProjectIds
    .map((projectId) => projects.find((project) => project.id === projectId))
    .filter((project): project is Project => !!project);

  const getTargetProjectsLabel = (target: Target) => {
    const names: string[] = [];

    if (target.projectId) {
      const project = projects.find((p) => p.id === target.projectId);
      if (project?.name) names.push(project.name);
    }

    if (target.selectedProjects && target.selectedProjects.length > 0) {
      for (const projectId of target.selectedProjects) {
        const project = projects.find((p) => p.id === projectId);
        if (project?.name) names.push(project.name);
      }
    }

    if (target.customProject?.trim()) names.push(target.customProject.trim());

    const unique = Array.from(new Set(names));
    return unique.length > 0 ? unique.join(', ') : '—';
  };

  if (!isAdmin && !isWithinAllowedTimeWindow && allowedTimeWindowsText) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4'>
        <div className='bg-surface-container rounded-xl p-6 shadow-2xl max-w-xl w-full border border-outline-variant'>
          <h3 className='text-xl font-bold text-on-surface mb-3'>
            Hedef girişi kapalı
          </h3>
          <p className='text-on-surface-variant'>
            Hedef girişi sadece şu saat aralıklarında yapılabilir:
          </p>
          <div className='mt-3 px-4 py-3 rounded-lg border border-outline bg-surface flex items-center justify-between gap-3'>
            <span className='text-sm font-semibold text-on-surface tracking-wide'>
              {allowedTimeWindowsText}
            </span>
          </div>
          <div className='flex justify-end mt-6'>
            <button
              type='button'
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                  return;
                }
                router.push('/dashboard');
              }}
              className='px-5 py-2.5 bg-surface text-on-surface rounded-lg border border-outline hover:bg-surface-container-high transition-colors font-medium'
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 w-full max-w-none'>
      {/* Proje Listesi */}
      <div
        id='project-list'
        className='mb-6 bg-surface-container rounded-xl p-4'
      >
        <div id='header'>
          <h2 className='text-2xl font-bold text-on-surface mb-2'>
            Proje Seçimi *
          </h2>
          <p className='mb-2'>Birden fazla proje seçebilirsiniz</p>
        </div>
        {isLoading ? (
          <div className='bg-surface p-4 rounded-lg text-on-surface-variant'>
            Projeler yükleniyor...
          </div>
        ) : (
          <div className='bg-surface flex flex-col gap-2 text-lg p-2 rounded-lg'>
            {projects.map((project) => {
              const inputId = `project-select-${project.id}`;
              const isSelected = selectedProjectIds.includes(project.id);
              return (
                <div key={project.id} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    id={inputId}
                    value={project.id}
                    checked={isSelected}
                    onChange={(e) =>
                      handleProjectSelectionChange(project.id, e.target.checked)
                    }
                    className='w-4 h-4'
                    disabled={isSubmittingAny}
                  />
                  <label className='cursor-pointer' htmlFor={inputId}>
                    {project.name} {project.code ? `(${project.code})` : ''}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='space-y-6'>
        <div className='bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm'>
          <h2 className='text-2xl font-bold text-on-surface mb-2'>
            Proje Hedefleri
          </h2>
          <p className='text-on-surface-variant'>
            Her proje için ayrı hedef girebilirsiniz - saat alanları isteğe
            bağlıdır.
          </p>
        </div>

        {selectedProjects.length === 0 ? (
          <div className='bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm text-center'>
            <p className='text-on-surface-variant'>
              Hedef girmek için yukarıdan proje seçin.
            </p>
          </div>
        ) : (
          <div className='grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]'>
            {selectedProjects.map((project) => {
              const draft = draftsByProjectId[project.id] ?? createDefaultDraft();
              const idPrefix = `project-target-${project.id}`;
              return (
                <div
                  key={project.id}
                  className='bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm space-y-6'
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <h3 className='text-lg font-semibold text-on-surface'>
                        {project.name}{' '}
                        {project.code ? `(${project.code})` : ''}
                      </h3>
                      <p className='text-sm text-on-surface-variant'>
                        Proje ID: {project.id}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        handleProjectSelectionChange(project.id, false)
                      }
                      className='px-3 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-(--surface-container-highest) transition-colors'
                      disabled={isSubmittingAny}
                    >
                      Kaldır
                    </button>
                  </div>

                  <div>
                    <label
                      className='block text-sm font-semibold text-on-surface mb-2'
                      htmlFor={`${idPrefix}-date`}
                    >
                      Tarih <span className='text-error'>*</span>
                    </label>
                    <input
                      id={`${idPrefix}-date`}
                      type='date'
                      value={draft.date}
                      onChange={(e) => {
                        const nextDate = e.target.value;
                        clearMeetingReminder({
                          projectId: project.id,
                          dateIso: draft.date,
                        });
                        updateProjectDraft(project.id, { date: nextDate });
                        if (draft.meetingStart) {
                          scheduleMeetingReminder({
                            projectId: project.id,
                            projectName: project.name,
                            dateIso: nextDate,
                            meetingStart: draft.meetingStart,
                          });
                        }
                      }}
                      className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                      required
                      disabled={isSubmittingAny}
                    />
                  </div>

                  <div>
                    <label
                      className='block text-sm font-semibold text-on-surface mb-2'
                      htmlFor={`${idPrefix}-task-content`}
                    >
                      İş İçeriği <span className='text-error'>*</span>
                    </label>
                    <textarea
                      id={`${idPrefix}-task-content`}
                      value={draft.taskContent}
                      onChange={(e) =>
                        updateProjectDraft(project.id, {
                          taskContent: e.target.value,
                        })
                      }
                      rows={4}
                      className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all'
                      placeholder='İş içeriğini girin'
                      required
                      disabled={isSubmittingAny}
                    />
                  </div>

                  <div>
                    <label
                      className='block text-sm font-semibold text-on-surface mb-2'
                      htmlFor={`${idPrefix}-description`}
                    >
                      Açıklama
                    </label>
                    <textarea
                      id={`${idPrefix}-description`}
                      value={draft.description}
                      onChange={(e) =>
                        updateProjectDraft(project.id, {
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all'
                      placeholder='Ek açıklamalar'
                      disabled={isSubmittingAny}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-block`}
                      >
                        Blok
                      </label>
                      <input
                        id={`${idPrefix}-block`}
                        type='text'
                        value={draft.block}
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            block: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        placeholder='Blok bilgisi'
                        disabled={isSubmittingAny}
                      />
                    </div>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-floors`}
                      >
                        Kat/Katlar
                      </label>
                      <input
                        id={`${idPrefix}-floors`}
                        type='text'
                        value={draft.floors}
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            floors: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        placeholder='Kat bilgisi'
                        disabled={isSubmittingAny}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-work-start`}
                      >
                        Çalışma Başlangıç (İsteğe bağlı)
                      </label>
                      <input
                        id={`${idPrefix}-work-start`}
                        type='time'
                        value={draft.workStart}
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            workStart: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        disabled={isSubmittingAny}
                      />
                    </div>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-work-end`}
                      >
                        Çalışma Bitiş (İsteğe bağlı)
                      </label>
                      <input
                        id={`${idPrefix}-work-end`}
                        type='time'
                        value={draft.workEnd}
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            workEnd: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        disabled={isSubmittingAny}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-meeting-start`}
                      >
                        Toplantı Başlangıç (İsteğe bağlı)
                      </label>
                      <input
                        id={`${idPrefix}-meeting-start`}
                        type='time'
                        value={draft.meetingStart}
                        onChange={(e) => {
                          const nextMeetingStart = e.target.value;
                          updateProjectDraft(project.id, {
                            meetingStart: nextMeetingStart,
                          });
                          if (nextMeetingStart) {
                            scheduleMeetingReminder({
                              projectId: project.id,
                              projectName: project.name,
                              dateIso: draft.date,
                              meetingStart: nextMeetingStart,
                            });
                            return;
                          }
                          clearMeetingReminder({
                            projectId: project.id,
                            dateIso: draft.date,
                          });
                        }}
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        disabled={isSubmittingAny}
                      />
                    </div>
                    <div>
                      <label
                        className='block text-sm font-semibold text-on-surface mb-2'
                        htmlFor={`${idPrefix}-meeting-end`}
                      >
                        Toplantı Bitiş (İsteğe bağlı)
                      </label>
                      <input
                        id={`${idPrefix}-meeting-end`}
                        type='time'
                        value={draft.meetingEnd}
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            meetingEnd: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        disabled={isSubmittingAny}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className='block text-sm font-semibold text-on-surface mb-2'
                      id={`${idPrefix}-goal-status-label`}
                    >
                      Hedef Durumu
                    </label>
                    <div
                      className='grid gap-3 sm:grid-cols-2'
                      role='radiogroup'
                      aria-labelledby={`${idPrefix}-goal-status-label`}
                    >
                      <div className='flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface'>
                        <input
                          id={`${idPrefix}-goal-status-not-set`}
                          type='radio'
                          name={`${idPrefix}-goal-status`}
                          value='Belirlenmedi'
                          checked={draft.goalStatusLabel === 'Belirlenmedi'}
                          onChange={() =>
                            updateProjectDraft(project.id, {
                              goalStatusLabel: 'Belirlenmedi',
                            })
                          }
                          className='h-5 w-5 accent-primary'
                          disabled={isSubmittingAny}
                        />
                        <label
                          htmlFor={`${idPrefix}-goal-status-not-set`}
                          className='text-sm font-medium text-on-surface cursor-pointer'
                        >
                          Belirlenmedi
                        </label>
                      </div>

                      <div className='flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface'>
                        <input
                          id={`${idPrefix}-goal-status-reached`}
                          type='radio'
                          name={`${idPrefix}-goal-status`}
                          value='Hedefime ulaştım'
                          checked={draft.goalStatusLabel === 'Hedefime ulaştım'}
                          onChange={() =>
                            updateProjectDraft(project.id, {
                              goalStatusLabel: 'Hedefime ulaştım',
                            })
                          }
                          className='h-5 w-5 accent-success'
                          disabled={isSubmittingAny}
                        />
                        <label
                          htmlFor={`${idPrefix}-goal-status-reached`}
                          className='text-sm font-medium text-success cursor-pointer'
                        >
                          Hedefime ulaştım
                        </label>
                      </div>

                      <div className='flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface'>
                        <input
                          id={`${idPrefix}-goal-status-partial`}
                          type='radio'
                          name={`${idPrefix}-goal-status`}
                          value='Hedefime kısmen ulaştım'
                          checked={
                            draft.goalStatusLabel === 'Hedefime kısmen ulaştım'
                          }
                          onChange={() =>
                            updateProjectDraft(project.id, {
                              goalStatusLabel: 'Hedefime kısmen ulaştım',
                            })
                          }
                          className='h-5 w-5 accent-warning'
                          disabled={isSubmittingAny}
                        />
                        <label
                          htmlFor={`${idPrefix}-goal-status-partial`}
                          className='text-sm font-medium text-warning cursor-pointer'
                        >
                          Hedefime kısmen ulaştım
                        </label>
                      </div>

                      <div className='flex items-center gap-3 p-3 rounded-lg border border-outline bg-surface'>
                        <input
                          id={`${idPrefix}-goal-status-failed`}
                          type='radio'
                          name={`${idPrefix}-goal-status`}
                          value='Hedefime ulaşamadım'
                          checked={draft.goalStatusLabel === 'Hedefime ulaşamadım'}
                          onChange={() =>
                            updateProjectDraft(project.id, {
                              goalStatusLabel: 'Hedefime ulaşamadım',
                            })
                          }
                          className='h-5 w-5 accent-error'
                          disabled={isSubmittingAny}
                        />
                        <label
                          htmlFor={`${idPrefix}-goal-status-failed`}
                          className='text-sm font-medium text-error cursor-pointer'
                        >
                          Hedefime ulaşamadım
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={() => handleProjectSave(project)}
                    disabled={
                      isSubmittingAny ||
                      !draft.taskContent.trim() ||
                      (!isAdmin && !isWithinAllowedTimeWindow)
                    }
                    className='w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmittingProjectId === project.id
                      ? 'Kaydediliyor...'
                      : 'Kaydet'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='mt-8 bg-surface-container rounded-xl p-4'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <h3 className='text-lg font-bold text-on-surface'>Hedeflerim</h3>
          <button
            type='button'
            onClick={() => void loadMyTargets()}
            disabled={isMyTargetsLoading}
            className='px-4 py-2 rounded-lg border border-outline bg-surface text-on-surface font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50'
          >
            Yenile
          </button>
        </div>

        {isMyTargetsLoading ? (
          <div className='bg-surface p-4 rounded-lg text-on-surface-variant'>
            Hedefler yükleniyor...
          </div>
        ) : myTargets.length === 0 ? (
          <div className='bg-surface p-4 rounded-lg text-on-surface-variant'>
            Henüz hedef bulunmuyor.
          </div>
        ) : (
          <div className='overflow-x-auto rounded-lg border border-outline bg-surface'>
            <table className='min-w-full text-sm'>
              <thead className='bg-surface-container-high text-on-surface'>
                <tr>
                  <th className='text-left font-semibold px-4 py-3 whitespace-nowrap'>
                    Tarih
                  </th>
                  <th className='text-left font-semibold px-4 py-3'>Proje</th>
                  <th className='text-left font-semibold px-4 py-3'>
                    İş İçeriği
                  </th>
                  <th className='text-left font-semibold px-4 py-3 whitespace-nowrap'>
                    Durum
                  </th>
                  <th className='text-left font-semibold px-4 py-3 whitespace-nowrap'>
                    Oluşturma
                  </th>
                  <th className='text-right font-semibold px-4 py-3 whitespace-nowrap'>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-outline-variant'>
                {myTargets.map((target) => {
                  const dateKey = normalizeDateKey(target.date) ?? target.date;
                  const statusLabel =
                    GOAL_STATUS_LABELS[target.goalStatus ?? 'NOT_SET'];
                  const createdAt = formatDateTime(target.createdAt);

                  const canEdit = canEditTargetStatus(target);
                  const isDeleting = isDeletingTargetId === target.id;

                  return (
                    <tr key={target.id} className='hover:bg-surface-container-high'>
                      <td className='px-4 py-3 text-on-surface whitespace-nowrap'>
                        {dateKey}
                      </td>
                      <td className='px-4 py-3 text-on-surface-variant'>
                        {getTargetProjectsLabel(target)}
                      </td>
                      <td className='px-4 py-3 text-on-surface'>
                        {target.taskContent?.trim() ? target.taskContent : '—'}
                      </td>
                      <td className='px-4 py-3 text-on-surface whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${GOAL_STATUS_BADGE_CLASSES[target.goalStatus ?? 'NOT_SET']}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-on-surface-variant whitespace-nowrap'>
                        {createdAt}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <div className='flex items-center justify-end gap-2'>
                          {canEdit && (
                            <button
                              type='button'
                              onClick={() => {
                                setEditingTarget(target);
                                setShowEditDialog(true);
                              }}
                              className='px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity'
                            >
                              {isAdmin ? 'Düzenle' : 'Durumu Güncelle'}
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type='button'
                              onClick={() => confirmDeleteTarget(target)}
                              disabled={isDeleting}
                              className='px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50'
                            >
                              {isDeleting ? 'Siliniyor...' : 'Sil'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog dialog={dialog.dialog} onClose={dialog.close} />
      {editingTarget && (
        <EditTargetDialog
          isOpen={showEditDialog}
          target={editingTarget}
          onClose={() => {
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
          onTargetUpdated={() => {
            showSuccess('Hedef başarıyla güncellendi');
            void loadMyTargets();
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
}
