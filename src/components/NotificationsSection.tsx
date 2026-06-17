import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../services/notifications';

interface NotificationTemplate {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  trigger?: string;
  subject?: string;
  body?: string;
  isActive: boolean;
}

interface EventMapping {
  id: string;
  event: string;
  description?: string;
  templates: Array<{ id?: string; name?: string; displayName?: string }> | string[];
  active: boolean;
}

interface NotificationLog {
  id: string;
  template?: { id?: string; name?: string; category?: string; trigger?: string };
  channel: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced' | 'unsubscribed';
  recipient?: { email?: string; phone?: string };
  createdAt: string;
}

interface MarketingRule {
  id: string;
  name: string;
  trigger: string;
  active: boolean;
  audience?: { segments?: string[]; countries?: string[]; tags?: string[] };
}

interface NotificationsSectionProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function logStatusBadge(status: string) {
  const map: Record<string, string> = {
    sent: 'badge-success',
    delivered: 'badge-success',
    failed: 'badge-danger',
    bounced: 'badge-danger',
    pending: 'badge-warning',
    unsubscribed: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

export function NotificationsSection({ onError, onSuccess }: NotificationsSectionProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'mappings' | 'logs' | 'marketing'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [eventMappings, setEventMappings] = useState<EventMapping[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [marketingRules, setMarketingRules] = useState<MarketingRule[]>([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getTemplates();
      const data = response?.data || [];
      setTemplates(data.map((t: any) => ({
        id: t.id || t._id,
        name: t.name,
        displayName: t.displayName,
        category: t.category,
        trigger: t.trigger,
        subject: t.emailTemplate?.subject || t.subject || '',
        body: t.emailTemplate?.body || t.body || '',
        isActive: t.isActive,
      })));
    } catch (err) {
      onError(`Failed to load templates: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEventMappings = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getEventMappings();
      const data = response?.data || [];
      setEventMappings(data.map((m: any) => ({
        id: m.id || m._id,
        event: m.event,
        description: m.description,
        templates: Array.isArray(m.templates)
          ? m.templates.map((t: any) => ({ id: t.id || t._id, name: t.name, displayName: t.displayName }))
          : m.templates,
        active: m.active,
      })));
    } catch (err) {
      onError(`Failed to load event mappings: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        notificationsApi.getNotificationLogs(1, 50),
        notificationsApi.getNotificationStats(),
      ]);
      const logsData = logsRes?.data || [];
      setLogs(logsData.map((l: any) => ({
        id: l.id || l._id,
        template: l.template,
        channel: l.channel || l.type || 'unknown',
        status: l.status,
        recipient: l.recipient,
        createdAt: l.createdAt,
      })));
      const statsData = statsRes?.data || {};
      setStats({ sent: statsData.sent ?? 0, failed: statsData.failed ?? 0, pending: statsData.pending ?? 0 });
    } catch (err) {
      onError(`Failed to load logs: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketingRules = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getMarketingRules();
      const data = response?.data || [];
      setMarketingRules(data.map((r: any) => ({
        id: r.id || r._id,
        name: r.name,
        trigger: r.trigger,
        active: r.active,
        audience: r.audience,
      })));
    } catch (err) {
      onError(`Failed to load marketing rules: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') loadTemplates();
    else if (activeTab === 'mappings') loadEventMappings();
    else if (activeTab === 'logs') loadLogs();
    else if (activeTab === 'marketing') loadMarketingRules();
  }, [activeTab]);

  const tabs = [
    { key: 'templates' as const, label: 'Templates' },
    { key: 'mappings' as const, label: 'Event Mappings' },
    { key: 'logs' as const, label: 'Logs' },
    { key: 'marketing' as const, label: 'Marketing Rules' },
  ];

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Notification Management</h2>

      <div className="section-tabs">
        {tabs.map(t => (
          <button key={t.key} className={activeTab === t.key ? 'active' : ''} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={() => onSuccess('Template creation form coming soon.')}>+ New Template</button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700 }}>{t.displayName || t.name}</td>
                    <td><span className="badge badge-info">{t.category || t.trigger || '—'}</span></td>
                    <td><small>{t.subject || '—'}</small></td>
                    <td>
                      <span className={`badge ${t.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="secondary" onClick={() => onSuccess('Edit template form coming soon.')}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !templates.length && <div className="state-empty">No notification templates configured.</div>}
            {loading && <div className="state-loading">Loading templates…</div>}
          </div>
        </div>
      )}

      {activeTab === 'mappings' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={() => onSuccess('Event mapping form coming soon.')}>+ New Event Mapping</button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Description</th>
                  <th>Templates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {eventMappings.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: '#63d2ff' }}>{m.event}</td>
                    <td><small>{m.description || '—'}</small></td>
                    <td>
                      <small>
                        {Array.isArray(m.templates)
                          ? m.templates.map((t: any) => (typeof t === 'string' ? t : t.displayName || t.name)).join(', ')
                          : String(m.templates)}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${m.active ? 'badge-success' : 'badge-neutral'}`}>
                        {m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !eventMappings.length && <div className="state-empty">No event mappings configured.</div>}
            {loading && <div className="state-loading">Loading mappings…</div>}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <div className="stats-grid small" style={{ marginBottom: '1.25rem', gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
            <article className="stat"><strong style={{ color: '#43d17a' }}>{stats.sent}</strong><span>Sent</span></article>
            <article className="stat"><strong style={{ color: '#ff8b8b' }}>{stats.failed}</strong><span>Failed</span></article>
            <article className="stat"><strong style={{ color: '#fcc419' }}>{stats.pending}</strong><span>Pending</span></article>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td><small style={{ fontFamily: 'monospace', color: '#9fb6cb' }}>{log.id?.slice(-10)}</small></td>
                    <td><span className="badge badge-neutral">{log.channel}</span></td>
                    <td><small>{log.recipient?.email || log.recipient?.phone || '—'}</small></td>
                    <td>{logStatusBadge(log.status)}</td>
                    <td><small>{new Date(log.createdAt).toLocaleString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !logs.length && <div className="state-empty">No notification logs found.</div>}
            {loading && <div className="state-loading">Loading logs…</div>}
          </div>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={() => onSuccess('Marketing rule creation is available in the next phase.')}>+ New Marketing Rule</button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trigger</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {marketingRules.map(rule => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: 700 }}>{rule.name}</td>
                    <td><span className="badge badge-info">{rule.trigger}</span></td>
                    <td>
                      <small>
                        {(rule.audience?.segments || []).join(', ')
                          || (rule.audience?.countries || []).join(', ')
                          || (rule.audience?.tags || []).join(', ')
                          || 'All users'}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${rule.active ? 'badge-success' : 'badge-neutral'}`}>
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="secondary" onClick={() => onSuccess('Edit form coming soon.')}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !marketingRules.length && <div className="state-empty">No marketing rules configured yet.</div>}
            {loading && <div className="state-loading">Loading marketing rules…</div>}
          </div>
        </div>
      )}
    </div>
  );
}
