import { apiClient } from '../api-client';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  displayName?: string;
  userTitle?: string;
  isActive: boolean;
  totalTargets?: number;
  lastTargetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  userTitle?: string;
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  displayName?: string;
  userTitle?: string;
  role?: 'ADMIN' | 'USER';
  isActive?: boolean;
}

export const usersApi = {
  // Admin: Tüm kullanıcıları getir (sadece admin panelinde kullanılmalı)
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.getClient().get<User[]>('/users');
    return response.data;
  },

  async updateMe(dto: UpdateUserDto): Promise<User> {
    const response = await apiClient.getClient().patch<User>('/users/me', dto);
    return response.data;
  },

  // Takım takibi için kullanıcıları getir (/me endpoint'i)
  // Eğer projectId verilirse, sadece o projenin kullanıcılarını döndürür
  // Verilmezse, kullanıcının dahil olduğu tüm projelerin kullanıcılarını döndürür
  async getTeamUsers(projectId?: string): Promise<User[]> {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.getClient().get<User[]>('/users/me/team', { params });
    return response.data;
  },

  // Admin: Kullanıcı oluştur
  async createUser(dto: CreateUserDto): Promise<User> {
    const response = await apiClient.getClient().post<User>('/users', dto);
    return response.data;
  },

  // Admin: Kullanıcı bilgilerini getir
  async getUserById(userId: string): Promise<User> {
    const response = await apiClient.getClient().get<User>(`/users/${userId}`);
    return response.data;
  },

  // Admin: Kullanıcı güncelle
  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const response = await apiClient.getClient().put<User>(`/users/${userId}`, dto);
    return response.data;
  },

  // Admin: Kullanıcı sil
  async deleteUser(userId: string): Promise<void> {
    await apiClient.getClient().delete(`/users/${userId}`);
  },
};


