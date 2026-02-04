"use client";

interface AdminHeaderProps {
  currentTab: "all" | "archived" | "users" | "users_archived";
  onTabChange: (tab: "all" | "archived" | "users" | "users_archived") => void;
  projectsCount: number;
  archivedProjectsCount: number;
  usersCount: number;
  archivedUsersCount: number;
  editMode: boolean;
  onToggleEditMode: () => void;
  onCreateProject?: () => void;
  onCreateUser?: () => void;
  onExport?: () => void;
  onExcelExport?: () => void;
  onMissingTargetsExport?: () => void;
  onPerformanceReport?: () => void;
}

export default function AdminHeader({
  currentTab,
  onTabChange,
  projectsCount,
  archivedProjectsCount,
  usersCount,
  archivedUsersCount,
  editMode,
  onToggleEditMode,
  onCreateProject,
  onCreateUser,
  onExport,
}: AdminHeaderProps) {
  const isProjectsTab = currentTab === "all" || currentTab === "archived";
  const isUsersTab = currentTab === "users" || currentTab === "users_archived";

  return (
    <div className="bg-surface-container border-b border-outline-variant px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-on-surface">Admin Panel</h2>
        <div className="flex items-center gap-2">
          {isProjectsTab && onCreateProject && (
            <button
              onClick={onCreateProject}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>➕</span>
              <span>Create Project</span>
            </button>
          )}
          {isUsersTab && onCreateUser && (
            <button
              onClick={onCreateUser}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add User</span>
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 border border-outline rounded-lg text-on-surface hover:bg-(--surface-container-high) transition-colors"
            >
              Export
            </button>
          )}
          <button
            onClick={onToggleEditMode}
            className={`px-4 py-2 rounded-lg transition-colors ${
              editMode
                ? "bg-primary text-on-primary"
                : "border border-outline text-on-surface hover:bg-(--surface-container-high)"
            }`}
            >
            {editMode ? "Düzenleme Modu" : "Düzenle"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-outline-variant">
        <button
          onClick={() => onTabChange("all")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentTab === "all"
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-(--on-surface)"
          }`}
        >
          Projeler ({projectsCount})
        </button>
        <button
          onClick={() => onTabChange("archived")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentTab === "archived"
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-(--on-surface)"
          }`}
        >
          Proje Arşivi ({archivedProjectsCount})
        </button>
        <button
          onClick={() => onTabChange("users")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentTab === "users"
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-(--on-surface)"
          }`}
        >
          Kullanıcılar ({usersCount})
        </button>
        <button
          onClick={() => onTabChange("users_archived")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            currentTab === "users_archived"
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-(--on-surface)"
          }`}
        >
          Kullanıcı Arşivi ({archivedUsersCount})
        </button>
      </div>
    </div>
  );
}






