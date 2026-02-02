import { apiClient } from '../api-client';

export type ReportStatus = 'STARTED' | 'PROCESSING' | 'READY' | 'FAILED';
export type ReportType = 'TARGETS' | 'PROJECTS' | 'USERS' | 'TEAM';

export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  parameters?: {
    projectIds?: string[];
    userIds?: string[];
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  };
  s3Path?: string;
  fileName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDto {
  type: ReportType;
  parameters?: {
    projectIds?: string[];
    userIds?: string[];
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  };
}

export interface ReportDownload {
  downloadUrl: string;
  fileName: string;
  expiresIn: number;
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
};





