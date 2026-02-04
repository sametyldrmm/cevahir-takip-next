import { apiClient } from '../api-client';

export type ReportStatus = 'STARTED' | 'PROCESSING' | 'READY' | 'FAILED';
export type ReportType = 'TARGETS' | 'PROJECTS' | 'USERS' | 'TEAM' | 'PERFORMANCE' | 'MISSING_TARGETS' | string;

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

  // Excel export oluştur - Backend direkt dosya gönderiyor (binary response)
  async createExcelExport(dto: {
    exportType: 'daily' | 'weekly' | 'date_range';
    targetDate?: string;
    startDate?: string;
    endDate?: string;
    filename?: string;
    email?: string;
  }): Promise<{ success: boolean; downloadUrl?: string; message: string; blob?: Blob; fileName?: string }> {
    const response = await apiClient.getClient().post('/reports/excel-export', dto, {
      responseType: 'blob',
    });
    
    // Content-Disposition header'ından dosya adını al
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'export.xlsx';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (fileNameMatch) {
        fileName = decodeURIComponent(fileNameMatch[1].replace(/"/g, ''));
      }
    }
    
    return {
      success: true,
      blob: response.data,
      fileName,
      message: 'Excel export başarıyla oluşturuldu',
    };
  },

  // Eksik hedef girişleri export - Asenkron (Report entity oluşturur)
  async createMissingTargetsExport(dto: {
    startDate: string;
    endDate: string;
    periodType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    filename?: string;
  }): Promise<Report> {
    const response = await apiClient.getClient().post<Report>('/reports/missing-targets-export', dto);
    return response.data;
  },

  // Performans raporu export - Asenkron (Report entity oluşturur)
  async createPerformanceExport(dto: {
    year: number;
    month: number;
    filename?: string;
  }): Promise<Report> {
    const response = await apiClient.getClient().post<Report>('/reports/performance-export', dto);
    return response.data;
  },
};






