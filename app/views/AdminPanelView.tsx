"use client";

import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { projectsApi, Project as ApiProject } from "@/lib/api/projects";
import { usersApi, CreateUserDto, UpdateUserDto } from "@/lib/api/users";
import { useNotification } from "@/app/contexts/NotificationContext";
import {
  CreateUserDialog,
  EditUserRoleDialog,
  CreateProjectDialog,
  EditProjectDialog,
  ArchiveProjectDialog,
  ArchiveUserDialog,
  AdminPasswordChangeDialog,
} from "@/app/components/dialogs";
import ProjectDetailDialog from "@/app/components/dialogs/ProjectDetailDialog";
import { Header, ProjectsTable, UsersTable } from "@/app/components/admin";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  const [showArchiveProject, setShowArchiveProject] = useState(false);
  const [showArchiveUser, setShowArchiveUser] = useState(false);
  const [showEditUserRole, setShowEditUserRole] = useState(false);
  const [editUserDialogMode, setEditUserDialogMode] = useState<"role" | "title">("role");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [archiveProjectTargetId, setArchiveProjectTargetId] = useState<string | null>(null);
  const [archiveUserTargetId, setArchiveUserTargetId] = useState<string | null>(null);

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

      const currentProject = projects.find((p) => p.id === projectData.id);
      const currentMembers = new Set(currentProject?.teamMembers ?? []);
      const desiredMembers = new Set(projectData.teamMembers ?? []);

      const usernamesToRemove = Array.from(currentMembers).filter((u) => !desiredMembers.has(u));
      const usernamesToAdd = Array.from(desiredMembers).filter((u) => !currentMembers.has(u));

      let latestProject: ApiProject = updatedProject;

      for (const username of usernamesToRemove) {
        const user = users.find((u) => u.username === username);
        if (!user) continue;
        try {
          latestProject = await projectsApi.removeUserFromProject(projectData.id, user.id);
        } catch (error: unknown) {
          console.error(`Failed to remove user ${username} from project:`, error);
        }
      }

      for (const username of usernamesToAdd) {
        const user = users.find((u) => u.username === username);
        if (!user) continue;
        try {
          latestProject = await projectsApi.addUserToProject(projectData.id, user.id);
        } catch (error: unknown) {
          console.error(`Failed to add user ${username} to project:`, error);
        }
      }

      const teamMembersFromApi = latestProject.users?.map((u) => u.username) ?? Array.from(desiredMembers);

      setProjects((current) =>
        current.map((p) =>
          p.id === projectData.id
            ? {
                ...p,
                name: latestProject.name,
                code: latestProject.code ?? undefined,
                description: latestProject.description ?? undefined,
                category: latestProject.category || projectData.category || "special",
                isActive: latestProject.isActive,
                archived: !latestProject.isActive,
                teamMembers: teamMembersFromApi,
                userCount: latestProject.userCount,
                targetCount: latestProject.targetCount,
                users: latestProject.users,
                createdAt: latestProject.createdAt,
                updatedAt: latestProject.updatedAt,
              }
            : p
        )
      );

      setSelectedProjectDetail((current) => {
        if (!current || current.id !== projectData.id) return current;
        return {
          ...current,
          name: latestProject.name,
          code: latestProject.code ?? undefined,
          description: latestProject.description ?? undefined,
          category: latestProject.category || projectData.category || "special",
          isActive: latestProject.isActive,
          archived: !latestProject.isActive,
          teamMembers: teamMembersFromApi,
          userCount: latestProject.userCount,
          targetCount: latestProject.targetCount,
          users: latestProject.users,
          createdAt: latestProject.createdAt,
          updatedAt: latestProject.updatedAt,
        };
      });
      setShowEditProject(false);
      setEditingProject(null);
      showSuccess("Proje başarıyla güncellendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Proje güncellenirken bir hata oluştu");
    }
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
      setArchiveProjectTargetId(null);
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
      if (editUserDialogMode === "role") {
        showSuccess("Kullanıcı rolü başarıyla güncellendi");
      } else {
        showSuccess("Kullanıcı pozisyonu başarıyla güncellendi");
      }
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı güncellenirken bir hata oluştu");
    }
  };

  const handleArchiveUsers = async (userIds: string[]) => {
    try {
      await Promise.all(userIds.map((id) => usersApi.updateUser(id, { isActive: false })));
      setUsers((currentUsers) =>
        currentUsers.map((u) => (userIds.includes(u.id) ? { ...u, status: "archived" as const } : u))
      );
      showSuccess("Kullanıcı(lar) başarıyla arşivlendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı arşivlenirken bir hata oluştu");
    } finally {
      setShowArchiveUser(false);
      setArchiveUserTargetId(null);
    }
  };

  const handleRestoreUsersByIds = async (userIds: string[]) => {
    try {
      await Promise.all(
        userIds.map((id) => usersApi.updateUser(id, { isActive: true }))
      );
      setUsers((current) =>
        current.map((u) => (userIds.includes(u.id) ? { ...u, status: "active" as const } : u))
      );
      showSuccess("Kullanıcı(lar) başarıyla geri yüklendi");
    } catch (error: unknown) {
      showError(getApiErrorMessage(error) ?? "Kullanıcı geri yüklenirken bir hata oluştu");
    }
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    setEditingUser(null);
    showSuccess("Kullanıcı şifresi başarıyla değiştirildi");
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredProjects = projects
    .filter((p) => (activeTab === "archived" ? p.archived : !p.archived))
    .filter((p) => {
      if (!normalizedSearch) return true;
      const haystack = `${p.name} ${p.category} ${p.description ?? ""} ${p.code ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });

  const filteredUsers = users
    .filter((u) => (activeTab === "users_archived" ? u.status === "archived" : u.status !== "archived"))
    .filter((u) => {
      if (!normalizedSearch) return true;
      const haystack = `${u.username} ${u.displayName} ${u.email} ${u.userTitle ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      userTitle: u.userTitle,
      status: (u.status || "active") as "active" | "archived",
      totalTargets: u.totalTargets || 0,
      lastTargetDate: u.lastTargetDate,
      isAdmin: u.isAdmin,
    }));

  const handleEditProjectById = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setEditingProject(project);
    setShowEditProject(true);
  };

  const handleArchiveProjectById = (projectId: string) => {
    setArchiveProjectTargetId(projectId);
    setShowArchiveProject(true);
  };

  const handleRestoreProjectById = async (projectId: string) => {
    await handleRestoreProjects([projectId]);
  };

  const handleChangeUserRoleById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setEditingUser(user);
    setEditUserDialogMode("role");
    setShowEditUserRole(true);
  };

  const handleChangeUserTitleById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setEditingUser(user);
    setEditUserDialogMode("title");
    setShowEditUserRole(true);
  };

  const handleChangeUserPasswordById = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setEditingUser(user);
    setShowChangePassword(true);
  };

  const handleArchiveUserById = (userId: string) => {
    setArchiveUserTargetId(userId);
    setShowArchiveUser(true);
  };

  const handleRestoreUserById = async (userId: string) => {
    await handleRestoreUsersByIds([userId]);
  };

  const archiveProjectList = archiveProjectTargetId
    ? projects
        .filter((p) => p.id === archiveProjectTargetId)
        .map((p) => ({ id: p.id, name: p.name, category: p.category }))
    : [];

  const archiveUserList = archiveUserTargetId
    ? users
        .filter((u) => u.id === archiveUserTargetId)
        .map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          email: u.email,
        }))
    : [];

  return (
    <div className="flex flex-col h-full">
      <Header
        currentTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        projectsCount={projects.filter((p) => !p.archived).length}
        archivedProjectsCount={projects.filter((p) => p.archived).length}
        usersCount={users.filter((u) => u.status !== "archived").length}
        archivedUsersCount={users.filter((u) => u.status === "archived").length}
        onCreateProject={() => setShowCreateProject(true)}
        onCreateUser={() => setShowCreateUser(true)}
      />

      <div className="bg-surface-container-low border-b border-outline-variant px-6 py-3">
        <form
          className="relative w-full max-w-md"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <span className="absolute left-3 top-2.5 text-on-surface-variant">🔎</span>
          <input
            type="search"
            name="adminPanelSearch"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="w-full px-4 py-2.5 pl-10 pr-10 bg-surface border border-outline rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 p-1.5 text-on-surface-variant hover:text-(--on-surface) hover:bg-(--surface-container-high) rounded-md transition-colors"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "all" || activeTab === "archived" ? (
          <ProjectsTable
            projects={filteredProjects}
            mode={activeTab === "archived" ? "archived" : "active"}
            onProjectClick={(project) => {
              setSelectedProjectDetail(project);
              setShowProjectDetail(true);
            }}
            onEditProject={handleEditProjectById}
            onArchiveProject={activeTab === "all" ? handleArchiveProjectById : undefined}
            onRestoreProject={activeTab === "archived" ? handleRestoreProjectById : undefined}
          />
        ) : (
          <UsersTable
            users={filteredUsers}
            mode={activeTab === "users_archived" ? "archived" : "active"}
            onChangeRole={handleChangeUserRoleById}
            onChangeTitle={handleChangeUserTitleById}
            onChangePassword={handleChangeUserPasswordById}
            onArchiveUser={activeTab === "users" ? handleArchiveUserById : undefined}
            onRestoreUser={activeTab === "users_archived" ? handleRestoreUserById : undefined}
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

      <ArchiveProjectDialog
        isOpen={showArchiveProject}
        projects={archiveProjectList}
        onClose={() => {
          setShowArchiveProject(false);
          setArchiveProjectTargetId(null);
        }}
        onProjectsArchived={(archivedIds) => {
          void handleArchiveProjects(archivedIds);
        }}
      />

      <ArchiveUserDialog
        isOpen={showArchiveUser}
        users={archiveUserList}
        onClose={() => {
          setShowArchiveUser(false);
          setArchiveUserTargetId(null);
        }}
        onUsersArchived={(archivedIds) => {
          void handleArchiveUsers(archivedIds);
        }}
      />
    </div>
  );
}
