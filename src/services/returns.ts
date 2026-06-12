import { adminApi } from './api';

export interface Return {
  _id: string;
  order: string;
  user: string;
  returnItems: Array<{product: string; quantity: number; reason: string; condition: string}>;
  status: 'initiated' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'inspected' | 'completed' | 'cancelled';
  pickupAddress?: {street: string; city: string; state: string; zipCode: string};
  images?: string[];
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnTimeline {
  event: string;
  timestamp: string;
  updatedBy: string;
}

export const returnsApi = {
  async getReturns(page = 1, limit = 20, status?: string, search = '') {
    let url = `/admin/returns?page=${page}&limit=${limit}&search=${search}`;
    if (status) url += `&status=${status}`;
    return adminApi(url, 'GET');
  },

  async getReturnDetail(returnId: string) {
    return adminApi(`/admin/returns/${returnId}`, 'GET');
  },

  async approveReturn(returnId: string, notes?: string) {
    return adminApi(`/admin/returns/${returnId}/approve`, 'POST', {notes});
  },

  async rejectReturn(returnId: string, reason: string) {
    return adminApi(`/admin/returns/${returnId}/reject`, 'POST', {reason});
  },

  async updateReturnStatus(returnId: string, status: string) {
    return adminApi(`/admin/returns/${returnId}/status`, 'PATCH', {status});
  },
};
