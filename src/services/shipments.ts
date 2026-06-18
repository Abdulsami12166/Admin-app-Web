import { adminApi } from './api';

export interface Shipment {
  _id: string;
  order: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  estimatedDelivery?: string;
  estimatedDeliveryDate?: string;
  actualDelivery?: string;
  actualDeliveryDate?: string;
  weight?: number;
  cost?: number;
  shippingAddress: {
    street?: string;
    address?: string;
    city: string;
    state: string;
    zipCode?: string;
    postalCode?: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  status: string;
  location: string;
  description: string;
  timestamp: string;
  createdBy: string;
}

export const shipmentsApi = {
  async getShipments(page = 1, limit = 20, status?: string, search = '') {
    let url = `/admin/shipments?page=${page}&limit=${limit}&search=${search}`;
    if (status) url += `&status=${status}`;
    return adminApi(url, 'GET');
  },

  async getShipmentDetail(shipmentId: string) {
    return adminApi(`/admin/shipments/${shipmentId}`, 'GET');
  },

  async createShipment(orderId: string, data: {trackingNumber: string; carrier: string; weight?: number; cost?: number}) {
    return adminApi(`/admin/shipments/order/${orderId}`, 'POST', data);
  },

  async updateTrackingStatus(shipmentId: string, data: {status: string; location: string; description: string}) {
    return adminApi(`/admin/shipments/${shipmentId}/tracking`, 'PATCH', data);
  },

  async getTrackingHistory(shipmentId: string) {
    return adminApi(`/admin/shipments/${shipmentId}/tracking-history`, 'GET');
  },

  async getShipmentsByStatus(status: string, page = 1, limit = 20) {
    return adminApi(`/admin/shipments/status/${status}?page=${page}&limit=${limit}`, 'GET');
  },

  async getShipmentStats() {
    return adminApi('/admin/shipments/stats/overview', 'GET');
  },
};
