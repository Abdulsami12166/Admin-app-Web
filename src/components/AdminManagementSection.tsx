import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

interface AdminProps {
  onError: (m: string) => void;
  onSuccess: (m: string) => void;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: '#ffffff',
  padding: 16,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
};

const badgeStyle = (type: string): React.CSSProperties => {
  const isDanger = type === 'blocked' || type === 'failure' || type === 'high' || type === 'critical';
  const isSuccess = type === 'active' || type === 'success' || type === 'low';
  return {
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: isDanger ? '#fee2e2' : isSuccess ? '#dcfce7' : '#f1f5f9',
    color: isDanger ? '#991b1b' : isSuccess ? '#166534' : '#475569',
    display: 'inline-block',
  };
};

const tableHeaderStyle: React.CSSProperties = {
  background: '#f8fafc',
  padding: '10px 12px',
  textAlign: 'left',
  borderBottom: '2px solid #e2e8f0',
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 13,
  color: '#334155',
};

export default function AdminManagementSection({ onError, onSuccess }: AdminProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'permissions' | 'sessions' | 'actions' | 'raw'>('timeline');

  const loadAdminsList = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data?.users || []);
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

      // Subscribe to real-time events for this admin
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

  const formatDate = (val?: string) => (val ? new Date(val).toLocaleString() : 'Never');

  const renderTimelineItem = (item: any) => {
    const isActivity = !!item.action && !item.entityType;
    const date = formatDate(item.createdAt);
    const title = item.action || 'System Action';
    const detail = item.details || item.errorMessage || JSON.stringify(item.changes?.after || item.metadata || {});

    return (
      <div key={item._id} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: isActivity ? '#2563eb' : '#10b981',
            border: '2px solid #fff',
            boxShadow: '0 0 0 2px #e2e8f0'
          }} />
          <div style={{ flex: 1, width: 2, background: '#e2e8f0', marginTop: 4 }} />
        </div>
        <div style={{ flex: 1, paddingBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <strong style={{ fontSize: 14 }}>{title}</strong>
            <span style={{ fontSize: 11, color: '#64748b' }}>{date}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{String(detail)}</p>
          {item.ipAddress && <small style={{ color: '#94a3b8' }}>IP: {item.ipAddress}</small>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Admin Management</h2>
        {selectedId && (
          <button
            onClick={() => setSelectedId(null)}
            style={{
              padding: '6px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              background: '#f8fafc',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ← Back to List
          </button>
        )}
      </div>

      {!selectedId ? (
        <div style={cardStyle}>
          {loading ? (
            <div>Loading admins list...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={tableHeaderStyle}>Admin Name</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Role</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Last Login</th>
                  <th style={tableHeaderStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tableCellStyle}><strong>{u.name}</strong></td>
                    <td style={tableCellStyle}>{u.email}</td>
                    <td style={tableCellStyle}><span style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td style={tableCellStyle}>
                      <span style={badgeStyle(u.blocked ? 'blocked' : 'active')}>
                        {u.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{formatDate(u.lastLoginAt)}</td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => setSelectedId(u._id)}
                        style={{
                          padding: '4px 10px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 0,
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Profile Details Card */}
          <div style={{ ...cardStyle, width: 320, flexShrink: 0 }}>
            {detailLoading || !profileData ? (
              <div>Loading profile...</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: '#e2e8f0', margin: '0 auto 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 700, color: '#64748b'
                  }}>
                    {profileData.admin?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{profileData.admin?.name}</h3>
                  <span style={badgeStyle(profileData.admin?.blocked ? 'blocked' : 'active')}>
                    {profileData.admin?.blocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: 0 }} />

                <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                  <div><strong>Email:</strong> {profileData.admin?.email}</div>
                  <div><strong>Phone:</strong> {profileData.admin?.phone || 'Not recorded'}</div>
                  <div><strong>Assigned Role:</strong> <span style={{ textTransform: 'capitalize' }}>{profileData.admin?.role}</span></div>
                  <div><strong>Last Login:</strong> {formatDate(profileData.admin?.lastLoginAt)}</div>
                  <div><strong>Account Created:</strong> {formatDate(profileData.admin?.createdAt)}</div>
                </div>

                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  {profileData.admin?.blocked ? (
                    <button
                      onClick={() => handleUnblock(profileData.admin?._id)}
                      style={{ padding: '8px', background: '#16a34a', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Unblock Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(profileData.admin?._id)}
                      style={{ padding: '8px', background: '#dc2626', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Block Admin
                    </button>
                  )}
                  <button
                    onClick={() => handleForceLogout(profileData.admin?._id)}
                    style={{ padding: '8px', background: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Force Logout Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audit History Tabs */}
          <div style={{ flex: 1, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', gap: 16 }}>
              {[
                { key: 'timeline', label: 'Activity Timeline' },
                { key: 'permissions', label: 'Assigned Permissions' },
                { key: 'sessions', label: 'Access & Session Logs' },
                { key: 'actions', label: 'Actions by Category' },
                { key: 'raw', label: 'Raw Audit Logs' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    padding: '8px 4px 12px',
                    border: 0,
                    borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                    background: 'none',
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    color: activeTab === tab.key ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={cardStyle}>
              {detailLoading ? (
                <div>Loading audit history...</div>
              ) : !profileData ? (
                <div>No details found.</div>
              ) : (
                <div>
                  {activeTab === 'timeline' && (
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: 16 }}>Timeline of actions & logins</h4>
                      {profileData.activityTimeline?.length ? (
                        <div style={{ paddingLeft: 8 }}>
                          {profileData.activityTimeline.map(renderTimelineItem)}
                        </div>
                      ) : (
                        <div style={{ color: '#64748b' }}>No activity recorded for this admin.</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'permissions' && (
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: 16 }}>Dynamic RBAC Permissions List</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {profileData.permissions?.length ? (
                          profileData.permissions.map((p: string) => (
                            <span key={p} style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              background: '#eff6ff',
                              color: '#1e40af',
                              border: '1px solid #bfdbfe',
                              fontSize: 13,
                              fontWeight: 500
                            }}>
                              {p}
                            </span>
                          ))
                        ) : (
                          <div style={{ color: '#64748b' }}>No permissions assigned to this role.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'sessions' && (
                    <div style={{ display: 'grid', gap: 20 }}>
                      <div>
                        <h4 style={{ marginTop: 0 }}>Login / Logout History</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={tableHeaderStyle}>Action</th>
                              <th style={tableHeaderStyle}>IP Address</th>
                              <th style={tableHeaderStyle}>User Agent</th>
                              <th style={tableHeaderStyle}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(profileData.loginHistory || []), ...(profileData.logoutHistory || [])]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map(item => (
                                <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={tableCellStyle}><span style={badgeStyle(item.action)}>{item.action}</span></td>
                                  <td style={tableCellStyle}>{item.ipAddress || 'unknown'}</td>
                                  <td style={tableCellStyle}><span style={{ fontSize: 11, color: '#64748b' }}>{item.userAgent || 'unknown'}</span></td>
                                  <td style={tableCellStyle}>{formatDate(item.createdAt)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h4>Force Logout & Status Audit</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={tableHeaderStyle}>Event</th>
                              <th style={tableHeaderStyle}>Modified By</th>
                              <th style={tableHeaderStyle}>Details</th>
                              <th style={tableHeaderStyle}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...(profileData.forceLogoutEvents || []), ...(profileData.blockHistory || []), ...(profileData.unblockHistory || [])]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map(item => (
                                <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={tableCellStyle}><span style={badgeStyle(item.action)}>{item.action}</span></td>
                                  <td style={tableCellStyle}>{item.actor?.name || 'Admin'}</td>
                                  <td style={tableCellStyle}>{JSON.stringify(item.changes || {})}</td>
                                  <td style={tableCellStyle}>{formatDate(item.createdAt)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'actions' && (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {['Product Actions', 'Order Actions', 'Inventory Actions', 'Ticket Actions'].map(section => {
                        let data = [];
                        if (section.startsWith('Product')) data = profileData.productActions || [];
                        else if (section.startsWith('Order')) data = profileData.orderActions || [];
                        else if (section.startsWith('Inventory')) data = profileData.inventoryActions || [];
                        else data = profileData.ticketActions || [];

                        return (
                          <div key={section}>
                            <h4 style={{ marginTop: 0 }}>{section}</h4>
                            {data.length ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc' }}>
                                    <th style={tableHeaderStyle}>Action</th>
                                    <th style={tableHeaderStyle}>Entity ID/Name</th>
                                    <th style={tableHeaderStyle}>Changes</th>
                                    <th style={tableHeaderStyle}>Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.map((item: any) => (
                                    <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={tableCellStyle}><span style={badgeStyle(item.action)}>{item.action}</span></td>
                                      <td style={tableCellStyle}>{item.entityName || item.entityId}</td>
                                      <td style={tableCellStyle}>
                                        <pre style={{ margin: 0, fontSize: 11, background: '#f8fafc', padding: 4, borderRadius: 4 }}>
                                          {JSON.stringify(item.changes?.after || item.changes || {}, null, 2)}
                                        </pre>
                                      </td>
                                      <td style={tableCellStyle}>{formatDate(item.createdAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ color: '#64748b', fontSize: 13 }}>No action logs for this category.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'raw' && (
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: 16 }}>Raw Audit History Logs (Last 100 Entries)</h4>
                      {profileData.auditLogs?.length ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={tableHeaderStyle}>Action</th>
                              <th style={tableHeaderStyle}>Entity Type</th>
                              <th style={tableHeaderStyle}>Status</th>
                              <th style={tableHeaderStyle}>Severity</th>
                              <th style={tableHeaderStyle}>IP</th>
                              <th style={tableHeaderStyle}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileData.auditLogs.map((log: any) => (
                              <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={tableCellStyle}><strong>{log.action}</strong></td>
                                <td style={tableCellStyle}>{log.entityType}</td>
                                <td style={tableCellStyle}><span style={badgeStyle(log.status)}>{log.status}</span></td>
                                <td style={tableCellStyle}><span style={badgeStyle(log.severity)}>{log.severity}</span></td>
                                <td style={tableCellStyle}>{log.ipAddress}</td>
                                <td style={tableCellStyle}>{formatDate(log.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: '#64748b' }}>No audit logs found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
