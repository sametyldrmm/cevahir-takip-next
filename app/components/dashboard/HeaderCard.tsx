"use client";

interface HeaderCardProps {
  displayName: string;
}

export default function HeaderCard({ displayName }: HeaderCardProps) {
  return (
    <div className="bg-dashboard-surface p-6 rounded-xl shadow-sm border border-outline-variant">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">Dashboard</h1>
          <p className="text-base text-on-surface-variant">
            Hoş Geldiniz <span className="font-bold">{displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <span className="text-2xl">📅</span>
          <span className="text-base font-medium">Hedef Takibi</span>
        </div>
      </div>
    </div>
  );
}









