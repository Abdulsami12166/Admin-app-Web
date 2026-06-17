import { adminApi } from './api';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  description: string;
  actor: string;
  metadata?: Record<string, any>;
}

export interface OrderTimeline {
  orderId: string;
  orderStatus?: string;
  events: TimelineEvent[];
}

export const orderTimelineApi = {
  // GET /admin/orders/:orderId/timeline
  getOrderTimeline: async (orderId: string) => {
    return adminApi.get(`/admin/orders/${orderId}/timeline`);
  },

  // POST /admin/orders/:orderId/timeline/event
  addTimelineEvent: async (orderId: string, data: Partial<TimelineEvent>) => {
    return adminApi.post(`/admin/orders/${orderId}/timeline/event`, data);
  },

  // PATCH /admin/orders/:orderId/timeline/:eventId
  updateTimelineEvent: async (orderId: string, eventId: string, data: Partial<TimelineEvent>) => {
    return adminApi.patch(`/admin/orders/${orderId}/timeline/${eventId}`, data);
  },

  // GET /admin/orders/:orderId/timeline/lifecycle
  getOrderLifecycleHistory: async (orderId: string) => {
    return adminApi.get(`/admin/orders/${orderId}/timeline/lifecycle`);
  },

  // GET /admin/timeline/stats
  getTimelineStats: async () => {
    return adminApi.get('/admin/timeline/stats');
  },
};
