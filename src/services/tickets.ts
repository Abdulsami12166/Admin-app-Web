import { adminApi } from './api';

export interface Ticket {
  _id: string;
  ticketNumber: string;
  user: string;
  order?: string;
  category: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_admin' | 'escalated' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: Array<{sender: string; senderType: string; message: string; attachments?: string[]; createdAt: string}>;
  satisfaction?: {rating: number; feedback: string};
  createdAt: string;
  updatedAt: string;
}

export const ticketsApi = {
  async getTickets(page = 1, limit = 20, filters?: {status?: string; priority?: string; category?: string; assignedTo?: string}) {
    let url = `/admin/tickets?page=${page}&limit=${limit}`;
    if (filters) {
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.priority) url += `&priority=${filters.priority}`;
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.assignedTo) url += `&assignedTo=${filters.assignedTo}`;
    }
    return adminApi(url, 'GET');
  },

  async getTicketDetail(ticketId: string) {
    return adminApi(`/admin/tickets/${ticketId}`, 'GET');
  },

  async createTicket(data: {subject: string; description: string; category: string; priority: string}) {
    return adminApi('/admin/tickets', 'POST', data);
  },

  async assignTicket(ticketId: string, adminId: string) {
    return adminApi(`/admin/tickets/${ticketId}/assign`, 'POST', {adminId});
  },

  async addMessage(ticketId: string, data: {message: string; attachments?: string[]}) {
    return adminApi(`/admin/tickets/${ticketId}/message`, 'POST', data);
  },

  async updateTicketStatus(ticketId: string, status: string) {
    return adminApi(`/admin/tickets/${ticketId}/status`, 'PATCH', {status});
  },

  async escalateTicket(ticketId: string, reason?: string) {
    return adminApi(`/admin/tickets/${ticketId}/escalate`, 'POST', {reason});
  },

  async addTicketRating(ticketId: string, rating: number, feedback?: string) {
    return adminApi(`/admin/tickets/${ticketId}/rating`, 'POST', {rating, feedback});
  },

  async getTicketStats() {
    return adminApi('/admin/tickets/stats/overview', 'GET');
  },
};
