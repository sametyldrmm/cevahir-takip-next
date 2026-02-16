"use client";

import { useState } from "react";

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
  editMode: boolean;
  selectedUsers: Set<string>; // userId'leri tutar
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUserClick?: (user: User) => void;
}

export default function UsersTable({
  users,
  editMode,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onUserClick,
}: UsersTableProps) {
  const allSelected = users.length > 0 && users.every((u) => selectedUsers.has(u.id));
  const someSelected = users.some((u) => selectedUsers.has(u.id));

  return (
    <div className="border border-outline-variant rounded-xl m-5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-surface-container-low px-5 py-3.5 border-b border-outline-variant">
        <div className="flex items-center gap-0">
          {editMode && (
            <div className="w-12 flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
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
            const isSelected = selectedUsers.has(user.id);
            return (
              <div
                key={user.id}
                onClick={() => {
                  if (editMode) {
                    onUserSelect(user.id, !isSelected);
                    return;
                  }
                  onUserClick?.(user);
                }}
                className={`flex items-center gap-0 px-5 py-3.5 border-b border-outline-variant transition-all ${
                  isSelected
                    ? "bg-selected-bg border-l-4 border-l-primary"
                    : "hover:bg-(--surface-container-high)"
                } ${index === users.length - 1 ? "border-b-0" : ""}`}
              >
                {editMode && (
                  <div className="w-12 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUserSelect(user.id, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-primary bg-surface border-outline rounded focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
