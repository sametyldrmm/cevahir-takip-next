import { apiClient } from '../api-client';

export type GoalStatus = 'NOT_SET' | 'REACHED' | 'PARTIAL' | 'FAILED';

const getResolvedTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

export interface TargetUser {
  id: string;
  username: string;
  displayName?: string;
  userTitle?: string;
}

export interface Target {
  id: string;
  date: string;
  userId: string;
  user?: TargetUser;
  projectId?: string;
  selectedProjects?: string[];
  customProject?: string;
  block?: string;
  floors?: string;
  taskContent?: string;
  goalStatus?: GoalStatus;
  description?: string;
  workStart?: string;
  workEnd?: string;
  meetingStart?: string;
  meetingEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTargetDto {
  date: string;
  projectId?: string;
  selectedProjects?: string[];
  customProject?: string;
  block?: string;
  floors?: string;
  taskContent?: string;
  goalStatus?: GoalStatus;
  description?: string;
  workStart?: string;
  workEnd?: string;
  meetingStart?: string;
  meetingEnd?: string;
}

export interface UpdateTargetDto {
  date?: string;
  projectId?: string;
  selectedProjects?: string[];
  customProject?: string;
  block?: string;
  floors?: string;
  taskContent?: string;
  goalStatus?: GoalStatus;
  description?: string;
  workStart?: string;
  workEnd?: string;
  meetingStart?: string;
  meetingEnd?: string;
}

export interface TargetStatistics {
  totalTargets: number;
  completedTargets: number;
  partialTargets: number;
  failedTargets: number;
  pendingTargets: number;
  successRate: number;
}

export interface CalendarDay {
  date: string;
  status: 'done' | 'partial' | 'missed' | 'none';
  note: string;
  project: string;
}

export interface TeamTarget {
  targetId?: string; // Hedef ID (düzenleme için)
  username: string;
  selectedProjects: string[];
  projectTargets?: Array<{
    targetId?: string; // Hedef ID (düzenleme için)
    projectId: string;
    projectName: string;
    block?: string;
    floors?: string;
    taskContent?: string;
    goalStatus?: GoalStatus;
    description?: string;
    workStart?: string;
    workEnd?: string;
    meetingStart?: string;
    meetingEnd?: string;
  }>;
  date: string;
  block?: string;
  floors?: string;
  taskContent?: string;
  goalStatus?: GoalStatus;
  description?: string;
  workStart?: string;
  workEnd?: string;
  meetingStart?: string;
  meetingEnd?: string;
}

export type AllowedTimeWindow = { start: string; end: string };

export type AllowedTimeWindowsResponse = { windows: AllowedTimeWindow[] };

export const targetsApi = {
  // Kullanıcının tüm targetlarını getir
  async getMyTargets(): Promise<Target[]> {
    const response = await apiClient.getClient().get<Target[]>('/me/targets');
    return response.data;
  },

  // Bugünkü targetları getir (aynı tarih için birden fazla hedef olabilir)
  async getTodayTargets(): Promise<Target[]> {
    const response = await apiClient.getClient().get<Target[]>('/me/targets/today');
    return response.data;
  },

  // Belirli tarihteki targetları getir (aynı tarih için birden fazla hedef olabilir)
  async getTargetsByDate(date: string): Promise<Target[]> {
    const response = await apiClient.getClient().get<Target[]>(
      `/me/targets/date/${date}`,
    );
    return response.data;
  },

  // Tarih aralığındaki targetları getir
  async getTargetsByRange(start: string, end: string): Promise<Target[]> {
    const response = await apiClient.getClient().get<Target[]>('/me/targets/range', {
      params: { start, end },
    });
    return response.data;
  },

  // Takvim verilerini getir
  async getCalendarData(days: number = 30): Promise<CalendarDay[]> {
    const response = await apiClient.getClient().get<CalendarDay[]>(
      '/me/targets/calendar',
      {
        params: { days },
      },
    );
    return response.data;
  },

  // İstatistikleri getir
  async getStatistics(): Promise<TargetStatistics> {
    const response = await apiClient.getClient().get<TargetStatistics>(
      '/me/targets/statistics',
    );
    return response.data;
  },

  // Target oluştur
  async createTarget(dto: CreateTargetDto): Promise<Target> {
    const timezone = getResolvedTimeZone();
    const response = await apiClient.getClient().post<Target>('/me/targets', dto, {
      headers: timezone ? { 'x-timezone': timezone } : undefined,
    });
    return response.data;
  },

  async getAllowedTimeWindows(): Promise<AllowedTimeWindowsResponse> {
    const response = await apiClient
      .getClient()
      .get<AllowedTimeWindowsResponse>('/targets/allowed-time-windows');
    return response.data;
  },

  async updateAllowedTimeWindows(dto: AllowedTimeWindowsResponse): Promise<AllowedTimeWindowsResponse> {
    const response = await apiClient
      .getClient()
      .put<AllowedTimeWindowsResponse>('/targets/allowed-time-windows', dto);
    return response.data;
  },

  // Target güncelle
  async updateTarget(targetId: string, dto: UpdateTargetDto): Promise<Target> {
    const response = await apiClient.getClient().patch<Target>(
      `/me/targets/${targetId}`,
      dto,
    );
    return response.data;
  },

  // Target sil
  async deleteTarget(targetId: string): Promise<void> {
    await apiClient.getClient().delete(`/me/targets/${targetId}`);
  },

  // Takım targetlarını getir
  async getTeamTargets(projectIds?: string[], date?: string): Promise<TeamTarget[]> {
    const response = await apiClient.getClient().get<TeamTarget[]>('/targets/team', {
      params: {
        ...(projectIds && projectIds.length > 0 ? { projectIds: projectIds.join(',') } : {}),
        ...(date ? { date } : {}),
      },
    });
    return response.data;
  },

  // Proje targetlarını getir
  async getProjectTargets(projectId: string, limit: number = 50): Promise<Target[]> {
    const response = await apiClient.getClient().get<Target[]>(`/targets/project/${projectId}`, {
      params: { limit },
    });
    return response.data;
  },
};


