import { adminApi } from './api';

export interface BulkOperation {
  id: string;
  type: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  totalProducts?: number;
  processedProducts?: number;
  errorCount?: number;
  productIds?: string[];
  action?: string;
}

export const bulkOperationsApi = {
  getBulkOperations: async () => {
    return adminApi.get('/bulk-operations');
  },

  getBulkOperationDetails: async (jobId: string) => {
    return adminApi.get(`/bulk-operations/${jobId}`);
  },

  bulkToggleVisibility: async (data: { productIds: string[]; visible: boolean; scheduleDate?: string }) => {
    return adminApi.post('/bulk-operations/visibility', data);
  },

  bulkUpdateInventory: async (data: { updates: Array<{ productId: string; quantity: number; action: string }> }) => {
    return adminApi.post('/bulk-operations/inventory', data);
  },

  bulkAssignCategory: async (data: { productIds: string[]; categoryId: string }) => {
    return adminApi.post('/bulk-operations/category', data);
  },

  bulkUpdatePricing: async (data: { productIds: string[]; priceAdjustment: number; adjustmentType: 'fixed' | 'percentage' }) => {
    return adminApi.post('/bulk-operations/pricing', data);
  },

  cancelBulkOperation: async (jobId: string) => {
    return adminApi.post(`/bulk-operations/${jobId}/cancel`);
  },

  getBulkOperationLogs: async (jobId: string) => {
    return adminApi.get(`/bulk-operations/${jobId}/logs`);
  },

  getBulkOperationStats: async () => {
    return adminApi.get('/bulk-operations/stats/overview');
  },
};
