import { apiClient } from '../api-client';

export enum PermissionRequestType {
  LEAVE = 'LEAVE',
  ACCESS = 'ACCESS',
  OTHER = 'OTHER',
}

export enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface UserInfo {
  id: string;
  username: string;
  displayName?: string;
}

export interface PermissionRequest {
  id: string;
  userId: string;
  user: UserInfo;
  type: PermissionRequestType;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: PermissionRequestStatus;
  reviewedById?: string;
  reviewedBy?: UserInfo;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequestDto {
  type: PermissionRequestType;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdatePermissionRequestDto {
  status: PermissionRequestStatus;
  rejectionReason?: string;
}

export const permissionRequestsApi = {
  async getAll(): Promise<PermissionRequest[]> {
    const response = await apiClient.getClient().get<PermissionRequest[]>('/permission-requests');
    return response.data;
  },

  async getOne(id: string): Promise<PermissionRequest> {
    const response = await apiClient.getClient().get<PermissionRequest>(`/permission-requests/${id}`);
    return response.data;
  },

  async create(dto: CreatePermissionRequestDto): Promise<PermissionRequest> {
    const response = await apiClient.getClient().post<PermissionRequest>('/permission-requests', dto);
    return response.data;
  },

  async update(id: string, dto: UpdatePermissionRequestDto): Promise<PermissionRequest> {
    const response = await apiClient.getClient().patch<PermissionRequest>(`/permission-requests/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.getClient().delete(`/permission-requests/${id}`);
  },
};


