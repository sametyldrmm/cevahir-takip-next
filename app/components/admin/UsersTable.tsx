"use client";

interface User {
  id: string;
  username: string;
  displayName: string;
  userTitle?: string;
  status: "active" | "archived";
  totalTargets: number;
  lastTargetDate?: string;
  isAdmin?: boolean;
}

interface UsersTableProps {
  users: User[];
  onUserClick?: (user: User) => void;
  mode: "active" | "archived";
  onChangeRole: (userId: string) => void;
  onChangeTitle: (userId: string) => void;
  onChangePassword: (userId: string) => void;
  onArchiveUser?: (userId: string) => void;
  onRestoreUser?: (userId: string) => void;
}

export default function UsersTable({
  users,
  onUserClick,
  mode,
  onChangeRole,
  onChangeTitle,
  onChangePassword,
  onArchiveUser,
  onRestoreUser,
}: UsersTableProps) {
  return (
    <div className="border border-outline-variant rounded-xl m-5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant">
        <div className="flex items-center gap-0">
          <div className="w-56 text-xs font-semibold text-on-surface-variant">
            Username
          </div>
          <div className="w-56 text-xs font-semibold text-on-surface-variant">
            Display Name
          </div>
          <div className="w-56 text-xs font-semibold text-on-surface-variant">
            Pozisyon
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Status
          </div>
          <div className="w-32 text-xs font-semibold text-on-surface-variant">
            Total Targets
          </div>
          <div className="w-40 text-xs font-semibold text-on-surface-variant">
            Last Target Date
          </div>
          <div className="flex-1 text-xs font-semibold text-on-surface-variant text-right">
            İşlemler
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto bg-surface">
        {users.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            Kullanıcı bulunamadı
          </div>
        ) : (
          users.map((user, index) => {
            return (
              <div
                key={user.id}
                onClick={() => onUserClick?.(user)}
                className={`flex items-center gap-0 px-5 py-3.5 border-b border-outline-variant transition-all hover:bg-(--surface-container-high) ${
                  index === users.length - 1 ? "border-b-0" : ""
                }`}
              >
                <div className="w-56 text-sm text-on-surface font-medium">
                  <div className="flex items-center gap-2">
                    {user.username}
                    {user.isAdmin && (
                      <span className="text-xs px-2 py-0.5 bg-primary-container text-primary rounded-lg font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-56 text-sm text-on-surface-variant">
                  {user.displayName}
                </div>
                <div className="w-56 text-sm text-on-surface-variant">
                  {user.userTitle?.trim() || "-"}
                </div>
                <div className="w-32">
                  <span
                    className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      user.status === "active"
                        ? "bg-success-container text-success"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {user.status === "active" ? "Aktif" : "Arşivli"}
                  </span>
                </div>
                <div className="w-32 text-sm text-on-surface-variant font-medium">
                  {user.totalTargets}
                </div>
                <div className="w-40 text-sm text-on-surface-variant">
                  {user.lastTargetDate
                    ? new Date(user.lastTargetDate).toLocaleDateString("tr-TR")
                    : "-"}
                </div>
                <div className="flex-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeRole(user.id);
                    }}
                    className="px-3 py-1.5 border border-primary rounded-lg text-sm text-primary hover:bg-(--primary-container) transition-colors"
                  >
                    Rol Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeTitle(user.id);
                    }}
                    className="px-3 py-1.5 border border-primary rounded-lg text-sm text-primary hover:bg-(--primary-container) transition-colors"
                  >
                    Pozisyon Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangePassword(user.id);
                    }}
                    className="px-3 py-1.5 border border-primary rounded-lg text-sm text-primary hover:bg-(--primary-container) transition-colors"
                  >
                    Şifre Değiştir
                  </button>
                  {mode === "archived" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreUser?.(user.id);
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
                        onArchiveUser?.(user.id);
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
