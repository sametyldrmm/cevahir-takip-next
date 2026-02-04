'use client';

import { useEffect, useState } from 'react';
import { usePushNotification } from '../hooks/usePushNotification';

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, isLoading, subscribe } =
    usePushNotification();

  const [showPrompt, setShowPrompt] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem('push-notification-dismissed') === 'true';
  });

  useEffect(() => {
    if (!isSupported || isSubscribed || isLoading || showPrompt) {
      return;
    }

    if (dismissed) {
      return;
    }

    if ('Notification' in window && Notification.permission === 'denied') {
      return;
    }

    // Kullanıcı sayfada biraz zaman geçirdikten sonra göster (2 saniye - daha hızlı)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [dismissed, isSupported, isSubscribed, isLoading, showPrompt]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    console.log('success=>', success);
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  console.log("burda=>",isSupported, isSubscribed, showPrompt, isLoading)
  // Desteklenmiyorsa veya zaten abone ise göster
  if (!isSupported || isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 max-w-sm'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4'>
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-blue-600 dark:text-blue-400'
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
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-1'>
              Bildirimleri Etkinleştir
            </h3>
            <p className='text-xs text-gray-600 dark:text-gray-300 mb-3'>
              Uygulama arka planda olsa bile önemli bildirimleri kaçırmayın.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className='flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Yükleniyor...' : 'Etkinleştir'}
              </button>
              <button
                onClick={handleDismiss}
                className='px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
