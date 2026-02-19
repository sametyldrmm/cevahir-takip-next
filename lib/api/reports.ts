import { apiClient } from '../api-client';

export type ReportStatus = 'STARTED' | 'PROCESSING' | 'READY' | 'FAILED';
export type ReportType =
  | 'TARGETS'
  | 'PROJECTS'
  | 'USERS'
  | 'TEAM'
  | 'WEEKLY_AI_SUMMARY';

export type AutoMailIntervalUnit = 'DAY' | 'WEEK' | 'MONTH';
export type AutoMailIntervalPreset = '1D' | '1W' | '1M' | 'CUSTOM';

export type AutoMailReportType =
  | 'PERFORMANCE'
  | 'TARGETS'
  | 'MISSING_TARGETS'
  | 'WEEKLY_AI_SUMMARY';
export type AutoMailReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  parameters?: {
    projectIds?: string[];
    userIds?: string[];
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
  };
  s3Path?: string;
  fileName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  mailGroupId?: string;
}

export interface CreateReportDto {
  type: ReportType;
  parameters?: {
    projectIds?: string[];
    userIds?: string[];
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
  };
  filename?: string;
}

export interface ReportDownload {
  downloadUrl: string;
  fileName: string;
  expiresIn: number;
}

export interface UpsertAutoMailScheduleDto {
  reportTypes: AutoMailReportType[];
  mailGroupIds?: string[];
  emails?: string[];
  projectIds?: string[];
  intervalPreset: AutoMailIntervalPreset;
  customEvery?: number;
  customUnit?: AutoMailIntervalUnit;
  periodByReportType: Partial<Record<AutoMailReportType, AutoMailReportPeriod>>;
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface UpdateAutoMailScheduleDto {
  reportTypes?: AutoMailReportType[];
  mailGroupIds?: string[];
  emails?: string[];
  intervalPreset?: AutoMailIntervalPreset;
  customEvery?: number;
  customUnit?: AutoMailIntervalUnit;
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface AutoMailSchedule {
  id?: string;
  reportTypes: AutoMailReportType[];
  mailGroupIds?: string[];
  emails?: string[];
  projectIds?: string[];
  intervalPreset: AutoMailIntervalPreset;
  customEvery?: number;
  customUnit?: AutoMailIntervalUnit;
  periodByReportType?: Partial<Record<AutoMailReportType, AutoMailReportPeriod>>;
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const reportsApi = {
  // Yeni rapor isteği oluştur
  async createReport(dto: CreateReportDto): Promise<Report> {
    const response = await apiClient.getClient().post<Report>('/reports', dto);
    return response.data;
  },

  // Kullanıcının tüm raporlarını getir
  async getMyReports(): Promise<Report[]> {
    const response = await apiClient.getClient().get<Report[]>('/reports');
    return response.data;
  },

  // Rapor detayını getir
  async getReport(reportId: string): Promise<Report> {
    const response = await apiClient.getClient().get<Report>(`/reports/${reportId}`);
    return response.data;
  },

  // Rapor indirme URL'i al
  async getDownloadUrl(reportId: string, expiresIn?: number): Promise<ReportDownload> {
    const params = expiresIn ? { expiresIn } : {};
    const response = await apiClient.getClient().get<ReportDownload>(
      `/reports/${reportId}/download`,
      { params },
    );
    return response.data;
  },

  // Excel export oluştur
  async createExcelExport(dto: {
    exportType: 'daily' | 'weekly' | 'date_range';
    targetDate?: string;
    startDate?: string;
    endDate?: string;
    filename?: string;
    email?: string;
  }): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
    const response = await apiClient.getClient().post('/reports/excel-export', dto);
    return response.data;
  },

  // Eksik hedef girişleri export
  async createMissingTargetsExport(dto: {
    startDate: string;
    endDate: string;
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    filename?: string;
  }): Promise<Report> {
    const response = await apiClient.getClient().post<Report>('/reports/missing-targets-export', dto);
    return response.data;
  },

  // Performans raporu export
  async createPerformanceExport(dto: {
    periodType: 'monthly' | 'yearly';
    year: number;
    month?: number;
    filename?: string;
  }): Promise<Report> {
    const response = await apiClient.getClient().post<Report>('/reports/performance-export', dto);
    return response.data;
  },

  async upsertAutoMailSchedule(
    dto: UpsertAutoMailScheduleDto,
  ): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient
      .getClient()
      .post<{ success: boolean; message?: string }>(
        '/reports/auto-mail-schedule',
        dto,
      );
    return response.data;
  },

  async updateAutoMailSchedule(
    scheduleId: string,
    dto: UpdateAutoMailScheduleDto,
  ): Promise<AutoMailSchedule> {
    const response = await apiClient
      .getClient()
      .patch<AutoMailSchedule>(`/reports/auto-mail-schedule/${scheduleId}`, dto);
    return response.data;
  },

  async getAutoMailSchedules(): Promise<AutoMailSchedule[]> {
    const response = await apiClient
      .getClient()
      .get<AutoMailSchedule[] | AutoMailSchedule | null>(
        '/reports/auto-mail-schedule',
      );

    const data = response.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return [data];
  },

  async deleteAutoMailSchedule(scheduleId?: string): Promise<void> {
    if (scheduleId) {
      await apiClient
        .getClient()
        .delete(`/reports/auto-mail-schedule/${scheduleId}`);
      return;
    }

    await apiClient.getClient().delete('/reports/auto-mail-schedule');
  },
};






