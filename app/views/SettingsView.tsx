'use client';

import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { authApi, User } from '@/lib/api/auth';
import { useNotification } from '../contexts/NotificationContext';
import { usePushNotification } from '../hooks/usePushNotification';
import { apiClient } from '@/lib/api-client';
import { usersApi } from '@/lib/api/users';
import { targetsApi, AllowedTimeWindow } from '@/lib/api/targets';
import { PasswordChangeDialog } from '@/app/components/dialogs';

export default function SettingsView() {
  const { themeSetting, accentColor, setThemeSetting, setAccentColor } =
    useTheme();
  const { user, setUser } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { showSuccess, showError } = useNotification();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<{
    username: string;
    email: string;
    displayName: string;
    userTitle: string;
  }>({ username: '', email: '', displayName: '', userTitle: '' });
  const [profileErrors, setProfileErrors] = useState<{
    username?: string;
    email?: string;
    displayName?: string;
    userTitle?: string;
  }>({});
  const accentOptions = [
    { name: 'Mavi', value: 'blue' },
    { name: 'Yeşil', value: 'green' },
    { name: 'Turuncu', value: 'orange' },
  ] as const;
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isPermissionGranted: isPushPermissionGranted,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotification();
  const [pushToggleLoading, setPushToggleLoading] = useState(false);
  const [allowedTimeWindows, setAllowedTimeWindows] = useState<AllowedTimeWindow[]>(
    [],
  );
  const [isLoadingAllowedTimeWindows, setIsLoadingAllowedTimeWindows] =
    useState(false);
  const [isSavingAllowedTimeWindows, setIsSavingAllowedTimeWindows] =
    useState(false);

  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: unknown }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const first = message.find(
          (item) => typeof item === 'string' && item.trim(),
        );
        if (typeof first === 'string') return first;
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.getProfile();
        setProfile(userData);
        setProfileForm({
          username: userData.username ?? '',
          email: userData.email ?? '',
          displayName: userData.displayName ?? '',
          userTitle: userData.userTitle ?? '',
        });
      } catch (error) {
        console.error('Profile load error:', error);
        showError('Profil bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [user, showError]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadAllowedTimeWindows = async () => {
      try {
        setIsLoadingAllowedTimeWindows(true);
        const response = await targetsApi.getAllowedTimeWindows();
        setAllowedTimeWindows(response.windows);
      } catch (error: unknown) {
        showError(getApiErrorMessage(error) ?? 'Saat aralıkları yüklenemedi');
      } finally {
        setIsLoadingAllowedTimeWindows(false);
      }
    };

    void loadAllowedTimeWindows();
  }, [isAdmin, showError]);

  const handleAddAllowedTimeWindow = () => {
    setAllowedTimeWindows((prev) => [...prev, { start: '08:30', end: '09:30' }]);
  };

  const handleRemoveAllowedTimeWindow = (index: number) => {
    setAllowedTimeWindows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAllowedTimeWindow = (
    index: number,
    patch: Partial<AllowedTimeWindow>,
  ) => {
    setAllowedTimeWindows((prev) =>
      prev.map((window, i) => (i === index ? { ...window, ...patch } : window)),
    );
  };

  const handleSaveAllowedTimeWindows = async () => {
    const cleaned = allowedTimeWindows
      .map((w) => ({ start: w.start.trim(), end: w.end.trim() }))
      .filter((w) => w.start && w.end);

    if (cleaned.length !== allowedTimeWindows.length) {
      showError('Lütfen tüm saat aralıklarını doldurun');
      return;
    }

    try {
      setIsSavingAllowedTimeWindows(true);
      const response = await targetsApi.updateAllowedTimeWindows({ windows: cleaned });
      setAllowedTimeWindows(response.windows);
      showSuccess('Saat aralıkları güncellendi');
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? 'Saat aralıkları güncellenemedi');
    } finally {
      setIsSavingAllowedTimeWindows(false);
    }
  };

  const isProfileDirty =
    !!profile &&
    (profileForm.username.trim() !== (profile.username ?? '').trim() ||
      profileForm.email.trim() !== (profile.email ?? '').trim() ||
      profileForm.displayName.trim() !== (profile.displayName ?? '').trim() ||
      profileForm.userTitle.trim() !== (profile.userTitle ?? '').trim());

  const resetProfileForm = () => {
    if (!profile) return;
    setProfileForm({
      username: profile.username ?? '',
      email: profile.email ?? '',
      displayName: profile.displayName ?? '',
      userTitle: profile.userTitle ?? '',
    });
    setProfileErrors({});
  };

  const validateProfileForm = () => {
    const nextErrors: {
      username?: string;
      email?: string;
      displayName?: string;
    } = {};

    const username = profileForm.username.trim();
    const email = profileForm.email.trim();

    if (!username) nextErrors.username = 'Kullanıcı adı gerekli';
    if (!email) nextErrors.email = 'E-posta gerekli';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Geçerli bir e-posta girin';
    }

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (!validateProfileForm()) return;

    if (!isProfileDirty) {
      showSuccess('Değişiklik yok');
      return;
    }

    const dto = {
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      displayName: profileForm.displayName.trim() || undefined,
      ...(isAdmin ? { userTitle: profileForm.userTitle.trim() } : {}),
    };

    try {
      setIsSavingProfile(true);
      try {
        await usersApi.updateMe(dto);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) {
          await usersApi.updateUser(profile.id, dto);
        } else {
          throw error;
        }
      }

      const refreshed = await authApi.getProfile();
      setProfile(refreshed);
      setUser(refreshed);
      setProfileForm({
        username: refreshed.username ?? '',
        email: refreshed.email ?? '',
        displayName: refreshed.displayName ?? '',
        userTitle: refreshed.userTitle ?? '',
      });
      setProfileErrors({});
      showSuccess('Profil güncellendi');
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? 'Profil güncellenemedi');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold text-on-surface mb-6'>Ayarlar</h2>
      <div className='space-y-6 max-w-2xl'>
        {/* Profil Bilgileri */}
        <div className='bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm'>
          <h3 className='text-lg font-semibold text-on-surface mb-4'>
            Profil Bilgileri
          </h3>
          {isLoading ? (
            <p className='text-on-surface-variant'>Yükleniyor...</p>
          ) : profile ? (
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Kullanıcı Adı
                </label>
                <input
                  value={profileForm.username}
                  onChange={(e) => {
                    setProfileForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }));
                    setProfileErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  className={`w-full px-4 py-2 bg-surface rounded-lg border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    profileErrors.username ? 'border-error' : 'border-outline'
                  }`}
                  disabled={isSavingProfile}
                />
                {profileErrors.username && (
                  <p className='mt-1 text-sm text-error'>
                    {profileErrors.username}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  E-posta
                </label>
                <input
                  type='email'
                  value={profileForm.email}
                  onChange={(e) => {
                    setProfileForm((prev) => ({ ...prev, email: e.target.value }));
                    setProfileErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-4 py-2 bg-surface rounded-lg border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    profileErrors.email ? 'border-error' : 'border-outline'
                  }`}
                  disabled={isSavingProfile}
                />
                {profileErrors.email && (
                  <p className='mt-1 text-sm text-error'>
                    {profileErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Görünen Ad
                </label>
                <input
                  value={profileForm.displayName}
                  onChange={(e) => {
                    setProfileForm((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }));
                    setProfileErrors((prev) => ({
                      ...prev,
                      displayName: undefined,
                    }));
                  }}
                  className={`w-full px-4 py-2 bg-surface rounded-lg border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    profileErrors.displayName ? 'border-error' : 'border-outline'
                  }`}
                  disabled={isSavingProfile}
                />
                {profileErrors.displayName && (
                  <p className='mt-1 text-sm text-error'>
                    {profileErrors.displayName}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Pozisyon
                </label>
                <input
                  value={profileForm.userTitle}
                  onChange={(e) => {
                    if (!isAdmin) return;
                    setProfileForm((prev) => ({
                      ...prev,
                      userTitle: e.target.value,
                    }));
                    setProfileErrors((prev) => ({
                      ...prev,
                      userTitle: undefined,
                    }));
                  }}
                  className={`w-full px-4 py-2 bg-surface rounded-lg border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                    profileErrors.userTitle ? 'border-error' : 'border-outline'
                  }`}
                  disabled={isSavingProfile || !isAdmin}
                />
                {profileErrors.userTitle && (
                  <p className='mt-1 text-sm text-error'>
                    {profileErrors.userTitle}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-on-surface-variant mb-1'>
                  Rol
                </label>
                <div className='px-4 py-2 bg-surface rounded-lg border border-outline'>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                      profile.role === 'ADMIN'
                        ? 'bg-primary-container text-primary'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {profile.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
                  </span>
                </div>
              </div>
              <div className='flex flex-wrap gap-3 pt-2'>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || !isProfileDirty}
                  className='px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {isSavingProfile ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={resetProfileForm}
                  disabled={isSavingProfile || !isProfileDirty}
                  className='px-4 py-2 bg-surface text-on-surface rounded-lg border border-outline hover:bg-surface-container-high transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Sıfırla
                </button>
                <button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  disabled={isSavingProfile}
                  className='px-4 py-2 bg-surface text-on-surface rounded-lg border border-outline hover:bg-surface-container-high transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  Şifre Değiştir
                </button>
              </div>
            </div>
          ) : (
            <p className='text-on-surface-variant'>
              Profil bilgileri yüklenemedi.
            </p>
          )}
        </div>

        {/* Tema Ayarları */}
        <div className='bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm'>
          <h3 className='text-lg font-semibold text-on-surface mb-4'>Tema</h3>
          <div className='space-y-3'>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='radio'
                name='theme'
                value='auto'
                checked={themeSetting === 'auto'}
                onChange={(e) => setThemeSetting(e.target.value as 'auto')}
                className='w-4 h-4'
              />
              <span className='text-on-surface'>Otomatik (Sistem Teması)</span>
            </label>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='radio'
                name='theme'
                value='light'
                checked={themeSetting === 'light'}
                onChange={(e) => setThemeSetting(e.target.value as 'light')}
                className='w-4 h-4'
              />
              <span className='text-on-surface'>Açık Tema</span>
            </label>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='radio'
                name='theme'
                value='dark'
                checked={themeSetting === 'dark'}
                onChange={(e) => setThemeSetting(e.target.value as 'dark')}
                className='w-4 h-4'
              />
              <span className='text-on-surface'>Koyu Tema</span>
            </label>
          </div>
        </div>

        {/* Vurgu Rengi */}
        <div className='bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm'>
          <h3 className='text-lg font-semibold text-on-surface mb-4'>
            Vurgu Rengi
          </h3>
          <div className='grid grid-cols-4 gap-3'>
            {accentOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  accentColor === color.value
                    ? 'border-primary bg-primary-container'
                    : 'border-outline bg-surface hover:border-(--primary)'
                }`}
              >
                <span className='text-sm font-medium text-on-surface'>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bildirim Ayarları */}
        <div className='bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm'>
          <h3 className='text-lg font-semibold text-on-surface mb-4'>
            Bildirimler
          </h3>
          <div className='space-y-4'>
            {/* Birleştirilmiş Bildirim Toggle */}
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <h4 className='text-sm font-medium text-on-surface mb-1'>
                  Bildirimler
                </h4>
                <p className='text-xs text-on-surface-variant'>
                  {isPushSubscribed && isPushPermissionGranted
                    ? 'Site açıkken ve kapalıyken bildirim alırsınız'
                    : 'Site açıkken bildirim alırsınız (kapalıyken bildirim için açın)'}
                </p>
                {!isPushSupported && (
                  <p className='text-xs text-error mt-1'>
                    ⚠️ Tarayıcınız push notification desteklemiyor
                  </p>
                )}
                {isPushSupported && !isPushPermissionGranted && isPushSubscribed && (
                  <p className='text-xs text-warning mt-1'>
                    ⚠️ Bildirim izni verilmedi
                  </p>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {pushToggleLoading ? (
                  <div className='w-12 h-6 flex items-center justify-center'>
                    <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setPushToggleLoading(true);
                      try {
                        if (isPushSubscribed) {
                          const success = await unsubscribePush();
                          if (success) {
                            showSuccess('Bildirimler kapatıldı (sadece site açıkken bildirim alırsınız)');
                            localStorage.removeItem(
                              'push-notification-dismissed',
                            );
                          } else {
                            showError('Bildirimler kapatılamadı');
                          }
                        } else {
                          const success = await subscribePush();
                          if (success) {
                            showSuccess('Bildirimler etkinleştirildi! Site kapalıyken bile bildirim alacaksınız.');
                            localStorage.removeItem(
                              'push-notification-dismissed',
                            );
                          } else {
                            showError('Bildirimler etkinleştirilemedi');
                          }
                        }
                      } catch (error) {
                        showError('Bir hata oluştu');
                      } finally {
                        setPushToggleLoading(false);
                      }
                    }}
                    disabled={!isPushSupported || pushToggleLoading}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${
                        isPushSubscribed && isPushPermissionGranted
                          ? 'bg-success'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }
                      ${!isPushSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${
                          isPushSubscribed && isPushPermissionGranted
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }
                      `}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Test Butonu */}
            {isPushSubscribed && (
              <div className='border-t border-outline-variant pt-4'>
                <button
                  onClick={async () => {
                    try {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription =
                        await registration.pushManager.getSubscription();

                      if (!subscription) {
                        showError('Push subscription bulunamadı');
                        return;
                      }

                      const subscriptionData = {
                        endpoint: subscription.endpoint,
                        keys: {
                          p256dh: btoa(
                            String.fromCharCode(
                              ...new Uint8Array(subscription.getKey('p256dh')!),
                            ),
                          ),
                          auth: btoa(
                            String.fromCharCode(
                              ...new Uint8Array(subscription.getKey('auth')!),
                            ),
                          ),
                        },
                      };

                      const response = await apiClient
                        .getClient()
                        .post('/push/test', subscriptionData);

                      if (response.data.success) {
                        showSuccess(
                          'Test bildirimi gönderildi! Bildirimi kontrol edin.',
                        );
                      } else {
                        showError('Test bildirimi gönderilemedi');
                      }
                    } catch (error: any) {
                      console.error('Test push error:', error);
                      showError(
                        error.response?.data?.message ||
                          'Test bildirimi gönderilemedi',
                      );
                    }
                  }}
                  className='w-full px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium'
                >
                  🧪 Test Bildirimi Gönder
                </button>
              </div>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className='bg-surface-container p-6 rounded-lg border border-outline-variant shadow-sm'>
            <h3 className='text-lg font-semibold text-on-surface mb-4'>
              Hedef Giriş Saatleri
            </h3>
            {isLoadingAllowedTimeWindows ? (
              <p className='text-on-surface-variant'>Yükleniyor...</p>
            ) : (
              <div className='space-y-4'>
                {allowedTimeWindows.length === 0 ? (
                  <p className='text-sm text-on-surface-variant'>
                    Saat aralığı tanımlı değil.
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {allowedTimeWindows.map((window, index) => (
                      <div
                        key={`${window.start}-${window.end}-${index}`}
                        className='grid grid-cols-[1fr_1fr_auto] gap-3 items-center'
                      >
                        <input
                          type='time'
                          value={window.start}
                          onChange={(e) =>
                            handleUpdateAllowedTimeWindow(index, {
                              start: e.target.value,
                            })
                          }
                          disabled={isSavingAllowedTimeWindows}
                          className='w-full px-4 py-2 bg-surface rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        />
                        <input
                          type='time'
                          value={window.end}
                          onChange={(e) =>
                            handleUpdateAllowedTimeWindow(index, {
                              end: e.target.value,
                            })
                          }
                          disabled={isSavingAllowedTimeWindows}
                          className='w-full px-4 py-2 bg-surface rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all'
                        />
                        <button
                          type='button'
                          onClick={() => handleRemoveAllowedTimeWindow(index)}
                          disabled={isSavingAllowedTimeWindows}
                          className='px-3 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className='flex flex-wrap gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={handleAddAllowedTimeWindow}
                    disabled={isSavingAllowedTimeWindows}
                    className='px-4 py-2 bg-surface text-on-surface rounded-lg border border-outline hover:bg-surface-container-high transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                  >
                    + Saat Aralığı Ekle
                  </button>
                  <button
                    type='button'
                    onClick={handleSaveAllowedTimeWindows}
                    disabled={isSavingAllowedTimeWindows}
                    className='px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
                  >
                    {isSavingAllowedTimeWindows ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {profile && (
        <PasswordChangeDialog
          isOpen={isPasswordDialogOpen}
          userId={profile.id}
          onClose={() => setIsPasswordDialogOpen(false)}
          onPasswordChanged={() => {
            showSuccess('Şifre güncellendi');
          }}
        />
      )}
    </div>
  );
}
