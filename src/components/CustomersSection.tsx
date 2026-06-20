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

// ─── Dark-theme design tokens ──────────────────────────────────────────────
const DS = {
  card: {
    border: '1px solid #28425f',
    borderRadius: 16,
    background: 'rgba(16,32,51,0.92)',
    padding: 16,
  } as React.CSSProperties,
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #28425f',
    fontSize: 12,
    fontWeight: 700,
    color: '#9fb6cb',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    background: 'rgba(10,23,40,0.8)',
  } as React.CSSProperties,
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(40,66,95,0.5)',
    fontSize: 13,
    color: '#eef4fb',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  muted: { color: '#9fb6cb', fontSize: 12 } as React.CSSProperties,
  input: {
    padding: '9px 14px',
    border: '1px solid #28425f',
    borderRadius: 12,
    background: '#08111f',
    color: '#eef4fb',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not recorded');
const formatMoney = (value?: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value || 0);

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: isActive ? 'rgba(67,209,122,0.15)' : 'rgba(255,139,139,0.15)',
      color: isActive ? '#43d17a' : '#ff8b8b',
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={DS.card}>
      <div style={DS.muted}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: '#63d2ff' }}>{value}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div style={{ ...DS.muted, padding: '12px 0' }}>{label}</div>;
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
  const [pagination, setPagination] = useState<{ page: number; pages: number; total: number }>({
    page: 1,
    pages: 1,
    total: 0,
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await customerApi.getCustomers(page, 20, search, status, sortBy, sortOrder);
      setCustomers(
        Array.isArray(result.data) ? result.data : (result.data as any)?.customers || []
      );
      setPagination(
        (result as any).pagination ||
          (result.data as any)?.pagination || { page, pages: 1, total: 0 }
      );
    } catch (err) {
      onError(
        `Failed to load customers: ${err instanceof Error ? err.message : String(err)}`
      );
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
      setSelectedCustomer(detail.data?.customer || null);
      setActivityLogs(
        Array.isArray(logs.data) ? logs.data : logs.data?.logs || []
      );
      setPreferences(
        (prefs.data as any)?.preferences ??
          (prefs.data && !Array.isArray(prefs.data) ? (prefs.data as any) : null)
      );
    } catch (err) {
      onError(
        `Failed to load customer detail: ${err instanceof Error ? err.message : String(err)}`
      );
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

  // ─── Customer Detail View ─────────────────────────────────────────────────
  if (selectedCustomer) {
    const statusLabel =
      selectedCustomer.status || ((selectedCustomer as any).blocked ? 'blocked' : 'active');
    const orders = (selectedCustomer.orders || []).filter(Boolean);
    const addresses = (selectedCustomer.addresses || []).filter(Boolean);
    const wishlist = (selectedCustomer.wishlist || []).filter(Boolean);

    return (
      <div style={{ padding: 20, display: 'grid', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Customer Profile</p>
            <h2 style={{ margin: 0, color: '#eef4fb' }}>{selectedCustomer.name || 'Unnamed customer'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {statusLabel === 'active' ? (
              <button
                onClick={() => handleBlockCustomer(selectedCustomer._id)}
                style={{ padding: '8px 14px', background: 'rgba(255,139,139,0.2)', color: '#ff8b8b', border: '1px solid rgba(255,139,139,0.3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Block Customer
              </button>
            ) : (
              <button
                onClick={() => handleUnblockCustomer(selectedCustomer._id)}
                style={{ padding: '8px 14px', background: 'rgba(67,209,122,0.15)', color: '#43d17a', border: '1px solid rgba(67,209,122,0.3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Unblock Customer
              </button>
            )}
            <button onClick={() => setSelectedCustomer(null)} style={{ padding: '8px 14px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              ← Back
            </button>
          </div>
        </div>

        {detailLoading && <div style={{ ...DS.card, textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading customer profile…</div>}

        {/* Identity card */}
        <div style={{ ...DS.card, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status={statusLabel} />
            {selectedCustomer.isVerified && (
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(99,210,255,0.1)', color: '#63d2ff' }}>Verified</span>
            )}
          </div>
          <div style={DS.muted}>{selectedCustomer.email || 'No email'} &nbsp;·&nbsp; {selectedCustomer.phone || 'No phone'}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCard label="Orders Placed" value={selectedStats.placed} />
          <StatCard label="Cancelled" value={selectedStats.cancelled} />
          <StatCard label="Returned" value={selectedStats.returned} />
          <StatCard label="Refund Requests" value={selectedStats.refunds} />
          <StatCard label="Tickets Raised" value={selectedStats.tickets} />
          <StatCard label="Total Spent" value={formatMoney(selectedCustomer.totalSpent)} />
        </div>

        {/* Profile & Notification Prefs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Profile</h3>
            <p style={DS.muted}><strong style={{ color: '#9fb6cb' }}>Created:</strong> {formatDate(selectedCustomer.createdAt)}</p>
            <p style={DS.muted}><strong style={{ color: '#9fb6cb' }}>Last login:</strong> {formatDate(selectedCustomer.lastLoginAt || selectedCustomer.lastLogin)}</p>
            <p style={DS.muted}><strong style={{ color: '#9fb6cb' }}>Last activity:</strong> {formatDate(selectedCustomer.lastActivityAt || selectedCustomer.updatedAt)}</p>
          </section>

          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Notification Preferences</h3>
            {preferences?.channels ? (
              Object.entries(preferences.channels).map(([key, enabled]) => (
                <p key={key} style={DS.muted}><strong style={{ color: '#9fb6cb' }}>{key}:</strong> <span style={{ color: (enabled as boolean) ? '#43d17a' : '#ff8b8b' }}>{(enabled as boolean) ? 'Enabled' : 'Disabled'}</span></p>
              ))
            ) : (
              <EmptyState label="No notification preferences recorded." />
            )}
          </section>
        </div>

        {/* Addresses */}
        <section style={DS.card}>
          <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Addresses</h3>
          {addresses.length ? (
            addresses.map(address => (
              <div key={address._id || address.address} style={{ padding: '10px 0', borderTop: '1px solid #28425f' }}>
                <strong style={{ color: '#63d2ff' }}>{address.type}</strong>
                <div style={DS.muted}>{address.address}</div>
              </div>
            ))
          ) : (
            <EmptyState label="No saved addresses found." />
          )}
        </section>

        {/* Orders */}
        <section style={DS.card}>
          <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Orders</h3>
          {orders.length ? (
            orders.map(order => (
              <div key={String(order._id)} style={{ padding: '10px 0', borderTop: '1px solid #28425f', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong style={{ color: '#eef4fb' }}>#{String(order._id).slice(-8).toUpperCase()}</strong>
                  <div style={DS.muted}>{formatDate(String(order.createdAt || ''))}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#9fb6cb', fontSize: 12 }}>{String(order.orderStatus || 'pending')}</div>
                  <strong style={{ color: '#63d2ff' }}>{formatMoney(Number(order.totalAmount || 0))}</strong>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="No orders placed yet." />
          )}
        </section>

        {/* Wishlist & Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Wishlist</h3>
            {wishlist.length ? (
              wishlist.map(item => {
                const isObj = typeof item === 'object' && item !== null;
                const itemId = isObj ? String(item._id || item.id || '') : String(item);
                const title = isObj ? String(item.title || 'Product') : 'Product';
                const price = isObj ? Number(item.discountedPrice || item.price || 0) : 0;
                return (
                  <div key={itemId} style={{ padding: '8px 0', borderTop: '1px solid #28425f' }}>
                    <strong style={{ color: '#eef4fb' }}>{title}</strong>
                    <div style={DS.muted}>{formatMoney(price)}</div>
                  </div>
                );
              })
            ) : (
              <EmptyState label="Wishlist is empty." />
            )}
          </section>

          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Activity Timeline</h3>
            {activityLogs.length ? (
              activityLogs.map(log => (
                <div key={log._id} style={{ padding: '10px 0 10px 14px', borderLeft: '3px solid #63d2ff', marginLeft: 4, marginBottom: 8 }}>
                  <strong style={{ color: '#eef4fb', fontSize: 13 }}>{log.action}</strong>
                  <div style={DS.muted}>{typeof log.details === 'string' ? log.details : log.resource || 'Customer activity'}</div>
                  <small style={{ color: '#9fb6cb', fontSize: 11 }}>{formatDate(log.createdAt || log.timestamp)}</small>
                </div>
              ))
            ) : (
              <EmptyState label="No login, logout, or account activity recorded." />
            )}
          </section>
        </div>
      </div>
    );
  }

  // ─── Customer List View ───────────────────────────────────────────────────
  return (
    <div style={{ padding: 20, display: 'grid', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Customer Management</p>
        <h2 style={{ margin: 0, color: '#eef4fb' }}>Customers</h2>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 160px 180px 140px', gap: 10 }}>
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          style={DS.input}
        />
        <select value={status} onChange={e => { setPage(1); setStatus(e.target.value); }} style={DS.input}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={DS.input}>
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="lastLoginAt">Last login</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')} style={DS.input}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...DS.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Status', 'Orders', 'Spent', 'Last Activity', 'Action'].map(h => (
                  <th key={h} style={DS.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer._id} style={{ transition: 'background 0.15s' }}>
                  <td style={DS.td}><strong>{customer.name || 'Unnamed'}</strong></td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{customer.email || 'No email'}</span></td>
                  <td style={DS.td}><StatusBadge status={customer.status || 'active'} /></td>
                  <td style={DS.td}>{customer.totalOrders || 0}</td>
                  <td style={DS.td}><strong style={{ color: '#63d2ff' }}>{formatMoney(customer.totalSpent)}</strong></td>
                  <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{formatDate(customer.lastActivityAt || customer.updatedAt)}</span></td>
                  <td style={DS.td}>
                    <button
                      onClick={() => loadCustomerDetail(customer._id)}
                      style={{ padding: '5px 12px', background: '#63d2ff', color: '#06101d', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !customers.length && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9fb6cb' }}>No customers match the current search or filters.</div>
          )}
          {loading && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading customers…</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={DS.muted}>{pagination.total} customers</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(cur => Math.max(1, cur - 1))}
            style={{ padding: '6px 14px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 10, fontWeight: 700, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, fontSize: 13 }}
          >
            ← Previous
          </button>
          <span style={DS.muted}>Page {page} of {Math.max(pagination.pages, 1)}</span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage(cur => cur + 1)}
            style={{ padding: '6px 14px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 10, fontWeight: 700, cursor: page >= pagination.pages ? 'not-allowed' : 'pointer', opacity: page >= pagination.pages ? 0.5 : 1, fontSize: 13 }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
