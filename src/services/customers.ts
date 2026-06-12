import { adminApi } from './api';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  addresses: Array<{type: string; address: string}>;
  preferences: Record<string, unknown>;
}

export interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface NotificationPreference {
  _id: string;
  userId: string;
  channels: {email: boolean; sms: boolean; push: boolean; inApp: boolean};
  categories: Record<string, boolean>;
  frequency: 'instant' | 'daily' | 'weekly' | 'monthly' | 'never';
  quietHours?: {enabled: boolean; startTime: string; endTime: string};
}

export const customerApi = {
  async getCustomers(page = 1, limit = 20, search = '') {
    return adminApi(`/admin/customers?page=${page}&limit=${limit}&search=${search}`, 'GET');
  },

  async getCustomerDetail(userId: string) {
    return adminApi(`/admin/customers/${userId}`, 'GET');
  },

  async getCustomerActivityLogs(userId: string, page = 1, limit = 50) {
    return adminApi(`/admin/customers/${userId}/activity-logs?page=${page}&limit=${limit}`, 'GET');
  },

  async getCustomerNotificationPreferences(userId: string) {
    return adminApi(`/admin/customers/${userId}/notification-preferences`, 'GET');
  },

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>) {
    return adminApi(`/admin/customers/${userId}/notification-preferences`, 'PUT', preferences);
  },

  async blockCustomer(userId: string, reason: string) {
    return adminApi(`/admin/customers/${userId}/block`, 'POST', {reason});
  },

  async unblockCustomer(userId: string) {
    return adminApi(`/admin/customers/${userId}/unblock`, 'POST');
  },

  async getCustomerStats() {
    return adminApi('/admin/customers/stats/overview', 'GET');
  },
};
