import React, { useEffect, useState } from 'react';
import { adminApi, AdminUser, ActivityItem, AdminOrder } from '../services/api';

// ─── Dark-theme design tokens ──────────────────────────────────────────────
const DS = {
  card: {
    border: '1px solid #28425f',
    borderRadius: 16,
    background: 'rgba(16,32,51,0.92)',
    padding: 14,
  } as React.CSSProperties,
  th: {
    padding: '8px 12px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #28425f',
    fontSize: 12,
    fontWeight: 700,
    color: '#9fb6cb',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
  } as React.CSSProperties,
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(40,66,95,0.5)',
    fontSize: 12,
    color: '#eef4fb',
  } as React.CSSProperties,
  muted: { color: '#9fb6cb', fontSize: 12 } as React.CSSProperties,
  sectionTitle: { margin: '0 0 10px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase' as const, fontSize: 11, letterSpacing: '0.1em' } as React.CSSProperties,
};

const ADMIN_ROLES = new Set(['super-admin', 'admin', 'product-manager', 'inventory-manager', 'support', 'finance-manager', 'customer-service']);

export default function UserHistorySection({
  onError,
  onSuccess,
}: {
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<ActivityItem[]>([]);
  const [payments, setPayments] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [activityPage, setActivityPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const pageSize = 10;

  async function loadUsers() {
    try {
      const res = await adminApi.getUsers();
      const allUsers: AdminUser[] = res.data?.users || [];
      // Show only regular users (not admin roles)
      setUsers(allUsers.filter(u => !ADMIN_ROLES.has(u.role as string)));
    } catch (e: any) {
      onError(String(e.message || e));
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function selectUser(user: AdminUser) {
    setSelected(user);
    setActivities([]);
    setLoginHistory([]);
    setPayments([]);
    setActivityPage(1);
    setLoginPage(1);
    setPaymentPage(1);
    setLoading(true);
    try {
      const [a, l, p] = await Promise.all([
        adminApi.getUserActivities(user._id || user.id || '', 1, pageSize),
        adminApi.getUserLoginHistory(user._id || user.id || '', 1, pageSize),
        adminApi.getUserPayments(user._id || user.id || '', 1, pageSize),
      ]);
      setActivities(a.data?.activities || []);
      setLoginHistory(l.data?.history || []);
      setPayments(p.data?.payments || []);
    } catch (e: any) {
      onError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadActivityPage(page: number) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await adminApi.getUserActivities(selected._id || selected.id || '', page, pageSize);
      setActivities(res.data?.activities || []);
      setActivityPage(page);
    } catch (e: any) {
      onError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadLoginPage(page: number) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await adminApi.getUserLoginHistory(selected._id || selected.id || '', page, pageSize);
      setLoginHistory(res.data?.history || []);
      setLoginPage(page);
    } catch (e: any) {
      onError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentPage(page: number) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await adminApi.getUserPayments(selected._id || selected.id || '', page, pageSize);
      setPayments(res.data?.payments || []);
      setPaymentPage(page);
    } catch (e: any) {
      onError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function PaginationControls({ page, hasMore, onPrev, onNext }: { page: number; hasMore: boolean; onPrev: () => void; onNext: () => void }) {
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color: '#9fb6cb' }}>Page {page}</small>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page === 1} onClick={onPrev} style={{ padding: '5px 12px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 8, fontWeight: 700, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 12 }}>← Prev</button>
          <button disabled={!hasMore} onClick={onNext} style={{ padding: '5px 12px', background: 'rgba(22,48,75,0.9)', color: '#eef4fb', border: '1px solid #28425f', borderRadius: 8, fontWeight: 700, cursor: !hasMore ? 'not-allowed' : 'pointer', opacity: !hasMore ? 0.5 : 1, fontSize: 12 }}>Next →</button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={DS.sectionTitle}>Audit & History</p>
        <h2 style={{ margin: 0, color: '#eef4fb' }}>User History &amp; Activity</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* User list panel */}
        <div style={DS.card}>
          <p style={{ ...DS.sectionTitle, marginBottom: 10 }}>Customers ({filteredUsers.length})</p>
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 12px', border: '1px solid #28425f', borderRadius: 10, background: '#08111f', color: '#eef4fb', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 2 }}>
            {filteredUsers.map(u => (
              <div
                key={u._id || u.email}
                onClick={() => selectUser(u)}
                style={{
                  padding: '10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  marginBottom: 6,
                  border: (selected?._id === u._id || selected?.email === u.email) ? '1px solid rgba(99,210,255,0.4)' : '1px solid transparent',
                  background: (selected?._id === u._id || selected?.email === u.email) ? 'rgba(99,210,255,0.08)' : 'rgba(22,48,75,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                <strong style={{ color: '#eef4fb', fontSize: 13 }}>{u.name || 'Unnamed'}</strong>
                <div style={DS.muted}>{u.email}</div>
                <div style={{ marginTop: 3, display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, color: u.blocked ? '#ff8b8b' : '#43d17a', fontWeight: 700 }}>
                    {u.blocked ? '🔒 Blocked' : '✓ Active'}
                  </span>
                  {u.isVerified && <span style={{ fontSize: 11, color: '#63d2ff' }}>· Verified</span>}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#9fb6cb', fontSize: 13 }}>No customers found</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* User profile card */}
              <div style={{ ...DS.card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <p style={DS.sectionTitle}>Profile</p>
                  <div><small style={{ color: '#9fb6cb' }}>Name</small><div style={{ color: '#eef4fb', fontWeight: 700 }}>{selected.name || '—'}</div></div>
                  <div style={{ marginTop: 6 }}><small style={{ color: '#9fb6cb' }}>Email</small><div style={{ color: '#eef4fb' }}>{selected.email}</div></div>
                  <div style={{ marginTop: 6 }}><small style={{ color: '#9fb6cb' }}>Phone</small><div style={{ color: '#eef4fb' }}>{selected.phone || 'N/A'}</div></div>
                </div>
                <div>
                  <p style={DS.sectionTitle}>Account</p>
                  <div><small style={{ color: '#9fb6cb' }}>Role</small><div style={{ color: '#63d2ff', fontWeight: 700 }}>{selected.role || 'user'}</div></div>
                  <div style={{ marginTop: 6 }}><small style={{ color: '#9fb6cb' }}>Status</small><div style={{ color: selected.blocked ? '#ff8b8b' : '#43d17a', fontWeight: 700 }}>{selected.blocked ? '🔒 Blocked' : '✓ Active'}</div></div>
                  <div style={{ marginTop: 6 }}><small style={{ color: '#9fb6cb' }}>Verified</small><div style={{ color: selected.isVerified ? '#43d17a' : '#9fb6cb' }}>{selected.isVerified ? 'Yes' : 'No'}</div></div>
                </div>
                <div>
                  <p style={DS.sectionTitle}>Dates</p>
                  <div><small style={{ color: '#9fb6cb' }}>Last Login</small><div style={{ color: '#eef4fb', fontSize: 12 }}>{selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : 'Never'}</div></div>
                  <div style={{ marginTop: 6 }}><small style={{ color: '#9fb6cb' }}>Joined</small><div style={{ color: '#eef4fb', fontSize: 12 }}>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</div></div>
                </div>
              </div>

              {/* Activities */}
              <div style={DS.card}>
                <p style={DS.sectionTitle}>Recent Activities ({activities.length})</p>
                {loading && activityPage === 1 ? (
                  <div style={{ textAlign: 'center', color: '#63d2ff', padding: '1rem', fontWeight: 700 }}>Loading…</div>
                ) : activities.length ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={DS.th}>Action</th>
                            <th style={DS.th}>Details</th>
                            <th style={DS.th}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activities.map(a => (
                            <tr key={a._id || a.createdAt}>
                              <td style={DS.td}><strong style={{ color: '#63d2ff' }}>{a.action}</strong></td>
                              <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{a.details || '—'}</span></td>
                              <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={activityPage}
                      hasMore={activities.length === pageSize}
                      onPrev={() => loadActivityPage(activityPage - 1)}
                      onNext={() => loadActivityPage(activityPage + 1)}
                    />
                  </>
                ) : (
                  <div style={{ color: '#9fb6cb', textAlign: 'center', padding: '1rem' }}>No recent activities recorded.</div>
                )}
              </div>

              {/* Login history */}
              <div style={DS.card}>
                <p style={DS.sectionTitle}>Login / Logout History ({loginHistory.length})</p>
                {loginHistory.length ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={DS.th}>Event</th>
                            <th style={DS.th}>IP Address</th>
                            <th style={DS.th}>User Agent</th>
                            <th style={DS.th}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.map(h => {
                            const details = typeof h.details === 'string' ? (() => { try { return JSON.parse(h.details as string); } catch { return {}; } })() : h.details || {};
                            const ip = (details as any).ipAddress || '—';
                            const ua = (details as any).userAgent || '—';
                            return (
                              <tr key={h._id || h.createdAt}>
                                <td style={DS.td}><strong style={{ color: '#63d2ff' }}>{h.action}</strong></td>
                                <td style={DS.td}>{ip}</td>
                                <td style={DS.td}><span title={ua} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', color: '#9fb6cb' }}>{ua}</span></td>
                                <td style={DS.td}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={loginPage}
                      hasMore={loginHistory.length === pageSize}
                      onPrev={() => loadLoginPage(loginPage - 1)}
                      onNext={() => loadLoginPage(loginPage + 1)}
                    />
                  </>
                ) : (
                  <div style={{ color: '#9fb6cb', textAlign: 'center', padding: '1rem' }}>No login history recorded.</div>
                )}
              </div>

              {/* Payments */}
              <div style={DS.card}>
                <p style={DS.sectionTitle}>Payments &amp; Orders ({payments.length})</p>
                {payments.length ? (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={DS.th}>Order ID</th>
                            <th style={DS.th}>Amount</th>
                            <th style={DS.th}>Status</th>
                            <th style={DS.th}>Payment</th>
                            <th style={DS.th}>Reference</th>
                            <th style={DS.th}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(o => (
                            <tr key={o._id}>
                              <td style={DS.td}><strong style={{ fontSize: 11, fontFamily: 'monospace', color: '#9fb6cb' }}>{o._id?.slice(-8) || '—'}</strong></td>
                              <td style={DS.td}><strong style={{ color: '#63d2ff' }}>₹{o.totalAmount || 0}</strong></td>
                              <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{o.orderStatus || '—'}</span></td>
                              <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{o.paymentStatus || '—'}</span></td>
                              <td style={DS.td}><span title={o.paymentReference || o.razorpayPaymentId || '—'} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', color: '#9fb6cb' }}>{o.paymentReference || o.razorpayPaymentId || '—'}</span></td>
                              <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls
                      page={paymentPage}
                      hasMore={payments.length === pageSize}
                      onPrev={() => loadPaymentPage(paymentPage - 1)}
                      onNext={() => loadPaymentPage(paymentPage + 1)}
                    />
                  </>
                ) : (
                  <div style={{ color: '#9fb6cb', textAlign: 'center', padding: '1rem' }}>No payments recorded.</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ ...DS.card, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <p style={{ margin: 0, color: '#9fb6cb', fontWeight: 700 }}>Select a customer to view detailed history</p>
              <p style={{ margin: '8px 0 0', color: '#9fb6cb', fontSize: 13 }}>Activities, login sessions, and payment records will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
