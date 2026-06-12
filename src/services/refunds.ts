import { adminApi } from './api';

export interface Refund {
  _id: string;
  order: string;
  return?: string;
  user: string;
  reason: 'return' | 'cancellation' | 'complaint' | 'duplicate_charge' | 'other';
  refundType: 'full' | 'partial';
  refundAmount: number;
  refundBreakdown: {productAmount: number; shippingRefund: number; taxRefund: number; additionalCredit: number};
  status: 'initiated' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  paymentDetails?: {gateway: string; transactionId: string; refundId: string};
  createdAt: string;
  updatedAt: string;
}

export const refundsApi = {
  async getRefunds(page = 1, limit = 20, status?: string) {
    let url = `/admin/refunds?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return adminApi(url, 'GET');
  },

  async getRefundDetail(refundId: string) {
    return adminApi(`/admin/refunds/${refundId}`, 'GET');
  },

  async approveRefund(refundId: string) {
    return adminApi(`/admin/refunds/${refundId}/approve`, 'POST');
  },

  async rejectRefund(refundId: string, reason: string) {
    return adminApi(`/admin/refunds/${refundId}/reject`, 'POST', {reason});
  },

  async processRefund(refundId: string) {
    return adminApi(`/admin/refunds/${refundId}/process`, 'POST');
  },

  async completeRefund(refundId: string) {
    return adminApi(`/admin/refunds/${refundId}/complete`, 'POST');
  },

  async getRefundStats() {
    return adminApi('/admin/refunds/stats/overview', 'GET');
  },
};
