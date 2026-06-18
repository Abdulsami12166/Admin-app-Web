import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../services/notifications';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

const Backdrop: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <div
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(4, 12, 24, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onClick}
  >
    {children}
  </div>
);

const ModalCard: React.FC<{ children: React.ReactNode; maxWidth?: number }> = ({ children, maxWidth = 520 }) => (
  <div
    style={{
      background: 'linear-gradient(145deg, #0d1f33, #06101d)',
      border: '1px solid #28425f',
      borderRadius: 20,
      padding: '28px 28px 24px',
      maxWidth,
      width: '95%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,210,255,0.07)',
      boxSizing: 'border-box'
    }}
    onClick={e => e.stopPropagation()}
  >
    {children}
  </div>
);

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

  // Modal toggle states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  // Template Form fields
  const [tName, setTName] = useState('');
  const [tDisplayName, setTDisplayName] = useState('');
  const [tCategory, setTCategory] = useState('order');
  const [tTrigger, setTTrigger] = useState('');
  const [tEmailEnabled, setTEmailEnabled] = useState(true);
  const [tSmsEnabled, setTSmsEnabled] = useState(false);
  const [tPushEnabled, setTPushEnabled] = useState(false);
  const [tInAppEnabled, setTInAppEnabled] = useState(false);
  const [tEmailSubject, setTEmailSubject] = useState('');
  const [tEmailBody, setTEmailBody] = useState('');
  const [tSmsBody, setTSmsBody] = useState('');
  const [tPushTitle, setTPushTitle] = useState('');
  const [tPushBody, setTPushBody] = useState('');
  const [tInAppTitle, setTInAppTitle] = useState('');
  const [tInAppMessage, setTInAppMessage] = useState('');
  const [tIsActive, setTIsActive] = useState(true);

  // Mapping Form fields
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mEvent, setMEvent] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mSelectedTemplates, setMSelectedTemplates] = useState<string[]>([]);
  const [mActive, setMActive] = useState(true);

  // Send Direct Form fields
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTargetType, setSendTargetType] = useState<'all' | 'role' | 'user'>('all');
  const [sendUserId, setSendUserId] = useState('');
  const [sendUserRole, setSendUserRole] = useState('customer');
  const [sendChannel, setSendChannel] = useState('push');
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTName('');
    setTDisplayName('');
    setTCategory('order');
    setTTrigger('');
    setTEmailEnabled(true);
    setTSmsEnabled(false);
    setTPushEnabled(false);
    setTInAppEnabled(false);
    setTEmailSubject('');
    setTEmailBody('');
    setTSmsBody('');
    setTPushTitle('');
    setTPushBody('');
    setTInAppTitle('');
    setTInAppMessage('');
    setTIsActive(true);
    setShowTemplateModal(true);
  };

  const openEditTemplate = (tmpl: any) => {
    setEditingTemplate(tmpl);
    setTName(tmpl.name || '');
    setTDisplayName(tmpl.displayName || tmpl.name || '');
    setTCategory(tmpl.category || 'order');
    setTTrigger(tmpl.trigger || '');
    setTEmailEnabled(!!tmpl.channels?.email);
    setTSmsEnabled(!!tmpl.channels?.sms);
    setTPushEnabled(!!tmpl.channels?.push);
    setTInAppEnabled(!!tmpl.channels?.inApp);
    setTEmailSubject(tmpl.emailTemplate?.subject || '');
    setTEmailBody(tmpl.emailTemplate?.body || '');
    setTSmsBody(tmpl.smsTemplate?.body || '');
    setTPushTitle(tmpl.pushTemplate?.title || '');
    setTPushBody(tmpl.pushTemplate?.body || '');
    setTInAppTitle(tmpl.inAppTemplate?.title || '');
    setTInAppMessage(tmpl.inAppTemplate?.message || '');
    setTIsActive(tmpl.isActive !== false);
    setShowTemplateModal(true);
  };

  const openCreateMapping = () => {
    setMEvent('');
    setMDescription('');
    setMSelectedTemplates([]);
    setMActive(true);
    setShowMappingModal(true);
  };

  const openSendModal = () => {
    setSendTargetType('all');
    setSendUserId('');
    setSendUserRole('customer');
    setSendChannel('push');
    setSendTitle('');
    setSendBody('');
    setShowSendModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tTrigger) {
      onError('Template Name and Trigger event are required');
      return;
    }
    const data = {
      name: tName,
      displayName: tDisplayName || tName,
      category: tCategory,
      trigger: tTrigger,
      channels: {
        email: tEmailEnabled,
        sms: tSmsEnabled,
        push: tPushEnabled,
        inApp: tInAppEnabled
      },
      emailTemplate: { subject: tEmailSubject, body: tEmailBody },
      smsTemplate: { body: tSmsBody },
      pushTemplate: { title: tPushTitle, body: tPushBody },
      inAppTemplate: { title: tInAppTitle, message: tInAppMessage },
      isActive: tIsActive
    };

    try {
      if (editingTemplate) {
        await notificationsApi.updateTemplate(editingTemplate.id, data);
        onSuccess('Template updated successfully');
      } else {
        await notificationsApi.createTemplate(data);
        onSuccess('Template created successfully');
      }
      setShowTemplateModal(false);
      loadTemplates();
    } catch (err) {
      onError(`Failed to save template: ${err}`);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mEvent || mSelectedTemplates.length === 0) {
      onError('Event Name and at least one template are required');
      return;
    }
    const data = {
      event: mEvent,
      description: mDescription,
      templates: mSelectedTemplates,
      active: mActive
    };

    try {
      await notificationsApi.createEventMapping(data);
      onSuccess('Event mapping created successfully');
      setShowMappingModal(false);
      loadEventMappings();
    } catch (err) {
      onError(`Failed to save mapping: ${err}`);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendBody) {
      onError('Notification content is required');
      return;
    }
    if (sendTargetType === 'user' && !sendUserId) {
      onError('User ID is required for target type specific user');
      return;
    }
    const data = {
      userId: sendTargetType === 'user' ? sendUserId : undefined,
      role: sendTargetType === 'role' ? sendUserRole : undefined,
      channel: sendChannel,
      title: sendTitle,
      body: sendBody
    };

    try {
      await notificationsApi.sendNotification(data);
      onSuccess('Notification dispatch triggered successfully');
      setShowSendModal(false);
      loadLogs();
    } catch (err) {
      onError(`Failed to send notification: ${err}`);
    }
  };

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
        channels: t.channels,
        emailTemplate: t.emailTemplate,
        smsTemplate: t.smsTemplate,
        pushTemplate: t.pushTemplate,
        inAppTemplate: t.inAppTemplate,
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

  useEffect(() => {
    const unsub = subscribeAdminSocketEvent(socketEvents.DOMAIN.NOTIFICATION_SENT, () => {
      if (activeTab === 'logs') {
        loadLogs();
      }
    });
    return () => unsub?.();
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
            <button onClick={openCreateTemplate}>+ New Template</button>
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
                      <button className="secondary" onClick={() => openEditTemplate(t)}>Edit</button>
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
            <button onClick={openCreateMapping}>+ New Event Mapping</button>
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
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={openSendModal}>⚡ Send Direct Alert</button>
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

      {/* Modal: Create/Edit Template */}
      {showTemplateModal && (
        <Backdrop onClick={() => setShowTemplateModal(false)}>
          <ModalCard maxWidth={600}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#eef4fb', fontSize: '1.2rem', fontWeight: 800 }}>
              {editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'}
            </h3>
            <form onSubmit={handleSaveTemplate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Template Name (Unique Code)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    value={tName}
                    onChange={e => setTName(e.target.value)}
                    placeholder="e.g. order_completed_notification"
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Display Name</label>
                  <input
                    type="text"
                    required
                    value={tDisplayName}
                    onChange={e => setTDisplayName(e.target.value)}
                    placeholder="e.g. Order Completed Email"
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Category</label>
                  <select
                    value={tCategory}
                    onChange={e => setTCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  >
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="delivery">Delivery</option>
                    <option value="return">Return</option>
                    <option value="support">Support</option>
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                    <option value="account">Account</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Trigger Event</label>
                  <input
                    type="text"
                    required
                    value={tTrigger}
                    onChange={e => setTTrigger(e.target.value)}
                    placeholder="e.g. order.completed"
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Channels</label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="checkbox" checked={tEmailEnabled} onChange={e => setTEmailEnabled(e.target.checked)} />
                    Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="checkbox" checked={tSmsEnabled} onChange={e => setTSmsEnabled(e.target.checked)} />
                    SMS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="checkbox" checked={tPushEnabled} onChange={e => setTPushEnabled(e.target.checked)} />
                    Push (FCM)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="checkbox" checked={tInAppEnabled} onChange={e => setTInAppEnabled(e.target.checked)} />
                    In-App
                  </label>
                </div>
              </div>

              {/* Email Fields */}
              {tEmailEnabled && (
                <div style={{ border: '1px solid #28425f', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#081424' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#63d2ff', fontSize: '0.9rem', fontWeight: 700 }}>📧 Email Channel Template</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Subject</label>
                    <input
                      type="text"
                      value={tEmailSubject}
                      onChange={e => setTEmailSubject(e.target.value)}
                      placeholder="e.g. Your order {{orderNumber}} has been placed"
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Body Text</label>
                    <textarea
                      rows={3}
                      value={tEmailBody}
                      onChange={e => setTEmailBody(e.target.value)}
                      placeholder="e.g. Hello {{customerName}}, your order is confirmed..."
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* SMS Fields */}
              {tSmsEnabled && (
                <div style={{ border: '1px solid #28425f', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#081424' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#63d2ff', fontSize: '0.9rem', fontWeight: 700 }}>💬 SMS Channel Template</h4>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>SMS Body</label>
                    <textarea
                      rows={2}
                      value={tSmsBody}
                      onChange={e => setTSmsBody(e.target.value)}
                      placeholder="e.g. Hello {{customerName}}, your order {{orderNumber}} status updated to {{status}}"
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Push Fields */}
              {tPushEnabled && (
                <div style={{ border: '1px solid #28425f', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#081424' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#63d2ff', fontSize: '0.9rem', fontWeight: 700 }}>🔔 Push Notification Channel Template</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Push Title</label>
                    <input
                      type="text"
                      value={tPushTitle}
                      onChange={e => setTPushTitle(e.target.value)}
                      placeholder="e.g. Order Placed"
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Push Body</label>
                    <textarea
                      rows={2}
                      value={tPushBody}
                      onChange={e => setTPushBody(e.target.value)}
                      placeholder="e.g. Hey {{customerName}}, order {{orderNumber}} is processing."
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* In-App Fields */}
              {tInAppEnabled && (
                <div style={{ border: '1px solid #28425f', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', background: '#081424' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#63d2ff', fontSize: '0.9rem', fontWeight: 700 }}>💻 In-App Alert Channel Template</h4>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Alert Title</label>
                    <input
                      type="text"
                      value={tInAppTitle}
                      onChange={e => setTInAppTitle(e.target.value)}
                      placeholder="e.g. New Ticket Received"
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#9fb6cb', fontSize: '0.75rem', fontWeight: 700 }}>Message Body</label>
                    <textarea
                      rows={2}
                      value={tInAppMessage}
                      onChange={e => setTInAppMessage(e.target.value)}
                      placeholder="e.g. Ticket #{{ticketId}} has been created and assigned."
                      style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: '6px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                  <input type="checkbox" checked={tIsActive} onChange={e => setTIsActive(e.target.checked)} />
                  Active Template
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                <button type="submit">Save Template</button>
              </div>
            </form>
          </ModalCard>
        </Backdrop>
      )}

      {/* Modal: Create Event Mapping */}
      {showMappingModal && (
        <Backdrop onClick={() => setShowMappingModal(false)}>
          <ModalCard maxWidth={500}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#eef4fb', fontSize: '1.2rem', fontWeight: 800 }}>
              Create Event Mapping
            </h3>
            <form onSubmit={handleSaveMapping}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Event Name (Trigger Code)</label>
                <input
                  type="text"
                  required
                  value={mEvent}
                  onChange={e => setMEvent(e.target.value)}
                  placeholder="e.g. order.created or inventory.low_stock"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Description</label>
                <input
                  type="text"
                  value={mDescription}
                  onChange={e => setMDescription(e.target.value)}
                  placeholder="e.g. Trigger notifications when a customer completes checkout"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Select Templates to Trigger</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #28425f', borderRadius: '8px', padding: '0.5rem 0.75rem', background: '#08111f' }}>
                  {templates.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer', color: '#eef4fb' }}>
                      <input
                        type="checkbox"
                        checked={mSelectedTemplates.includes(t.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setMSelectedTemplates([...mSelectedTemplates, t.id]);
                          } else {
                            setMSelectedTemplates(mSelectedTemplates.filter(id => id !== t.id));
                          }
                        }}
                      />
                      <small>{t.displayName || t.name}</small>
                    </label>
                  ))}
                  {templates.length === 0 && <span style={{ color: '#9fb6cb', fontSize: '0.8rem' }}>No templates found</span>}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#eef4fb' }}>
                  <input type="checkbox" checked={mActive} onChange={e => setMActive(e.target.checked)} />
                  Active Mapping
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setShowMappingModal(false)}>Cancel</button>
                <button type="submit">Save Mapping</button>
              </div>
            </form>
          </ModalCard>
        </Backdrop>
      )}

      {/* Modal: Send Direct Alert */}
      {showSendModal && (
        <Backdrop onClick={() => setShowSendModal(false)}>
          <ModalCard maxWidth={500}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#eef4fb', fontSize: '1.2rem', fontWeight: 800 }}>
              Send Direct Notification
            </h3>
            <form onSubmit={handleSendNotification}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Target Audience</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="radio" name="target" checked={sendTargetType === 'all'} onChange={() => setSendTargetType('all')} /> All Users
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="radio" name="target" checked={sendTargetType === 'role'} onChange={() => setSendTargetType('role')} /> User Role
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: '#eef4fb' }}>
                    <input type="radio" name="target" checked={sendTargetType === 'user'} onChange={() => setSendTargetType('user')} /> Specific User
                  </label>
                </div>
              </div>

              {sendTargetType === 'user' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>User ID</label>
                  <input
                    type="text"
                    required
                    value={sendUserId}
                    onChange={e => setSendUserId(e.target.value)}
                    placeholder="Enter MongoDB User ID"
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {sendTargetType === 'role' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>User Role</label>
                  <select
                    value={sendUserRole}
                    onChange={e => setSendUserRole(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="support">Support</option>
                    <option value="product-manager">Product Manager</option>
                    <option value="inventory-manager">Inventory Manager</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Notification Channel</label>
                <select
                  value={sendChannel}
                  onChange={e => setSendChannel(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                >
                  <option value="push">Push Notification</option>
                  <option value="inApp">In-App Notification</option>
                  <option value="email">Email Notification</option>
                  <option value="sms">SMS Notification</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Notification Title / Subject</label>
                <input
                  type="text"
                  value={sendTitle}
                  onChange={e => setSendTitle(e.target.value)}
                  placeholder="e.g. Flash Sale Alert! or System Maintenance"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', color: '#9fb6cb', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Message Body (Required)</label>
                <textarea
                  rows={4}
                  required
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  placeholder="Type your notification message content here..."
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #28425f', background: '#08111f', color: '#eef4fb', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary" onClick={() => setShowSendModal(false)}>Cancel</button>
                <button type="submit">⚡ Send Alert</button>
              </div>
            </form>
          </ModalCard>
        </Backdrop>
      )}
    </div>
  );
}
