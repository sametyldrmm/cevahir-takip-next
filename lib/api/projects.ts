import { apiClient } from '../api-client';

export interface ProjectUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
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
  async getAllProjects(): Promise<Project[]> {
    const response = await apiClient.getClient().get<Project[]>('/projects');
    return response.data;
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

