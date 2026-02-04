import { apiClient } from '../api-client';

export interface SendReportMailDto {
  mailGroupIds?: string[];
  emails?: string[];
}

export const mailsApi = {
  async sendReportMail(reportId: string, dto: SendReportMailDto) {
    await apiClient.getClient().post(`/reports/${reportId}/send-mail`, dto);
  },

  async sendReportToMailGroup(reportId: string, mailGroupId: string) {
    await mailsApi.sendReportMail(reportId, { mailGroupIds: [mailGroupId] });
  },

  async sendReportToMailGroups(reportId: string, mailGroupIds: string[]) {
    await mailsApi.sendReportMail(reportId, { mailGroupIds });
  },

  async sendReportToEmails(reportId: string, emails: string[]) {
    await mailsApi.sendReportMail(reportId, { emails });
  },

};






