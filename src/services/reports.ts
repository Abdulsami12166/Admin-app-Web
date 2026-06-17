const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1/admin';

export interface ReportData {
  totalRevenue?: number;
  totalOrders?: number;
  avgOrderValue?: number;
  conversionRate?: number;
  recentSales?: Array<{ orderId: string; date: string; customer: string; amount: number; status: string }>;
  totalUsers?: number;
  activeUsers?: number;
  newUsers?: number;
  blockedUsers?: number;
  userGrowth?: Array<{ period: string; newUsers: number; activeUsers: number; retentionRate: number }>;
  totalProducts?: number;
  activeProducts?: number;
  outOfStock?: number;
  lowStock?: number;
  topProducts?: Array<{ id: string; name: string; category: string; sold: number; revenue: number; stock: number }>;
  totalStockValue?: number;
  stockMovements?: number;
  lowStockAlerts?: number;
  outOfStockItems?: number;
  movements?: Array<{ id: string; product: string; type: string; quantity: number; reason: string; date: string }>;
  totalTickets?: number;
  openTickets?: number;
  resolvedTickets?: number;
  avgResolutionTime?: number;
  ticketStats?: Array<{ category: string; total: number; open: number; resolved: number; avgTime: number }>;
}

export const reportsApi = {
  async getReport(type: string, dateRange: { start: string; end: string }): Promise<{ data: ReportData }> {
    const token = localStorage.getItem('ADMIN_TOKEN_KEY');
    const params = new URLSearchParams();
    if (dateRange.start) params.append('startDate', dateRange.start);
    if (dateRange.end) params.append('endDate', dateRange.end);
    
    const response = await fetch(`${API_BASE}/reports/${type}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} report`);
    }

    return response.json();
  },

  async exportReport(type: string, format: 'csv' | 'pdf', dateRange: { start: string; end: string }): Promise<void> {
    const token = localStorage.getItem('ADMIN_TOKEN_KEY');
    const params = new URLSearchParams();
    if (dateRange.start) params.append('startDate', dateRange.start);
    if (dateRange.end) params.append('endDate', dateRange.end);
    params.append('format', format);
    
    const response = await fetch(`${API_BASE}/reports/${type}/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export ${type} report`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
