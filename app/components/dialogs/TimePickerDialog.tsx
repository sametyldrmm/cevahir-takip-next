"use client";

import { useState, useEffect } from "react";

interface TimePickerDialogProps {
  isOpen: boolean;
  title?: string;
  initialTime?: string;
  minTime?: string;
  onClose: () => void;
  onTimeSelected: (time: string) => void;
}

export default function TimePickerDialog({
  isOpen,
  title = "Saat Seçin",
  initialTime = "08:00",
  minTime,
  onClose,
  onTimeSelected,
}: TimePickerDialogProps) {
  const [selectedTime, setSelectedTime] = useState(initialTime);

  useEffect(() => {
    setSelectedTime(initialTime);
  }, [initialTime]);

  // Saat seçenekleri (08:00 - 18:00, 30 dakika aralıklarla, 18:30 hariç)
  const allHourOptions: string[] = [];
  for (let hour = 8; hour < 19; hour++) {
    for (const minute of [0, 30]) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      // 18:30'u hariç tut
      if (timeStr !== "18:30") {
        allHourOptions.push(timeStr);
      }
    }
  }

  // Minimum saate göre seçenekleri filtrele
  const hourOptions = minTime
    ? allHourOptions.slice(
        Math.max(0, allHourOptions.indexOf(minTime)),
        allHourOptions.length
      )
    : allHourOptions;

  // Mevcut saat seçeneklerde yoksa ilk uygun saati seç
  useEffect(() => {
    if (!hourOptions.includes(selectedTime)) {
      setSelectedTime(hourOptions[0] || "08:00");
    }
  }, [hourOptions, selectedTime]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onTimeSelected(selectedTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-xl shadow-2xl w-full max-w-md border border-outline-variant">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
              <span className="text-primary text-xl">🕐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
              <p className="text-sm text-on-surface-variant">Saat seçiniz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-(--on-surface) transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Saat seçimi */}
        <div className="p-5">
          <label className="block text-sm font-medium text-on-surface mb-2">
            Saat:
          </label>
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg">
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {hourOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 p-5 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-lg transition-all font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Seç
          </button>
        </div>
      </div>
    </div>
  );
}
