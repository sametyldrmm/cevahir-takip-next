'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { usersApi, User as ApiUser } from '@/lib/api/users';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNotification } from '@/app/contexts/NotificationContext';

interface MailGroup {
  id: string;
  name: string;
  emails: string[];
  createdAt: string;
  updatedAt: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR');
}

function getApiErrorMessage(error: unknown): string | undefined {
  if (isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) {
      const first = message.find((item) => typeof item === 'string' && item.trim());
      if (typeof first === 'string') return first;
    }
  }
  return undefined;
}

type SortKey = 'name' | 'emails' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function MailGroupsView() {
  const { user, isLoading: authLoading } = useAuth();
  const { showError, showSuccess } = useNotification();

  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [groups, setGroups] = useState<MailGroup[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [isGroupBusyById, setIsGroupBusyById] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    new Set(),
  );

  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmails, setNewGroupEmails] = useState<string[]>([]);
  const [newGroupEmailInput, setNewGroupEmailInput] = useState('');
  const [newGroupSelectedUserId, setNewGroupSelectedUserId] = useState('');
  const [newGroupError, setNewGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [selectedUserIdByGroupId, setSelectedUserIdByGroupId] = useState<
    Record<string, string>
  >({});
  const [emailToAddByGroupId, setEmailToAddByGroupId] = useState<
    Record<string, string>
  >({});
  const [groupActionErrorByGroupId, setGroupActionErrorByGroupId] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async (): Promise<void> => {
      try {
        setIsUsersLoading(true);
        const apiUsers = await usersApi.getAllUsers();
        setUsers(apiUsers.filter((u) => u.isActive));
      } catch {
        showError('Kullanıcılar yüklenirken bir hata oluştu');
      } finally {
        setIsUsersLoading(false);
      }
    };

    const loadGroups = async (): Promise<void> => {
      try {
        setIsGroupsLoading(true);
        const response = await apiClient.getClient().get<MailGroup[]>(
          '/mail-groups',
        );
        setGroups(response.data);
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? 'Mail grupları yüklenemedi');
      } finally {
        setIsGroupsLoading(false);
      }
    };

    void Promise.all([loadUsers(), loadGroups()]);
  }, [isAdmin, showError]);

  const visibleGroups = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase();

    const filtered = normalizedFilter
      ? groups.filter((g) => g.name.toLowerCase().includes(normalizedFilter))
      : groups;

    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        return a.name.localeCompare(b.name, 'tr-TR') * directionFactor;
      }
      if (sortKey === 'emails') {
        return (a.emails.length - b.emails.length) * directionFactor;
      }
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) *
        directionFactor
      );
    });

    return sorted;
  }, [filterText, groups, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return visibleGroups.slice(startIndex, startIndex + pageSize);
  }, [currentPage, visibleGroups]);

  useEffect(() => {
    setPage(1);
  }, [filterText, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const toggleExpanded = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const updateGroupLocal = (
    groupId: string,
    updater: (group: MailGroup) => MailGroup,
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? updater(g)
          : g,
      ),
    );
  };

  const setGroupBusy = (groupId: string, isBusy: boolean) => {
    setIsGroupBusyById((prev) => ({ ...prev, [groupId]: isBusy }));
  };

  const addNewGroupEmail = (rawEmail: string) => {
    setNewGroupError(null);
    const email = normalizeEmail(rawEmail);
    if (!email) return;
    if (!isValidEmail(email)) {
      setNewGroupError('Geçerli bir e-posta girin');
      return;
    }
    const exists = newGroupEmails.some((e) => normalizeEmail(e) === email);
    if (exists) {
      setNewGroupError('Bu e-posta zaten eklendi');
      return;
    }
    setNewGroupEmails((prev) => [...prev, email]);
  };

  const addSelectedUserToNewGroupEmails = () => {
    setNewGroupError(null);
    if (!newGroupSelectedUserId) return;
    const selectedUser = users.find((u) => u.id === newGroupSelectedUserId);
    if (!selectedUser) return;
    addNewGroupEmail(selectedUser.email);
    setNewGroupSelectedUserId('');
  };

  const removeNewGroupEmail = (email: string) => {
    setNewGroupEmails((prev) => prev.filter((e) => normalizeEmail(e) !== normalizeEmail(email)));
  };

  const createGroup = async () => {
    setNewGroupError(null);

    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setNewGroupError('Grup adı zorunludur');
      return;
    }

    const existing = groups.some(
      (g) => g.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (existing) {
      setNewGroupError('Bu isimde bir grup zaten mevcut');
      return;
    }

    const normalizedEmails = newGroupEmails.map(normalizeEmail).filter(Boolean);
    if (normalizedEmails.length === 0) {
      setNewGroupError('En az 1 e-posta ekleyin');
      return;
    }
    if (normalizedEmails.some((email) => !isValidEmail(email))) {
      setNewGroupError('Geçerli olmayan e-posta var');
      return;
    }
    if (new Set(normalizedEmails).size !== normalizedEmails.length) {
      setNewGroupError('E-posta listesinde tekrar var');
      return;
    }

    try {
      setIsCreatingGroup(true);
      const response = await apiClient.getClient().post<MailGroup>('/mail-groups', {
        name: trimmedName,
        emails: normalizedEmails,
      });
      const created = response.data;
      setGroups((prev) => [created, ...prev]);
      setExpandedGroupIds((prev) => new Set(prev).add(created.id));
      setNewGroupName('');
      setNewGroupEmails([]);
      setNewGroupEmailInput('');
      showSuccess('Mail grubu oluşturuldu');
    } catch (error: unknown) {
      setNewGroupError(getApiErrorMessage(error) ?? 'Mail grubu oluşturulamadı');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    setGroupActionErrorByGroupId((prev) => ({ ...prev, [groupId]: null }));
    try {
      setGroupBusy(groupId, true);
      await apiClient.getClient().delete(`/mail-groups/${groupId}`);

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setExpandedGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      setSelectedUserIdByGroupId((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      setEmailToAddByGroupId((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      showSuccess('Mail grubu silindi');
    } catch (error: unknown) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: getApiErrorMessage(error) ?? 'Mail grubu silinemedi',
      }));
    } finally {
      setGroupBusy(groupId, false);
    }
  };

  const saveGroup = async (groupId: string) => {
    setGroupActionErrorByGroupId((prev) => ({ ...prev, [groupId]: null }));
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const trimmedName = group.name.trim();
    if (!trimmedName) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Grup adı zorunludur',
      }));
      return;
    }

    const duplicate = groups.some(
      (g) =>
        g.id !== groupId &&
        g.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Bu isimde bir grup zaten mevcut',
      }));
      return;
    }

    try {
      setGroupBusy(groupId, true);
      const response = await apiClient
        .getClient()
        .patch<MailGroup>(`/mail-groups/${groupId}`, { name: trimmedName });
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? response.data : g)),
      );
      showSuccess('Değişiklikler kaydedildi');
    } catch (error: unknown) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: getApiErrorMessage(error) ?? 'Mail grubu güncellenemedi',
      }));
    } finally {
      setGroupBusy(groupId, false);
    }
  };

  const addUserToGroup = async (groupId: string) => {
    setGroupActionErrorByGroupId((prev) => ({ ...prev, [groupId]: null }));
    const selectedUserId = selectedUserIdByGroupId[groupId];
    if (!selectedUserId) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Lütfen bir kullanıcı seçin',
      }));
      return;
    }

    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Seçili kullanıcı bulunamadı',
      }));
      return;
    }

    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const email = normalizeEmail(selectedUser.email);
    const alreadyExists = group.emails.some((e) => normalizeEmail(e) === email);
    if (alreadyExists) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Bu e-posta zaten grupta',
      }));
      return;
    }

    try {
      setGroupBusy(groupId, true);
      const response = await apiClient
        .getClient()
        .post<MailGroup>(`/mail-groups/${groupId}/emails`, { email });
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? response.data : g)),
      );
      setSelectedUserIdByGroupId((prev) => ({ ...prev, [groupId]: '' }));
      showSuccess('E-posta gruba eklendi');
    } catch (error: unknown) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: getApiErrorMessage(error) ?? 'E-posta eklenemedi',
      }));
    } finally {
      setGroupBusy(groupId, false);
    }
  };

  const addEmailToGroup = async (groupId: string) => {
    setGroupActionErrorByGroupId((prev) => ({ ...prev, [groupId]: null }));
    const rawEmail = emailToAddByGroupId[groupId] ?? '';
    const email = normalizeEmail(rawEmail);

    if (!email) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'E-posta zorunludur',
      }));
      return;
    }
    if (!isValidEmail(email)) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Geçerli bir e-posta girin',
      }));
      return;
    }

    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    const exists = group.emails.some((e) => normalizeEmail(e) === email);
    if (exists) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: 'Bu e-posta zaten grupta',
      }));
      return;
    }

    try {
      setGroupBusy(groupId, true);
      const response = await apiClient
        .getClient()
        .post<MailGroup>(`/mail-groups/${groupId}/emails`, { email });
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? response.data : g)),
      );
      setEmailToAddByGroupId((prev) => ({ ...prev, [groupId]: '' }));
      showSuccess('E-posta gruba eklendi');
    } catch (error: unknown) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: getApiErrorMessage(error) ?? 'E-posta eklenemedi',
      }));
    } finally {
      setGroupBusy(groupId, false);
    }
  };

  const removeEmailFromGroup = async (groupId: string, email: string) => {
    setGroupActionErrorByGroupId((prev) => ({ ...prev, [groupId]: null }));
    try {
      setGroupBusy(groupId, true);
      const encodedEmail = encodeURIComponent(email);
      const response = await apiClient
        .getClient()
        .delete<MailGroup>(`/mail-groups/${groupId}/emails/${encodedEmail}`);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? response.data : g)),
      );
      showSuccess('E-posta gruptan çıkarıldı');
    } catch (error: unknown) {
      setGroupActionErrorByGroupId((prev) => ({
        ...prev,
        [groupId]: getApiErrorMessage(error) ?? 'E-posta çıkarılamadı',
      }));
    } finally {
      setGroupBusy(groupId, false);
    }
  };

  if (authLoading) {
    return (
      <div className='p-6'>
        <div className='rounded-xl border border-outline-variant bg-surface-container p-6 text-on-surface-variant'>
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='p-6'>
        <div className='rounded-xl border border-outline-variant bg-surface-container p-6'>
          <h2 className='text-lg font-semibold text-on-surface'>
            Yetkisiz erişim
          </h2>
          <p className='mt-2 text-sm text-on-surface-variant'>
            Bu sayfayı görüntülemek için admin yetkisi gereklidir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <div className='rounded-xl border border-outline-variant bg-surface-container p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-on-surface'>
              Mail Grupları
            </h2>
            <p className='mt-1 text-sm text-on-surface-variant'>
              Mail grupları oluşturun, e-posta ekleyin ve yönetin.
            </p>
          </div>
        </div>

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='rounded-xl border border-outline-variant bg-surface p-4'>
            <div className='flex items-center justify-between gap-4'>
              <h3 className='text-sm font-semibold text-on-surface'>
                Yeni Grup
              </h3>
              <span className='text-xs text-on-surface-variant'>
                1) Grup adı • 2) E-posta ekle
              </span>
            </div>
            <label className='block text-sm font-medium text-on-surface mb-1'>
              Grup Adı
            </label>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className='w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
              placeholder='Örn: Haftalık Raporlar'
            />

            <div className='mt-4'>
              <div className='flex items-center justify-between gap-4'>
                <h4 className='text-sm font-semibold text-on-surface'>
                  Kullanıcıdan Ekle
                </h4>
                {isUsersLoading && (
                  <span className='text-xs text-on-surface-variant'>
                    Yükleniyor...
                  </span>
                )}
              </div>
              <div className='mt-2 flex gap-2'>
                <select
                  value={newGroupSelectedUserId}
                  onChange={(e) => setNewGroupSelectedUserId(e.target.value)}
                  disabled={isUsersLoading}
                  className='flex-1 px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60'
                >
                  <option value=''>Kullanıcı seçin</option>
                  {users
                    .filter((u) => !newGroupEmails.some((e) => normalizeEmail(e) === normalizeEmail(u.email)))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {(u.displayName || u.username) + ` (${u.username})`}
                      </option>
                    ))}
                </select>
                <button
                  type='button'
                  onClick={addSelectedUserToNewGroupEmails}
                  disabled={isUsersLoading || !newGroupSelectedUserId}
                  className='px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60'
                >
                  Ekle
                </button>
              </div>
            </div>

            <div className='mt-4'>
              <h4 className='text-sm font-semibold text-on-surface'>
                E-posta ile Ekle
              </h4>
              <div className='mt-2 flex gap-2'>
                <input
                  value={newGroupEmailInput}
                  onChange={(e) => setNewGroupEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    addNewGroupEmail(newGroupEmailInput);
                    setNewGroupEmailInput('');
                  }}
                  className='flex-1 px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
                  placeholder='ornek@firma.com'
                />
                <button
                  type='button'
                  onClick={() => {
                    addNewGroupEmail(newGroupEmailInput);
                    setNewGroupEmailInput('');
                  }}
                  className='px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors'
                >
                  Ekle
                </button>
              </div>
              <p className='mt-2 text-xs text-on-surface-variant'>
                Bu seçenek, sistemde kullanıcı kaydı olmayan adresleri eklemek içindir.
              </p>
            </div>
          </div>

          <div className='rounded-xl border border-outline-variant bg-surface p-4'>
            <div className='flex items-center justify-between gap-4'>
              <h4 className='text-sm font-semibold text-on-surface'>
                E-posta Listesi
              </h4>
              <span className='text-xs text-on-surface-variant'>
                {newGroupEmails.length} e-posta
              </span>
            </div>

            {newGroupEmails.length === 0 ? (
              <div className='mt-4 text-sm text-on-surface-variant'>
                Henüz e-posta eklenmedi.
              </div>
            ) : (
              <div className='mt-4 flex flex-wrap gap-2'>
                {newGroupEmails.map((email) => (
                  <div
                    key={email}
                    className='inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-3 py-1'
                  >
                    <span className='max-w-[280px] truncate text-sm text-on-surface'>
                      {email}
                    </span>
                    <button
                      type='button'
                      onClick={() => removeNewGroupEmail(email)}
                      className='rounded-full px-2 py-0.5 text-xs text-on-surface-variant hover:bg-(--surface-container-high) hover:text-on-surface transition-colors'
                    >
                      Çıkar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {newGroupError && (
          <p className='mt-3 text-sm text-error'>{newGroupError}</p>
        )}

        <div className='mt-4 flex items-center justify-end gap-4'>
          <button
            type='button'
            onClick={createGroup}
            disabled={isCreatingGroup}
            className='px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity disabled:opacity-60'
          >
            {isCreatingGroup ? 'Oluşturuluyor...' : 'Grup Oluştur'}
          </button>
        </div>
      </div>

      <div className='rounded-xl border border-outline-variant bg-surface-container p-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h3 className='text-lg font-semibold text-on-surface'>Gruplar</h3>
            <p className='text-sm text-on-surface-variant mt-1'>
              Satırı genişleterek e-postaları yönetin.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3'>
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className='w-full sm:w-72 px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
              placeholder='Grup ara...'
            />
          </div>
        </div>

        <div className='mt-5 border border-outline-variant rounded-xl overflow-hidden'>
          <div className='bg-surface-container-low px-5 py-3.5 border-b border-outline-variant'>
            <div className='flex items-center gap-4'>
              <button
                type='button'
                onClick={() => toggleSort('name')}
                className='w-[280px] text-left text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors'
              >
                Grup Adı
              </button>
              <button
                type='button'
                onClick={() => toggleSort('emails')}
                className='w-28 text-left text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors'
              >
                E-postalar
              </button>
              <button
                type='button'
                onClick={() => toggleSort('updatedAt')}
                className='w-56 text-left text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors'
              >
                Güncelleme
              </button>
              <div className='flex-1' />
              <div className='w-36 text-xs font-semibold text-on-surface-variant text-right'>
                İşlemler
              </div>
            </div>
          </div>

          <div className='bg-surface'>
            {isGroupsLoading ? (
              <div className='p-12 text-center text-on-surface-variant'>
                Yükleniyor...
              </div>
            ) : pagedGroups.length === 0 ? (
              <div className='p-12 text-center text-on-surface-variant'>
                {groups.length === 0
                  ? 'Henüz mail grubu oluşturulmadı'
                  : 'Aramanızla eşleşen grup bulunamadı'}
              </div>
            ) : (
              pagedGroups.map((group) => {
                const isExpanded = expandedGroupIds.has(group.id);
                const errorMessage = groupActionErrorByGroupId[group.id] ?? null;
                const isBusy = isGroupBusyById[group.id] ?? false;

                const selectableUsers = users.filter((u) => {
                  const alreadyInGroup = group.emails.some(
                    (email) => normalizeEmail(email) === normalizeEmail(u.email),
                  );
                  return !alreadyInGroup;
                });

                return (
                  <div
                    key={group.id}
                    className='border-b border-outline-variant last:border-b-0'
                  >
                    <div
                      role='button'
                      tabIndex={0}
                      onClick={() => toggleExpanded(group.id)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        toggleExpanded(group.id);
                      }}
                      className={[
                        'px-5 py-3.5 outline-none transition-colors cursor-pointer',
                        'border-l-4 border-transparent hover:bg-(--surface-container-high)',
                        isExpanded ? 'bg-(--surface-container-high) border-primary' : '',
                      ].join(' ')}
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-[280px] flex items-center gap-2'>
                          <span className='text-on-surface-variant'>
                            {isExpanded ? '▾' : '▸'}
                          </span>
                          <span className='text-left text-sm font-medium text-on-surface truncate'>
                            {group.name}
                          </span>
                        </div>
                        <div className='w-28 text-sm text-on-surface-variant'>
                          {group.emails.length}
                        </div>
                        <div className='w-56 text-sm text-on-surface-variant'>
                          {formatDateTime(group.updatedAt)}
                        </div>
                        <div className='flex-1' />
                        <div className='w-36 flex items-center justify-end gap-2'>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(group.id);
                            }}
                            className='px-3 py-1.5 border border-outline rounded-lg text-sm text-on-surface hover:bg-(--surface-container-high) transition-colors'
                          >
                            {isExpanded ? 'Kapat' : 'Detay'}
                          </button>
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteGroup(group.id);
                            }}
                            disabled={isBusy}
                            className='px-3 py-1.5 border border-red-500 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors'
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className='px-5 pb-5'>
                        <div className='rounded-xl border border-outline-variant bg-surface-container-low p-5'>
                          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                            <div className='lg:col-span-2'>
                              <label className='block text-sm font-medium text-on-surface mb-1'>
                                Grup Adı
                              </label>
                              <input
                                value={group.name}
                                onChange={(e) =>
                                  updateGroupLocal(group.id, (g) => ({
                                    ...g,
                                    name: e.target.value,
                                  }))
                                }
                                disabled={isBusy}
                                className='w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
                              />
                            </div>

                            <div>
                              <label className='block text-sm font-medium text-on-surface mb-1'>
                                İşlemler
                              </label>
                              <button
                                type='button'
                                onClick={() => saveGroup(group.id)}
                                disabled={isBusy}
                                className='w-full px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity disabled:opacity-60'
                              >
                                {isBusy ? 'Kaydediliyor...' : 'Kaydet'}
                              </button>
                            </div>
                          </div>

                          {errorMessage && (
                            <p className='mt-3 text-sm text-error'>
                              {errorMessage}
                            </p>
                          )}

                          <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4'>
                            <div className='rounded-xl border border-outline-variant bg-surface p-4'>
                              <div className='flex items-center justify-between gap-4'>
                                <h4 className='text-sm font-semibold text-on-surface'>
                                  Kullanıcı Ekle
                                </h4>
                                {isUsersLoading && (
                                  <span className='text-xs text-on-surface-variant'>
                                    Yükleniyor...
                                  </span>
                                )}
                              </div>

                              <div className='mt-3 flex gap-2'>
                                <select
                                  value={selectedUserIdByGroupId[group.id] ?? ''}
                                  onChange={(e) =>
                                    setSelectedUserIdByGroupId((prev) => ({
                                      ...prev,
                                      [group.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isUsersLoading || isBusy}
                                  className='flex-1 px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60'
                                >
                                  <option value=''>Kullanıcı seçin</option>
                                  {selectableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {(u.displayName || u.username) + ` (${u.username})`}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type='button'
                                  onClick={() => addUserToGroup(group.id)}
                                  disabled={isUsersLoading || isBusy}
                                  className='px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-60'
                                >
                                  Ekle
                                </button>
                              </div>
                            </div>

                            <div className='rounded-xl border border-outline-variant bg-surface p-4'>
                              <h4 className='text-sm font-semibold text-on-surface'>
                                E-posta Ekle
                              </h4>
                              <div className='mt-3 flex gap-2'>
                                <input
                                  value={emailToAddByGroupId[group.id] ?? ''}
                                  onChange={(e) =>
                                    setEmailToAddByGroupId((prev) => ({
                                      ...prev,
                                      [group.id]: e.target.value,
                                    }))
                                  }
                                  disabled={isBusy}
                                  className='flex-1 px-3 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
                                  placeholder='ornek@firma.com'
                                />
                                <button
                                  type='button'
                                  onClick={() => addEmailToGroup(group.id)}
                                  disabled={isBusy}
                                  className='px-3 py-2 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors'
                                >
                                  Ekle
                                </button>
                              </div>
                              <p className='mt-2 text-xs text-on-surface-variant'>
                                Bu seçenek, sistemde kullanıcı kaydı olmayan
                                adresleri eklemek içindir.
                              </p>
                            </div>
                          </div>

                          <div className='mt-6 rounded-xl border border-outline-variant bg-surface p-4'>
                            <div className='flex items-center justify-between gap-4'>
                              <h4 className='text-sm font-semibold text-on-surface'>
                                Grup E-postaları
                              </h4>
                              <span className='text-xs text-on-surface-variant'>
                                {group.emails.length} e-posta
                              </span>
                            </div>

                            {group.emails.length === 0 ? (
                              <div className='mt-4 text-sm text-on-surface-variant'>
                                Bu grupta henüz üye yok.
                              </div>
                            ) : (
                              <div className='mt-4 flex flex-wrap gap-2'>
                                {group.emails.map((email) => (
                                  <div
                                    key={email}
                                    className='inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-3 py-1'
                                  >
                                    <span className='max-w-[280px] truncate text-sm text-on-surface'>
                                      {email}
                                    </span>
                                    <button
                                      type='button'
                                      onClick={() => removeEmailFromGroup(group.id, email)}
                                      disabled={isBusy}
                                      className='rounded-full px-2 py-0.5 text-xs text-on-surface-variant hover:bg-(--surface-container-high) hover:text-on-surface transition-colors disabled:opacity-60'
                                    >
                                      Çıkar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className='mt-5 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='text-sm text-on-surface-variant'>
            Toplam {visibleGroups.length} grup
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className='px-3 py-1.5 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-50'
            >
              Önceki
            </button>
            <div className='text-sm text-on-surface-variant'>
              {currentPage} / {totalPages}
            </div>
            <button
              type='button'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className='px-3 py-1.5 rounded-lg border border-outline text-on-surface hover:bg-(--surface-container-high) transition-colors disabled:opacity-50'
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
