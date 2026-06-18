import { adminApi } from './api';

export interface NotificationTemplate {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  trigger?: string;
  type?: 'email' | 'sms' | 'push';
  subject?: string;
  body?: string;
  emailTemplate?: { subject?: string; body?: string };
  isActive: boolean;
  isSystem?: boolean;
}

export interface EventMapping {
  id: string;
  event: string;
  description?: string;
  templates: Array<{ id?: string; name?: string; displayName?: string }> | string[];
  active: boolean;
}

export interface NotificationLog {
  id: string;
  templateId?: string;
  template?: { name?: string; category?: string; trigger?: string };
  channel: string;
  type?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced' | 'unsubscribed';
  recipient?: { email?: string; phone?: string };
  createdAt: string;
}

export const notificationsApi = {
  // Templates — /admin/notifications/templates
  getTemplates: async (page = 1, limit = 50) =>
    adminApi(`/admin/notifications/templates?page=${page}&limit=${limit}`, 'GET'),

  getTemplateDetails: async (templateId: string) =>
    adminApi(`/admin/notifications/templates/${templateId}`, 'GET'),

  createTemplate: async (data: Partial<NotificationTemplate>) =>
    adminApi('/admin/notifications/templates', 'POST', data),

  updateTemplate: async (templateId: string, data: Partial<NotificationTemplate>) =>
    adminApi(`/admin/notifications/templates/${templateId}`, 'PATCH', data),

  deleteTemplate: async (templateId: string) =>
    adminApi.delete(`/admin/notifications/templates/${templateId}`),

  // Event Mappings — /admin/notifications/event-mappings
  getEventMappings: async (page = 1, limit = 50) =>
    adminApi(`/admin/notifications/event-mappings?page=${page}&limit=${limit}`, 'GET'),

  createEventMapping: async (data: Partial<EventMapping>) =>
    adminApi('/admin/notifications/event-mappings', 'POST', data),

  updateEventMapping: async (mappingId: string, data: Partial<EventMapping>) =>
    adminApi(`/admin/notifications/event-mappings/${mappingId}`, 'PATCH', data),

  deleteEventMapping: async (mappingId: string) =>
    adminApi.delete(`/admin/notifications/event-mappings/${mappingId}`),

  // Logs — /admin/notifications/logs
  getNotificationLogs: async (page = 1, limit = 50, filters: Record<string, string> = {}) => {
    let url = `/admin/notifications/logs?page=${page}&limit=${limit}`;
    Object.entries(filters).forEach(([k, v]) => { if (v) url += `&${k}=${encodeURIComponent(v)}`; });
    return adminApi(url, 'GET');
  },

  getNotificationLogDetails: async (logId: string) =>
    adminApi(`/admin/notifications/logs/${logId}`, 'GET'),

  createNotificationLog: async (data: Partial<NotificationLog>) =>
    adminApi('/admin/notifications/logs', 'POST', data),

  getNotificationStats: async () =>
    adminApi('/admin/notifications/stats', 'GET'),

  // Marketing Rules — /admin/notifications/marketing-rules
  getMarketingRules: async (page = 1, limit = 50) =>
    adminApi(`/admin/notifications/marketing-rules?page=${page}&limit=${limit}`, 'GET'),

  createMarketingRule: async (data: any) =>
    adminApi('/admin/notifications/marketing-rules', 'POST', data),

  updateMarketingRule: async (ruleId: string, data: any) =>
    adminApi(`/admin/notifications/marketing-rules/${ruleId}`, 'PATCH', data),

  deleteMarketingRule: async (ruleId: string) =>
    adminApi.delete(`/admin/notifications/marketing-rules/${ruleId}`),
};
