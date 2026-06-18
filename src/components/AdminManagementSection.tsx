import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

interface AdminProps {
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}

// ─── Shared dark-theme token styles ───────────────────────────────────────────
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
  badge: (variant: 'active' | 'blocked' | 'neutral'): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background:
      variant === 'active'
        ? 'rgba(67,209,122,0.15)'
        : variant === 'blocked'
        ? 'rgba(255,139,139,0.15)'
        : 'rgba(159,182,203,0.10)',
    color:
      variant === 'active' ? '#43d17a' : variant === 'blocked' ? '#ff8b8b' : '#9fb6cb',
  }),
  btn: (variant: 'primary' | 'secondary' | 'danger' | 'ghost'): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: 10,
    border: variant === 'secondary' ? '1px solid #28425f' : 'none',
    background:
      variant === 'primary'
        ? '#63d2ff'
        : variant === 'danger'
        ? 'rgba(255,139,139,0.2)'
        : variant === 'ghost'
        ? 'transparent'
        : 'rgba(22,48,75,0.9)',
    color:
      variant === 'primary' ? '#06101d' : variant === 'danger' ? '#ff8b8b' : '#eef4fb',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  }),
  tabBtn: (active: boolean): React.CSSProperties => ({
    padding: '8px 14px 10px',
    border: 'none',
    borderBottom: active ? '2px solid #63d2ff' : '2px solid transparent',
    background: 'transparent',
    fontWeight: active ? 700 : 500,
    color: active ? '#63d2ff' : '#9fb6cb',
    cursor: 'pointer',
    fontSize: 13,
  }),
};

