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

  const [historySummary, setHistorySummary] = useState<any>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'timeline' | 'orders' | 'wishlist' | 'purchases' | 'tickets' | 'login-history'>('profile');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<any>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<any>(null);

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
      const [detail, logs, prefs, summary] = await Promise.all([
        customerApi.getCustomerDetail(customerId),
        customerApi.getCustomerActivityLogs(customerId),
        customerApi.getCustomerNotificationPreferences(customerId),
        customerApi.getCustomerHistorySummary(customerId),
      ]);
      setSelectedCustomer(detail.data?.customer || null);
      setActivityLogs(
        Array.isArray(logs.data) ? logs.data : logs.data?.logs || []
      );
      setPreferences(
        (prefs.data as any)?.preferences ??
          (prefs.data && !Array.isArray(prefs.data) ? (prefs.data as any) : null)
      );
      setHistorySummary(summary.data || null);
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

  // Wishlist history extractor
  const wishlistHistoryList = useMemo(() => {
    if (!historySummary) return [];
    const timeline = historySummary.timeline || [];
    const currentWishlist = historySummary.wishlist || [];
    const wishlistItems: any[] = [];
    
    // Add current wishlist items
    currentWishlist.forEach((item: any) => {
      const addedLog = timeline.find((log: any) => 
        log.action === 'Product Added to Wishlist' && String(log.relatedEntityId) === String(item._id)
      );
      wishlistItems.push({
        product: item,
        name: item.title || item.name || 'Product',
        image: item.images?.[0] || '',
        addedDate: addedLog ? addedLog.createdAt : item.createdAt,
        removedDate: null,
        status: 'In Wishlist'
      });
    });

    // Add removed items from timeline
    timeline.forEach((log: any) => {
      if (log.action === 'Product Removed from Wishlist') {
        const prodId = log.relatedEntityId;
        // Prevent duplicate logs for the same removal event
        const alreadyIn = wishlistItems.some(x => x.status === 'Removed' && String(x.product?._id) === String(prodId) && x.removedDate === log.createdAt);
        if (!alreadyIn) {
          const matchingAdd = timeline.find((addLog: any) => 
            addLog.action === 'Product Added to Wishlist' && 
            String(addLog.relatedEntityId) === String(prodId) && 
            new Date(addLog.createdAt) < new Date(log.createdAt)
          );
          
          wishlistItems.push({
            product: { _id: prodId },
            name: log.details?.replace('Product removed from wishlist: ', '') || 'Product (Removed)',
            image: '',
            addedDate: matchingAdd ? matchingAdd.createdAt : null,
            removedDate: log.createdAt,
            status: 'Removed'
          });
        }
      }
    });

    return wishlistItems.sort((a, b) => new Date(b.addedDate || b.removedDate || 0).getTime() - new Date(a.addedDate || a.removedDate || 0).getTime());
  }, [historySummary]);

  // ─── Customer Detail View ─────────────────────────────────────────────────
  if (selectedCustomer) {
    const statusLabel =
      selectedCustomer.status || ((selectedCustomer as any).blocked ? 'blocked' : 'active');
    const addresses = (selectedCustomer.addresses || []).filter(Boolean);

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
              ← Back to List
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

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #28425f', paddingBottom: 10, overflowX: 'auto' }}>
          {[
            { key: 'profile', label: 'Profile & Addresses' },
            { key: 'timeline', label: 'Activity Timeline' },
            { key: 'orders', label: 'Order History Summary' },
            { key: 'wishlist', label: 'Wishlist History' },
            { key: 'purchases', label: 'Recent Purchases' },
            { key: 'tickets', label: 'Ticket History' },
            { key: 'login-history', label: 'Login History' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveDetailTab(tab.key as any)}
              style={{
                padding: '8px 16px',
                background: activeDetailTab === tab.key ? '#63d2ff' : 'transparent',
                color: activeDetailTab === tab.key ? '#06101d' : '#eef4fb',
                border: '1px solid #28425f',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeDetailTab === 'profile' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <section style={DS.card}>
                <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Profile Info</h3>
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
          </div>
        )}

        {activeDetailTab === 'timeline' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Activity Timeline</h3>
            {activityLogs.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {activityLogs.map(log => (
                  <div key={log._id} style={{ padding: '10px 14px', borderLeft: '3px solid #63d2ff', marginLeft: 4, background: 'rgba(10,23,40,0.4)', borderRadius: '0 8px 8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#eef4fb', fontSize: 13 }}>{log.action}</strong>
                      <small style={{ color: '#9fb6cb', fontSize: 11 }}>{formatDate(log.createdAt || log.timestamp)}</small>
                    </div>
                    <div style={{ ...DS.muted, marginTop: 4 }}>{typeof log.details === 'string' ? log.details : log.resource || 'Customer activity'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No activities recorded." />
            )}
          </section>
        )}

        {activeDetailTab === 'orders' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Order History Summary</h3>
            {historySummary?.orders?.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={DS.th}>Order ID</th>
                      <th style={DS.th}>Product(s)</th>
                      <th style={DS.th}>Qty</th>
                      <th style={DS.th}>Amount</th>
                      <th style={DS.th}>Order Status</th>
                      <th style={DS.th}>Payment Status</th>
                      <th style={DS.th}>Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySummary.orders.map((order: any) => {
                      const totalQty = order.items?.reduce((sum: number, x: any) => sum + Number(x.quantity || 1), 0) || 0;
                      const productNames = order.items?.map((x: any) => x.title || 'Product').join(', ') || 'n/a';
                      return (
                        <tr key={order._id}>
                          <td style={DS.td}>
                            <button
                              onClick={() => setSelectedOrderDetail(order)}
                              style={{ background: 'none', border: 'none', color: '#63d2ff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                            >
                              #{String(order._id).slice(-8).toUpperCase()}
                            </button>
                          </td>
                          <td style={{ ...DS.td, maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {productNames}
                          </td>
                          <td style={DS.td}>{totalQty}</td>
                          <td style={{ ...DS.td, color: '#63d2ff', fontWeight: 'bold' }}>{formatMoney(order.totalAmount)}</td>
                          <td style={DS.td}>{order.orderStatus}</td>
                          <td style={DS.td}>{order.paymentStatus}</td>
                          <td style={DS.td}>{formatDate(order.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState label="No order history found." />
            )}
          </section>
        )}

        {activeDetailTab === 'wishlist' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Wishlist History</h3>
            {wishlistHistoryList.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={DS.th}>Product Name</th>
                      <th style={DS.th}>Image</th>
                      <th style={DS.th}>Added Date</th>
                      <th style={DS.th}>Removed Date</th>
                      <th style={DS.th}>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlistHistoryList.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={DS.td}>
                          {item.product?._id && item.status !== 'Removed' ? (
                            <button
                              onClick={() => setSelectedProductDetail(item.product)}
                              style={{ background: 'none', border: 'none', color: '#63d2ff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                            >
                              {item.name}
                            </button>
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </td>
                        <td style={DS.td}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#5b7692' }}>—</span>
                          )}
                        </td>
                        <td style={DS.td}>{formatDate(item.addedDate)}</td>
                        <td style={DS.td}>{item.removedDate ? formatDate(item.removedDate) : <span style={{ color: '#5b7692' }}>—</span>}</td>
                        <td style={DS.td}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 'bold',
                            background: item.status === 'In Wishlist' ? 'rgba(99,210,255,0.15)' : 'rgba(255,139,139,0.15)',
                            color: item.status === 'In Wishlist' ? '#63d2ff' : '#ff8b8b'
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState label="Wishlist history is empty." />
            )}
          </section>
        )}

        {activeDetailTab === 'purchases' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Recent Purchases</h3>
            {historySummary?.orders?.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {historySummary.orders.flatMap((order: any) => order.items || []).slice(0, 10).map((item: any, idx: number) => (
                  <div key={idx} style={{ padding: '10px 14px', background: 'rgba(10,23,40,0.4)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: '#1c344e', borderRadius: 8 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#eef4fb' }}>{item.title || 'Product'}</strong>
                      <div style={DS.muted}>Quantity: {item.quantity || 1} &nbsp;·&nbsp; Price: {formatMoney(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No purchases found." />
            )}
          </section>
        )}

        {activeDetailTab === 'tickets' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Support Ticket History</h3>
            {historySummary?.tickets?.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={DS.th}>Ticket Number / Subject</th>
                      <th style={DS.th}>Category</th>
                      <th style={DS.th}>Priority</th>
                      <th style={DS.th}>Status</th>
                      <th style={DS.th}>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySummary.tickets.map((ticket: any) => (
                      <tr key={ticket._id}>
                        <td style={DS.td}>
                          <button
                            onClick={() => setSelectedTicketDetail(ticket)}
                            style={{ background: 'none', border: 'none', color: '#63d2ff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                          >
                            #{String(ticket._id).slice(-6).toUpperCase()} - {ticket.subject}
                          </button>
                        </td>
                        <td style={{ ...DS.td, textTransform: 'capitalize' }}>{ticket.category}</td>
                        <td style={DS.td}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 'bold',
                            background: ticket.priority === 'high' || ticket.priority === 'critical' ? 'rgba(255,139,139,0.15)' : 'rgba(99,210,255,0.15)',
                            color: ticket.priority === 'high' || ticket.priority === 'critical' ? '#ff8b8b' : '#63d2ff'
                          }}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td style={DS.td}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 'bold',
                            background: ticket.status === 'open' ? 'rgba(67,209,122,0.15)' : 'rgba(159,182,203,0.15)',
                            color: ticket.status === 'open' ? '#43d17a' : '#9fb6cb'
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                        <td style={DS.td}>{formatDate(ticket.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState label="No ticket history found." />
            )}
          </section>
        )}

        {activeDetailTab === 'login-history' && (
          <section style={DS.card}>
            <h3 style={{ margin: '0 0 12px', color: '#eef4fb' }}>Login History</h3>
            {historySummary?.loginHistory?.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={DS.th}>Timestamp</th>
                      <th style={DS.th}>IP Address</th>
                      <th style={DS.th}>Device Information</th>
                      <th style={DS.th}>Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySummary.loginHistory.map((log: any) => (
                      <tr key={log._id}>
                        <td style={DS.td}>{formatDate(log.createdAt)}</td>
                        <td style={DS.td}>{log.ipAddress || 'unknown'}</td>
                        <td style={{ ...DS.td, maxWidth: '250px', wordBreak: 'break-all' }}>{log.deviceInfo || log.userAgent || 'unknown'}</td>
                        <td style={DS.td}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 'bold',
                            background: 'rgba(99,210,255,0.15)',
                            color: '#63d2ff'
                          }}>
                            {log.platform || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState label="No login history found." />
            )}
          </section>
        )}

        {/* Order Details Modal Overlay */}
        {selectedOrderDetail && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0a1728',
              border: '1px solid #28425f',
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px', color: '#63d2ff' }}>Order Details #{String(selectedOrderDetail._id).toUpperCase()}</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={DS.muted}><strong>Purchase Date:</strong> {formatDate(selectedOrderDetail.createdAt)}</div>
                <div style={DS.muted}><strong>Status:</strong> {selectedOrderDetail.orderStatus}</div>
                <div style={DS.muted}><strong>Payment Status:</strong> {selectedOrderDetail.paymentStatus}</div>
                <div style={DS.muted}><strong>Payment Method:</strong> {selectedOrderDetail.paymentMethod}</div>
                
                <h4 style={{ margin: '12px 0 6px', color: '#eef4fb' }}>Items</h4>
                <div style={{ borderTop: '1px solid #28425f', borderBottom: '1px solid #28425f', padding: '8px 0' }}>
                  {selectedOrderDetail.items?.map((item: any, index: number) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#eef4fb' }}>{item.title || 'Product'} (x{item.quantity || 1})</span>
                      <span style={{ color: '#63d2ff' }}>{formatMoney(item.price)}</span>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16 }}>
                  <span style={{ color: '#eef4fb' }}>Total Amount</span>
                  <span style={{ color: '#63d2ff' }}>{formatMoney(selectedOrderDetail.totalAmount)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                style={{
                  marginTop: 20,
                  padding: '8px 16px',
                  background: '#63d2ff',
                  color: '#06101d',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Product Details Modal Overlay */}
        {selectedProductDetail && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0a1728',
              border: '1px solid #28425f',
              borderRadius: 16,
              padding: 24,
              maxWidth: 500,
              width: '90%',
              textAlign: 'center'
            }}>
              {selectedProductDetail.images?.[0] ? (
                <img
                  src={selectedProductDetail.images[0]}
                  alt={selectedProductDetail.title}
                  style={{ width: '100%', maxHeight: 250, objectFit: 'contain', borderRadius: 12, marginBottom: 16 }}
                />
              ) : (
                <div style={{ width: '100%', height: 180, background: '#1c344e', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fb6cb', marginBottom: 16 }}>No Image</div>
              )}
              <h3 style={{ margin: '0 0 8px', color: '#eef4fb' }}>{selectedProductDetail.title || selectedProductDetail.name}</h3>
              <p style={{ ...DS.muted, textTransform: 'capitalize', margin: '0 0 12px' }}>{selectedProductDetail.category}</p>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#63d2ff', margin: '12px 0' }}>
                {formatMoney(selectedProductDetail.discountedPrice || selectedProductDetail.price)}
              </div>
              <p style={{ color: '#9fb6cb', fontSize: 13, lineHeight: '1.5', margin: '0 0 20px', textAlign: 'left' }}>
                {selectedProductDetail.description || 'No description available.'}
              </p>
              <button
                onClick={() => setSelectedProductDetail(null)}
                style={{
                  padding: '8px 16px',
                  background: '#63d2ff',
                  color: '#06101d',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Ticket Details Modal Overlay */}
        {selectedTicketDetail && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#0a1728',
              border: '1px solid #28425f',
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px', color: '#63d2ff' }}>Support Ticket Details</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={DS.muted}><strong>Subject:</strong> {selectedTicketDetail.subject}</div>
                <div style={DS.muted}><strong>Category:</strong> {selectedTicketDetail.category}</div>
                <div style={DS.muted}><strong>Priority:</strong> {selectedTicketDetail.priority}</div>
                <div style={DS.muted}><strong>Status:</strong> {selectedTicketDetail.status}</div>
                <div style={DS.muted}><strong>Created:</strong> {formatDate(selectedTicketDetail.createdAt)}</div>
                
                <h4 style={{ margin: '16px 0 6px', color: '#eef4fb' }}>Conversation History</h4>
                <div style={{ display: 'grid', gap: 10, maxHeight: 300, overflowY: 'auto', borderTop: '1px solid #28425f', padding: '12px 0' }}>
                  {selectedTicketDetail.messages?.map((msg: any, index: number) => (
                    <div key={index} style={{
                      padding: 10,
                      borderRadius: 8,
                      background: msg.senderType === 'admin' ? 'rgba(99,210,255,0.08)' : 'rgba(10,23,40,0.5)',
                      border: msg.senderType === 'admin' ? '1px solid rgba(99,210,255,0.15)' : '1px solid #28425f',
                      alignSelf: msg.senderType === 'admin' ? 'flex-start' : 'flex-end',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9fb6cb', marginBottom: 4 }}>
                        <strong>{msg.senderType === 'admin' ? 'Admin' : 'Customer'}</strong>
                        <span>{formatDate(msg.timestamp || msg.createdAt)}</span>
                      </div>
                      <div style={{ color: '#eef4fb', fontSize: 13 }}>{msg.message}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                style={{
                  marginTop: 20,
                  padding: '8px 16px',
                  background: '#63d2ff',
                  color: '#06101d',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
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
