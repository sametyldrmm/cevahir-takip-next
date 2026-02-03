'use client';

import { useState, useEffect } from 'react';
import {
  leavesApi,
  Leave,
  LeaveType,
  BulkCreateLeaveDto,
} from '@/lib/api/leaves';
import { targetsApi, Target } from '@/lib/api/targets';
import { useAuth } from '@/app/contexts/AuthContext';
import { useNotification } from '@/app/contexts/NotificationContext';

interface LeaveEditPanelProps {
  selectedDays: Date[];
  onCancel: () => void;
  onSave: () => void;
  onSelectedDaysChange: (days: Date[]) => void;
  selectedLeaveType: string | null;
  onLeaveTypeChange: (type: string | null) => void;
}

const LEAVE_COLORS = {
  annual_leave: {
    color: '#2196F3',
    bg_light: '#E3F2FD',
    bg_dark: '#1976D2',
    text: 'Yıllık İzin',
  },
  sick_leave: {
    color: '#F44336',
    bg_light: '#FFEBEE',
    bg_dark: '#C62828',
    text: 'Hastalık / Rapor',
  },
  assignment_leave: {
    color: '#9C27B0',
    bg_light: '#F3E5F5',
    bg_dark: '#7B1FA2',
    text: 'Görevlendirme',
  },
};

