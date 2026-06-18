import { adminApi } from './api';

export interface AuditLog {
  _id: string;
  actor: string | { _id: string; name?: string; email?: string };
  action: string;
  entityType: string;
  entityId: string;
  changes?: {before: Record<string, unknown>; after: Record<string, unknown>};
  status: 'success' | 'failure';
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  resourcePath?: string;
  location?: {country: string; city: string; region: string};
  failureReason?: string;
  duration?: number;
  createdAt: string;
}

export const auditLogsApi = {
  async getAuditLogs(page = 1, limit = 50, filters?: {
    action?: string;
    entityType?: string;
    actor?: string;
    status?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let url = `/admin/audit-logs?page=${page}&limit=${limit}`;
    if (filters) {
      if (filters.action) url += `&action=${filters.action}`;
      if (filters.entityType) url += `&entityType=${filters.entityType}`;
      if (filters.actor) url += `&actor=${filters.actor}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.severity) url += `&severity=${filters.severity}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
    }
    return adminApi(url, 'GET');
  },

  async getAuditLogDetail(logId: string) {
    return adminApi(`/admin/audit-logs/${logId}`, 'GET');
  },

  async getUserActivity(userId: string, page = 1, limit = 50) {
    return adminApi(`/admin/audit-logs/user/${userId}?page=${page}&limit=${limit}`, 'GET');
  },

  async getEntityActivity(entityType: string, entityId: string) {
    return adminApi(`/admin/audit-logs/entity/${entityType}/${entityId}`, 'GET');
  },

  async getAuditStats() {
    return adminApi('/admin/audit-logs/stats/overview', 'GET');
  },

  async exportAuditLogs(format: 'json' | 'csv') {
    return adminApi(`/admin/audit-logs/export?format=${format}`, 'GET');
  },

  async getSystemHealthSummary() {
    return adminApi('/admin/audit-logs/health/summary', 'GET');
  },
};
