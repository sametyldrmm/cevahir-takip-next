'use client';

import { useState, useEffect } from 'react';
import { projectsApi, Project } from '@/lib/api/projects';
import { targetsApi, CreateTargetDto, GoalStatus } from '@/lib/api/targets';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useDialog } from '@/app/components/dialogs';
import { Dialog } from '@/app/components/dialogs';

const GOAL_STATUS_MAP: Record<string, GoalStatus> = {
  Belirlenmedi: 'NOT_SET',
  'Hedefime ulaştım': 'REACHED',
  'Hedefime kısmen ulaştım': 'PARTIAL',
  'Hedefime ulaşamadım': 'FAILED',
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

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

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

export default function TargetFormView() {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [draftsByProjectId, setDraftsByProjectId] = useState<
    Record<string, ProjectTargetDraft>
  >({});

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProjectId, setIsSubmittingProjectId] = useState<
    string | null
  >(null);

  const { showSuccess, showError } = useNotification();
  const dialog = useDialog();

  const isSubmittingAny = isSubmittingProjectId !== null;

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const data = await projectsApi.getMyProjects();
        setProjects(data);
      } catch (error: any) {
        showError('Projeler yüklenirken bir hata oluştu');
        console.error('Projects load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [showError]);

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
      setDraftsByProjectId((prev) => ({
        ...prev,
        [project.id]: createEmptyDraft(draft.date),
      }));
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Hedef kaydedilirken bir hata oluştu';
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
                      onChange={(e) =>
                        updateProjectDraft(project.id, { date: e.target.value })
                      }
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
                        onChange={(e) =>
                          updateProjectDraft(project.id, {
                            meetingStart: e.target.value,
                          })
                        }
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
                    disabled={isSubmittingAny || !draft.taskContent.trim()}
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

      <Dialog dialog={dialog.dialog} onClose={dialog.close} />
    </div>
  );
}
