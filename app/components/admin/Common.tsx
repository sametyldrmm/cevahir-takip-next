"use client";

interface UserInfoProps {
  username: string;
  displayName?: string;
  isAdmin?: boolean;
  date?: string;
}

export function UserInfo({ username, displayName, isAdmin, date }: UserInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
        <span className="text-primary text-sm">👤</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-on-surface">
          {displayName || username}
        </span>
        {date && (
          <span className="text-xs text-on-surface-variant">{date}</span>
        )}
        {isAdmin && (
          <span className="text-xs px-2 py-0.5 bg-primary-container text-primary rounded w-fit mt-1">
            Admin
          </span>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  type: "projects" | "users";
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  const defaultMessages = {
    projects: "Henüz proje eklenmemiş.",
    users: "Henüz kullanıcı eklenmemiş.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-6xl mb-4">
        {type === "projects" ? "📁" : "👤"}
      </span>
      <h3 className="text-lg font-semibold text-on-surface mb-2">
        {type === "projects" ? "Proje Bulunamadı" : "Kullanıcı Bulunamadı"}
      </h3>
      <p className="text-sm text-on-surface-variant text-center max-w-md">
        {message || defaultMessages[type]}
      </p>
    </div>
  );
}







