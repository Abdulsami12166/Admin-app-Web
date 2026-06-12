import { adminApi } from './api';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject: string;
  body: string;
  isActive: boolean;
}

export interface EventMapping {
  id: string;
  event: string;
  templates: string[];
  active: boolean;
}

export interface NotificationLog {
  id: string;
  templateId: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  recipient: string;
  createdAt: string;
}

export const notificationsApi = {
  // Templates
  getTemplates: async () => {
    return adminApi.get('/notifications/templates');
  },

  getTemplateDetails: async (templateId: string) => {
    return adminApi.get(`/notifications/templates/${templateId}`);
  },

  createTemplate: async (data: Partial<NotificationTemplate>) => {
    return adminApi.post('/notifications/templates', data);
  },

  updateTemplate: async (templateId: string, data: Partial<NotificationTemplate>) => {
    return adminApi.patch(`/notifications/templates/${templateId}`, data);
  },

  deleteTemplate: async (templateId: string) => {
    return adminApi.delete(`/notifications/templates/${templateId}`);
  },

  // Event Mappings
  getEventMappings: async () => {
    return adminApi.get('/notifications/event-mappings');
  },

  createEventMapping: async (data: Partial<EventMapping>) => {
    return adminApi.post('/notifications/event-mappings', data);
  },

  updateEventMapping: async (mappingId: string, data: Partial<EventMapping>) => {
    return adminApi.patch(`/notifications/event-mappings/${mappingId}`, data);
  },

  deleteEventMapping: async (mappingId: string) => {
    return adminApi.delete(`/notifications/event-mappings/${mappingId}`);
  },

  // Logs
  getNotificationLogs: async (page = 1, limit = 50, filters = {}) => {
    return adminApi.get('/notifications/logs', { params: { page, limit, ...filters } });
  },

  getNotificationLogDetails: async (logId: string) => {
    return adminApi.get(`/notifications/logs/${logId}`);
  },

  createNotificationLog: async (data: Partial<NotificationLog>) => {
    return adminApi.post('/notifications/logs', data);
  },

  getNotificationStats: async () => {
    return adminApi.get('/notifications/stats');
  },

  // Marketing Rules
  getMarketingRules: async () => {
    return adminApi.get('/notifications/marketing-rules');
  },

  createMarketingRule: async (data: any) => {
    return adminApi.post('/notifications/marketing-rules', data);
  },

  updateMarketingRule: async (ruleId: string, data: any) => {
    return adminApi.patch(`/notifications/marketing-rules/${ruleId}`, data);
  },

  deleteMarketingRule: async (ruleId: string) => {
    return adminApi.delete(`/notifications/marketing-rules/${ruleId}`);
  },
};
