'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePushNotification } from '../hooks/usePushNotification';
import Image from 'next/image';

export function PushNotificationPrompt() {
  const pathname = usePathname();
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    subscribe,
    requestPermission,
  } = usePushNotification();

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined') return 'default';
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  });
  const [permissionWasDenied, setPermissionWasDenied] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    return Notification.permission === 'denied';
  });

  const hasAutoRequestedPermission = useRef(false);

  const shouldBlock =
    isSupported && !isSubscribed && !isPermissionGranted && !isLoading;

  const isLoginPage = pathname?.startsWith('/login');

  useEffect(() => {
    if (!shouldBlock) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldBlock]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }
    if (!shouldBlock) {
      return;
    }
    if (!('Notification' in window)) {
      return;
    }
    if (permissionWasDenied) {
      return;
    }
    const intervalId = window.setInterval(() => {
      const nextPermission = Notification.permission;
      if (nextPermission === 'denied') {
        setPermissionWasDenied(true);
      }
      setPermission((prevPermission) =>
        prevPermission === nextPermission ? prevPermission : nextPermission,
      );
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoginPage, permissionWasDenied, shouldBlock]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }
    if (!shouldBlock) {
      return;
    }
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission !== 'default') {
      return;
    }
    if (permissionWasDenied) {
      return;
    }
    if (hasAutoRequestedPermission.current) {
      return;
    }

    hasAutoRequestedPermission.current = true;

    (async () => {
      const nextPermission = await requestPermission();
      if (nextPermission !== 'granted') {
        return;
      }
      await subscribe();
    })();
  }, [isLoginPage, permissionWasDenied, requestPermission, shouldBlock, subscribe]);

  if (isLoginPage) {
    return null;
  }

  if (!shouldBlock) {
    return null;
  }

  // const handleEnable = async () => {
  //   const nextPermission = await requestPermission();
  //   setPermission(nextPermission);

  //   if (nextPermission !== 'granted') {
  //     return;
  //   }

  //   await subscribe();
  // };

  return (
    <div className='fixed inset-0 z-[100]'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' />
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          className='w-full max-w-md bg-surface-container rounded-xl border border-outline-variant shadow-lg p-6'
        >
          <div className='flex items-start gap-4'>
            <div className='w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary flex-shrink-0'>
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
            </div>

            <div className='min-w-0 flex-1'>
              <h3 className='text-lg font-semibold text-on-surface mb-1'>
                Bildirim İzni Gerekli
              </h3>
              <p className='text-sm text-on-surface-variant'>
                Uygulamayı kullanabilmek için tarayıcı bildirim iznini
                etkinleştirmeniz gerekiyor.
              </p>

              {permission === 'denied' && (
                <div className='mt-4 rounded-lg border border-outline-variant bg-surface p-4'>
                  <p className='text-sm font-semibold text-on-surface mb-2'>
                    İzinler daha önce engellenmiş
                  </p>
                  <ol className='text-sm text-on-surface-variant list-decimal pl-5 space-y-1'>
                    <li>Adres çubuğunun sol ucunda bulunan bilgi simgesine tıklayın.</li>
                    <Image src="/permission.png" alt="permission-image" width={300} height={300} />
                    <li>Bildirimler seçeneğini aktifleştirin.</li>
                    <li>&apos;Yeniden Kontrol Et&apos; butonuna tıklayın ve tekrar deneyin.</li>
                  </ol>
                </div>
              )}

              {permission !== 'denied' && !permissionWasDenied && (
                <div className='mt-4 rounded-lg border border-outline-variant bg-surface p-4'>
                  <Image src="/permission3.png" alt="permission-image-3" width={300} height={300} />
                  <p className='text-sm text-on-surface-variant mt-2 mb-2'>
                    Açılan tarayıcı izin penceresinde &apos;İzni Ver&apos; butonuna tıklayın.
                  </p>
                  <Image src="/permission2.png" alt="permission-image-3" width={300} height={300} />
                    <p className='text-sm text-on-surface-variant mt-2'>Eğer otomatik olarak açılmadıysa &apos;Bildirimler engellendi&apos; butonuna tıklayın ve izin verdikten sonra &apos;Yeniden Kontrol Et&apos; butonuna tıklayın.</p>
                    
                </div>
              )}

              <div className='mt-6 flex flex-col gap-2'>
                {/* <button
                  type='button'
                  onClick={handleEnable}
                  disabled={isLoading}
                  className='w-full px-4 py-3 rounded-lg bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Yükleniyor...' : 'İzni Ver'}
                </button> */}
                <button
                  type='button'
                  onClick={() => {
                    if ('Notification' in window) {
                      setPermission(Notification.permission);
                      window.location.reload()
                    }
                  }}
                  className='w-full px-4 py-3 rounded-lg bg-(--on-surface) text-on-primary font-semibold hover:bg-(--primary)! transition-colors'
                >
                  Yeniden Kontrol Et
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
