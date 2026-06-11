import { adminApi } from './api';

export interface FeatureToggle {
  _id: string;
  name: string;
  displayName?: string;
  description?: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetAudience?: {userTypes?: string[]; regions?: string[]; customSegments?: string[]};
  configuration?: Record<string, unknown>;
  category?: string;
  visibility: 'public' | 'internal' | 'beta';
  dependencies?: Array<{featureName: string; requiredEnabled: boolean}>;
  enabledAt?: string;
  disabledAt?: string;
  enabledBy?: string;
  disabledBy?: string;
  performance?: {impactLevel: string; estimatedLatency: number};
  createdAt: string;
  updatedAt: string;
}

export const featureTogglesApi = {
  async getFeatureToggles(page = 1, limit = 50, filters?: {category?: string; isEnabled?: boolean; visibility?: string}) {
    let url = `/admin/feature-toggles?page=${page}&limit=${limit}`;
    if (filters) {
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.isEnabled !== undefined) url += `&isEnabled=${filters.isEnabled}`;
      if (filters.visibility) url += `&visibility=${filters.visibility}`;
    }
    return adminApi(url, 'GET');
  },

  async getFeatureToggleDetail(name: string) {
    return adminApi(`/admin/feature-toggles/${name}`, 'GET');
  },

  async enableFeature(name: string, rolloutPercentage = 100) {
    return adminApi(`/admin/feature-toggles/${name}/enable`, 'POST', {rolloutPercentage});
  },

  async disableFeature(name: string) {
    return adminApi(`/admin/feature-toggles/${name}/disable`, 'POST');
  },

  async updateRollout(name: string, rolloutPercentage: number) {
    return adminApi(`/admin/feature-toggles/${name}/rollout`, 'PATCH', {rolloutPercentage});
  },

  async updateConfiguration(name: string, configuration: Record<string, unknown>) {
    return adminApi(`/admin/feature-toggles/${name}/config`, 'PATCH', {configuration});
  },

  async checkFeatureEnabled(name: string) {
    return adminApi(`/admin/feature-toggles/${name}/check`, 'GET');
  },

  async createFeatureToggle(data: Partial<FeatureToggle>) {
    return adminApi('/admin/feature-toggles', 'POST', data);
  },

  async getFeatureStats() {
    return adminApi('/admin/feature-toggles/stats/overview', 'GET');
  },

  async getFeatureDependencies(name: string) {
    return adminApi(`/admin/feature-toggles/${name}/dependencies`, 'GET');
  },
};
