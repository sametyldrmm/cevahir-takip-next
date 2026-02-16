'use client';

import { useState, useEffect, useMemo } from 'react';
import { targetsApi, TeamTarget } from '@/lib/api/targets';
import { projectsApi, Project } from '@/lib/api/projects';
import { usersApi } from '@/lib/api/users';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAuth } from '@/app/contexts/AuthContext';
import EditTargetDialog from '@/app/components/dialogs/EditTargetDialog';
import Image from 'next/image';
import userPng from '../../public/user.png';

export default function TeamTrackingView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [teamTargets, setTeamTargets] = useState<TeamTarget[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [areUserTitlesResolved, setAreUserTitlesResolved] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { showError, showSuccess } = useNotification();

  // Projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const teamData = isAdmin
          ? await projectsApi.getAllProjects()
          : await projectsApi.getMyTeam();
        setAllProjects(teamData);
      } catch (error: any) {
        console.error('Projects load error:', error);
        showError('Projeler yüklenirken bir hata oluştu');
      }
    };
    loadProjects();
  }, [isAdmin, showError]);

  // Unique kategorileri hesapla (backend'den gelen projelerden)
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    allProjects.forEach((p) => {
      const category = p.category || 'special';
      if (category) {
        uniqueCategories.add(category);
      }
    });

    // Kategorileri array'e çevir - direkt kategori değerini kullan
    return Array.from(uniqueCategories)
      .sort()
      .map((cat) => ({
        id: cat,
        name: cat, // Kategori ismini direkt göster
      }));
  }, [allProjects]);

  // Unique proje isimlerini hesapla
  const uniqueProjectNames = useMemo(() => {
    const uniqueNames = new Set<string>();
    allProjects.forEach((p) => {
      if (p.name) {
        uniqueNames.add(p.name);
      }
    });
    return Array.from(uniqueNames).sort();
  }, [allProjects]);

  // Kategori seçildiğinde projeleri filtrele
  const filteredProjects =
    selectedCategoryIds.size > 0
      ? allProjects.filter((p) =>
          selectedCategoryIds.has(p.category || 'special'),
        )
      : [];

  // Seçili projelerdeki kullanıcıları yükle
  useEffect(() => {
    if (selectedProjects.size === 0) {
      setUsers([]);
      setIsUsersLoading(false);
      setAreUserTitlesResolved(false);
      setSelectedUser('all');
      return;
    }

    const loadUsers = async () => {
      setSelectedUser('all');
      setIsUsersLoading(true);
      setAreUserTitlesResolved(false);
      try {
        const projectIds = Array.from(selectedProjects);
        const usersMap = new Map<string, any>();

        // Seçili projelerin kullanıcılarını topla
        allProjects
          .filter((p) => projectIds.includes(p.id))
          .forEach((project) => {
            if (project.users) {
              project.users.forEach((user) => {
                if (user.username && !usersMap.has(user.id)) {
                  usersMap.set(user.id, {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName || user.username,
                    userTitle: user.userTitle,
                  });
                }
              });
            }
          });

        const userLists = await Promise.all(
          projectIds.map((projectId) => usersApi.getTeamUsers(projectId)),
        );
        const combined = userLists.flat();
        for (const u of combined) {
          if (!u.id || !u.username) continue;
          const existing = usersMap.get(u.id) as
            | {
                id: string;
                username: string;
                displayName: string;
                userTitle?: string;
              }
            | undefined;

          usersMap.set(u.id, {
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.username,
            userTitle: u.userTitle || existing?.userTitle,
          });
        }

        setUsers(Array.from(usersMap.values()));
        setAreUserTitlesResolved(true);
      } catch (error: any) {
        console.error('Users load error:', error);
        setUsers([]);
        setAreUserTitlesResolved(false);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsers();
  }, [selectedProjects, allProjects]);

  // Hedefleri yükle
  useEffect(() => {
    const loadTargets = async () => {
      if (selectedProjects.size === 0) {
        setTeamTargets([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const projectIds = Array.from(selectedProjects);
        const date = selectedDate || undefined;

        const targets = await targetsApi.getTeamTargets(projectIds, date);
        setTeamTargets(targets);
      } catch (error: any) {
        console.error('Targets load error:', error);
        showError('Hedefler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadTargets();
  }, [selectedProjects, selectedDate, showError]);

  const handleCategorySelect = (categoryId: string) => {
    const nextCategoryIds = new Set(selectedCategoryIds);
    const isSelected = nextCategoryIds.has(categoryId);

    if (isSelected) {
      nextCategoryIds.delete(categoryId);
    } else {
      nextCategoryIds.add(categoryId);
    }

    setSelectedCategoryIds(nextCategoryIds);

    if (isSelected) {
      setSelectedProjects((prev) => {
        const nextProjects = new Set(prev);
        allProjects
          .filter((p) => (p.category || 'special') === categoryId)
          .forEach((p) => nextProjects.delete(p.id));
        return nextProjects;
      });
    }
  };

  // Proje seçimi
  const handleProjectSelect = (projectId: string, selected: boolean) => {
    const newSet = new Set(selectedProjects);
    if (selected) {
      newSet.add(projectId);
    } else {
      newSet.delete(projectId);
    }
    setSelectedProjects(newSet);
  };

  // Tümünü seç/temizle
  const handleSelectAll = () => {
    const allCategoryIds = new Set(categories.map((c) => c.id));
    const allProjectIds = new Set(allProjects.map((p) => p.id));
    const isAllSelected =
      selectedCategoryIds.size === allCategoryIds.size &&
      selectedProjects.size === allProjectIds.size &&
      allProjectIds.size > 0;

    if (isAllSelected) {
      setSelectedCategoryIds(new Set());
      setSelectedProjects(new Set());
      return;
    }

    setSelectedCategoryIds(allCategoryIds);
    setSelectedProjects(allProjectIds);
  };

  const handleClearAll = () => {
    setSelectedProjects(new Set());
    setSelectedCategoryIds(new Set());
  };

  // Filtreleme
  const filteredTargets = teamTargets.filter((target) => {
    if (selectedUser !== 'all' && target.username !== selectedUser)
      return false;
    return true;
  });

  // Projeye göre grupla
  const targetsByProject = filteredTargets.reduce(
    (acc, target) => {
      const projectId = target.selectedProjects?.[0];
      if (!projectId) {
        const key = 'Belirtilmemiş';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(target);
        return acc;
      }
      
      // Proje ID'sinden proje ismini bul
      const project = allProjects.find((p) => p.id === projectId);
      const projectName = project?.name || project?.code || projectId;
      
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(target);
      return acc;
    },
    {} as Record<string, TeamTarget[]>,
  );

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-on-surface mb-2 flex items-center gap-2'>
          <span>👥</span>
          <span>Takım Takibi</span>
        </h2>
        <p className='text-sm text-on-surface-variant'>
          Klasör seçin ve proje kartlarından takım arkadaşlarınızı takip edin
        </p>
      </div>

      {/* Project Filter Section */}
      <div className='bg-surface-container p-4 rounded-lg border border-outline-variant mb-6'>
        <div className='flex items-center gap-2 mb-4'>
          <span className='text-sm font-semibold text-on-surface-variant'>
            🔍
          </span>
          <h3 className='text-lg font-semibold text-on-surface'>
            Project Filter
          </h3>
        </div>

        <div className='flex gap-2 float-right'>
          <button
            onClick={handleSelectAll}
            className='px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity text-sm font-medium'
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className='px-4 py-2 bg-surface-container-high text-on-surface rounded-lg hover:bg-(--surface-container) transition-colors text-sm font-medium'
          >
            Clear
          </button>
        </div>

        {/* Kategori Butonları - Dinamik olarak backend'den gelen unique kategoriler */}
        <div className='flex flex-wrap gap-3 mb-4'>
          {categories.length === 0 ? (
            <p className='text-sm text-on-surface-variant'>
              Kategori bulunamadı
            </p>
          ) : (
            categories.map((category) => {
              const categoryProjects = allProjects.filter(
                (p) => (p.category || 'special') === category.id,
              );
              const isSelected = selectedCategoryIds.has(category.id);

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary font-bold'
                      : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-(--surface-container-high)'
                  }`}
                >
                  <div className='text-center'>
                    <div className='text-sm font-medium'>{category.name}</div>
                    <div className='text-xs px-2 py-1 bg-surface-container-high rounded mt-1'>
                      {categoryProjects.length} projects
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Proje Seçimi (Kategori seçildiyse göster) */}
        {selectedCategoryIds.size > 0 && (
          <>
            <div className='flex items-center gap-2 mb-4'>
              <span className='text-sm text-on-surface-variant ml-auto'>
                {selectedProjects.size} / {filteredProjects.length} projects
              </span>
            </div>

            {/* Proje Kartları */}
            <div className='flex flex-wrap gap-2'>
              {filteredProjects.map((project) => {
                const isSelected = selectedProjects.has(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id, !isSelected)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-(--surface-container-high)'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => {}}
                      className='w-4 h-4'
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className='text-sm font-medium'>{project.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Takım Bilgileri (Proje seçildiyse göster) */}
      {selectedProjects.size > 0 && (
        <div className='mb-6'>
          <div className='flex items-center gap-4 mb-4'>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={isUsersLoading}
              className='px-4 py-2 border border-outline rounded-lg bg-surface-container text-on-surface focus:outline-none focus:border-primary'
            >
              <option value='all'>Tüm Kullanıcılar</option>
              {areUserTitlesResolved ? (
                users.map((user) => (
                  <option key={user.id} value={user.username}>
                    {`${user.displayName || user.username}${user.userTitle ? ` - ${user.userTitle}` : ''}`}
                  </option>
                ))
              ) : (
                <option value='' disabled>
                  Kullanıcılar yükleniyor...
                </option>
              )}
            </select>

            <input
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className='px-4 py-2 border border-outline rounded-lg bg-surface-container text-on-surface focus:outline-none focus:border-primary'
              placeholder='Tarih seçin'
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className='px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:bg-(--surface-container-highest) transition-colors'
              >
                Tüm Tarihleri Göster
              </button>
            )}
          </div>

          {/* Seçili Projeler Özeti */}
          <div className='bg-surface-container-low p-4 rounded-lg border border-outline-variant mb-4'>
            <div className='flex items-center justify-between'>
              <div>
                <span className='text-sm font-semibold text-on-surface-variant'>
                  Seçili Projeler:
                </span>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {Array.from(selectedProjects).map((projectId) => {
                    const project = allProjects.find((p) => p.id === projectId);
                    return project ? (
                      <span
                        key={projectId}
                        className='px-2 py-1 bg-primary-container text-primary rounded text-xs font-medium'
                      >
                        {project.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <span className='px-3 py-1 bg-primary text-on-primary rounded-lg text-sm font-medium'>
                  {users.length} kişi
                </span>
                <span className='px-3 py-1 bg-primary text-on-primary rounded-lg text-sm font-medium'>
                  {selectedProjects.size} proje
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hedefler Listesi */}
      {isLoading ? (
        <div className='bg-surface-container p-6 rounded-lg border border-outline-variant text-center'>
          <p className='text-on-surface-variant'>Yükleniyor...</p>
        </div>
      ) : selectedProjects.size === 0 ? (
        <div className='bg-surface-container p-12 rounded-lg border border-outline-variant text-center'>
          <div className='text-4xl mb-4'>👥</div>
          <p className='text-on-surface-variant'>
            {selectedCategoryIds.size > 0
              ? 'Lütfen proje seçin'
              : 'Lütfen bir kategori seçin'}
          </p>
        </div>
      ) : filteredTargets.length === 0 ? (
        <div className='bg-surface-container p-12 rounded-lg border border-outline-variant text-center'>
          <div className='text-4xl mb-4'>📋</div>
          <p className='text-on-surface-variant'>
            Seçilen projeler için bugün hedef girilmemiş
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {Object.entries(targetsByProject).map(([projectName, targets]) => (
            <div
              key={projectName}
              className='bg-surface-container rounded-lg border border-outline-variant overflow-hidden'
            >
              {/* Proje Başlığı */}
              <div className='bg-surface-container-low px-6 py-4 border-b border-outline-variant'>
                <h3 className='text-lg font-semibold text-on-surface flex items-center gap-2'>
                  <span>📁</span>
                  <span>{projectName}</span>
                </h3>
              </div>

              {/* Projeye Ait Hedefler */}
              <div className='p-6 space-y-4'>
                {targets
                  .filter((target) => {
                    if (
                      selectedUser !== 'all' &&
                      target.username !== selectedUser
                    )
                      return false;
                    return true;
                  })
                  .map((target) => {
                    const targetUser = users.find(
                      (u) => u.username === target.username,
                    );
                    const effectiveTargetDate = selectedDate || target.date;
                    const targetEntries = Array.isArray(target.projectTargets) &&
                      target.projectTargets.length > 0
                      ? target.projectTargets
                      : [
                          {
                            targetId: target.targetId,
                            projectId: target.selectedProjects?.[0] ?? '',
                            projectName,
                            block: target.block,
                            floors: target.floors,
                            taskContent: target.taskContent,
                            goalStatus: target.goalStatus,
                            description: target.description,
                            workStart: target.workStart,
                            workEnd: target.workEnd,
                            meetingStart: target.meetingStart,
                            meetingEnd: target.meetingEnd,
                          },
                        ];
                    const statusLabels: Record<string, string> = {
                      REACHED: 'Tamamlandı',
                      PARTIAL: 'Kısmen',
                      FAILED: 'Başarısız',
                      NOT_SET: 'Belirsiz',
                    };
                    const statusColors: Record<string, string> = {
                      REACHED: 'bg-(--success)/20 text-success',
                      PARTIAL: 'bg-(--warning)/20 text-warning',
                      FAILED: 'bg-(--error)/20 text-error',
                      NOT_SET:
                        'bg-surface-container-high text-on-surface-variant',
                    };
                    const groupKey =
                      target.targetId ||
                      (Array.isArray(target.projectTargets) &&
                      target.projectTargets.length > 0
                        ? `group-${target.projectTargets
                            .map((entry) => entry.targetId)
                            .filter(Boolean)
                            .join('-')}`
                        : `group-${target.username}-${effectiveTargetDate}`);

                    return (
                      <div key={groupKey} className='space-y-4'>
                        {targetEntries.map((entry) => {
                          const handleEditClick = () => {
                            if (!isAdmin) return;
                            if (!entry.targetId) return;

                            const targetToEdit: any = {
                              id: entry.targetId,
                              date: effectiveTargetDate,
                              userId: targetUser?.id || '',
                              projectId: entry.projectId || undefined,
                              taskContent: entry.taskContent,
                              description: entry.description,
                              block: entry.block,
                              floors: entry.floors,
                              goalStatus: entry.goalStatus,
                              workStart: entry.workStart,
                              workEnd: entry.workEnd,
                              meetingStart: entry.meetingStart,
                              meetingEnd: entry.meetingEnd,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            };
                            setEditingTarget(targetToEdit);
                            setShowEditDialog(true);
                          };

                          const canEdit = isAdmin && Boolean(entry.targetId);

                          return (
                            <div
                              key={`${target.username}-${effectiveTargetDate}-${entry.targetId || entry.projectId}`}
                              className={`bg-surface-container-low p-4 rounded-lg border border-outline-variant ${
                                canEdit
                                  ? 'cursor-pointer hover:border-(--primary) transition-colors'
                                  : ''
                              }`}
                              onClick={handleEditClick}
                            >
                              <div className='flex justify-between items-start'>
                                <div>
                                  {canEdit && (
                                    <p className='text-xs text-warning mt-1'>
                                      Düzenlemek için tıklayın
                                    </p>
                                  )}
                                  <h4 className='font-bold text-lg text-on-surface mb-2'>
                                    <Image
                                      src={userPng}
                                      alt='user'
                                      className='w-5 h-5 mr-2 inline-block'
                                    />
                                    {areUserTitlesResolved
                                      ? `${targetUser?.displayName || target.username}${targetUser?.userTitle ? ` - ${targetUser.userTitle}` : ''}`
                                      : 'Yükleniyor...'}
                                  </h4>
                                  {entry.block && (
                                    <p className='text-on-surface mb-2'>
                                      <b>Blok:</b> {entry.block}
                                    </p>
                                  )}
                                  {entry.floors && (
                                    <p className='text-on-surface mb-2'>
                                      <b>Kat/Katlar:</b> {entry.floors}
                                    </p>
                                  )}
                                </div>
                                {entry.goalStatus && (
                                  <span
                                    className={`px-3 py-1 rounded text-xs font-medium ${
                                      statusColors[entry.goalStatus] ||
                                      statusColors.NOT_SET
                                    }`}
                                  >
                                    {statusLabels[entry.goalStatus] ||
                                      'Bilinmiyor'}
                                  </span>
                                )}
                              </div>
                              {entry.taskContent && (
                                <p className='text-on-surface mb-2'>
                                  <b>İşin İçeriği:</b> {entry.taskContent}
                                </p>
                              )}
                              {entry.description && (
                                <p className='text-on-surface mb-2'>
                                  <b>Açıklama:</b> {entry.description}
                                </p>
                              )}
                              <div className='text-on-surface mb-2'>
                                <span>
                                  <b>Çalışma Başlangıç/Bitiş Tarihi:</b>{' '}
                                  {effectiveTargetDate}
                                </span>
                                {(entry.workStart || entry.workEnd) && (
                                  <span>
                                    &nbsp;|&nbsp;
                                    {entry.workStart && entry.workEnd
                                      ? `${entry.workStart} - ${entry.workEnd}`
                                      : entry.workStart || entry.workEnd}
                                  </span>
                                )}
                              </div>
                              <div className='text-on-surface mb-2'>
                                <span>
                                  <b>Toplantı Başlangıç/Bitiş Tarihi:</b>{' '}
                                  {effectiveTargetDate}
                                </span>
                                {(entry.meetingStart || entry.meetingEnd) && (
                                  <span>
                                    &nbsp;|&nbsp;
                                    {entry.meetingStart && entry.meetingEnd
                                      ? `${entry.meetingStart} - ${entry.meetingEnd}`
                                      : entry.meetingStart || entry.meetingEnd}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && editingTarget && (
        <EditTargetDialog
          isOpen={showEditDialog}
          target={editingTarget}
          onClose={() => {
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
          onTargetUpdated={async (updatedTarget) => {
            try {
              const projectIds = Array.from(selectedProjects);
              const date = selectedDate || undefined;
              const targets = await targetsApi.getTeamTargets(projectIds, date);
              setTeamTargets(targets);
              showSuccess('Hedef başarıyla güncellendi');
            } catch (error) {
              console.error('Failed to reload targets:', error);
            }
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
          onTargetDeleted={async (targetId) => {
            try {
              const projectIds = Array.from(selectedProjects);
              const date = selectedDate || undefined;
              const targets = await targetsApi.getTeamTargets(projectIds, date);
              setTeamTargets(targets);
              showSuccess('Hedef başarıyla silindi');
            } catch (error) {
              console.error('Failed to reload targets:', error);
            }
            setShowEditDialog(false);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
}