export default function AdminManagementSection({ onError, onSuccess }: AdminProps) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'permissions' | 'sessions' | 'actions' | 'raw'>('timeline');

  const loadAdminsList = async () => {
    setLoading(true);
    try {
      // Use /admin/admins to get admins only (not all users)
      let res: any;
      try {
        res = await adminApi.get('/admin/admins');
        setAdmins(res.data?.admins || res.data?.users || res.data || []);
      } catch {
        // fallback: filter from users list
        const fallback = await adminApi.getUsers();
        const allUsers: any[] = fallback.data?.users || [];
        setAdmins(allUsers.filter(u => ['super-admin','admin','product-manager','inventory-manager','support','finance-manager','customer-service'].includes(u.role)));
      }
    } catch (e: any) {
      onError(`Failed to load admin list: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminProfile = async (adminId: string) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.getAdminProfile(adminId);
      setProfileData(res.data || null);
    } catch (e: any) {
      onError(`Failed to load admin profile: ${e.message || e}`);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadAdminsList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadAdminProfile(selectedId);

      const unsubscribeActivity = subscribeAdminSocketEvent(
        socketEvents.DOMAIN.ADMIN_ACTIVITY_CREATED,
        (payload: any) => {
          if (payload?.userId === selectedId || payload?.actor === selectedId) {
            loadAdminProfile(selectedId);
            loadAdminsList();
          }
        }
      );

      const unsubscribeLogout = subscribeAdminSocketEvent(
        socketEvents.DOMAIN.ADMIN_FORCE_LOGOUT,
        (payload: any) => {
          if (payload?.userId === selectedId) {
            loadAdminProfile(selectedId);
            loadAdminsList();
          }
        }
      );

      return () => {
        unsubscribeActivity();
        unsubscribeLogout();
      };
    } else {
      setProfileData(null);
    }
  }, [selectedId]);

  const handleForceLogout = async (adminId: string) => {
    if (!window.confirm('Force logout this admin? All active sessions will be terminated.')) return;
    try {
      await adminApi.forceLogoutUser(adminId);
      onSuccess('Admin has been forcefully logged out');
      await Promise.all([loadAdminsList(), loadAdminProfile(adminId)]);
    } catch (e: any) {
      onError(`Failed to force logout: ${e.message || e}`);
    }
  };

  const handleBlock = async (adminId: string) => {
    if (!window.confirm('Block this admin? Access will be immediately disabled.')) return;
    try {
      await adminApi.blockUser(adminId);
      onSuccess('Admin blocked successfully');
      await Promise.all([loadAdminsList(), loadAdminProfile(adminId)]);
    } catch (e: any) {
      onError(`Failed to block admin: ${e.message || e}`);
    }
  };

  const handleUnblock = async (adminId: string) => {
    try {
      await adminApi.unblockUser(adminId);
      onSuccess('Admin unblocked successfully');
      await Promise.all([loadAdminsList(), loadAdminProfile(adminId)]);
    } catch (e: any) {
      onError(`Failed to unblock admin: ${e.message || e}`);
    }
  };

  const fmt = (val?: string) => (val ? new Date(val).toLocaleString() : 'Never');

  const renderTimelineItem = (item: any, idx: number) => {
    const date = fmt(item.createdAt);
    const title = item.action || 'System Action';
    const detail = item.details || item.errorMessage || JSON.stringify(item.changes?.after || item.metadata || {});
    const isActivity = !!item.action && !item.entityType;
    return (
      <div key={item._id || idx} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: isActivity ? '#63d2ff' : '#43d17a', border: '2px solid #28425f', boxShadow: '0 0 0 3px rgba(99,210,255,0.15)', flexShrink: 0 }} />
          <div style={{ flex: 1, width: 2, background: '#28425f', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1, paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <strong style={{ fontSize: 13, color: '#eef4fb' }}>{title}</strong>
            <span style={{ fontSize: 11, color: '#9fb6cb' }}>{date}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#9fb6cb' }}>{String(detail)}</p>
          {item.ipAddress && <small style={{ color: '#63d2ff', fontSize: 11 }}>IP: {item.ipAddress}</small>}
        </div>
      </div>
    );
  };

  // ─── ADMIN LIST VIEW ────────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>System Accounts</p>
            <h2 style={{ margin: 0, color: '#eef4fb' }}>Admin Management</h2>
          </div>
          <button style={DS.btn('secondary')} onClick={loadAdminsList} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div style={DS.card}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading admins list…</div>
          ) : admins.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9fb6cb' }}>No admin accounts found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={DS.th}>Admin Name</th>
                    <th style={DS.th}>Email</th>
                    <th style={DS.th}>Role</th>
                    <th style={DS.th}>Status</th>
                    <th style={DS.th}>Last Login</th>
                    <th style={DS.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a._id}>
                      <td style={DS.td}><strong style={{ color: '#eef4fb' }}>{a.name || 'Unnamed'}</strong></td>
                      <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{a.email}</span></td>
                      <td style={DS.td}>
                        <span style={{ color: '#63d2ff', fontWeight: 700, textTransform: 'capitalize' }}>{a.role}</span>
                      </td>
                      <td style={DS.td}>
                        <span style={DS.badge(a.blocked ? 'blocked' : 'active')}>
                          {a.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={DS.td}><span style={{ color: '#9fb6cb', fontSize: 12 }}>{fmt(a.lastLoginAt)}</span></td>
                      <td style={DS.td}>
                        <button style={DS.btn('primary')} onClick={() => setSelectedId(a._id)}>
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PROFILE DETAIL VIEW ───────────────────────────────────────────────────
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: '#63d2ff', fontWeight: 900, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.12em' }}>Admin Profile</p>
          <h2 style={{ margin: 0, color: '#eef4fb' }}>Admin Detail</h2>
        </div>
        <button style={DS.btn('secondary')} onClick={() => setSelectedId(null)}>← Back to List</button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Profile Card */}
        <div style={{ ...DS.card, width: 300, flexShrink: 0, display: 'grid', gap: 16 }}>
          {detailLoading || !profileData ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading profile…</div>
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#63d2ff,#43d17a)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#06101d' }}>
                  {profileData.admin?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <h3 style={{ margin: '0 0 6px', color: '#eef4fb' }}>{profileData.admin?.name}</h3>
                <span style={DS.badge(profileData.admin?.blocked ? 'blocked' : 'active')}>
                  {profileData.admin?.blocked ? 'Blocked' : 'Active'}
                </span>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid #28425f', margin: 0 }} />

              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ color: '#9fb6cb' }}><strong style={{ color: '#eef4fb' }}>Email:</strong> {profileData.admin?.email}</div>
                <div style={{ color: '#9fb6cb' }}><strong style={{ color: '#eef4fb' }}>Phone:</strong> {profileData.admin?.phone || 'Not recorded'}</div>
                <div style={{ color: '#9fb6cb' }}><strong style={{ color: '#eef4fb' }}>Role:</strong> <span style={{ color: '#63d2ff', textTransform: 'capitalize' }}>{profileData.admin?.role}</span></div>
                <div style={{ color: '#9fb6cb' }}><strong style={{ color: '#eef4fb' }}>Last Login:</strong> {fmt(profileData.admin?.lastLoginAt)}</div>
                <div style={{ color: '#9fb6cb' }}><strong style={{ color: '#eef4fb' }}>Created:</strong> {fmt(profileData.admin?.createdAt)}</div>
              </div>

              <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
                {profileData.admin?.blocked ? (
                  <button style={{ ...DS.btn('primary'), padding: 10, width: '100%', borderRadius: 12 }} onClick={() => handleUnblock(profileData.admin?._id)}>
                    Unblock Admin
                  </button>
                ) : (
                  <button style={{ ...DS.btn('danger'), padding: 10, width: '100%', borderRadius: 12 }} onClick={() => handleBlock(profileData.admin?._id)}>
                    Block Admin
                  </button>
                )}
                <button style={{ ...DS.btn('secondary'), padding: 10, width: '100%', borderRadius: 12 }} onClick={() => handleForceLogout(profileData.admin?._id)}>
                  Force Logout Session
                </button>
              </div>
            </>
          )}
        </div>

        {/* Audit Tabs */}
        <div style={{ flex: 1, display: 'grid', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #28425f', gap: 4, flexWrap: 'wrap' }}>
            {([
              { key: 'timeline', label: 'Activity Timeline' },
              { key: 'permissions', label: 'Permissions' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'actions', label: 'Actions' },
              { key: 'raw', label: 'Audit Logs' },
            ] as const).map(tab => (
              <button key={tab.key} style={DS.tabBtn(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={DS.card}>
            {detailLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#63d2ff', fontWeight: 700 }}>Loading audit history…</div>
            ) : !profileData ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9fb6cb' }}>No details found.</div>
            ) : (
              <>
                {activeTab === 'timeline' && (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: 16, color: '#eef4fb' }}>Timeline of Actions &amp; Logins</h4>
                    {profileData.activityTimeline?.length ? (
                      <div style={{ paddingLeft: 8 }}>
                        {profileData.activityTimeline.map(renderTimelineItem)}
                      </div>
                    ) : (
                      <div style={{ color: '#9fb6cb', textAlign: 'center', padding: '2rem 0' }}>No activity recorded for this admin.</div>
                    )}
                  </div>
                )}

                {activeTab === 'permissions' && (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: 16, color: '#eef4fb' }}>Assigned RBAC Permissions</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {profileData.permissions?.length ? (
                        profileData.permissions.map((p: string) => (
                          <span key={p} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(99,210,255,0.12)', color: '#63d2ff', border: '1px solid rgba(99,210,255,0.25)', fontSize: 12, fontWeight: 700 }}>
                            {p}
                          </span>
                        ))
                      ) : (
                        <div style={{ color: '#9fb6cb', padding: '1rem 0' }}>No permissions assigned to this role.</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div style={{ display: 'grid', gap: 20 }}>
                    <div>
                      <h4 style={{ marginTop: 0, color: '#eef4fb' }}>Login / Logout History</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={DS.th}>Action</th>
                              <th style={DS.th}>IP Address</th>
                              <th style={DS.th}>User Agent</th>
                              <th style={DS.th}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(profileData.loginHistory || []), ...(profileData.logoutHistory || [])]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((item: any, idx: number) => (
                                <tr key={item._id || idx}>
                                  <td style={DS.td}><span style={{ color: '#63d2ff', fontWeight: 700 }}>{item.action}</span></td>
                                  <td style={DS.td}>{item.ipAddress || '—'}</td>
                                  <td style={DS.td}><span style={{ fontSize: 11, color: '#9fb6cb' }}>{item.userAgent || '—'}</span></td>
                                  <td style={DS.td}>{fmt(item.createdAt)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {[...(profileData.loginHistory || []), ...(profileData.logoutHistory || [])].length === 0 && (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9fb6cb' }}>No session history recorded.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: '#eef4fb' }}>Force Logout &amp; Block Audit</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={DS.th}>Event</th>
                              <th style={DS.th}>Modified By</th>
                              <th style={DS.th}>Details</th>
                              <th style={DS.th}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(profileData.forceLogoutEvents || []), ...(profileData.blockHistory || []), ...(profileData.unblockHistory || [])]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((item: any, idx: number) => (
                                <tr key={item._id || idx}>
                                  <td style={DS.td}><span style={{ color: '#ff8b8b', fontWeight: 700 }}>{item.action}</span></td>
                                  <td style={DS.td}>{item.actor?.name || 'Admin'}</td>
                                  <td style={DS.td}><span style={{ fontSize: 11, color: '#9fb6cb', fontFamily: 'monospace' }}>{JSON.stringify(item.changes || {})}</span></td>
                                  <td style={DS.td}>{fmt(item.createdAt)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {[...(profileData.forceLogoutEvents || []), ...(profileData.blockHistory || []), ...(profileData.unblockHistory || [])].length === 0 && (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9fb6cb' }}>No security events recorded.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div style={{ display: 'grid', gap: 20 }}>
                    {(['Product Actions', 'Order Actions', 'Inventory Actions', 'Ticket Actions'] as const).map(section => {
                      let data: any[] = [];
                      if (section === 'Product Actions') data = profileData.productActions || [];
                      else if (section === 'Order Actions') data = profileData.orderActions || [];
                      else if (section === 'Inventory Actions') data = profileData.inventoryActions || [];
                      else data = profileData.ticketActions || [];
                      return (
                        <div key={section}>
                          <h4 style={{ marginTop: 0, color: '#eef4fb' }}>{section}</h4>
                          {data.length ? (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={DS.th}>Action</th>
                                    <th style={DS.th}>Entity</th>
                                    <th style={DS.th}>Changes</th>
                                    <th style={DS.th}>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.map((item: any, idx: number) => (
                                    <tr key={item._id || idx}>
                                      <td style={DS.td}><span style={{ color: '#63d2ff', fontWeight: 700 }}>{item.action}</span></td>
                                      <td style={DS.td}>{item.entityName || item.entityId}</td>
                                      <td style={DS.td}><pre style={{ margin: 0, fontSize: 11, color: '#9fb6cb', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{JSON.stringify(item.changes?.after || item.changes || {}, null, 2)}</pre></td>
                                      <td style={DS.td}>{fmt(item.createdAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ color: '#9fb6cb', fontSize: 13, padding: '0.5rem 0' }}>No action logs for this category.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'raw' && (
                  <div>
                    <h4 style={{ marginTop: 0, marginBottom: 16, color: '#eef4fb' }}>Raw Audit History Logs</h4>
                    {profileData.auditLogs?.length ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={DS.th}>Action</th>
                              <th style={DS.th}>Entity Type</th>
                              <th style={DS.th}>Status</th>
                              <th style={DS.th}>Severity</th>
                              <th style={DS.th}>IP</th>
                              <th style={DS.th}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileData.auditLogs.map((log: any, idx: number) => (
                              <tr key={log._id || idx}>
                                <td style={DS.td}><strong style={{ color: '#eef4fb' }}>{log.action}</strong></td>
                                <td style={DS.td}><span style={{ color: '#9fb6cb' }}>{log.entityType}</span></td>
                                <td style={DS.td}><span style={DS.badge(log.status === 'success' ? 'active' : 'blocked')}>{log.status}</span></td>
                                <td style={DS.td}><span style={{ color: log.severity === 'high' || log.severity === 'critical' ? '#ff8b8b' : '#fcc419', fontWeight: 700, fontSize: 11 }}>{log.severity}</span></td>
                                <td style={DS.td}><span style={{ fontSize: 11, color: '#9fb6cb' }}>{log.ipAddress}</span></td>
                                <td style={DS.td}>{fmt(log.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#9fb6cb' }}>No audit logs found.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
