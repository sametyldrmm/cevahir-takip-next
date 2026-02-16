'use client';

import { useState } from 'react';
import { Target, CalendarDay } from '@/lib/api/targets';

interface MonthlyCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  calendarData?: CalendarDay[];
  targets?: Target[];
  projectNamesById?: Record<string, string>;
  onEditLeaves?: () => void;
  editMode?: boolean;
  selectedDays?: Date[];
  onDayToggle?: (date: Date) => void;
  selectedLeaveType?: string | null;
  leaves?: Record<string, { type: string; note?: string }>;
  onEditTarget?: (target: Target) => void;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  target?: CalendarDay;
  targets?: Target[];
  leave?: { type: string; note?: string };
}

export default function MonthlyCalendar({
  currentDate,
  selectedDate,
  onDateSelect,
  calendarData = [],
  targets = [],
  projectNamesById = {},
  onEditLeaves,
  editMode = false,
  selectedDays = [],
  onDayToggle,
  selectedLeaveType = null,
  leaves = {},
  onEditTarget,
}: MonthlyCalendarProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const [dayEntriesDialog, setDayEntriesDialog] = useState<{
    isOpen: boolean;
    date: Date;
    entries: Target[];
  } | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const pad2 = (value: number) => String(value).padStart(2, '0');
  const getLocalDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const normalizeDateKey = (value: string | undefined) => {
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
  };

  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  // Takvim günlerini oluştur (6 hafta - önceki ve sonraki ayın günleri dahil)
  const getCalendarDays = (): DayData[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Pazar

    const days: DayData[] = [];

    // Önceki ayın son günleri
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Mevcut ayın günleri
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = getLocalDateKey(date);

      const target = calendarData.find((d) => d.date === dateKey);
      const dayTargets = targets.filter((t) => {
        const targetDateKey = normalizeDateKey(t.date);
        if (!targetDateKey) return false;
        return targetDateKey === dateKey;
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isSelected:
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear(),
        target,
        targets: dayTargets.length > 0 ? dayTargets : undefined,
      });
    }

    // Sonraki ayın ilk günleri (6 hafta tamamlamak için)
    const remainingDays = 42 - days.length; // 6 hafta * 7 gün = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'missed':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Tamamlandı';
      case 'partial':
        return 'Kısmen';
      case 'missed':
        return 'Ulaşılamadı';
      default:
        return '';
    }
  };

  const getGoalStatusColor = (goalStatus?: Target['goalStatus']) => {
    switch (goalStatus) {
      case 'REACHED':
        return 'bg-green-500';
      case 'PARTIAL':
        return 'bg-yellow-500';
      case 'FAILED':
        return 'bg-red-500';
      case 'NOT_SET':
      default:
        return 'bg-gray-400';
    }
  };

  const getGoalStatusLabel = (goalStatus?: Target['goalStatus']) => {
    switch (goalStatus) {
      case 'REACHED':
        return 'Hedefime ulaştım';
      case 'PARTIAL':
        return 'Hedefime kısmen ulaştım';
      case 'FAILED':
        return 'Hedefime ulaşamadım';
      case 'NOT_SET':
      default:
        return 'Belirtilmemiş';
    }
  };

  const getGoalStatusBadgeClasses = (goalStatus?: Target['goalStatus']) => {
    switch (goalStatus) {
      case 'REACHED':
        return 'bg-success/20 text-success border-success/30';
      case 'PARTIAL':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'FAILED':
        return 'bg-error/20 text-error border-error/30';
      case 'NOT_SET':
      default:
        return 'bg-surface-container-high text-on-surface-variant border-outline-variant';
    }
  };

  const resolvePrimaryProjectName = (target: Target) => {
    const selectedProjects = (target.selectedProjects ?? []).filter(
      (p) => p && p.trim().length > 0,
    );
    if (selectedProjects.length > 0) return selectedProjects[0];
    if (target.customProject?.trim()) return target.customProject.trim();
    if (target.projectId && projectNamesById[target.projectId])
      return projectNamesById[target.projectId];
    if (target.projectId) return target.projectId;
    return 'Proje';
  };

  const resolveProjectsLabel = (target: Target) => {
    const selectedProjects = (target.selectedProjects ?? []).filter(
      (p) => p && p.trim().length > 0,
    );
    if (selectedProjects.length > 0) return selectedProjects.join(', ');
    if (target.customProject?.trim()) return target.customProject.trim();
    if (target.projectId && projectNamesById[target.projectId])
      return projectNamesById[target.projectId];
    if (target.projectId) return target.projectId;
    return 'Proje';
  };

  const getLeaveColor = (type: string) => {
    switch (type) {
      case 'annual_leave':
        return 'bg-blue-500';
      case 'sick_leave':
        return 'bg-red-500';
      case 'assignment_leave':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getLeaveLabel = (type: string) => {
    switch (type) {
      case 'annual_leave':
        return 'Yıllık İzin';
      case 'sick_leave':
        return 'Hastalık';
      case 'assignment_leave':
        return 'Görevlendirme';
      default:
        return 'İzin';
    }
  };

  // Haftalara böl
  const weeks: DayData[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className='bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <svg
            className='w-5 h-5 text-primary'
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
          <h3 className='text-lg font-semibold text-on-surface mr-5'>
            Hedef Takvimi
          </h3>
          {onEditLeaves && (
            <button
              onClick={onEditLeaves}
              className={`w-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                editMode
                  ? 'bg-surface-container-high text-on-surface border border-outline-variant hover:bg-(--surface-container-highest)'
                  : 'bg-primary text-on-primary hover:bg-(--primary)/90'
              }`}
            >
              <div className='flex gap-1 items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  id='Edit-Calendar-Fill--Streamline-Outlined-Fill-Material'
                  height='16'
                  width='16'
                >
                  <desc>
                    Edit Calendar Fill Streamline Icon: https://streamlinehq.com
                  </desc>
                  <path
                    fill='#000000'
                    d='M4.5 22c-0.4 0 -0.75 -0.15 -1.05 -0.45 -0.3 -0.3 -0.45 -0.65 -0.45 -1.05V5c0 -0.4 0.15 -0.75 0.45 -1.05C3.75 3.65 4.1 3.5 4.5 3.5h1.625V2h1.625v1.5h8.5V2h1.625v1.5H19.5c0.4 0 0.75 0.15 1.05 0.45 0.3 0.3 0.45 0.65 0.45 1.05v6.5h-1.5v-1.75H4.5V20.5h8v1.5H4.5Zm9.5 0v-3.075l5.525 -5.5c0.15 -0.15 0.31665 -0.25835 0.5 -0.325 0.18335 -0.06665 0.36665 -0.1 0.55 -0.1 0.2 0 0.39165 0.0375 0.575 0.1125 0.18335 0.075 0.35 0.1875 0.5 0.3375l0.925 0.925c0.15 0.15 0.25835 0.31665 0.325 0.5 0.06665 0.18335 0.1 0.36665 0.1 0.55 0 0.18335 -0.0375 0.37085 -0.1125 0.5625 -0.075 0.19165 -0.1875 0.3625 -0.3375 0.5125L17.075 22H14Zm6.575 -5.6L21.5 15.425 20.575 14.5l-0.95 0.95 0.95 0.95Z'
                    strokeWidth='0.5'
                  ></path>
                </svg>
                {editMode ? (
                  <p>Düzenlemeyi Bitir</p>
                ) : (
                  <p>İzinleri Düzenle</p>
                )}
              </div>
            </button>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={prevMonth}
            className='p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>
          <span className='text-base font-semibold text-on-surface min-w-[120px] text-center'>
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className='p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors text-on-surface'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {weekDays.map((day) => (
          <div
            key={day}
            className='text-center text-xs font-semibold text-on-surface-variant py-2 bg-surface-container-highest rounded'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className='grid grid-cols-7 gap-1'>
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dateKey = getLocalDateKey(day.date);
            const hasTarget = day.target && day.target.status !== 'none';
            const hasLeave = leaves[dateKey] !== undefined;
            const leave = leaves[dateKey];
            const isSelectedForLeave = selectedDays.some(
              (d) => getLocalDateKey(d) === dateKey,
            );
            const isWeekend =
              day.date.getDay() === 0 || day.date.getDay() === 6;
            const hasOverflowTargets =
              !editMode && day.targets && day.targets.length > 3;
            const hasDayEntries = !editMode && day.targets && day.targets.length > 0;

            return (
              <button
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => {
                  if (!day.isCurrentMonth) return;
                  if (editMode && onDayToggle && !hasTarget && !isWeekend) {
                    onDayToggle(day.date);
                  } else if (!editMode) {
                    if (hasDayEntries && day.targets) {
                      setDayEntriesDialog({
                        isOpen: true,
                        date: day.date,
                        entries: day.targets,
                      });
                      return;
                    }
                    onDateSelect(day.date);
                  }
                }}
                className={`
                  relative min-h-[160px] p-2 rounded-lg border-2 transition-all text-left
                  ${!day.isCurrentMonth ? 'opacity-30 cursor-default' : 'cursor-pointer'}
                  ${
                    editMode && isSelectedForLeave && selectedLeaveType
                      ? `border-2 ${
                          selectedLeaveType === 'annual_leave'
                            ? 'bg-blue-100 border-blue-500'
                            : selectedLeaveType === 'sick_leave'
                              ? 'bg-red-100 border-red-500'
                              : 'bg-purple-100 border-purple-500'
                        }`
                      : day.isSelected
                        ? 'border-primary bg-primary-container shadow-md'
                        : day.isToday
                          ? 'border-primary/50 bg-primary-container/30'
                          : 'border-outline-variant hover:border-(--primary)/50 hover:shadow-sm'
                  }
                  ${!editMode && hasTarget ? 'bg-surface' : ''}
                  ${!editMode && hasLeave && !hasTarget ? 'bg-blue-50' : ''}
                  ${!editMode && !hasTarget && !hasLeave ? 'bg-surface-container' : ''}
                  ${editMode && (hasTarget || isWeekend) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={
                  !day.isCurrentMonth || (editMode && (hasTarget || isWeekend))
                }
              >
                <div className='flex flex-col h-full'>
                  {/* Day Number */}
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      {editMode &&
                        selectedLeaveType &&
                        !hasTarget &&
                        !hasLeave &&
                        !isWeekend && (
                          <input
                            type='checkbox'
                            checked={isSelectedForLeave}
                            onChange={() => {}}
                            className='w-4 h-4 rounded border-outline-variant'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDayToggle) onDayToggle(day.date);
                            }}
                          />
                        )}
                      <span
                        className={`text-base font-bold ${
                          day.isSelected
                            ? 'text-primary'
                            : day.isToday
                              ? 'text-primary'
                              : day.isCurrentMonth
                                ? 'text-on-surface'
                                : 'text-on-surface-variant'
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                    </div>
                    {/* {hasTarget && day.target && (
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getStatusColor(day.target.status)}`}
                        title={getStatusLabel(day.target.status)}
                      />
                    )} */}
                  </div>

                  {/* Target Events - Event Chips Style */}
                  {day.targets && day.targets.length > 0 && (
                    <div className='flex-1 space-y-1 overflow-hidden mt-1'>
                      {day.targets.slice(0, 3).map((target, idx) => {
                        const statusColor = getGoalStatusColor(target.goalStatus);

                        const primaryProjectName = resolvePrimaryProjectName(target);
                        const displayText = target.taskContent || primaryProjectName;

                        return (
                          <div
                            key={idx}
                            className='flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-surface-container-high text-on-surface truncate hover:bg-(--surface-container-highest) transition-colors'
                            title={`${displayText} - ${target.goalStatus || 'Belirtilmemiş'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${statusColor} flex-shrink-0`}
                            />
                            <span className='truncate'>{displayText}</span>
                          </div>
                        );
                      })}
                      {day.targets.length > 3 && (
                        <div className='text-xs text-on-surface-variant text-center px-2 py-1 rounded-full bg-surface-container-low hover:bg-(--surface-container-high) transition-colors'>
                          +{day.targets.length - 3} daha
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leave Indicator */}
                  {hasLeave && leave && (
                    <div className='mt-auto pt-1'>
                      <div
                        className={`text-xs px-2 py-1 rounded text-center ${
                          leave.type === 'annual_leave'
                            ? 'bg-blue-500/20 text-blue-600'
                            : leave.type === 'sick_leave'
                              ? 'bg-red-500/20 text-red-600'
                              : 'bg-purple-500/20 text-purple-600'
                        }`}
                      >
                        {leave.type === 'annual_leave'
                          ? 'Yıllık İzin'
                          : leave.type === 'sick_leave'
                            ? 'Hastalık'
                            : 'Görevlendirme'}
                      </div>
                    </div>
                  )}

                  {/* Project Note */}
                  {/* {day.target && day.target.note && (
                    <div
                      className='mt-auto pt-1 text-xs text-on-surface-variant truncate'
                      title={day.target.note}
                    >
                      {day.target.note}
                    </div>
                  )} */}

                  {/* Empty state for current month days */}
                  {day.isCurrentMonth && !hasTarget && !hasLeave && (
                    <div className='flex-1 flex items-center justify-center'>
                      <span className='text-xs text-on-surface-variant opacity-50'>
                        -
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          }),
        )}
      </div>

      {dayEntriesDialog?.isOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
          onClick={() => setDayEntriesDialog(null)}
        >
          <div
            className='bg-surface-container rounded-xl p-6 shadow-2xl max-w-lg w-full border border-outline-variant'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between gap-4 mb-4'>
              <div className='min-w-0'>
                <h3 className='text-xl font-bold text-on-surface truncate'>
                  {dayEntriesDialog.date.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className='text-sm text-on-surface-variant'>
                  {dayEntriesDialog.entries.length} kayıt
                </p>
                <p className='text-xs text-on-surface-variant mt-1'>
                  Detayları görmek için kayda tıklayın.
                </p>
              </div>
              <button
                onClick={() => setDayEntriesDialog(null)}
                className='px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) transition-all'
              >
                Kapat
              </button>
            </div>

            <div className='space-y-2 max-h-[60vh] overflow-y-auto pr-1'>
              {dayEntriesDialog.entries.map((target) => {
                const primaryProjectName = resolvePrimaryProjectName(target);
                const projectsLabel = resolveProjectsLabel(target);
                const title = target.taskContent?.trim()
                  ? target.taskContent
                  : primaryProjectName;
                const workRange =
                  target.workStart || target.workEnd
                    ? `${target.workStart ?? '--:--'} - ${target.workEnd ?? '--:--'}`
                    : null;
                const meetingRange =
                  target.meetingStart || target.meetingEnd
                    ? `${target.meetingStart ?? '--:--'} - ${target.meetingEnd ?? '--:--'}`
                    : null;
                const userLabel = target.user?.displayName || target.user?.username;

                return (
                  <details
                    key={target.id}
                    className='group rounded-lg border border-outline-variant bg-surface-container-low'
                  >
                    <summary className='p-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${getGoalStatusColor(
                            target.goalStatus,
                          )}`}
                          title={getGoalStatusLabel(target.goalStatus)}
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm font-medium text-on-surface truncate flex justify-between items-center'>
                            {projectsLabel}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getGoalStatusBadgeClasses(
                              target.goalStatus,
                            )}`}>{getGoalStatusLabel(target.goalStatus)}</span>
                          </p>
                          {/* <div className='flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-on-surface-variant justify-between'>
                            {workRange && <span>Çalışma: {workRange}</span>}
                            {meetingRange && <span>Toplantı: {meetingRange}</span>}
                          </div> */}
                        </div>
                        <span className='text-xs text-on-surface-variant mt-0.5 group-open:rotate-90 transition-transform'>
                          ›
                        </span>
                      </div>
                    </summary>
                    <div className='px-3 pb-3'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant'>
                        <div className='rounded-md bg-surface-container-high px-2 py-1'>
                          <span className='text-on-surface font-medium'>Durum: </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded border ${getGoalStatusBadgeClasses(
                              target.goalStatus,
                            )}`}
                          >
                            {getGoalStatusLabel(target.goalStatus)}
                          </span>
                        </div>
                        {userLabel && (
                          <div className='rounded-md bg-surface-container-high px-2 py-1'>
                            <span className='text-on-surface font-medium'>
                              Kullanıcı:{' '}
                            </span>
                            <span className='break-words'>{userLabel}</span>
                          </div>
                        )}
                        <div className='rounded-md bg-surface-container-high px-2 py-1'>
                          <span className='text-on-surface font-medium'>Proje: </span>
                          <span className='break-words'>{projectsLabel}</span>
                        </div>
                        {target.block?.trim() && (
                          <div className='rounded-md bg-surface-container-high px-2 py-1'>
                            <span className='text-on-surface font-medium'>Blok: </span>
                            <span className='break-words'>{target.block}</span>
                          </div>
                        )}
                        {target.floors?.trim() && (
                          <div className='rounded-md bg-surface-container-high px-2 py-1'>
                            <span className='text-on-surface font-medium'>Katlar: </span>
                            <span className='break-words'>{target.floors}</span>
                          </div>
                        )}
                        {workRange && (
                          <div className='rounded-md bg-surface-container-high px-2 py-1'>
                            <span className='text-on-surface font-medium'>
                              Çalışma:{' '}
                            </span>
                            <span className='break-words'>{workRange}</span>
                          </div>
                        )}
                        {meetingRange && (
                          <div className='rounded-md bg-surface-container-high px-2 py-1'>
                            <span className='text-on-surface font-medium'>
                              Toplantı:{' '}
                            </span>
                            <span className='break-words'>{meetingRange}</span>
                          </div>
                        )}
                      </div>

                      {target.description?.trim() && (
                        <div className='mt-2 rounded-md bg-surface-container-high px-2 py-2'>
                          <p className='text-xs text-on-surface font-medium mb-1'>
                            İş İçeriği
                          </p>
                          <p className='text-xs text-on-surface-variant whitespace-pre-wrap'>
                            {target.taskContent}
                          </p>
                        </div>
                      )}

                      {onEditTarget && (
                        <div className='mt-3 pt-3 border-t border-outline-variant'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTarget(target);
                              setDayEntriesDialog(null);
                            }}
                            className='w-full px-3 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity text-sm font-medium'
                          >
                            Düzenle
                          </button>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
