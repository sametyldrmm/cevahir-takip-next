"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi, User as ApiUser, CreateUserDto, UpdateUserDto } from "@/lib/api/users";
import { useNotification } from "@/app/contexts/NotificationContext";
import {
  CreateUserDialog,
  EditUserRoleDialog,
  DeleteUserDataDialog,
} from "@/app/components/dialogs";
import UsersTable from "@/app/components/admin/UsersTable";
import MainLayout from "@/app/components/MainLayout";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  status?: "active" | "archived";
  totalTargets?: number;
  lastTargetDate?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUserRole, setShowEditUserRole] = useState(false);
  const [showDeleteUserData, setShowDeleteUserData] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const { showSuccess, showError } = useNotification();

  // Kullanıcıları yükle
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const apiUsers = await usersApi.getAllUsers();
      const convertedUsers: User[] = apiUsers.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        email: u.email,
        isAdmin: u.role === "ADMIN",
        status: u.isActive ? "active" : "archived",
        totalTargets: u.totalTargets || 0,
        lastTargetDate: u.lastTargetDate,
      }));
      setUsers(convertedUsers);
    } catch (error: any) {
      console.error("Users load error:", error);
      showError("Kullanıcılar yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // Kullanıcı oluştur
  const handleCreateUser = async (userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    isAdmin: boolean;
  }) => {
    try {
      const createDto: CreateUserDto = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        role: userData.isAdmin ? "ADMIN" : "USER",
      };

      const newUser = await usersApi.createUser(createDto);

      const convertedUser: User = {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName || newUser.username,
        email: newUser.email,
        isAdmin: newUser.role === "ADMIN",
        status: newUser.isActive ? "active" : "archived",
        totalTargets: 0,
      };

      setUsers([...users, convertedUser]);
      setShowCreateUser(false);
      showSuccess("Kullanıcı başarıyla oluşturuldu");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Kullanıcı oluşturulurken bir hata oluştu";
      showError(message);
    }
  };

  // Kullanıcı rolü güncelle
  const handleEditUserRole = async (userData: { userId: string; isAdmin: boolean }) => {
    try {
      const updatedUser = await usersApi.updateUser(userData.userId, {
        role: userData.isAdmin ? "ADMIN" : "USER",
      });

      setUsers(
        users.map((u) =>
          u.id === userData.userId
            ? {
                ...u,
                isAdmin: updatedUser.role === "ADMIN",
              }
            : u
        )
      );
      setShowEditUserRole(false);
      setEditingUser(null);
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı rolü başarıyla güncellendi");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Kullanıcı rolü güncellenirken bir hata oluştu";
      showError(message);
    }
  };

  // Kullanıcı sil
  const handleDeleteUserData = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map((id) => usersApi.deleteUser(id)));
      setUsers(users.filter((u) => !userIds.includes(u.id)));
      setShowDeleteUserData(false);
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla silindi");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Kullanıcı silinirken bir hata oluştu";
      showError(message);
    }
  };

  // Kullanıcı arşivle
  const handleArchiveUsers = async () => {
    const userIds = Array.from(selectedUsers);
    try {
      await Promise.all(
        userIds.map((id) => usersApi.updateUser(id, { isActive: false }))
      );
      setUsers(users.map((u) => (userIds.includes(u.id) ? { ...u, status: "archived" as const } : u)));
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla arşivlendi");
    } catch (error: any) {
      const message = error.response?.data?.message || "Kullanıcı arşivlenirken bir hata oluştu";
      showError(message);
    }
  };

  // Kullanıcı geri yükle
  const handleRestoreUsers = async () => {
    const userIds = Array.from(selectedUsers);
    try {
      await Promise.all(
        userIds.map((id) => usersApi.updateUser(id, { isActive: true }))
      );
      setUsers(users.map((u) => (userIds.includes(u.id) ? { ...u, status: "active" as const } : u)));
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla geri yüklendi");
    } catch (error: any) {
      const message = error.response?.data?.message || "Kullanıcı geri yüklenirken bir hata oluştu";
      showError(message);
    }
  };

  // Selection handlers
  const handleUserSelect = (userId: string, selected: boolean) => {
    const newSet = new Set(selectedUsers);
    if (selected) {
      newSet.add(userId);
    } else {
      newSet.delete(userId);
    }
    setSelectedUsers(newSet);
  };

  const handleSelectAllUsers = (selected: boolean) => {
    const filteredUsers = getFilteredUsers();
    if (selected) {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleEditRoleClick = () => {
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      const user = users.find((u) => u.id === userId);
      if (user) {
        setEditingUser(user);
        setShowEditUserRole(true);
      }
    }
  };

  const getFilteredUsers = () => {
    switch (filter) {
      case "active":
        return users.filter((u) => u.status === "active");
      case "archived":
        return users.filter((u) => u.status === "archived");
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-on-surface-variant">Yükleniyor...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="bg-surface-container-low border-b border-outline-variant px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Kullanıcılar</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Tüm kullanıcıları görüntüleyin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateUser(true)}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-all font-medium shadow-sm"
            >
              + Kullanıcı Ekle
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                editMode
                  ? "bg-primary-container text-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {editMode ? "Düzenleme Modu" : "Düzenle"}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setFilter("all");
              setSelectedUsers(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Tümü ({users.length})
          </button>
          <button
            onClick={() => {
              setFilter("active");
              setSelectedUsers(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "active"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Aktif ({users.filter((u) => u.status === "active").length})
          </button>
          <button
            onClick={() => {
              setFilter("archived");
              setSelectedUsers(new Set());
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "archived"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            Arşivli ({users.filter((u) => u.status === "archived").length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {editMode && selectedUsers.size > 0 && (
        <div className="bg-surface-container-low border-b border-outline-variant px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-on-surface-variant">
              {selectedUsers.size} kullanıcı seçildi
            </div>
            <div className="flex items-center gap-2">
              {filter === "archived" ? (
                <button
                  onClick={handleRestoreUsers}
                  className="px-4 py-2 bg-success text-on-success rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                >
                  Geri Yükle
                </button>
              ) : (
                <>
                  {selectedUsers.size === 1 && (
                    <button
                      onClick={handleEditRoleClick}
                      className="px-4 py-2 bg-primary-container text-primary rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                    >
                      Rol Düzenle
                    </button>
                  )}
                  <button
                    onClick={handleArchiveUsers}
                    className="px-4 py-2 bg-warning text-on-warning rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                  >
                    Arşivle
                  </button>
                </>
              )}
              {filter === "archived" && (
                <button
                  onClick={() => setShowDeleteUserData(true)}
                  className="px-4 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                >
                  Sil
                </button>
              )}
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container transition-all font-medium text-sm"
              >
                Seçimi Temizle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="flex-1 overflow-auto">
        <UsersTable
          users={filteredUsers}
          editMode={editMode}
          selectedUsers={selectedUsers}
          onUserSelect={handleUserSelect}
          onSelectAll={handleSelectAllUsers}
          onUserClick={(user) => {
            if (editMode && selectedUsers.size === 1) {
              const originalUser = users.find((u) => u.id === user.id);
              if (originalUser) {
                setEditingUser(originalUser);
                setShowEditUserRole(true);
              }
            }
          }}
        />
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onUserCreated={handleCreateUser}
      />

      {editingUser && (
        <EditUserRoleDialog
          isOpen={showEditUserRole}
          userId={editingUser.id}
          username={editingUser.username}
          currentRole={editingUser.isAdmin ? "admin" : "user"}
          onClose={() => {
            setShowEditUserRole(false);
            setEditingUser(null);
          }}
          onRoleUpdated={handleEditUserRole}
        />
      )}

      {selectedUsers.size > 0 && (
        <DeleteUserDataDialog
          isOpen={showDeleteUserData}
          userIds={Array.from(selectedUsers)}
          usernames={users
            .filter((u) => selectedUsers.has(u.id))
            .map((u) => u.username)}
          onClose={() => setShowDeleteUserData(false)}
          onUserDataDeleted={handleDeleteUserData}
        />
      )}
      </div>
    </MainLayout>
  );
}

