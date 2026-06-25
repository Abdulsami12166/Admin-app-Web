import { adminApi } from './api';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked' | 'suspended';
  isVerified?: boolean;
  totalOrders: number;
  totalSpent: number;
  lastLogin?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  wishlistCount?: number;
  orders?: Array<Record<string, unknown>>;
  addresses?: Array<{_id?: string; type: string; address: string}>;
  wishlist?: Array<Record<string, unknown>>;
  ordersPlaced?: number;
  ordersCancelled?: number;
  ordersReturned?: number;
  refundRequests?: Array<Record<string, unknown>>;
  ticketsRaised?: Array<Record<string, unknown>>;
  chatHistory?: Array<Record<string, unknown>>;
  cartActivity?: Array<Record<string, unknown>>;
  notificationHistory?: Array<Record<string, unknown>>;
}

export interface CustomerDetail extends Customer {
  addresses: Array<{type: string; address: string}>;
  preferences: Record<string, unknown>;
}

export interface ActivityLog {
  _id: string;
  action: string;
  resource?: string;
  timestamp?: string;
  createdAt?: string;
  details?: Record<string, unknown> | string;
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
  async getCustomers(page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc') {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      status,
      sortBy,
      sortOrder,
    });
    return adminApi(`/admin/customers?${params.toString()}`, 'GET');
  },

  async getCustomerDetail(userId: string) {
    return adminApi(`/admin/customers/${userId}`, 'GET');
  },

  async getCustomerActivityLogs(userId: string, page = 1, limit = 50) {
    return adminApi(`/admin/customers/${userId}/audit-logs?page=${page}&limit=${limit}`, 'GET');
  },

  async getCustomerNotificationPreferences(userId: string) {
    return adminApi(`/admin/customers/${userId}/notification-preferences`, 'GET');
  },

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>) {
    return adminApi(`/admin/customers/${userId}/notification-preferences`, 'PUT', preferences);
  },

  async blockCustomer(userId: string, reason: string) {
    // Backend toggleCustomerStatus checks req.body.action to determine what to do
    return adminApi(`/admin/customers/${userId}/block`, 'POST', {action: 'block', reason});
  },

  async unblockCustomer(userId: string) {
    return adminApi(`/admin/customers/${userId}/unblock`, 'POST', {action: 'unblock'});
  },

  async getCustomerStats() {
    return adminApi('/admin/customers/stats/overview', 'GET');
  },
  async getGlobalAuditLogs(page = 1, limit = 50, search = '', module = '', action = '', platform = '') {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      module,
      action,
      platform,
    });
    return adminApi(`/admin/audit-logs/customers?${params.toString()}`, 'GET');
  },
  async getCustomerHistorySummary(userId: string) {
    return adminApi(`/admin/customers/${userId}/history-summary`, 'GET');
  },
};
