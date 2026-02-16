"use client";

import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { projectsApi, Project as ApiProject } from "@/lib/api/projects";
import { usersApi, User as ApiUser, CreateUserDto, UpdateUserDto } from "@/lib/api/users";
import { useNotification } from "@/app/contexts/NotificationContext";
import {
  CreateUserDialog,
  EditUserRoleDialog,
  CreateProjectDialog,
  EditProjectDialog,
  DeleteProjectDialog,
  ArchiveProjectDialog,
  ArchiveUserDialog,
  DeleteUserDataDialog,
  AdminPasswordChangeDialog,
} from "@/app/components/dialogs";
import ProjectDetailDialog from "@/app/components/dialogs/ProjectDetailDialog";
import { Header, ProjectsTable, UsersTable, Toolbar } from "@/app/components/admin";

interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  archived?: boolean;
  code?: string | null;
  isActive?: boolean;
  teamMembers?: string[];
  userCount?: number;
  targetCount?: number;
  users?: Array<{ id: string; username: string; email: string; displayName?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  userTitle?: string;
  isAdmin?: boolean;
  status?: "active" | "archived";
  totalTargets?: number;
  lastTargetDate?: string;
}

export default function AdminPanelView() {
  const [activeTab, setActiveTab] = useState<"all" | "archived" | "users" | "users_archived">("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set()); // userId'leri tutar
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useNotification();
  const getApiErrorMessage = (error: unknown) => {
    if (isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return undefined;
  };

  interface CreateProjectPayload {
    name: string;
    code?: string | null;
    description?: string | null;
    category?: string | null;
    teamMembers?: string[];
  }

  // Projeleri ve kullanıcıları API'den yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [apiProjects, apiUsers] = await Promise.all([
          projectsApi.getAllProjects(),
          usersApi.getAllUsers(),
        ]);
        
        // API projelerini local format'a çevir
        const convertedProjects: Project[] = apiProjects.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category || "special", // Backend'den gelen category
          description: p.description || undefined,
          code: p.code,
          isActive: p.isActive,
          archived: !p.isActive,
          teamMembers: p.users?.map((u) => u.username) || [], // Proje kullanıcılarının username'leri
          userCount: p.userCount,
          targetCount: p.targetCount,
          users: p.users,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
        setProjects(convertedProjects);

        // API kullanıcılarını local format'a çevir
        const convertedUsers: User[] = apiUsers.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName || u.username,
          email: u.email,
          userTitle: u.userTitle,
          isAdmin: u.role === "ADMIN",
          status: u.isActive ? "active" : "archived",
          totalTargets: u.totalTargets || 0,
          lastTargetDate: u.lastTargetDate,
        }));
        setUsers(convertedUsers);
      } catch (error: unknown) {
        console.error("Data load error:", error);
        showError("Veriler yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [showError]);

  // Dialog states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [showArchiveProject, setShowArchiveProject] = useState(false);
  const [showArchiveUser, setShowArchiveUser] = useState(false);
  const [showEditUserRole, setShowEditUserRole] = useState(false);
  const [editUserDialogMode, setEditUserDialogMode] = useState<"role" | "title">("role");
  const [showDeleteUserData, setShowDeleteUserData] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const categoryLabels: Record<string, string> = {
    turkiye: "🇹🇷 Türkiye Projeleri",
    international: "🌍 Uluslararası Projeler",
    special: "⭐ Özel Projeler",
    visualization: "🎨 Vizüalizasyon Projeleri",
  };

  const handleCreateProject = async (projectData: CreateProjectPayload) => {
    try {
      const newProject = await projectsApi.createProject({
        name: projectData.name,
        code: projectData.code ?? undefined,
        description: projectData.description ?? undefined,
        category: projectData.category || "special",
      });

      // Projeye seçili kullanıcıları ekle
      if (projectData.teamMembers && projectData.teamMembers.length > 0) {
        for (const username of projectData.teamMembers) {
          const user = users.find((u) => u.username === username);
          if (user) {
            try {
              await projectsApi.addUserToProject(newProject.id, user.id);
            } catch (error: unknown) {
              console.error(`Failed to add user ${username} to project:`, error);
            }
          }
        }
      }

      const convertedProject: Project = {
        id: newProject.id,
        name: newProject.name,
        category: newProject.category || projectData.category || "special",
        description: newProject.description || undefined,
        code: newProject.code,
        isActive: newProject.isActive,
        archived: !newProject.isActive,
        teamMembers: projectData.teamMembers || [],
      };
      setProjects([...projects, convertedProject]);
      setShowCreateProject(false);
      showSuccess("Proje başarıyla oluşturuldu");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Proje oluşturulurken bir hata oluştu");
    }
  };

  const handleEditProject = async (projectData: Project) => {
    try {
      const updatedProject = await projectsApi.updateProject(projectData.id, {
        name: projectData.name,
        code: projectData.code ?? undefined,
        description: projectData.description,
        category: projectData.category || "special",
        isActive: !projectData.archived,
      });

      // Projeye seçili kullanıcıları ekle
      if (projectData.teamMembers && projectData.teamMembers.length > 0) {
        // Mevcut proje kullanıcılarını al
        const currentProject = projects.find((p) => p.id === projectData.id);
        const currentUserIds = new Set(
          users
            .filter((u) => currentProject?.teamMembers?.includes(u.username))
            .map((u) => u.id)
        );

        // Yeni seçili kullanıcıları ekle
        for (const username of projectData.teamMembers) {
          const user = users.find((u) => u.username === username);
          if (user && !currentUserIds.has(user.id)) {
            try {
              await projectsApi.addUserToProject(projectData.id, user.id);
            } catch (error: unknown) {
              console.error(`Failed to add user ${username} to project:`, error);
            }
          }
        }
      }

      setProjects(
        projects.map((p) =>
          p.id === projectData.id
            ? {
                ...p,
                name: updatedProject.name,
                code: updatedProject.code ?? undefined,
                description: updatedProject.description ?? undefined,
                isActive: updatedProject.isActive,
                archived: !updatedProject.isActive,
                teamMembers: projectData.teamMembers,
              }
            : p
        )
      );
      setShowEditProject(false);
      setEditingProject(null);
      setSelectedProjects(new Set());
      showSuccess("Proje başarıyla güncellendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Proje güncellenirken bir hata oluştu");
    }
  };

  const handleDeleteProjects = (projectIds: string[]) => {
    setProjects(projects.filter((p) => !projectIds.includes(p.id)));
    setShowDeleteProject(false);
    setSelectedProjects(new Set());
  };

  const handleArchiveProjects = async (projectIds: string[]) => {
    try {
      await Promise.all(projectIds.map((id) => projectsApi.updateProject(id, { isActive: false })));
      setProjects((currentProjects) =>
        currentProjects.map((p) =>
          projectIds.includes(p.id)
            ? { ...p, isActive: false, archived: true, updatedBy: "Admin" }
            : p
        )
      );
      showSuccess("Proje(ler) başarıyla arşivlendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Proje arşivlenirken bir hata oluştu");
    } finally {
      setShowArchiveProject(false);
      setSelectedProjects(new Set());
    }
  };

  const handleRestoreProjects = async (projectIds: string[]) => {
    try {
      await Promise.all(projectIds.map((id) => projectsApi.updateProject(id, { isActive: true })));
      setProjects((currentProjects) =>
        currentProjects.map((p) =>
          projectIds.includes(p.id)
            ? { ...p, isActive: true, archived: false, updatedBy: "Admin" }
            : p
        )
      );
      showSuccess("Proje(ler) başarıyla geri alındı");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Proje geri alınırken bir hata oluştu");
    } finally {
      setSelectedProjects(new Set());
    }
  };

  // User handlers
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
        userTitle: newUser.userTitle,
        isAdmin: newUser.role === "ADMIN",
        status: newUser.isActive ? "active" : "archived",
        totalTargets: newUser.totalTargets || 0,
        lastTargetDate: newUser.lastTargetDate,
      };

      setUsers([...users, convertedUser]);
      setShowCreateUser(false);
      showSuccess("Kullanıcı başarıyla oluşturuldu");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı oluşturulurken bir hata oluştu");
    }
  };

  const handleEditUserSubmit = async (userData: { userId: string; isAdmin?: boolean; userTitle?: string }) => {
    try {
      const updateDto: UpdateUserDto = {};
      if (userData.isAdmin !== undefined) {
        updateDto.role = userData.isAdmin ? "ADMIN" : "USER";
      }
      if (userData.userTitle !== undefined) {
        updateDto.userTitle = userData.userTitle;
      }

      const updatedUser = await usersApi.updateUser(userData.userId, updateDto);

      setUsers(
        users.map((u) =>
          u.id === userData.userId
            ? {
                ...u,
                isAdmin: updatedUser.role === "ADMIN",
                userTitle: updatedUser.userTitle,
              }
            : u
        )
      );
      setShowEditUserRole(false);
      setEditingUser(null);
      setSelectedUsers(new Set());
      if (editUserDialogMode === "role") {
        showSuccess("Kullanıcı rolü başarıyla güncellendi");
      } else {
        showSuccess("Kullanıcı pozisyonu başarıyla güncellendi");
      }
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı güncellenirken bir hata oluştu");
    }
  };

  const handleDeleteUserData = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map((id) => usersApi.deleteUser(id)));
      setUsers(users.filter((u) => !userIds.includes(u.id)));
      setShowDeleteUserData(false);
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla silindi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı silinirken bir hata oluştu");
    }
  };

  const handleArchiveUsers = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map((id) => usersApi.updateUser(id, { isActive: false })));
      setUsers((currentUsers) =>
        currentUsers.map((u) => (userIds.includes(u.id) ? { ...u, status: "archived" as const } : u))
      );
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla arşivlendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı arşivlenirken bir hata oluştu");
    } finally {
      setShowArchiveUser(false);
    }
  };

  const handleRestoreUsers = async () => {
    const userIds = Array.from(selectedUsers);
    try {
      await Promise.all(
        userIds.map((id) => usersApi.updateUser(id, { isActive: true }))
      );
      setUsers(users.map((u) => (userIds.includes(u.id) ? { ...u, status: "active" as const } : u)));
      setSelectedUsers(new Set());
      showSuccess("Kullanıcı(lar) başarıyla geri yüklendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı geri yüklenirken bir hata oluştu");
    }
  };

  // Selection handlers
  const handleProjectSelect = (projectId: string, selected: boolean) => {
    const newSet = new Set(selectedProjects);
    if (selected) {
      newSet.add(projectId);
    } else {
      newSet.delete(projectId);
    }
    setSelectedProjects(newSet);
  };

  const handleSelectAllProjects = (selected: boolean) => {
    const filteredProjects = getFilteredProjects();
    if (selected) {
      setSelectedProjects(new Set(filteredProjects.map((p) => p.id)));
    } else {
      setSelectedProjects(new Set());
    }
  };

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

  const getFilteredProjects = () => {
    if (activeTab === "archived") {
      return projects.filter((p) => p.archived);
    }
    return projects.filter((p) => !p.archived);
  };

  const getFilteredUsers = () => {
    const filtered = activeTab === "users_archived"
      ? users.filter((u) => u.status === "archived")
      : users.filter((u) => u.status !== "archived");
    
    // Convert to UsersTable format
    return filtered.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      userTitle: u.userTitle,
      status: (u.status || "active") as "active" | "archived",
      totalTargets: u.totalTargets || 0,
      lastTargetDate: u.lastTargetDate,
      isAdmin: u.isAdmin,
    }));
  };

  const handleEditClick = () => {
    if (selectedProjects.size === 1) {
      const project = projects.find((p) => selectedProjects.has(p.id));
      if (project) {
        setEditingProject(project);
        setShowEditProject(true);
      }
    }
  };

  const handleEditRoleClick = () => {
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      const user = users.find((u) => u.id === userId);
      if (user) {
        setEditingUser(user);
        setEditUserDialogMode("role");
        setShowEditUserRole(true);
      }
    }
  };

  const handleEditUserTitleClick = () => {
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      const user = users.find((u) => u.id === userId);
      if (user) {
        setEditingUser(user);
        setEditUserDialogMode("title");
        setShowEditUserRole(true);
      }
    }
  };

  const handleChangePasswordClick = () => {
    if (selectedUsers.size === 1) {
      const userId = Array.from(selectedUsers)[0];
      const user = users.find((u) => u.id === userId);
      if (user) {
        setEditingUser(user);
        setShowChangePassword(true);
      }
    }
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    setEditingUser(null);
    setSelectedUsers(new Set());
    showSuccess("Kullanıcı şifresi başarıyla değiştirildi");
  };

  const filteredProjects = getFilteredProjects();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="flex flex-col h-full">
      <Header
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedProjects(new Set());
          setSelectedUsers(new Set());
        }}
        projectsCount={projects.filter((p) => !p.archived).length}
        archivedProjectsCount={projects.filter((p) => p.archived).length}
        usersCount={users.filter((u) => u.status !== "archived").length}
        archivedUsersCount={users.filter((u) => u.status === "archived").length}
        editMode={editMode}
        onToggleEditMode={() => {
          setEditMode(!editMode);
          setSelectedProjects(new Set());
          setSelectedUsers(new Set());
        }}
        onCreateProject={() => setShowCreateProject(true)}
        onCreateUser={() => setShowCreateUser(true)}
      />

      <Toolbar
        editMode={editMode}
        selectionCount={
          activeTab === "all" || activeTab === "archived"
            ? selectedProjects.size
            : selectedUsers.size
        }
        isProjectsTab={activeTab === "all" || activeTab === "archived"}
        canEditSingle={
          (activeTab === "all" || activeTab === "archived") && selectedProjects.size === 1
        }
        onToggleEditMode={() => setEditMode(!editMode)}
        onClearSelection={() => {
          setSelectedProjects(new Set());
          setSelectedUsers(new Set());
        }}
        onEdit={handleEditClick}
        onArchive={
          activeTab === "all"
            ? () => {
                if (selectedProjects.size > 0) {
                  setShowArchiveProject(true);
                }
              }
            : activeTab === "users"
              ? () => {
                  if (selectedUsers.size > 0) {
                    setShowArchiveUser(true);
                  }
                }
              : undefined
        }
        onRestore={
          activeTab === "archived"
            ? () => {
                const projectIds = Array.from(selectedProjects);
                if (projectIds.length > 0) {
                  void handleRestoreProjects(projectIds);
                }
              }
            : activeTab === "users_archived"
              ? () => {
                  if (selectedUsers.size > 0) {
                    void handleRestoreUsers();
                  }
                }
            : undefined
        }
        onDelete={
          activeTab === "users_archived" && selectedUsers.size > 0
            ? () => setShowDeleteUserData(true)
            : undefined
        }
        onEditRole={handleEditRoleClick}
        onEditUserTitle={handleEditUserTitleClick}
        onChangePassword={handleChangePasswordClick}
      />

      <div className="flex-1 overflow-auto">
        {activeTab === "all" || activeTab === "archived" ? (
          <ProjectsTable
            projects={filteredProjects}
            editMode={editMode}
            selectedProjects={selectedProjects}
            onProjectSelect={handleProjectSelect}
            onSelectAll={handleSelectAllProjects}
            onProjectClick={(project) => {
              if (editMode && selectedProjects.size === 1) {
                setEditingProject(project);
                setShowEditProject(true);
              } else if (!editMode) {
                // Edit mode değilse detay göster
                setSelectedProjectDetail(project);
                setShowProjectDetail(true);
              }
            }}
          />
        ) : (
          <UsersTable
            users={filteredUsers}
            editMode={editMode}
            selectedUsers={selectedUsers}
            onUserSelect={handleUserSelect}
            onSelectAll={handleSelectAllUsers}
            onUserClick={(user) => {
              if (editMode && selectedUsers.size === 1 && activeTab === "users") {
                // Find original user from users array
                const originalUser = users.find((u) => u.id === user.id);
                if (originalUser) {
                  setEditingUser(originalUser);
                  setEditUserDialogMode("role");
                  setShowEditUserRole(true);
                }
              }
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <ProjectDetailDialog
        isOpen={showProjectDetail}
        project={selectedProjectDetail}
        onClose={() => {
          setShowProjectDetail(false);
          setSelectedProjectDetail(null);
        }}
      />

      <CreateUserDialog
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onUserCreated={handleCreateUser}
      />

      {editingUser && (
        <>
          <EditUserRoleDialog
            isOpen={showEditUserRole}
            userId={editingUser.id}
            username={editingUser.username}
            currentRole={editingUser.isAdmin ? "admin" : "user"}
            currentUserTitle={editingUser.userTitle}
            mode={editUserDialogMode}
            onClose={() => {
              setShowEditUserRole(false);
              setEditingUser(null);
            }}
            onSubmit={handleEditUserSubmit}
          />
          <AdminPasswordChangeDialog
            isOpen={showChangePassword}
            userId={editingUser.id}
            username={editingUser.username}
            onClose={() => {
              setShowChangePassword(false);
              setEditingUser(null);
            }}
            onPasswordChanged={handlePasswordChanged}
          />
        </>
      )}

      <CreateProjectDialog
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={handleCreateProject}
      />

      {editingProject && (
        <EditProjectDialog
          isOpen={showEditProject}
          project={editingProject}
          onClose={() => {
            setShowEditProject(false);
            setEditingProject(null);
          }}
          onProjectUpdated={handleEditProject}
        />
      )}

      {selectedProjects.size > 0 && (
        <>
          <DeleteProjectDialog
            isOpen={showDeleteProject}
            projects={filteredProjects.filter((p) => selectedProjects.has(p.id))}
            onClose={() => setShowDeleteProject(false)}
            onProjectsDeleted={handleDeleteProjects}
          />

          <ArchiveProjectDialog
            isOpen={showArchiveProject}
            projects={filteredProjects.filter((p) => selectedProjects.has(p.id))}
            onClose={() => setShowArchiveProject(false)}
            onProjectsArchived={handleArchiveProjects}
          />
        </>
      )}

      {selectedUsers.size > 0 && (
        <>
          <ArchiveUserDialog
            isOpen={showArchiveUser}
            users={users
              .filter((u) => selectedUsers.has(u.id))
              .map((u) => ({
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                email: u.email,
              }))}
            onClose={() => setShowArchiveUser(false)}
            onUsersArchived={(archivedIds) => {
              void handleArchiveUsers(archivedIds);
            }}
          />

          <DeleteUserDataDialog
            isOpen={showDeleteUserData}
            userIds={Array.from(selectedUsers)}
            usernames={users
              .filter((u) => selectedUsers.has(u.id))
              .map((u) => u.username)}
            onClose={() => setShowDeleteUserData(false)}
            onUserDataDeleted={handleDeleteUserData}
          />
        </>
      )}
    </div>
  );
}
