import { apiClient } from '../api-client';

export enum LeaveType {
  ANNUAL_LEAVE = 'annual_leave',
  SICK_LEAVE = 'sick_leave',
  ASSIGNMENT_LEAVE = 'assignment_leave',
}

export interface Leave {
  id: string;
  userId: string;
  date: string;
  leaveType: LeaveType;
  note?: string;
  createdAt: string;
}

export interface CreateLeaveDto {
  date: string;
  leaveType: LeaveType;
  note?: string;
}

export interface BulkCreateLeaveDto {
  dates: string[];
  leaveType: LeaveType;
  note?: string;
}

export const leavesApi = {
  async getAll(): Promise<Leave[]> {
    const response = await apiClient.getClient().get<Leave[]>('/me/leaves');
    return response.data;
  },

  async getByRange(startDate: string, endDate: string): Promise<Leave[]> {
    const response = await apiClient.getClient().get<Leave[]>('/me/leaves/range', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getOne(date: string): Promise<Leave | null> {
    const response = await apiClient.getClient().get<Leave | null>(`/me/leaves/${date}`);
    // Backend null döndüğünde boş obje {} dönüyor, kontrol et
    if (!response.data || Object.keys(response.data).length === 0) {
      return null;
    }
    return response.data;
  },

  async create(dto: CreateLeaveDto): Promise<Leave> {
    const response = await apiClient.getClient().post<Leave>('/me/leaves', dto);
    return response.data;
  },

  async bulkCreate(dto: BulkCreateLeaveDto): Promise<Leave[]> {
    const response = await apiClient.getClient().post<Leave[]>('/me/leaves/bulk', dto);
    return response.data;
  },

  async delete(date: string): Promise<void> {
    await apiClient.getClient().delete(`/me/leaves/${date}`);
  },

  async bulkDelete(dates: string[]): Promise<{ removedCount: number }> {
    const response = await apiClient.getClient().post<{ removedCount: number }>('/me/leaves/bulk/delete', {
      dates,
    });
    return response.data;
  },
};

