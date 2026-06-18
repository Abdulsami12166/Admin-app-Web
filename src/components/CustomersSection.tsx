import React, { useEffect, useMemo, useState } from 'react';
import {
  customerApi,
  type Customer,
  type ActivityLog,
  type NotificationPreference,
} from '../services/customers';

interface CustomersProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#fff',
  padding: 16,
};

const muted: React.CSSProperties = { color: '#64748b', fontSize: 13 };

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not recorded');
const formatMoney = (value?: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value || 0);

function EmptyState({ label }: {label: string}) {
  return <div style={{ ...muted, padding: '12px 0' }}>{label}</div>;
}

function StatCard({ label, value }: {label: string; value: React.ReactNode}) {
  return (
    <div style={card}>
      <div style={muted}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export function CustomersSection({ onError, onSuccess }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<{page: number; pages: number; total: number}>({page: 1, pages: 1, total: 0});

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await customerApi.getCustomers(page, 20, search, status, sortBy, sortOrder);
      // Backend returns { success, data: [...], pagination: {...} } — data is the array directly
      setCustomers(Array.isArray(result.data) ? result.data : (result.data as any)?.customers || []);
      setPagination((result as any).pagination || (result.data as any)?.pagination || {page, pages: 1, total: 0});
    } catch (err) {
      onError(`Failed to load customers: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetail = async (customerId: string) => {
    setDetailLoading(true);
    try {
      const [detail, logs, prefs] = await Promise.all([
        customerApi.getCustomerDetail(customerId),
        customerApi.getCustomerActivityLogs(customerId),
        customerApi.getCustomerNotificationPreferences(customerId),
      ]);
      // getCustomerDetails returns { data: { customer, activityLogs, preferences } }
      setSelectedCustomer(detail.data?.customer || null);
      // getCustomerActivityLogs returns { data: [...logs], pagination } — data is the array directly
      setActivityLogs(Array.isArray(logs.data) ? logs.data : logs.data?.logs || []);
      // getNotificationPreferences returns { data: preferences } — data is the object directly
      setPreferences((prefs.data as any)?.preferences ?? (prefs.data && !Array.isArray(prefs.data) ? prefs.data as any : null));
    } catch (err) {
      onError(`Failed to load customer detail: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBlockCustomer = async (customerId: string) => {
    if (!window.confirm('Block this customer and terminate active sessions?')) return;
    try {
      await customerApi.blockCustomer(customerId, 'Admin blocked');
      onSuccess('Customer blocked successfully');
      await Promise.all([loadCustomers(), loadCustomerDetail(customerId)]);
    } catch (err) {
      onError(`Failed to block customer: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    try {
      await customerApi.unblockCustomer(customerId);
      onSuccess('Customer unblocked successfully');
      await Promise.all([loadCustomers(), loadCustomerDetail(customerId)]);
    } catch (err) {
      onError(`Failed to unblock customer: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadCustomers, 250);
    return () => window.clearTimeout(timer);
  }, [page, search, status, sortBy, sortOrder]);

  const selectedStats = useMemo(() => {
    const orders = selectedCustomer?.orders || [];
    return {
      placed: selectedCustomer?.ordersPlaced ?? selectedCustomer?.totalOrders ?? orders.length,
      cancelled: selectedCustomer?.ordersCancelled ?? 0,
      returned: selectedCustomer?.ordersReturned ?? 0,
      refunds: selectedCustomer?.refundRequests?.length || 0,
      tickets: selectedCustomer?.ticketsRaised?.length || 0,
    };
  }, [selectedCustomer]);

  if (selectedCustomer) {
    const statusLabel = selectedCustomer.status || ((selectedCustomer as any).blocked ? 'blocked' : 'active');
    const orders = (selectedCustomer.orders || []).filter(Boolean);
    const addresses = (selectedCustomer.addresses || []).filter(Boolean);
    const wishlist = (selectedCustomer.wishlist || []).filter(Boolean);

    return (
      <div style={{ padding: 20, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setSelectedCustomer(null)} style={{ padding: '8px 12px' }}>Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {statusLabel === 'active' ? (
              <button onClick={() => handleBlockCustomer(selectedCustomer._id)} style={{ background: '#dc2626', color: '#fff', border: 0, borderRadius: 6, padding: '8px 12px' }}>
                Block Customer
              </button>
            ) : (
              <button onClick={() => handleUnblockCustomer(selectedCustomer._id)} style={{ background: '#16a34a', color: '#fff', border: 0, borderRadius: 6, padding: '8px 12px' }}>
                Unblock Customer
              </button>
            )}
          </div>
        </div>

        {detailLoading && <div style={card}>Loading customer profile...</div>}

        <div style={{ ...card, display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0 }}>{selectedCustomer.name || 'Unnamed customer'}</h2>
          <div style={muted}>{selectedCustomer.email || 'No email'} | {selectedCustomer.phone || 'No phone'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 8px', borderRadius: 999, background: statusLabel === 'active' ? '#dcfce7' : '#fee2e2', color: statusLabel === 'active' ? '#166534' : '#991b1b' }}>
              {statusLabel}
            </span>
            <span style={{ padding: '4px 8px', borderRadius: 999, background: '#eef2ff', color: '#3730a3' }}>
              {selectedCustomer.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <StatCard label="Orders Placed" value={selectedStats.placed} />
          <StatCard label="Cancelled" value={selectedStats.cancelled} />
          <StatCard label="Returned" value={selectedStats.returned} />
          <StatCard label="Refund Requests" value={selectedStats.refunds} />
          <StatCard label="Tickets Raised" value={selectedStats.tickets} />
          <StatCard label="Total Spent" value={formatMoney(selectedCustomer.totalSpent)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <section style={card}>
            <h3>Profile</h3>
            <p><strong>Created:</strong> {formatDate(selectedCustomer.createdAt)}</p>
            <p><strong>Last login:</strong> {formatDate(selectedCustomer.lastLoginAt || selectedCustomer.lastLogin)}</p>
            <p><strong>Last activity:</strong> {formatDate(selectedCustomer.lastActivityAt || selectedCustomer.updatedAt)}</p>
          </section>

          <section style={card}>
            <h3>Notification Preferences</h3>
            {preferences?.channels ? (
              Object.entries(preferences.channels).map(([key, enabled]) => (
                <p key={key}><strong>{key}:</strong> {enabled ? 'Enabled' : 'Disabled'}</p>
              ))
            ) : <EmptyState label="No notification preferences recorded." />}
          </section>
        </div>

        <section style={card}>
          <h3>Addresses</h3>
          {addresses.length ? addresses.map(address => (
            <div key={address._id || address.address} style={{ padding: '10px 0', borderTop: '1px solid #eef2f7' }}>
              <strong>{address.type}</strong>
              <div style={muted}>{address.address}</div>
            </div>
          )) : <EmptyState label="No saved addresses found from order data." />}
        </section>

        <section style={card}>
          <h3>Orders</h3>
          {orders.length ? orders.map(order => (
            <div key={String(order._id)} style={{ padding: '10px 0', borderTop: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong>#{String(order._id).slice(-8).toUpperCase()}</strong>
                <div style={muted}>{formatDate(String(order.createdAt || ''))}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{String(order.orderStatus || 'pending')}</div>
                <strong>{formatMoney(Number(order.totalAmount || 0))}</strong>
              </div>
            </div>
          )) : <EmptyState label="No orders placed yet." />}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <section style={card}>
            <h3>Wishlist</h3>
            {wishlist.length ? wishlist.map(item => (
              <div key={String(item._id)} style={{ padding: '8px 0', borderTop: '1px solid #eef2f7' }}>
                <strong>{String(item.title || 'Product')}</strong>
                <div style={muted}>{formatMoney(Number(item.discountedPrice || item.price || 0))}</div>
              </div>
            )) : <EmptyState label="Wishlist is empty." />}
          </section>

          <section style={card}>
            <h3>Activity Timeline</h3>
            {activityLogs.length ? activityLogs.map(log => (
              <div key={log._id} style={{ padding: '10px 0 10px 14px', borderLeft: '2px solid #2563eb', marginLeft: 4 }}>
                <strong>{log.action}</strong>
                <div style={muted}>{typeof log.details === 'string' ? log.details : log.resource || 'Customer activity'}</div>
                <small>{formatDate(log.createdAt || log.timestamp)}</small>
              </div>
            )) : <EmptyState label="No login, logout, or account activity recorded." />}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Customers</h2>
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 160px 180px 140px', gap: 10 }}>
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <select value={status} onChange={e => { setPage(1); setStatus(e.target.value); }} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="lastLoginAt">Last login</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6 }}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <div style={{ ...card, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Name', 'Email', 'Status', 'Orders', 'Spent', 'Last Activity', 'Action'].map(header => (
                <th key={header} style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer._id} style={{ borderBottom: '1px solid #eef2f7' }}>
                <td style={{ padding: 10 }}>{customer.name || 'Unnamed'}</td>
                <td style={{ padding: 10 }}>{customer.email || 'No email'}</td>
                <td style={{ padding: 10 }}>{customer.status}</td>
                <td style={{ padding: 10 }}>{customer.totalOrders || 0}</td>
                <td style={{ padding: 10 }}>{formatMoney(customer.totalSpent)}</td>
                <td style={{ padding: 10 }}>{formatDate(customer.lastActivityAt || customer.updatedAt)}</td>
                <td style={{ padding: 10 }}>
                  <button onClick={() => loadCustomerDetail(customer._id)} style={{ padding: '6px 10px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !customers.length && <EmptyState label="No customers match the current search or filters." />}
        {loading && <div style={{ padding: 16 }}>Loading customers...</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={muted}>{pagination.total} customers</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</button>
          <span style={{ padding: '6px 8px' }}>Page {page} of {Math.max(pagination.pages, 1)}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(current => current + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
