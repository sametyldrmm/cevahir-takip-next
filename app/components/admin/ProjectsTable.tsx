"use client";

interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  userCount?: number;
  targetCount?: number;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
  updatedAt?: string;
  archived?: boolean;
}

interface ProjectsTableProps {
  projects: Project[];
  mode: "active" | "archived";
  onProjectClick?: (project: Project) => void;
  onEditProject: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
}

export default function ProjectsTable({
  projects,
  mode,
  onProjectClick,
  onEditProject,
  onArchiveProject,
  onRestoreProject,
}: ProjectsTableProps) {
  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷 Türkiye",
    international: "🌍 Uluslararası",
    special: "⭐ Özel",
    visualization: "🎨 Görselleştirme",
  };

  return (
    <div className="border border-outline-variant rounded-xl m-5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant">
        <div className="flex items-center gap-0">
          <div className="w-[300px] text-xs font-semibold text-on-surface-variant">
            Project name
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Category
          </div>
          <div className="w-[250px] text-xs font-semibold text-on-surface-variant">
            Description
          </div>
          <div className="w-24 text-xs font-semibold text-on-surface-variant text-center">
            Users
          </div>
          <div className="w-24 text-xs font-semibold text-on-surface-variant text-center">
            Targets
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Status
          </div>
          <div className="w-40 text-xs font-semibold text-on-surface-variant">
            Updated
          </div>
          <div className="flex-1 text-xs font-semibold text-on-surface-variant text-right">
            İşlemler
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto bg-surface">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            Proje bulunamadı
          </div>
        ) : (
          projects.map((project, index) => {
            return (
              <div
                key={project.id}
                onClick={() => {
                  onProjectClick?.(project);
                }}
                className={`flex items-center gap-0 px-5 py-3.5 border-b border-outline-variant transition-all ${
                  "hover:bg-(--surface-container-high)"
                } ${index === projects.length - 1 ? "border-b-0" : ""}`}
              >
                <div className="w-[300px] text-sm text-on-surface font-medium truncate">
                  {project.name}
                </div>
                <div className="w-32">
                  <span className="text-xs px-2 py-1 bg-surface-container-high rounded-lg text-on-surface-variant">
                    {categoryLabels[project.category] || project.category}
                  </span>
                </div>
                <div className="w-[250px] text-sm text-on-surface-variant truncate">
                  {project.description || "-"}
                </div>
                <div className="w-24 text-sm text-on-surface text-center font-medium">
                  {project.userCount !== undefined ? project.userCount : "-"}
                </div>
                <div className="w-24 text-sm text-on-surface text-center font-medium">
                  {project.targetCount !== undefined ? project.targetCount : "-"}
                </div>
                <div className="w-32">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      project.isActive && !project.archived
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}
                  >
                    {project.isActive && !project.archived ? "Aktif" : "Arşiv"}
                  </span>
                </div>
                <div className="w-40 text-sm text-on-surface-variant">
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "-"}
                </div>
                <div className="flex-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProject(project.id);
                    }}
                    className="px-3 py-1.5 border border-blue rounded-lg text-sm text-primary hover:bg-(--surface-container-high) transition-colors"
                  >
                    Düzenle
                  </button>
                  {mode === "archived" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreProject?.(project.id);
                      }}
                      className="px-3 py-1.5 border border-red-500  text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors"
                    >
                      Geri Al
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveProject?.(project.id);
                      }}
                      className="px-3 py-1.5 border border-red-500  text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors"
                    >
                      Arşivle
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
