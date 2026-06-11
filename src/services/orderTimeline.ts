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
  events: TimelineEvent[];
}

export const orderTimelineApi = {
  getOrderTimeline: async (orderId: string) => {
    return adminApi.get(`/orders/${orderId}/timeline`);
  },

  addTimelineEvent: async (orderId: string, data: Partial<TimelineEvent>) => {
    return adminApi.post(`/orders/${orderId}/timeline/event`, data);
  },

  updateTimelineEvent: async (orderId: string, eventId: string, data: Partial<TimelineEvent>) => {
    return adminApi.patch(`/orders/${orderId}/timeline/${eventId}`, data);
  },

  getOrderLifecycleHistory: async (orderId: string) => {
    return adminApi.get(`/orders/${orderId}/timeline/lifecycle`);
  },

  getTimelineStats: async () => {
    return adminApi.get('/timeline/stats');
  },
};
