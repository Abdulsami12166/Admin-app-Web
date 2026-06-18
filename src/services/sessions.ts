import { adminApi } from './api';

export interface AdminSession {
  _id: string;
  adminUser?: { _id?: string; name?: string; email?: string; role?: string };
  adminEmail?: string;
  sessionToken?: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt?: string;
  lastActivityAt?: string;
  logoutAt?: string;
  isActive?: boolean;
  expiresAt?: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  terminatedSessions: number;
  sessionsByAdmin: Array<{ _id: string; total: number; active: number; terminated: number }>;
}

export const sessionsApi = {
  getActiveSessions: (page = 1, limit = 25, status?: string, search?: string) => {
    let url = `/admin/sessions?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return adminApi(url, 'GET');
  },

  getAdminSessions: (adminId: string, page = 1, limit = 25) =>
    adminApi(`/admin/sessions/admin/${adminId}?page=${page}&limit=${limit}`, 'GET'),

  getSessionDetails: (sessionId: string) =>
    adminApi(`/admin/sessions/${sessionId}`, 'GET'),

  createSession: (data: Partial<AdminSession>) =>
    adminApi('/admin/sessions', 'POST', data),

  forceLogout: (sessionId: string) =>
    adminApi(`/admin/sessions/${sessionId}/logout`, 'POST'),

  forceLogoutAllForAdmin: (adminId: string) =>
    adminApi(`/admin/sessions/admin/${adminId}/logout-all`, 'POST'),

  updateSessionActivity: (sessionId: string) =>
    adminApi(`/admin/sessions/${sessionId}/activity`, 'PATCH'),

  getSessionStats: () =>
    adminApi('/admin/sessions/stats/overview', 'GET'),
};
