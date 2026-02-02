"use client";

interface Target {
  id: string;
  project: string;
  taskContent: string;
  goalStatus: string;
  date: string;
}

interface TargetCardProps {
  target: Target | null;
  date: string;
}

export default function TargetCard({ target, date }: TargetCardProps) {
  if (!target) {
    return (
      <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
        <h3 className="text-lg font-semibold text-on-surface mb-4">
          Bugünkü Hedef
        </h3>
        <p className="text-on-surface-variant">
          {date} için henüz hedef girilmemiş.
        </p>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    "Hedefime ulaştım": {
      bg: "bg-success-container",
      text: "text-success",
      border: "border-success/30",
    },
    "Hedefime kısmen ulaştım": {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/30",
    },
    "Hedefime ulaşamadım": {
      bg: "bg-error-container",
      text: "text-error",
      border: "border-error/30",
    },
    "Belirlenmedi": {
      bg: "bg-surface-container-high",
      text: "text-on-surface-variant",
      border: "border-outline-variant",
    },
  };

  const status = statusColors[target.goalStatus] || statusColors["Belirlenmedi"];

  return (
    <div className="bg-surface-container p-6 rounded-xl border border-outline-variant shadow-sm">
      <h3 className="text-lg font-semibold text-on-surface mb-4">
        Bugünkü Hedef
      </h3>
      <div className="space-y-4">
        <div>
          <span className="text-sm text-on-surface-variant">Proje: </span>
          <span className="text-sm font-medium text-on-surface">
            {target.project}
          </span>
        </div>
        <div>
          <span className="text-sm text-on-surface-variant">İş İçeriği: </span>
          <p className="text-sm text-on-surface mt-1">{target.taskContent}</p>
        </div>
        <div>
          <span className="text-sm text-on-surface-variant">Durum: </span>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-lg border-2 ${status.bg} ${status.text} ${status.border}`}
          >
            {target.goalStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
