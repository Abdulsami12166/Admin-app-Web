import { adminApi } from './api';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  order: string;
  user: string;
  items: Array<{product: string; quantity: number; unitPrice: number; tax: number; discount: number; total: number}>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate?: string;
  billingAddress?: Record<string, unknown>;
  payments: Array<{amount: number; date: string; method: string}>;
  creditNotes: Array<{creditNoteNumber: string; amount: number; reason: string}>;
  createdAt: string;
  updatedAt: string;
}

export const invoicesApi = {
  async getInvoices(page = 1, limit = 20, status?: string, search = '') {
    let url = `/admin/invoices?page=${page}&limit=${limit}&search=${search}`;
    if (status) url += `&status=${status}`;
    return adminApi(url, 'GET');
  },

  async getInvoiceDetail(invoiceId: string) {
    return adminApi(`/admin/invoices/${invoiceId}`, 'GET');
  },

  async createInvoice(orderId: string) {
    return adminApi(`/admin/invoices/order/${orderId}`, 'POST');
  },

  async sendInvoice(invoiceId: string, email?: string) {
    return adminApi(`/admin/invoices/${invoiceId}/send`, 'POST', {email});
  },

  async recordPayment(invoiceId: string, data: {amount: number; method: string; transactionId?: string}) {
    return adminApi(`/admin/invoices/${invoiceId}/payment`, 'POST', data);
  },

  async issueCreditNote(invoiceId: string, data: {amount: number; reason: string}) {
    return adminApi(`/admin/invoices/${invoiceId}/credit-note`, 'POST', data);
  },

  async updateInvoiceStatus(invoiceId: string, status: string) {
    return adminApi(`/admin/invoices/${invoiceId}/status`, 'PATCH', {status});
  },

  async getInvoiceStats() {
    return adminApi('/admin/invoices/stats/overview', 'GET');
  },
};
