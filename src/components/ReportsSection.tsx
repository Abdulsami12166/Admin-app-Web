import React, { useEffect, useState } from 'react';
import { reportsApi, type ReportData } from '../services/reports';

interface ReportsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

type ReportType = 'sales' | 'users' | 'products' | 'inventory' | 'tickets';

const reportTabs: { key: ReportType; label: string }[] = [
  { key: 'sales', label: 'Sales' },
  { key: 'users', label: 'Users' },
  { key: 'products', label: 'Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'tickets', label: 'Tickets' },
];

export function ReportsSection({ onError, onSuccess }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await reportsApi.getReport(reportType, dateRange);
      setReportData(result.data);
    } catch (err) {
      onError(`Failed to load report: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await reportsApi.exportReport(reportType, format, dateRange);
      onSuccess(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      onError(`Failed to export: ${err}`);
    }
  };

  useEffect(() => { loadReport(); }, [reportType, dateRange]);

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Reports</h2>

      <div className="section-tabs">
        {reportTabs.map(t => (
          <button key={t.key} className={reportType === t.key ? 'active' : ''} onClick={() => setReportType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="section-filters">
        <label style={{ color: '#9fb6cb', fontWeight: 700, fontSize: '0.85rem' }}>From</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
          style={{ width: 160 }}
        />
        <label style={{ color: '#9fb6cb', fontWeight: 700, fontSize: '0.85rem' }}>To</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
          style={{ width: 160 }}
        />
        <button className="secondary" onClick={loadReport}>Apply</button>
        <button className="secondary" onClick={() => handleExport('csv')}>Export CSV</button>
        <button className="secondary" onClick={() => handleExport('pdf')}>Export PDF</button>
      </div>

      {loading && <div className="state-loading">Loading report…</div>}

      {!loading && reportData && (
        <>
          {reportType === 'sales' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <article className="stat"><strong style={{ color: '#43d17a' }}>₹{reportData.totalRevenue || 0}</strong><span>Total Revenue</span></article>
                <article className="stat"><strong>{reportData.totalOrders || 0}</strong><span>Total Orders</span></article>
                <article className="stat"><strong>₹{reportData.avgOrderValue || 0}</strong><span>Avg Order Value</span></article>
                <article className="stat"><strong>{reportData.conversionRate || 0}%</strong><span>Conversion Rate</span></article>
              </div>
              <section className="panel">
                <h2>Recent Sales</h2>
                <div className="table-card">
                  <table>
                    <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {(reportData.recentSales || []).map((sale: any) => (
                        <tr key={sale.orderId || sale.id}>
                          <td><small>{sale.orderId}</small></td>
                          <td><small>{new Date(sale.date).toLocaleDateString()}</small></td>
                          <td>{sale.customer}</td>
                          <td style={{ color: '#43d17a', fontWeight: 700 }}>₹{sale.amount}</td>
                          <td><span className="badge badge-info">{sale.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(reportData.recentSales?.length) && <div className="state-empty">No recent sales data.</div>}
                </div>
              </section>
            </>
          )}

          {reportType === 'users' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <article className="stat"><strong>{reportData.totalUsers || 0}</strong><span>Total Users</span></article>
                <article className="stat"><strong style={{ color: '#43d17a' }}>{reportData.activeUsers || 0}</strong><span>Active Users</span></article>
                <article className="stat"><strong>{reportData.newUsers || 0}</strong><span>New (30d)</span></article>
                <article className="stat"><strong style={{ color: '#ff8b8b' }}>{reportData.blockedUsers || 0}</strong><span>Blocked</span></article>
              </div>
              <section className="panel">
                <h2>User Growth</h2>
                <div className="table-card">
                  <table>
                    <thead><tr><th>Period</th><th>New Users</th><th>Active Users</th><th>Retention Rate</th></tr></thead>
                    <tbody>
                      {(reportData.userGrowth || []).map((growth: any) => (
                        <tr key={growth.period}>
                          <td>{growth.period}</td>
                          <td>{growth.newUsers}</td>
                          <td>{growth.activeUsers}</td>
                          <td>{growth.retentionRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(reportData.userGrowth?.length) && <div className="state-empty">No user growth data.</div>}
                </div>
              </section>
            </>
          )}

          {reportType === 'products' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <article className="stat"><strong>{reportData.totalProducts || 0}</strong><span>Total Products</span></article>
                <article className="stat"><strong style={{ color: '#43d17a' }}>{reportData.activeProducts || 0}</strong><span>Active</span></article>
                <article className="stat"><strong style={{ color: '#ff8b8b' }}>{reportData.outOfStock || 0}</strong><span>Out of Stock</span></article>
                <article className="stat"><strong style={{ color: '#fcc419' }}>{reportData.lowStock || 0}</strong><span>Low Stock</span></article>
              </div>
              <section className="panel">
                <h2>Top Selling Products</h2>
                <div className="table-card">
                  <table>
                    <thead><tr><th>Product</th><th>Category</th><th>Sold</th><th>Revenue</th><th>Stock</th></tr></thead>
                    <tbody>
                      {(reportData.topProducts || []).map((product: any) => (
                        <tr key={product.id}>
                          <td style={{ fontWeight: 700 }}>{product.name}</td>
                          <td>{product.category}</td>
                          <td>{product.sold}</td>
                          <td style={{ color: '#43d17a', fontWeight: 700 }}>₹{product.revenue}</td>
                          <td>{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(reportData.topProducts?.length) && <div className="state-empty">No product data.</div>}
                </div>
              </section>
            </>
          )}

          {reportType === 'inventory' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <article className="stat"><strong>₹{reportData.totalStockValue || 0}</strong><span>Stock Value</span></article>
                <article className="stat"><strong>{reportData.stockMovements || 0}</strong><span>Movements</span></article>
                <article className="stat"><strong style={{ color: '#fcc419' }}>{reportData.lowStockAlerts || 0}</strong><span>Low Stock Alerts</span></article>
                <article className="stat"><strong style={{ color: '#ff8b8b' }}>{reportData.outOfStockItems || 0}</strong><span>Out of Stock</span></article>
              </div>
              <section className="panel">
                <h2>Stock Movements</h2>
                <div className="table-card">
                  <table>
                    <thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Date</th></tr></thead>
                    <tbody>
                      {(reportData.movements || []).map((movement: any, idx: number) => (
                        <tr key={movement.id || idx}>
                          <td>{movement.product}</td>
                          <td><span className={`badge ${movement.type === 'in' ? 'badge-success' : 'badge-danger'}`}>{movement.type}</span></td>
                          <td>{movement.quantity}</td>
                          <td><small>{movement.reason}</small></td>
                          <td><small>{new Date(movement.date).toLocaleDateString()}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(reportData.movements?.length) && <div className="state-empty">No stock movement data.</div>}
                </div>
              </section>
            </>
          )}

          {reportType === 'tickets' && (
            <>
              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <article className="stat"><strong>{reportData.totalTickets || 0}</strong><span>Total Tickets</span></article>
                <article className="stat"><strong style={{ color: '#fcc419' }}>{reportData.openTickets || 0}</strong><span>Open</span></article>
                <article className="stat"><strong style={{ color: '#43d17a' }}>{reportData.resolvedTickets || 0}</strong><span>Resolved</span></article>
                <article className="stat"><strong style={{ color: '#63d2ff' }}>{reportData.avgResolutionTime || 0}h</strong><span>Avg Resolution</span></article>
              </div>
              <section className="panel">
                <h2>Ticket Statistics by Category</h2>
                <div className="table-card">
                  <table>
                    <thead><tr><th>Category</th><th>Total</th><th>Open</th><th>Resolved</th><th>Avg Time</th></tr></thead>
                    <tbody>
                      {(reportData.ticketStats || []).map((stat: any) => (
                        <tr key={stat.category}>
                          <td style={{ fontWeight: 700 }}>{stat.category}</td>
                          <td>{stat.total}</td>
                          <td style={{ color: '#fcc419' }}>{stat.open}</td>
                          <td style={{ color: '#43d17a' }}>{stat.resolved}</td>
                          <td>{stat.avgTime}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(reportData.ticketStats?.length) && <div className="state-empty">No ticket statistics available.</div>}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {!loading && !reportData && (
        <div className="state-empty">No report data available for the selected period.</div>
      )}
    </div>
  );
}
