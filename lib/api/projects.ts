import { apiClient } from '../api-client';

export interface ProjectUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  userTitle?: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  category?: string;
  isActive: boolean;
  userCount: number;
  targetCount: number;
  users?: ProjectUser[];
  userIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  code?: string;
  description?: string;
  category?: string;
}

export interface UpdateProjectDto {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export const projectsApi = {
  // Kullanıcının projelerini getir
  async getMyProjects(): Promise<Project[]> {
    const response = await apiClient.getClient().get<Project[]>('/projects/my');
    return response.data;
  },

  // Admin: Tüm projeleri getir (sadece dahil oldukları)
  async getAllProjects(params?: Record<string, unknown>): Promise<Project[]> {
    const response = await apiClient.getClient().get<Project[]>('/projects', {
      params,
    });
    return response.data;
  },

  async getAllProjectsIncludingArchived(): Promise<Project[]> {
    const activeProjects = await projectsApi.getAllProjects();

    const uniqueById = new Map<string, Project>();
    for (const project of activeProjects) {
      uniqueById.set(project.id, project);
    }

    const archivedFetchAttempts: Array<() => Promise<Project[]>> = [
      () => projectsApi.getAllProjects({ isActive: false }),
      () => projectsApi.getAllProjects({ archived: true }),
      () => projectsApi.getAllProjects({ includeInactive: true }),
      async () => {
        const response = await apiClient.getClient().get<Project[]>('/projects/archived');
        return response.data;
      },
    ];

    for (const attempt of archivedFetchAttempts) {
      try {
        const archivedProjects = await attempt();
        for (const project of archivedProjects) {
          uniqueById.set(project.id, project);
        }
        break;
      } catch {
        continue;
      }
    }

    return Array.from(uniqueById.values());
  },

  // Admin: Proje oluştur
  async createProject(dto: CreateProjectDto): Promise<Project> {
    const response = await apiClient.getClient().post<Project>('/projects', dto);
    return response.data;
  },

  // Admin: Proje güncelle
  async updateProject(projectId: string, dto: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.getClient().patch<Project>(
      `/projects/${projectId}`,
      dto,
    );
    return response.data;
  },

  // Admin: Projeye kullanıcı ekle
  async addUserToProject(projectId: string, userId: string): Promise<Project> {
    const response = await apiClient.getClient().post<Project>(
      `/projects/${projectId}/users/${userId}`,
    );
    return response.data;
  },

  // Admin: Projeden kullanıcı çıkar
  async removeUserFromProject(projectId: string, userId: string): Promise<Project> {
    const response = await apiClient.getClient().patch<Project>(
      `/projects/${projectId}/users/${userId}/remove`,
    );
    return response.data;
  },

  // Kullanıcının dahil olduğu projeler ve takım bilgileri
  async getMyTeam(): Promise<Project[]> {
    const response = await apiClient.getClient().get<Project[]>('/me/team');
    return response.data;
  },
};

