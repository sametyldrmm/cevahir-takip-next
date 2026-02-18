"use client";

interface AdminHeaderProps {
  currentTab: "all" | "archived" | "users" | "users_archived";
  onTabChange: (tab: "all" | "archived" | "users" | "users_archived") => void;
  projectsCount: number;
  archivedProjectsCount: number;
  usersCount: number;
  archivedUsersCount: number;
  onCreateProject?: () => void;
  onCreateUser?: () => void;
  onExport?: () => void;
  onExcelExport?: () => void;
  onMissingTargetsExport?: () => void;
  onPerformanceReport?: () => void;
  usersSearch?: string;
  onUsersSearchChange?: (search: string) => void;
}

export default function AdminHeader({
  currentTab,
  onTabChange,
  projectsCount,
  archivedProjectsCount,
  usersCount,
  archivedUsersCount,
  onCreateProject,
  onCreateUser,
  onExport,
  usersSearch,
  onUsersSearchChange,
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
        </div>
      </div>

      {isUsersTab && onUsersSearchChange && (
        <div className="mb-4">
          <input
            type="text"
            value={usersSearch || ""}
            onChange={(e) => onUsersSearchChange(e.target.value)}
            placeholder="Kullanıcı ara (username, display name, pozisyon)..."
            className="w-full px-4 py-2 bg-surface border border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      )}

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






