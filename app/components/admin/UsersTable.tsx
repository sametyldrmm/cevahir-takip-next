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

type AdminUsersTableProps = {
  users: User[];
  onUserClick?: (user: User) => void;
  mode: "active" | "archived";
  onChangeRole: (userId: string) => void;
  onChangeTitle: (userId: string) => void;
  onChangePassword: (userId: string) => void;
  onArchiveUser?: (userId: string) => void;
  onRestoreUser?: (userId: string) => void;
};

type SelectableUsersTableProps = {
  users: User[];
  editMode: boolean;
  selectedUsers: Set<string>;
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUserClick?: (user: User) => void;
};

type UsersTableProps = AdminUsersTableProps | SelectableUsersTableProps;

export default function UsersTable({
  users,
  onUserClick,
  ...rest
}: UsersTableProps) {
  const isSelectable = "editMode" in rest;
  const isEditMode = isSelectable ? rest.editMode : false;
  const selectedUsers = isSelectable ? rest.selectedUsers : new Set<string>();
  const allSelected =
    isSelectable && users.length > 0 && selectedUsers.size === users.length;

  const gridCols = isSelectable
    ? "grid grid-cols-[48px_minmax(140px,1.3fr)_minmax(140px,1.5fr)_minmax(160px,1.8fr)_minmax(100px,1fr)_minmax(80px,0.9fr)_minmax(110px,1fr)]"
    : "grid grid-cols-[minmax(140px,1.2fr)_minmax(140px,1.4fr)_minmax(160px,1.7fr)_minmax(100px,1fr)_minmax(80px,0.9fr)_minmax(110px,1fr)_minmax(240px,2.2fr)]";

  return (
    <div className="border border-outline-variant rounded-xl m-5 shadow-sm overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto overflow-x-hidden bg-surface">
        <div className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 border-b border-outline-variant">
          <div className={`${gridCols} items-center gap-3`}>
            {isSelectable && (
              <div className="min-w-0 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={!isEditMode}
                  onChange={(e) => rest.onSelectAll(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            )}
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Username
            </div>
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Display Name
            </div>
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Pozisyon
            </div>
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Status
            </div>
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Total Targets
            </div>
            <div className="min-w-0 text-xs font-semibold text-on-surface-variant">
              Last Target Date
            </div>
            {!isSelectable && (
              <div className="min-w-0 text-xs font-semibold text-on-surface-variant text-right">
                İşlemler
              </div>
            )}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            Kullanıcı bulunamadı
          </div>
        ) : (
          users.map((user, index) => {
            const isSelected = isSelectable ? selectedUsers.has(user.id) : false;
            return (
              <div
                key={user.id}
                onClick={() => {
                  if (isSelectable && isEditMode) {
                    rest.onUserSelect(user.id, !isSelected);
                    return;
                  }
                  onUserClick?.(user);
                }}
                className={`px-4 py-3 border-b border-outline-variant transition-all hover:bg-(--surface-container-high) ${
                  index === users.length - 1 ? "border-b-0" : ""
                }`}
              >
                <div className={`${gridCols} items-center gap-3`}>
                  {isSelectable && (
                    <div className="min-w-0 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isEditMode}
                        onChange={(e) =>
                          rest.onUserSelect(user.id, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </div>
                  )}
                  <div className="min-w-0 text-sm text-on-surface font-medium truncate">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{user.username}</span>
                      {user.isAdmin && (
                        <span className="text-xs px-2 py-0.5 bg-primary-container text-primary rounded-lg font-medium shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 text-sm text-on-surface-variant truncate">
                    {user.displayName}
                  </div>
                  <div className="min-w-0 text-sm text-on-surface-variant truncate">
                    {user.userTitle?.trim() || "-"}
                  </div>
                  <div className="min-w-0">
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
                  <div className="min-w-0 text-sm text-on-surface-variant font-medium">
                    {user.totalTargets}
                  </div>
                  <div className="min-w-0 text-sm text-on-surface-variant">
                    {user.lastTargetDate
                      ? new Date(user.lastTargetDate).toLocaleDateString("tr-TR")
                      : "-"}
                  </div>
                  {!isSelectable && (
                    <div className="min-w-0 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rest.onChangeRole(user.id);
                        }}
                        className="px-2.5 py-1.5 border border-primary rounded-lg text-xs text-primary hover:bg-(--primary-container) transition-colors"
                      >
                        Rol Değiştir
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rest.onChangeTitle(user.id);
                        }}
                        className="px-2.5 py-1.5 border border-primary rounded-lg text-xs text-primary hover:bg-(--primary-container) transition-colors"
                      >
                        Pozisyon Değiştir
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rest.onChangePassword(user.id);
                        }}
                        className="px-2.5 py-1.5 border border-primary rounded-lg text-xs text-primary hover:bg-(--primary-container) transition-colors"
                      >
                        Şifre Değiştir
                      </button>
                      {rest.mode === "archived" ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            rest.onRestoreUser?.(user.id);
                          }}
                          className="px-2.5 py-1.5 border border-red-500 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors"
                        >
                          Geri Al
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            rest.onArchiveUser?.(user.id);
                          }}
                          className="px-2.5 py-1.5 border border-red-500 text-red-500 rounded-lg text-xs hover:bg-red-100 transition-colors"
                        >
                          Arşivle
                        </button>
                      )}
                    </div>
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
