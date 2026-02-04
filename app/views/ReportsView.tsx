'use client';

import { useMemo, useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { reportsApi, Report, ReportType } from '@/lib/api/reports';
import { projectsApi, Project as ApiProject } from '@/lib/api/projects';
import { apiClient } from '@/lib/api-client';
import { usersApi, User as ApiUser } from '@/lib/api/users';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAuth } from '@/app/contexts/AuthContext';
import ExcelExportDialog from '@/app/components/dialogs/ExcelExportDialog';
import MissingTargetsExportDialog from '@/app/components/dialogs/MissingTargetsExportDialog';
import PerformanceReportDialog from '@/app/components/dialogs/PerformanceReportDialog';
import { mailsApi } from '@/lib/api/mails';

interface MailGroup {
  id: string;
  name: string;
  emails: string[];
}

export default function ReportsView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType>('TARGETS');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filename, setFilename] = useState('');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [showExcelExportDialog, setShowExcelExportDialog] = useState(false);
  const [showMissingTargetsDialog, setShowMissingTargetsDialog] =
    useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);

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
        const projs = await projectsApi.getMyProjects();
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
  }, [showError]);

  // Raporları yükle
  useEffect(() => {
    loadReports();
  }, []);

  // Rapor durumlarını polling ile kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      const processingReports = reports.filter(
        (r) => r.status === 'STARTED' || r.status === 'PROCESSING',
      );
      if (processingReports.length > 0) {
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
      showError('Raporlar yüklenirken bir hata oluştu');
      console.error('Failed to load reports:', error);
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

      const newReport = await reportsApi.createReport({
        type: selectedType,
        parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
        filename: filename || undefined,
      });

      setReports((prev) => [newReport, ...prev]);
      setShowCreateDialog(false);
      showSuccess('Rapor oluşturma isteği başarıyla gönderildi');

      // Formu sıfırla
      setSelectedType('TARGETS');
      setSelectedProjects([]);
      setStartDate('');
      setEndDate('');
      setFilename('');
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error) ?? 'Rapor oluşturulurken bir hata oluştu',
      );
    } finally {
      setIsCreating(false);
    }
  };

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
      const haystack = `${u.displayName ?? ''} ${u.username ?? ''} ${u.email ?? ''}`
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

  const reportTypeLabels: Record<ReportType, string> = {
    TARGETS: 'Hedef Raporu',
    PROJECTS: 'Proje Raporu',
    USERS: 'Kullanıcı Raporu',
    TEAM: 'Takım Raporu',
  };

  const handleExcelExportCompleted = (filePath: string) => {
    if (filePath) {
      showSuccess('Excel export başarıyla oluşturuldu');
    }
  };

  const handleMissingTargetsCompleted = (filePath: string) => {
    if (filePath) {
      showSuccess('Eksik hedef girişleri raporu başarıyla oluşturuldu');
    }
  };

  const handlePerformanceCompleted = (filePath: string) => {
    if (filePath) {
      showSuccess('Performans raporu başarıyla oluşturuldu');
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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          {/* RAPORLAR Bölümü */}
          <div className='bg-surface-container p-4 rounded-lg border border-outline-variant'>
            <h3 className='text-sm font-bold text-on-surface-variant uppercase mb-3'>
              RAPORLAR
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => setShowPerformanceDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant'
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
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant'
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
            </div>
          </div>

          {/* DIŞA AKTARMA Bölümü */}
          <div className='bg-surface-container p-4 rounded-lg border border-outline-variant'>
            <h3 className='text-sm font-bold text-on-surface-variant uppercase mb-3'>
              DIŞA AKTARMA
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => setShowExcelExportDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant'
              >
                <div className='flex items-center gap-3'>
                  <span className='text-xl'>📊</span>
                  <div>
                    <div className='font-semibold text-on-surface'>
                      Excel Export
                    </div>
                    <div className='text-xs text-on-surface-variant'>
                      Günlük veya haftalık Excel export
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setShowExcelExportDialog(true)}
                className='w-full px-4 py-3 bg-surface hover:bg-(--surface-container-high) rounded-lg text-left transition-colors border border-outline-variant'
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

          {/* CSV RAPORLAR Bölümü (Mevcut) */}
          <div className='bg-surface-container p-4 rounded-lg border border-outline-variant'>
            <h3 className='text-sm font-bold text-on-surface-variant uppercase mb-3'>
              CSV RAPORLAR
            </h3>
            <div className='space-y-2'>
              <button
                onClick={() => setShowCreateDialog(true)}
                className='w-full px-4 py-3 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium'
              >
                + Yeni Rapor Oluştur
              </button>
              <p className='text-xs text-on-surface-variant mt-2'>
                Hedef, proje, kullanıcı ve takım raporları
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rapor Listesi */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='bg-surface-container p-6 rounded-lg border border-outline-variant text-center'>
            <p className='text-on-surface-variant'>Yükleniyor...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className='bg-surface-container p-6 rounded-lg border border-outline-variant text-center'>
            <p className='text-on-surface-variant'>
              Henüz rapor oluşturulmamış
            </p>
          </div>
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
                      {reportTypeLabels[report.type]}
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
                    {new Date(report.createdAt).toLocaleString('tr-TR')}
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4'>
          <div className='bg-surface-container rounded-xl p-6 shadow-2xl max-w-3xl w-full border border-outline-variant'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-xl font-bold text-on-surface'>
                  Rapor Maili Gönder
                </h3>
                <p className='text-xs text-on-surface-variant mt-1'>
                  {reportTypeLabels[sendMailReport.type]} •{' '}
                  {new Date(sendMailReport.createdAt).toLocaleString('tr-TR')}
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
                <div className='rounded-lg border border-outline-variant bg-surface p-4'>
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
                      className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60'
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

                <div className='rounded-lg border border-outline-variant bg-surface p-4'>
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
                      className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60'
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
                                {u.displayName || u.username || 'Kullanıcı'}
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

      {/* Rapor Oluşturma Dialog */}
      {showCreateDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4'>
          <div className='bg-surface-container rounded-xl p-6 shadow-2xl max-w-2xl w-full border border-outline-variant'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-bold text-on-surface'>
                Yeni Rapor Oluştur
              </h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className='p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface-variant hover:text-(--on-surface)'
              >
                ✕
              </button>
            </div>

            <div className='space-y-5'>
              {/* Rapor Tipi */}
              <div>
                <label className='block text-sm font-semibold text-on-surface mb-2'>
                  Rapor Tipi <span className='text-error'>*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as ReportType)
                  }
                  className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all'
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
                <label className='block text-sm font-semibold text-on-surface mb-2'>
                  Projeler (Opsiyonel)
                </label>
                {projects.length > 0 ? (
                  <div className='max-h-48 overflow-y-auto border border-outline rounded-lg p-3 bg-surface'>
                    {projects.map((project) => {
                      const isSelected = selectedProjects.includes(project.id);
                      return (
                        <label
                          key={project.id}
                          className='flex items-center gap-2 p-2 hover:bg-(--surface-container-high) rounded cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects([
                                  ...selectedProjects,
                                  project.id,
                                ]);
                              } else {
                                setSelectedProjects(
                                  selectedProjects.filter(
                                    (id) => id !== project.id,
                                  ),
                                );
                              }
                            }}
                            className='w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary'
                          />
                          <span className='text-sm text-on-surface'>
                            {project.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className='border border-outline rounded-lg p-3 bg-surface-container-high'>
                    <p className='text-sm text-on-surface-variant'>
                      Proje bulunamadı veya yüklenemedi. Rapor tüm projeler için
                      oluşturulacak.
                    </p>
                  </div>
                )}
              </div>

              {/* Tarih Aralığı */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-on-surface mb-2'>
                    Başlangıç Tarihi (Opsiyonel)
                  </label>
                  <input
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-on-surface mb-2'>
                    Bitiş Tarihi (Opsiyonel)
                  </label>
                  <input
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all'
                  />
                </div>
              </div>

              {/* Dosya Adı */}
              <div>
                <label className='block text-sm font-semibold text-on-surface mb-2'>
                  Dosya Adı (Opsiyonel)
                </label>
                <input
                  type='text'
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder='Dosya Adı (opsiyonel)'
                  className='w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                />
                <p className='mt-2 text-xs text-on-surface-variant'>
                  Boş bırakırsanız otomatik ad oluşturulur
                </p>
              </div>
            </div>

            <div className='flex gap-3 pt-6 mt-6 border-t border-outline-variant'>
              <button
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
                className='flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium hover:bg-(--surface-container-highest) transition-colors disabled:opacity-50'
              >
                İptal
              </button>
              <button
                onClick={handleCreateReport}
                disabled={isCreating}
                className='flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50'
              >
                {isCreating ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
              </button>
            </div>
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
        onExportCompleted={handleMissingTargetsCompleted}
      />

      {/* Performance Report Dialog */}
      <PerformanceReportDialog
        isOpen={showPerformanceDialog}
        onClose={() => setShowPerformanceDialog(false)}
        onExportCompleted={handlePerformanceCompleted}
      />
    </div>
  );
}
