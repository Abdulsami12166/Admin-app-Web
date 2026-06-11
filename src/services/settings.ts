import { adminApi } from './api';

export interface StoreSetting {
  _id: string;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  section?: string;
  defaultValue?: unknown;
  validation?: {min?: number; max?: number; pattern?: string; options?: string[]};
  isEditable: boolean;
  isRequired: boolean;
  environment: 'all' | 'development' | 'production';
  createdAt: string;
  updatedAt: string;
}

export const settingsApi = {
  async getSettings(page = 1, limit = 50, category?: string) {
    let url = `/admin/settings?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    return adminApi(url, 'GET');
  },

  async getSetting(key: string) {
    return adminApi(`/admin/settings/${key}`, 'GET');
  },

  async updateSetting(key: string, value: unknown) {
    return adminApi(`/admin/settings/${key}`, 'PUT', {value});
  },

  async updateMultipleSettings(updates: Array<{key: string; value: unknown}>) {
    return adminApi('/admin/settings/batch-update', 'POST', {updates});
  },

  async createSetting(data: Partial<StoreSetting>) {
    return adminApi('/admin/settings', 'POST', data);
  },

  async getSettingsByCategory(category: string, page = 1, limit = 50) {
    return adminApi(`/admin/settings/category/${category}?page=${page}&limit=${limit}`, 'GET');
  },

  async resetSetting(key: string) {
    return adminApi(`/admin/settings/${key}/reset`, 'POST');
  },

  async exportSettings() {
    return adminApi('/admin/settings/export', 'GET');
  },

  async importSettings(settings: Record<string, unknown>) {
    return adminApi('/admin/settings/import', 'POST', {settings});
  },
};
