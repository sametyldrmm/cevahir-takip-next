"use client";

interface ProjectTarget {
  projectId: string;
  projectName: string;
  taskContent: string;
  goalStatus: string;
  block?: string;
  floors?: string;
  description?: string;
}

interface Target {
  username: string;
  displayName: string;
  projectTargets: ProjectTarget[];
  isCurrentUser?: boolean;
}

interface TargetCardProps {
  target: Target;
}

export default function TargetCard({ target }: TargetCardProps) {
  const statusColors: Record<string, string> = {
    "Hedefime ulaştım": "bg-green-500",
    "Hedefime kısmen ulaştım": "bg-yellow-500",
    "Hedefime ulaşamadım": "bg-red-500",
    "Belirlenmedi": "bg-gray-400",
  };

  const cardBg = target.isCurrentUser
    ? "bg-primary-container border-primary"
    : "bg-surface-container-low border-outline-variant";

  return (
    <div className={`p-4 rounded-lg border-2 ${cardBg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">👤</span>
          <span className="text-sm font-bold text-on-surface">
            {target.displayName}
            {target.isCurrentUser && " (You)"}
          </span>
        </div>
        <span className="text-xs px-2 py-1 bg-primary text-on-primary rounded">
          📋 {target.projectTargets.length} proje
        </span>
      </div>

      <div className="space-y-3">
        {target.projectTargets.map((projectTarget, index) => (
          <div
            key={index}
            className="p-3 bg-surface-container rounded-lg border border-outline-variant"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-on-surface">
                {projectTarget.projectName}
              </span>
              <div
                className={`w-3 h-3 rounded-full ${statusColors[projectTarget.goalStatus] || statusColors["Belirlenmedi"]}`}
              />
            </div>
            <p className="text-sm text-on-surface-variant mb-2">
              {projectTarget.taskContent}
            </p>
            {(projectTarget.block || projectTarget.floors) && (
              <div className="text-xs text-on-surface-variant">
                {projectTarget.block && <span>Blok: {projectTarget.block}</span>}
                {projectTarget.block && projectTarget.floors && " • "}
                {projectTarget.floors && <span>Kat: {projectTarget.floors}</span>}
              </div>
            )}
            {projectTarget.description && (
              <p className="text-xs text-on-surface-variant mt-2 italic">
                {projectTarget.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}







