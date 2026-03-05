'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import {
  reportsApi,
  Report,
  ReportType,
} from '@/lib/api/reports';
import { projectsApi, Project as ApiProject } from '@/lib/api/projects';
import { apiClient } from '@/lib/api-client';
import { usersApi, User as ApiUser } from '@/lib/api/users';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAuth } from '@/app/contexts/AuthContext';
import MissingTargetsExportDialog from '@/app/components/dialogs/MissingTargetsExportDialog';
import PerformanceReportDialog from '@/app/components/dialogs/PerformanceReportDialog';
import { mailsApi } from '@/lib/api/mails';
import { dateKeyLocal, formatDateTime } from '@/lib/date-time';

interface MailGroup {
  id: string;
  name: string;
  emails: string[];
}

export default function ReportsView() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { showSuccess, showError } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filename, setFilename] = useState('');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [showMissingTargetsDialog, setShowMissingTargetsDialog] =
    useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const [selectedPeriodType, setSelectedPeriodType] = useState<'daily' | 'weekly'>('weekly');
  const [selectedTeamProjects, setSelectedTeamProjects] = useState<string[]>([]);
  const [teamProjectSearchText, setTeamProjectSearchText] = useState('');
  const [targetsDate, setTargetsDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [includeAIReport, setIncludeAIReport] = useState(false);

  // Hafta seçeneklerini oluştur
  const getWeekOptions = (endOffsetDays = 6, labelSeparator = ' ') => {
    const options: Array<{ value: string; label: string }> = [];
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
    currentWeekStart.setHours(0, 0, 0, 0);

    // Güncel hafta
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + endOffsetDays);
    options.push({
      value: 'current',
      label: `Bu Hafta${labelSeparator}(${currentWeekStart.getDate().toString().padStart(2, '0')}.${(currentWeekStart.getMonth() + 1).toString().padStart(2, '0')}.${currentWeekStart.getFullYear()} - ${currentWeekEnd.getDate().toString().padStart(2, '0')}.${(currentWeekEnd.getMonth() + 1).toString().padStart(2, '0')}.${currentWeekEnd.getFullYear()})`,
    });

    // Geçmiş 52 hafta
    for (let i = 1; i <= 52; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - 7 * i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + endOffsetDays);
      options.push({
        value: `last${i}`,
        label: `${i} Hafta Öncesi${labelSeparator}(${weekStart.getDate().toString().padStart(2, '0')}.${(weekStart.getMonth() + 1).toString().padStart(2, '0')}.${weekStart.getFullYear()} - ${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}.${weekEnd.getFullYear()})`,
      });
    }

    return options;
  };

  // Hafta seçimine göre tarihleri hesapla
  const calculateWeekDates = (weekValue: string, endOffsetDays = 6) => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Pazartesi
    currentWeekStart.setHours(0, 0, 0, 0);

    let weekStart: Date;
    if (weekValue === 'current') {
      weekStart = new Date(currentWeekStart);
    } else {
      const weekNum = parseInt(weekValue.replace('last', ''));
      weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - 7 * weekNum);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + endOffsetDays);

    return {
      start: dateKeyLocal(weekStart),
      end: dateKeyLocal(weekEnd),
    };
  };

  const [showSendMailDialog, setShowSendMailDialog] = useState(false);
  const [sendMailReport, setSendMailReport] = useState<Report | null>(null);
  const [mailGroups, setMailGroups] = useState<MailGroup[]>([]);
  const [isMailGroupsLoading, setIsMailGroupsLoading] = useState(false);
  const [groupsFilterText, setGroupsFilterText] = useState('');
  const [selectedMailGroupIds, setSelectedMailGroupIds] = useState<Set<string>>(
    new Set(),
  );

  const [usersForMail, setUsersForMail] = useState<ApiUser[]>([]);
  const [isUsersForMailLoading, setIsUsersForMailLoading] = useState(false);
  const [usersFilterText, setUsersFilterText] = useState('');
  const [selectedUserIdsForMail, setSelectedUserIdsForMail] = useState<
    Set<string>
  >(new Set());
  const [isSendingMail, setIsSendingMail] = useState(false);

  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return undefined;
  };

  const reportsRequestInFlightRef = useRef(false);
  const loadReports = useCallback(
    async (options?: { silent?: boolean }) => {
      if (reportsRequestInFlightRef.current) return;
      reportsRequestInFlightRef.current = true;

      const silent = options?.silent ?? false;
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const data = await reportsApi.getMyReports();
        setReports(data);
      } catch (error: unknown) {
        showError('Raporlar yüklenirken bir hata oluştu');
        console.error('Failed to load reports:', error);
      } finally {
        reportsRequestInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    if (!showSendMailDialog) return;

    const loadGroups = async (): Promise<void> => {
      try {
        setIsMailGroupsLoading(true);
        const response = await apiClient.getClient().get<MailGroup[]>(
          '/mail-groups',
        );
        setMailGroups(response.data);
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? 'Mail grupları yüklenemedi');
      } finally {
        setIsMailGroupsLoading(false);
      }
    };

    const loadUsers = async (): Promise<void> => {
      try {
        setIsUsersForMailLoading(true);
        const apiUsers = await usersApi.getAllUsers();
        setUsersForMail(apiUsers.filter((u) => u.isActive));
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? 'Kullanıcılar yüklenemedi');
      } finally {
        setIsUsersForMailLoading(false);
      }
    };

    void Promise.all([loadGroups(), loadUsers()]);
  }, [showSendMailDialog, showError]);

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projs = isAdmin
          ? await projectsApi.getAllProjects()
          : await projectsApi.getMyProjects();
        setProjects(projs);
      } catch (error: unknown) {
        console.error('Failed to load projects:', error);
        // Projeler yüklenemezse boş array kullan, rapor oluşturma devam edebilir
        setProjects([]);
        // 403 hatası ise kullanıcıya bilgi ver
        if (isAxiosError(error) && error.response?.status === 403) {
          showError(
            'Projeler yüklenirken yetkilendirme hatası oluştu. Lütfen tekrar giriş yapın.',
          );
        }
      }
    };
    loadProjects();
  }, [isAdmin, showError]);

  // Raporları yükle
  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Rapor durumlarını polling ile kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      const processingReports = reports.filter(
        (r) => r.status === 'STARTED' || r.status === 'PROCESSING',
      );
      if (processingReports.length > 0) {
        void loadReports({ silent: true });
      }
    }, 3000); // 3 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [loadReports, reports]);


  const handleDownload = async (report: Report) => {
    try {
      const download = await reportsApi.getDownloadUrl(report.id);

      // Yeni pencerede indir
      const link = document.createElement('a');
      link.href = download.downloadUrl;
      link.download = download.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Rapor indiriliyor...');
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ?? 'Rapor indirilirken bir hata oluştu',
      );
    }
  };

  const handleSendMail = (report: Report) => {
    openSendMailDialog(report);
  };

  const toggleSelectedUserForMail = (userId: string) => {
    setSelectedUserIdsForMail((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const filteredUsersForMail = useMemo(() => {
    const needle = usersFilterText.trim().toLowerCase();
    if (!needle) return usersForMail;
    return usersForMail.filter((u) => {
      const haystack = `${u.displayName ?? ''} ${u.username ?? ''} ${u.email ?? ''} ${u.userTitle ?? ''}`
        .trim()
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [usersFilterText, usersForMail]);

  const toggleSelectedGroupForMail = (groupId: string) => {
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

  const filteredGroupsForMail = useMemo(() => {
    const needle = groupsFilterText.trim().toLowerCase();
    if (!needle) return mailGroups;
    return mailGroups.filter((g) => g.name.toLowerCase().includes(needle));
  }, [groupsFilterText, mailGroups]);

  const selectedEmailsForMail = useMemo(() => {
    const normalizedEmails = new Set<string>();

    for (const u of usersForMail) {
      if (!selectedUserIdsForMail.has(u.id)) continue;
      const normalized = u.email.trim().toLowerCase();
      if (!normalized) continue;
      normalizedEmails.add(normalized);
    }

    return [...normalizedEmails].sort((a, b) => a.localeCompare(b, 'tr-TR'));
  }, [selectedUserIdsForMail, usersForMail]);

  const sendMail = async () => {
    if (!sendMailReport) return;

    try {
      setIsSendingMail(true);

      if (selectedMailGroupIds.size === 0 && selectedUserIdsForMail.size === 0) {
        showError('Lütfen en az bir mail grubu veya kullanıcı seçin');
        return;
      }

      const mailGroupIds = [...selectedMailGroupIds];
      const emails = selectedEmailsForMail;

      await mailsApi.sendReportMail(sendMailReport.id, {
        mailGroupIds: mailGroupIds.length ? mailGroupIds : undefined,
        emails: emails.length ? emails : undefined,
      });
      showSuccess('Rapor maili başarıyla gönderildi');
      closeSendMailDialog();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ?? 'Rapor maili gönderilirken bir hata oluştu',
      );
    } finally {
      setIsSendingMail(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      STARTED: 'Başlatıldı',
      PROCESSING: 'Oluşturuluyor',
      READY: 'İndirilebilir',
      FAILED: 'Başarısız',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      STARTED: 'bg-primary/20 text-primary',
      PROCESSING: 'bg-warning/20 text-warning',
      READY: 'bg-success/20 text-success',
      FAILED: 'bg-error/20 text-error',
    };
    return (
      colors[status] || 'bg-surface-container-high text-on-surface-variant'
    );
  };

  const closeSendMailDialog = () => {
    if (isSendingMail) return;
    setShowSendMailDialog(false);
    setSendMailReport(null);
    setGroupsFilterText('');
    setSelectedMailGroupIds(new Set());
    setUsersFilterText('');
    setSelectedUserIdsForMail(new Set());
  };

  const filteredProjectsForTargets = useMemo(() => {
    const query = teamProjectSearchText.trim().toLocaleLowerCase('tr-TR');
    if (!query) return projects;
    return projects.filter((project) => {
      const name = (project.name ?? '').toLocaleLowerCase('tr-TR');
      const category = (project.category ?? '').toLocaleLowerCase('tr-TR');
      return name.includes(query) || category.includes(query);
    });
  }, [projects, teamProjectSearchText]);

  const closeTargetsDialog = () => {
    setShowTargetsDialog(false);
    setSelectedPeriodType('weekly');
    setSelectedTeamProjects([]);
    setTeamProjectSearchText('');
    setTargetsDate('');
    setSelectedWeek('current');
    setIncludeAIReport(false);
    setFilename('');
  };

  const openSendMailDialog = (report: Report) => {
    setSendMailReport(report);
    setShowSendMailDialog(true);
    setIsSendingMail(false);
    setGroupsFilterText('');
    setSelectedMailGroupIds(
      report.mailGroupId ? new Set([report.mailGroupId]) : new Set(),
    );
    setUsersFilterText('');
    setSelectedUserIdsForMail(new Set());
  };

  const reportTypeLabels: Record<string, string> = {
    TARGETS: 'Hedef Raporu',
    PROJECTS: 'Proje Raporu',
    PROJECT: 'Proje Raporu',
    USERS: 'Kullanıcı Raporu',
    USER: 'Kullanıcı Raporu',
    TEAM: 'Takım Raporu',
    TEAMS: 'Takım Raporu',
    PERFORMANCE: 'Performans Raporu',
    MISSING_TARGETS: 'Hedef Eksiklikleri Raporu',
    WEEKLY_AI_SUMMARY: 'Haftalık AI Özeti',
  };

  const getReportTypeLabel = (type: string) => {
    return reportTypeLabels[type] ?? reportTypeLabels[type.toUpperCase()] ?? type;
  };

  const handleMissingTargetsCompleted = (reportId: string) => {
    if (reportId) {
      // Raporları yeniden yükle
      void loadReports({ silent: true });
    }
  };

  const handlePerformanceCompleted = (reportId: string) => {
    if (reportId) {
      // Raporları yeniden yükle
      void loadReports({ silent: true });
    }
  };

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-2xl font-bold text-on-surface mb-2'>
              Raporlama
            </h2>
            <p className='text-on-surface-variant'>
              Hedef verilerinizi Excel formatında export edin ve indirin
            </p>
          </div>
        </div>

        {/* Hızlı Erişim Butonları */}
        <div className='mb-6'>
          {/* RAPORLAR Bölümü */}
          <div className='bg-surface-container p-4 rounded-lg border border-outline-variant'>
            <h3 className='text-sm font-bold text-on-surface-variant uppercase mb-3'>
              RAPORLAR
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <button
                onClick={() => setShowPerformanceDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high)! rounded-lg text-left transition-colors border border-outline-variant'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xl'>📈</span>
                  <div>
                    <div className='font-semibold text-on-surface'>
                      Performans Raporları
                    </div>
                    <div className='text-xs text-on-surface-variant'>
                      Aylık takım performans raporları
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setShowMissingTargetsDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high)! rounded-lg text-left transition-colors border border-outline-variant'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xl'>⚠️</span>
                  <div>
                    <div className='font-semibold text-on-surface'>
                      Hedef Eksiklikleri
                    </div>
                    <div className='text-xs text-on-surface-variant'>
                      Eksik hedef girişleri raporu
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setShowTargetsDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high)! rounded-lg text-left transition-colors border border-outline-variant'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xl'>🎯</span>
                  <div>
                    <div className='font-semibold text-on-surface'>
                      Hedefler
                    </div>
                    <div className='text-xs text-on-surface-variant'>
                      Haftalık raporda AI özeti ekleyebilirsiniz
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* DIŞA AKTARMA Bölümü */}
          <div className='bg-surface-container p-4 rounded-lg border border-outline-variant mt-4'>
            <h3 className='text-sm font-bold text-on-surface-variant uppercase mb-3'>
              DIŞA AKTARMA
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => router.push('/mail-settings')}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high)! rounded-lg text-left transition-colors border border-outline-variant'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xl'>✉️</span>
                  <div>
                    <div className='font-semibold text-on-surface'>
                      Otomatik Mail Gönderme Aralıklarını Ayarla
                    </div>
                    <div className='text-xs text-on-surface-variant'>
                      Oluşturulan raporları düzenli aralıklarla mail olarak gönder
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rapor Listesi */}
      <div className='space-y-4'>
        {reports.length === 0 ? (
          isLoading ? (
            <div className='bg-surface-container p-6 rounded-lg border border-outline-variant text-center'>
              <p className='text-on-surface-variant'>Yükleniyor...</p>
            </div>
          ) : (
            <div className='bg-surface-container p-6 rounded-lg border border-outline-variant text-center'>
              <p className='text-on-surface-variant'>
                Henüz rapor oluşturulmamış
              </p>
            </div>
          )
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className='bg-surface-container p-6 rounded-lg border border-outline-variant'
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-lg font-semibold text-on-surface'>
                      {getReportTypeLabel(report.type)}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                        report.status,
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <p className='text-sm text-on-surface-variant mb-2'>
                    Oluşturulma:{' '}
                    {formatDateTime(report.createdAt)}
                  </p>
                  {report.status === 'READY' && report.fileName && (
                    <p className='text-sm text-on-surface-variant'>
                      Dosya: {report.fileName}
                    </p>
                  )}
                  {report.status === 'FAILED' && report.errorMessage && (
                    <p className='text-sm text-error mt-2'>
                      Hata: {report.errorMessage}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  {report.status === 'READY' && (
                    <>
                      <button
                        onClick={() => handleSendMail(report)}
                        className='px-4 py-2 bg-(--error)! text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium'
                      >
                        Mail
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className='px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium'
                      >
                        İndir
                      </button>
                    </>
                  )}
                  {(report.status === 'STARTED' ||
                    report.status === 'PROCESSING') && (
                    <div className='px-4 py-2 bg-surface-container-high rounded-lg text-on-surface-variant'>
                      Hazırlanıyor...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mail Gönder Dialog */}
      {showSendMailDialog && sendMailReport && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4'
          onClick={closeSendMailDialog}
        >
          <div
            className='bg-surface-container rounded-xl p-5 shadow-2xl max-w-2xl w-full border border-outline-variant max-h-[85vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-5'>
              <div>
                <h3 className='text-xl font-bold text-on-surface'>
                  Rapor Maili Gönder
                </h3>
                <p className='text-xs text-on-surface-variant mt-1'>
                  {getReportTypeLabel(sendMailReport.type)} •{' '}
                  {formatDateTime(sendMailReport.createdAt)}
                </p>
              </div>
              <button
                onClick={closeSendMailDialog}
                disabled={isSendingMail}
                className='p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface) disabled:opacity-50'
              >
                ✕
              </button>
            </div>

            <div className='space-y-5'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='rounded-lg border border-outline-variant bg-surface p-3'>
                  <div className='flex items-center justify-between gap-4'>
                    <label className='block text-sm font-semibold text-on-surface'>
                      Mail Grupları
                    </label>
                    <span className='text-xs text-on-surface-variant'>
                      {selectedMailGroupIds.size} seçili
                    </span>
                  </div>

                  <div className='mt-3'>
                    <input
                      value={groupsFilterText}
                      onChange={(e) => setGroupsFilterText(e.target.value)}
                      disabled={isSendingMail || isMailGroupsLoading}
                      className='w-full px-3 py-2.5 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 text-sm'
                      placeholder='Grup ara'
                    />
                  </div>

                  <div className='mt-3 max-h-64 overflow-y-auto rounded-lg border border-outline bg-surface'>
                    {isMailGroupsLoading ? (
                      <div className='p-4 text-sm text-on-surface-variant'>
                        Yükleniyor...
                      </div>
                    ) : filteredGroupsForMail.length === 0 ? (
                      <div className='p-4 text-sm text-on-surface-variant'>
                        Mail grubu bulunamadı.
                      </div>
                    ) : (
                      [...filteredGroupsForMail]
                        .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
                        .map((g) => {
                          const isChecked = selectedMailGroupIds.has(g.id);
                          return (
                            <label
                              key={g.id}
                              className='flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer'
                            >
                              <input
                                type='checkbox'
                                checked={isChecked}
                                onChange={() => toggleSelectedGroupForMail(g.id)}
                                disabled={isSendingMail}
                                className='w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary'
                              />
                              <div className='min-w-0 flex-1'>
                                <div className='text-sm font-medium text-on-surface truncate'>
                                  {g.name}
                                </div>
                                <div className='text-xs text-on-surface-variant truncate'>
                                  {g.emails.length} e-posta
                                </div>
                              </div>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>

                <div className='rounded-lg border border-outline-variant bg-surface p-3'>
                  <div className='flex items-center justify-between gap-4'>
                    <label className='block text-sm font-semibold text-on-surface'>
                      Kullanıcılar
                    </label>
                    <span className='text-xs text-on-surface-variant'>
                      {selectedUserIdsForMail.size} seçili
                    </span>
                  </div>

                  <div className='mt-3'>
                    <input
                      value={usersFilterText}
                      onChange={(e) => setUsersFilterText(e.target.value)}
                      disabled={isSendingMail || isUsersForMailLoading}
                      className='w-full px-3 py-2.5 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 text-sm'
                      placeholder='İsim / kullanıcı adı / e-posta ara'
                    />
                  </div>

                  <div className='mt-3 max-h-64 overflow-y-auto rounded-lg border border-outline bg-surface'>
                    {isUsersForMailLoading ? (
                      <div className='p-4 text-sm text-on-surface-variant'>
                        Yükleniyor...
                      </div>
                    ) : filteredUsersForMail.length === 0 ? (
                      <div className='p-4 text-sm text-on-surface-variant'>
                        Kullanıcı bulunamadı.
                      </div>
                    ) : (
                      filteredUsersForMail.map((u) => {
                        const isChecked = selectedUserIdsForMail.has(u.id);
                        return (
                          <label
                            key={u.id}
                            className='flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 hover:bg-(--surface-container-high) cursor-pointer'
                          >
                            <input
                              type='checkbox'
                              checked={isChecked}
                              onChange={() => toggleSelectedUserForMail(u.id)}
                              disabled={isSendingMail}
                              className='w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary'
                            />
                            <div className='min-w-0'>
                              <div className='text-sm font-medium text-on-surface truncate'>
                                {`${u.displayName || u.username || 'Kullanıcı'}${u.userTitle ? ` - ${u.userTitle}` : ''}`}
                              </div>
                              <div className='text-xs text-on-surface-variant truncate'>
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

              <div className='rounded-lg border border-outline-variant bg-surface p-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='text-sm font-semibold text-on-surface'>
                    Alıcı Özeti
                  </div>
                  <span className='text-xs text-on-surface-variant'>
                    {selectedEmailsForMail.length} e-posta
                  </span>
                </div>
                <div className='mt-3 text-xs text-on-surface-variant'>
                  {selectedMailGroupIds.size} grup • {selectedUserIdsForMail.size} kullanıcı
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={closeSendMailDialog}
                  disabled={isSendingMail}
                  className='px-4 py-2 border border-outline text-on-surface rounded-lg hover:bg-(--surface-container-high) transition-colors disabled:opacity-60'
                >
                  Vazgeç
                </button>
                <button
                  type='button'
                  onClick={sendMail}
                  disabled={isSendingMail}
                  className='px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-60'
                >
                  {isSendingMail ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Targets Export Dialog */}
      <MissingTargetsExportDialog
        isOpen={showMissingTargetsDialog}
        onClose={() => setShowMissingTargetsDialog(false)}
        onExportCompleted={handleMissingTargetsCompleted}
      />

      {/* Performance Report Dialog */}
      <PerformanceReportDialog
        isOpen={showPerformanceDialog}
        onClose={() => setShowPerformanceDialog(false)}
        onExportCompleted={handlePerformanceCompleted}
      />

      {/* Hedefler Dialog */}
      {showTargetsDialog && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4'
          onClick={closeTargetsDialog}
        >
          <div
            className='bg-surface-container rounded-2xl shadow-2xl max-w-xl w-full border border-outline-variant overflow-hidden max-h-[85vh] flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='bg-gradient-to-r from-primary-container to-primary-container/80 p-4 border-b border-outline-variant'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg'>
                    <span className='text-2xl'>🎯</span>
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-on-surface'>
                      Hedef Raporu Oluştur
                    </h3>
                    <p className='text-xs text-on-surface-variant mt-1'>
                      Hedef verilerinizi rapor olarak oluşturun
                    </p>
                  </div>
                </div>
                <button
                onClick={closeTargetsDialog}
                  disabled={isCreating}
                  className='w-10 h-10 flex items-center justify-center hover:bg-black/10 rounded-lg transition-colors text-on-surface-variant hover:text-on-surface disabled:opacity-50'
                >
                  <span className='text-xl'>✕</span>
                </button>
              </div>
            </div>

            <div className='p-4 space-y-4 overflow-y-auto flex-1'>
              {/* Periyot Tipi */}
              <div>
                <label className='block text-sm font-bold text-on-surface mb-4'>
                  Rapor Periyodu <span className='text-error'>*</span>
                </label>
                <div className='grid grid-cols-2 gap-4'>
                  <button
                    onClick={() => {
                      setSelectedPeriodType('daily');
                      setIncludeAIReport(false);
                    }}
                    disabled={isCreating}
                    className={`group relative px-4 py-4 rounded-xl border-2 transition-all duration-200 font-semibold overflow-hidden ${
                      selectedPeriodType === 'daily'
                        ? 'border-primary bg-primary-container text-primary shadow-lg scale-105'
                        : 'border-outline-variant bg-surface text-on-surface hover:border-primary hover:shadow-md hover:scale-[1.02]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <span className='text-2xl'>📅</span>
                      <span>Günlük</span>
                    </div>
                    {selectedPeriodType === 'daily' && (
                      <div className='absolute inset-0 bg-primary/5 pointer-events-none' />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedPeriodType('weekly')}
                    disabled={isCreating}
                    className={`group relative px-4 py-4 rounded-xl border-2 transition-all duration-200 font-semibold overflow-hidden ${
                      selectedPeriodType === 'weekly'
                        ? 'border-primary bg-primary-container text-primary shadow-lg scale-105'
                        : 'border-outline-variant bg-surface text-on-surface hover:border-primary hover:shadow-md hover:scale-[1.02]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className='flex flex-col items-center gap-2'>
                      <span className='text-2xl'>📆</span>
                      <span>Haftalık</span>
                    </div>
                    {selectedPeriodType === 'weekly' && (
                      <div className='absolute inset-0 bg-primary/5 pointer-events-none' />
                    )}
                  </button>
                </div>
              </div>

              {/* Tarih/Hafta Seçimi */}
              {selectedPeriodType === 'daily' ? (
                <div className='bg-surface rounded-xl p-4 border border-outline-variant'>
                  <label className='block text-sm font-bold text-on-surface mb-3'>
                    📅 Tarih <span className='text-error'>*</span>
                  </label>
                  <input
                    type='date'
                    value={targetsDate}
                    onChange={(e) => setTargetsDate(e.target.value)}
                    disabled={isCreating}
                    className='w-full px-3 py-2.5 bg-surface-container border-2 border-outline rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 font-medium text-sm'
                  />
                </div>
              ) : (
                <div className='bg-surface rounded-xl p-4 border border-outline-variant'>
                  <label className='block text-sm font-bold text-on-surface mb-3'>
                    📆 Hafta Seçimi <span className='text-error'>*</span>
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => {
                      setSelectedWeek(e.target.value);
                      const weekDates = calculateWeekDates(e.target.value);
                      setTargetsDate(weekDates.start); // Başlangıç tarihini sakla
                    }}
                    disabled={isCreating}
                    className='w-full px-3 py-2.5 bg-surface-container border-2 border-outline rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 font-medium text-sm'
                  >
                    {getWeekOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className='mt-3 text-xs text-on-surface-variant flex items-center gap-2'>
                    <span className='text-primary'>ℹ️</span>
                    Geçmiş 52 hafta (1 yıl) ve güncel hafta seçilebilir. Hafta Pazartesi-Pazar arasındadır.
                  </p>
                </div>
              )}

              {selectedPeriodType === 'weekly' && (
                <div className='bg-surface rounded-xl p-4 border border-outline-variant'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='min-w-0'>
                      <div className='text-sm font-bold text-on-surface'>
                        🤖 AI Özeti{' '}
                        <span className='text-xs font-normal text-on-surface-variant'>
                          (Opsiyonel)
                        </span>
                      </div>
                      <p className='mt-1 text-xs text-on-surface-variant flex items-center gap-2'>
                        <span className='text-primary'>ℹ️</span>
                        Sadece haftalık hedef raporlarında eklenebilir.
                      </p>
                    </div>
                    <label className='flex items-center gap-2 text-sm font-medium text-on-surface'>
                      <input
                        type='checkbox'
                        checked={includeAIReport}
                        onChange={(e) => setIncludeAIReport(e.target.checked)}
                        disabled={isCreating}
                        className='w-5 h-5 text-primary bg-surface border-2 border-outline rounded-md focus:ring-2 focus:ring-primary disabled:opacity-50'
                      />
                      Dahil Et
                    </label>
                  </div>
                </div>
              )}


              {/* Takım Seçimi */}
              <div className='bg-surface rounded-xl p-4 border border-outline-variant'>
                <div className='flex items-center justify-between mb-3'>
                  <label className='block text-sm font-bold text-on-surface'>
                    👥 Takım/Proje Seçimi
                  </label>
                  {selectedTeamProjects.length > 0 && (
                    <span className='text-xs px-3 py-1 bg-primary-container text-primary rounded-full font-medium'>
                      {selectedTeamProjects.length} seçili
                    </span>
                  )}
                </div>
                <p className='text-xs text-on-surface-variant mb-4'>
                  Seçmezseniz tüm takımlar için rapor oluşturulur
                </p>
                <div className='relative'>
                  <span className='absolute left-3 top-2.5 text-on-surface-variant'>
                    🔎
                  </span>
                  <input
                    value={teamProjectSearchText}
                    onChange={(e) => setTeamProjectSearchText(e.target.value)}
                    disabled={isCreating}
                    placeholder='Proje ara...'
                    className='w-full px-3 py-2.5 pl-9 pr-9 bg-surface-container border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 text-sm'
                  />
                  {teamProjectSearchText.trim() && (
                    <button
                      type='button'
                      onClick={() => setTeamProjectSearchText('')}
                      disabled={isCreating}
                      className='absolute right-2 top-2 p-1.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-md transition-colors disabled:opacity-50'
                    >
                      ✕
                    </button>
                  )}
                </div>

                {filteredProjectsForTargets.length > 0 ? (
                  <div className='max-h-64 overflow-y-auto space-y-2'>
                    {filteredProjectsForTargets.map((project) => {
                      const isSelected = selectedTeamProjects.includes(project.id);
                      return (
                        <label
                          key={project.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary-container/30 shadow-md'
                              : 'border-outline-variant bg-surface-container hover:border-primary/50 hover:shadow-sm'
                          }`}
                        >
                          <div className='relative'>
                            <input
                              type='checkbox'
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeamProjects([
                                    ...selectedTeamProjects,
                                    project.id,
                                  ]);
                                } else {
                                  setSelectedTeamProjects(
                                    selectedTeamProjects.filter(
                                      (id) => id !== project.id,
                                    ),
                                  );
                                }
                              }}
                              disabled={isCreating}
                              className='w-5 h-5 text-primary bg-surface border-2 border-outline rounded-md focus:ring-2 focus:ring-primary cursor-pointer disabled:cursor-not-allowed'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='text-sm font-semibold text-on-surface truncate'>
                              {project.name}
                            </div>
                            {project.category && (
                              <div className='text-xs text-on-surface-variant mt-1'>
                                {project.category}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className='w-6 h-6 rounded-full bg-primary flex items-center justify-center'>
                              <span className='text-white text-xs'>✓</span>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className='border-2 border-outline-variant rounded-xl p-4 bg-surface-container-high'>
                    <p className='text-sm text-on-surface-variant text-center'>
                      Proje bulunamadı.
                    </p>
                  </div>
                )}
              </div>

              {/* Dosya Adı */}
              <div className='bg-surface rounded-xl p-4 border border-outline-variant'>
                <label className='block text-sm font-bold text-on-surface mb-3'>
                  📄 Dosya Adı <span className='text-xs font-normal text-on-surface-variant'>(Opsiyonel)</span>
                </label>
                <input
                  type='text'
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder='Örn: Hedef_Raporu_Ocak_2026'
                  disabled={isCreating}
                  className='w-full px-3 py-2.5 bg-surface-container border-2 border-outline rounded-xl text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 font-medium text-sm'
                />
                <p className='mt-2 text-xs text-on-surface-variant flex items-center gap-2'>
                  <span>💡</span>
                  Boş bırakırsanız otomatik ad oluşturulur
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className='bg-surface-container-high px-4 py-3 border-t border-outline-variant flex gap-3'>
              <button
                onClick={closeTargetsDialog}
                disabled={isCreating}
                className='flex-1 px-4 py-3 bg-surface text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all disabled:opacity-50 border-2 border-outline-variant text-sm'
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  if (selectedPeriodType === 'daily' && !targetsDate) {
                    showError('Lütfen bir tarih seçin');
                    return;
                  }
                  if (selectedPeriodType === 'weekly' && !selectedWeek) {
                    showError('Lütfen bir hafta seçin');
                    return;
                  }

                  try {
                    setIsCreating(true);
                    const parameters: Record<string, unknown> = {};

                    if (selectedTeamProjects.length > 0) {
                      parameters.projectIds = selectedTeamProjects;
                    }

                    if (selectedPeriodType === 'daily') {
                      parameters.startDate = targetsDate;
                      parameters.endDate = targetsDate;
                    } else {
                      // Haftalık: Seçilen haftanın tarihlerini hesapla
                      const weekDates = calculateWeekDates(selectedWeek);
                      parameters.startDate = weekDates.start;
                      parameters.endDate = weekDates.end;
                    }

                    const newReport = await reportsApi.createReport({
                      type: 'TARGETS',
                      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
                      filename: filename || undefined,
                      includeAIReport: selectedPeriodType === 'weekly' ? includeAIReport : false,
                    });

                    setReports((prev) => [newReport, ...prev]);
                    closeTargetsDialog();
                    showSuccess('Hedef raporu oluşturma isteği başarıyla gönderildi');
                  } catch (error: unknown) {
                    showError(
                      getApiErrorMessage(error) ?? 'Rapor oluşturulurken bir hata oluştu',
                    );
                  } finally {
                    setIsCreating(false);
                  }
                }}
                disabled={isCreating}
                className='flex-1 px-4 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl text-sm'
              >
                {isCreating ? (
                  <span className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin'></div>
                    Oluşturuluyor...
                  </span>
                ) : (
                  '✨ Rapor Oluştur'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
