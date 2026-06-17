import React, { useEffect, useState } from 'react';
import { reportsApi, type ReportData } from '../services/reports';

interface ReportsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

type ReportType = 'sales' | 'users' | 'products' | 'inventory' | 'tickets';

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
      onSuccess(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      onError(`Failed to export report: ${err}`);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, dateRange]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reports</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setReportType('sales')}
          style={{
            padding: '8px 16px',
            background: reportType === 'sales' ? '#228be6' : '#f5f5f5',
            color: reportType === 'sales' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sales Report
        </button>
        <button
          onClick={() => setReportType('users')}
          style={{
            padding: '8px 16px',
            background: reportType === 'users' ? '#228be6' : '#f5f5f5',
            color: reportType === 'users' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          User Report
        </button>
        <button
          onClick={() => setReportType('products')}
          style={{
            padding: '8px 16px',
            background: reportType === 'products' ? '#228be6' : '#f5f5f5',
            color: reportType === 'products' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Product Report
        </button>
        <button
          onClick={() => setReportType('inventory')}
          style={{
            padding: '8px 16px',
            background: reportType === 'inventory' ? '#228be6' : '#f5f5f5',
            color: reportType === 'inventory' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Inventory Report
        </button>
        <button
          onClick={() => setReportType('tickets')}
          style={{
            padding: '8px 16px',
            background: reportType === 'tickets' ? '#228be6' : '#f5f5f5',
            color: reportType === 'tickets' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Ticket Report
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>From:</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <label>To:</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          onClick={loadReport}
          style={{ padding: '8px 16px', background: '#228be6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Apply Filter
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => handleExport('csv')}
          style={{ padding: '8px 16px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Export CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Export PDF
        </button>
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : reportData ? (
        <div>
          <h3>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h3>
          
          {reportType === 'sales' && (
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Revenue</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>₹{reportData.totalRevenue || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Orders</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.totalOrders || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Average Order Value</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>₹{reportData.avgOrderValue || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Conversion Rate</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.conversionRate || 0}%</p>
                </div>
              </div>
              
              <h4>Recent Sales</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Order ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Customer</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.recentSales?.map((sale: any) => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{sale.orderId}</td>
                      <td style={{ padding: '10px' }}>{new Date(sale.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px' }}>{sale.customer}</td>
                      <td style={{ padding: '10px' }}>₹{sale.amount}</td>
                      <td style={{ padding: '10px' }}>{sale.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'users' && (
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Users</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.totalUsers || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Active Users</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#51cf66' }}>{reportData.activeUsers || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>New Users (30d)</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.newUsers || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Blocked Users</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>{reportData.blockedUsers || 0}</p>
                </div>
              </div>

              <h4>User Growth</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Period</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>New Users</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Active Users</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Retention Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.userGrowth?.map((growth: any) => (
                    <tr key={growth.period} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{growth.period}</td>
                      <td style={{ padding: '10px' }}>{growth.newUsers}</td>
                      <td style={{ padding: '10px' }}>{growth.activeUsers}</td>
                      <td style={{ padding: '10px' }}>{growth.retentionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'products' && (
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Products</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.totalProducts || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Active Products</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#51cf66' }}>{reportData.activeProducts || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Out of Stock</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>{reportData.outOfStock || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Low Stock</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fcc419' }}>{reportData.lowStock || 0}</p>
                </div>
              </div>

              <h4>Top Selling Products</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sold</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Revenue</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts?.map((product: any) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{product.name}</td>
                      <td style={{ padding: '10px' }}>{product.category}</td>
                      <td style={{ padding: '10px' }}>{product.sold}</td>
                      <td style={{ padding: '10px' }}>₹{product.revenue}</td>
                      <td style={{ padding: '10px' }}>{product.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'inventory' && (
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Stock Value</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>₹{reportData.totalStockValue || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Stock Movements</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.stockMovements || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Low Stock Alerts</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fcc419' }}>{reportData.lowStockAlerts || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Out of Stock Items</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>{reportData.outOfStockItems || 0}</p>
                </div>
              </div>

              <h4>Stock Movements</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Quantity</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Reason</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.movements?.map((movement: any) => (
                    <tr key={movement.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{movement.product}</td>
                      <td style={{ padding: '10px' }}>{movement.type}</td>
                      <td style={{ padding: '10px' }}>{movement.quantity}</td>
                      <td style={{ padding: '10px' }}>{movement.reason}</td>
                      <td style={{ padding: '10px' }}>{new Date(movement.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'tickets' && (
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Total Tickets</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.totalTickets || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Open Tickets</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fcc419' }}>{reportData.openTickets || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Resolved Tickets</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#51cf66' }}>{reportData.resolvedTickets || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#666' }}>Avg Resolution Time</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#228be6' }}>{reportData.avgResolutionTime || 0}h</p>
                </div>
              </div>

              <h4>Ticket Statistics</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Open</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Resolved</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.ticketStats?.map((stat: any) => (
                    <tr key={stat.category} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{stat.category}</td>
                      <td style={{ padding: '10px' }}>{stat.total}</td>
                      <td style={{ padding: '10px' }}>{stat.open}</td>
                      <td style={{ padding: '10px' }}>{stat.resolved}</td>
                      <td style={{ padding: '10px' }}>{stat.avgTime}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p>No report data available</p>
      )}
    </div>
  );
}