export default function LeaveEditPanel({
  selectedDays,
  onCancel,
  onSave,
  onSelectedDaysChange,
  selectedLeaveType: propSelectedLeaveType,
  onLeaveTypeChange,
}: LeaveEditPanelProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const selectedLeaveType = propSelectedLeaveType as LeaveType | null;
  const [existingLeaves, setExistingLeaves] = useState<Leave[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(
    new Set(),
  );
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setIsLoading(true);
      const leaves = await leavesApi.getAll();
      setExistingLeaves(leaves);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLeave = (date: string) => {
    const newRemovals = new Set(pendingRemovals);
    if (newRemovals.has(date)) {
      newRemovals.delete(date);
    } else {
      newRemovals.add(date);
    }
    setPendingRemovals(newRemovals);
  };

  const handleSave = async () => {
    if (selectedDays.length === 0 && pendingRemovals.size === 0) {
      showError('Değişiklik yapılmadı');
      return;
    }

    if (selectedDays.length > 0 && !selectedLeaveType) {
      showError('Lütfen izin türünü seçin');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Önce kaldırılacak izinleri sil
      if (pendingRemovals.size > 0) {
        await leavesApi.bulkDelete(Array.from(pendingRemovals));
      }

      // 2. Sonra yeni izinleri ekle
      if (selectedDays.length > 0 && selectedLeaveType) {
        // Hedef girilmiş günleri filtrele
        const validDays: string[] = [];
        for (const day of selectedDays) {
          const dateStr = day.toISOString().split('T')[0];
          try {
            const targets = await targetsApi.getTargetsByDate(dateStr);
            // Hedef yoksa ve hafta sonu değilse ekle
            if (
              targets.length === 0 &&
              day.getDay() !== 0 &&
              day.getDay() !== 6
            ) {
              validDays.push(dateStr);
            }
          } catch (error) {
            // Hata durumunda yine de eklemeyi dene
            if (day.getDay() !== 0 && day.getDay() !== 6) {
              validDays.push(dateStr);
            }
          }
        }

        if (validDays.length > 0) {
          await leavesApi.bulkCreate({
            dates: validDays,
            leaveType: selectedLeaveType,
            note: note.trim() || undefined,
          });
        }
      }

      showSuccess('İzinler başarıyla kaydedildi');
      await loadLeaves();
      onSelectedDaysChange([]);
      setPendingRemovals(new Set());
      setNote('');
      onLeaveTypeChange(null);
      onSave();
    } catch (error: any) {
      const message = error.response?.data?.message || 'İzinler kaydedilemedi';
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const hasChanges = selectedDays.length > 0 || pendingRemovals.size > 0;
  const canSave =
    hasChanges && (selectedLeaveType !== null || pendingRemovals.size > 0);

  // Mevcut izinleri filtrele (hedef girilmiş günler hariç)
  const filteredLeaves = existingLeaves.filter(
    (leave) => !pendingRemovals.has(leave.date),
  );

  return (
    <div className='bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm h-auto flex flex-col'>
      {/* Header */}
      <div className='flex items-center gap-2 mb-4'>
        <svg
          className='w-6 h-6 text-primary'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
        <h3 className='text-lg font-bold text-on-surface'>İzin Düzenleme</h3>
      </div>

      {/* Info */}
      <p className='text-sm text-on-surface-variant italic mb-4'>
        Takvimden günleri seçin veya mevcut izinleri kaldırın
      </p>
      <hr />

      <div className='h-px bg-outline-variant mb-4' />

      {/* Mevcut İzinler */}
      <div className='mb-4'>
        <h4 className='text-sm font-semibold text-on-surface mb-2'>
          Mevcut İzinler ({filteredLeaves.length})
        </h4>
        {isLoading ? (
          <p className='text-sm text-on-surface-variant'>Yükleniyor...</p>
        ) : filteredLeaves.length === 0 ? (
          <div className='bg-surface-container-high p-3 rounded-lg'>
            <p className='text-sm text-on-surface-variant italic'>
              Henüz izin kaydı yok
            </p>
          </div>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {filteredLeaves.map((leave) => {
              const config = LEAVE_COLORS[leave.leaveType];
              const isPendingRemoval = pendingRemovals.has(leave.date);

              return (
                <button
                  key={leave.id}
                  onClick={() => handleRemoveLeave(leave.date)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all ${
                    isPendingRemoval
                      ? 'bg-gray-500 opacity-50 line-through'
                      : `bg-[${config.color}] hover:opacity-80`
                  }`}
                  style={{
                    backgroundColor: isPendingRemoval
                      ? '#9E9E9E'
                      : config.color,
                  }}
                  title={leave.note || config.text}
                >
                  {isPendingRemoval && '✓ '}
                  {formatDate(leave.date)}
                  <svg
                    className='w-3 h-3 inline ml-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <hr />

      <div className='h-px bg-outline-variant mb-4' />

      {/* Yeni İzin Ekle */}
      <div className='mb-4'>
        <h4 className='text-sm font-semibold text-primary mb-3'>
          Yeni İzin Ekle
        </h4>

        {/* İzin Türü */}
        <p className='text-sm font-medium text-on-surface mb-2'>İzin Türü</p>
        <div className='grid grid-cols-1 gap-2 mb-3'>
          <button
            onClick={() => {
              const newType =
                selectedLeaveType === LeaveType.ANNUAL_LEAVE
                  ? null
                  : LeaveType.ANNUAL_LEAVE;
              onLeaveTypeChange(newType);
            }}
            className={`w-full h-full text-center flex items-center justify-center px-4 py-2.5 rounded-lg bg-(--surface) transition-all ${
              selectedLeaveType === LeaveType.ANNUAL_LEAVE
                ? 'border-2 border-blue-500 bg-blue-50 text-blue-700'
                : 'hover:bg-(--on-surface-variant)'
            }`}
          >
            <div className='flex items-center gap-2'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z' />
              </svg>
              <span className='text-sm font-medium'>Yıllık İzin</span>
            </div>
          </button>

          <button
            onClick={() => {
              const newType =
                selectedLeaveType === LeaveType.SICK_LEAVE
                  ? null
                  : LeaveType.SICK_LEAVE;
              onLeaveTypeChange(newType);
            }}
            className={`w-full h-full text-center flex items-center justify-center px-4 py-2.5 rounded-lg bg-(--surface) transition-all ${
              selectedLeaveType === LeaveType.SICK_LEAVE
                ? 'border-2 border-red-500 bg-red-50 text-red-700'
                : 'hover:bg-(--on-surface-variant)'
            }`}
          >
            <div className='flex items-center gap-2'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M19 8h-1V6c0-2.76-2.24-5-5-5S8 3.24 8 6v2H7c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM10 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2h-6V6zm8 14H6V10h12v10z' />
              </svg>
              <span className='text-sm font-medium'>Hastalık / Rapor</span>
            </div>
          </button>

          <button
            onClick={() => {
              const newType =
                selectedLeaveType === LeaveType.ASSIGNMENT_LEAVE
                  ? null
                  : LeaveType.ASSIGNMENT_LEAVE;
              onLeaveTypeChange(newType);
            }}
            className={`w-full h-full text-center flex items-center justify-center px-4 py-2.5 rounded-lg bg-(--surface) transition-all ${
              selectedLeaveType === LeaveType.ASSIGNMENT_LEAVE
                ? 'border-2 border-purple-500 bg-purple-50 text-purple-700'
                : 'hover:bg-(--on-surface-variant)'
            }`}
          >
            <div className='flex items-center gap-2'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' />
              </svg>
              <span className='text-sm font-medium'>Görevlendirme</span>
            </div>
          </button>
        </div>

        {!selectedLeaveType && (
          <div className='bg-primary-container p-3 rounded-lg mb-3'>
            <div className='flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-(--primary)'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
              </svg>
              <p className='text-xs text-on-surface-variant italic'>
                Takvimden gün seçmek için önce izin türünü seçin
              </p>
            </div>
          </div>
        )}

        {/* Açıklama */}
        <p className='text-sm font-medium text-on-surface mb-2'>
          Açıklama (İsteğe Bağlı)
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='Açıklama girin (isteğe bağlı)'
          className='w-full p-3 border border-outline-variant rounded-lg bg-surface text-on-surface resize-none'
          rows={3}
        />
      </div>

      {/* Özet Bilgi */}
      <div
        className={`p-3 rounded-lg mb-4 ${
          hasChanges ? 'bg-primary-container' : 'bg-surface-container-high'
        }`}
      >
        {hasChanges ? (
          <div className='space-y-2'>
            {selectedDays.length > 0 && (
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-primary'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' />
                </svg>
                <span className='text-sm font-medium text-primary'>
                  Seçili gün sayısı: {selectedDays.length}
                </span>
              </div>
            )}
            {pendingRemovals.size > 0 && (
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5 text-orange-500'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
                </svg>
                <span className='text-sm font-medium text-orange-500'>
                  Kaldırılacak izin sayısı: {pendingRemovals.size}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <svg
              className='w-5 h-5 text-on-surface-variant'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
            </svg>
            <span className='text-sm text-on-surface-variant'>
              Henüz değişiklik yok
            </span>
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className='flex gap-2 mt-auto'>
        <button
          onClick={onCancel}
          className='flex-1 px-4 py-2 border border-outline-variant text-(--on-surface-variant) rounded-lg text-sm font-medium hover:bg-(--on-surface) hover:text-(--on-surface-button-variant) transition-colors'
        >
          Vazgeç
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
            canSave && !isSaving
              ? selectedLeaveType === LeaveType.ANNUAL_LEAVE
                ? 'bg-green-500 hover:bg-green-600'
                : selectedLeaveType === LeaveType.ASSIGNMENT_LEAVE
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
