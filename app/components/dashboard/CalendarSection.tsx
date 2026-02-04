"use client";

import { useState } from "react";

interface CalendarSectionProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  targets?: Record<string, { status: string; hasTarget: boolean }>;
  leaves?: Record<string, { type: string; note?: string }>;
}

export default function CalendarSection({
  currentDate,
  selectedDate,
  onDateSelect,
  targets = {},
  leaves = {},
}: CalendarSectionProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getLeaveColor = (type: string) => {
    switch (type) {
      case "annual_leave":
        return "bg-blue-500";
      case "sick_leave":
        return "bg-red-500";
      case "assignment_leave":
        return "bg-purple-500";
      default:
        return "bg-gray-400";
    }
  };

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="bg-surface-container p-6 rounded-lg border border-outline-variant">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-on-surface">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-(--surface-container-high) rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-on-surface-variant py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map(
          (_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          )
        )}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const dateKey = getDateKey(date);
          const target = targets[dateKey];
          const leave = leaves[dateKey];
          const dayIsToday = isToday(date);
          const dayIsSelected = isSelected(date);

          return (
            <button
              key={day}
              onClick={() => onDateSelect(date)}
              className={`aspect-square p-1 rounded-lg border-2 transition-colors ${
                dayIsSelected
                  ? "border-primary bg-primary-container"
                  : dayIsToday
                  ? "border-primary/50 bg-primary-container/50"
                  : "border-transparent hover:bg-(--surface-container-high)"
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span
                  className={`text-sm font-medium ${
                    dayIsSelected
                      ? "text-primary"
                      : dayIsToday
                      ? "text-primary"
                      : "text-on-surface"
                  }`}
                >
                  {day}
                </span>
                {target && (
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(
                      target.status
                    )}`}
                  />
                )}
                {leave && (
                  <div
                    className={`w-2 h-2 rounded-full ${getLeaveColor(
                      leave.type
                    )}`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}









