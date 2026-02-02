"use client";

import { useState } from "react";
import CalendarSection from "../dashboard/CalendarSection";

interface GoalData {
  date: string;
  status: "completed" | "partial" | "failed" | "no_data";
  goalValue?: number;
  targetValue?: number;
  description?: string;
  project?: string;
}

interface GoalCalendarProps {
  goals?: GoalData[];
  onDateSelect?: (date: Date) => void;
  initialDate?: Date;
}

export default function GoalCalendar({
  goals = [],
  onDateSelect,
  initialDate = new Date(),
}: GoalCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentDate, setCurrentDate] = useState(initialDate);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // Goals'ı date key formatına çevir
  const targets: Record<string, { status: string; hasTarget: boolean }> = {};
  const leaves: Record<string, { type: string; note?: string }> = {};

  goals.forEach((goal) => {
    const dateKey = goal.date;
    targets[dateKey] = {
      status: goal.status,
      hasTarget: goal.status !== "no_data",
    };
  });

  return (
    <div className="w-full">
      <CalendarSection
        currentDate={currentDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        targets={targets}
        leaves={leaves}
      />
    </div>
  );
}







