import { adminApi } from './api';

export interface AdminSession {
  id: string;
  adminId: string;
  adminEmail: string;
  ipAddress: string;
  loginTime: string;
  lastActivityTime: string;
  status: 'active' | 'terminated';
}

export const sessionsApi = {
  getActiveSessions: async () => {
    return adminApi.get('/sessions');
  },

  getAdminSessions: async (adminId: string) => {
    return adminApi.get(`/sessions/admin/${adminId}`);
  },

  getSessionDetails: async (sessionId: string) => {
    return adminApi.get(`/sessions/${sessionId}`);
  },

  createSession: async (data: Partial<AdminSession>) => {
    return adminApi.post('/sessions', data);
  },

  forceLogout: async (sessionId: string) => {
    return adminApi.post(`/sessions/${sessionId}/logout`);
  },

  forceLogoutAllForAdmin: async (adminId: string) => {
    return adminApi.post(`/sessions/admin/${adminId}/logout-all`);
  },

  updateSessionActivity: async (sessionId: string) => {
    return adminApi.patch(`/sessions/${sessionId}/activity`);
  },

  getSessionStats: async () => {
    return adminApi.get('/sessions/stats/overview');
  },
};
