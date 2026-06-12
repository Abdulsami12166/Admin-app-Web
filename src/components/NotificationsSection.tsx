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
      setTemplates(data.map((template: any) => ({
        id: template.id || template._id,
        name: template.name,
        displayName: template.displayName,
        category: template.category,
        trigger: template.trigger,
        subject: template.emailTemplate?.subject || template.subject || '',
        body: template.emailTemplate?.body || template.body || '',
        isActive: template.isActive,
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
      setEventMappings(data.map((mapping: any) => ({
        id: mapping.id || mapping._id,
        event: mapping.event,
        description: mapping.description,
        templates: Array.isArray(mapping.templates)
          ? mapping.templates.map((template: any) => ({
              id: template.id || template._id,
              name: template.name,
              displayName: template.displayName,
            }))
          : mapping.templates,
        active: mapping.active,
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
      const [logsResponse, statsResponse] = await Promise.all([
        notificationsApi.getNotificationLogs(1, 50),
        notificationsApi.getNotificationStats(),
      ]);

      const logsData = logsResponse?.data || [];
      setLogs(logsData.map((log: any) => ({
        id: log.id || log._id,
        template: log.template,
        channel: log.channel || log.type || 'unknown',
        status: log.status,
        recipient: log.recipient,
        createdAt: log.createdAt || log.createdAt || log.createdAt,
      })));

      const statsData = statsResponse?.data || {};
      setStats({
        sent: statsData.sent ?? 0,
        failed: statsData.failed ?? 0,
        pending: statsData.pending ?? 0,
      });
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
      setMarketingRules(data.map((rule: any) => ({
        id: rule.id || rule._id,
        name: rule.name,
        trigger: rule.trigger,
        active: rule.active,
        audience: rule.audience,
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Notification Management</h2>
      
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'templates' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'templates' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'mappings' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'mappings' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Event Mappings
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'logs' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'logs' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('marketing')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'marketing' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'marketing' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Marketing Rules
        </button>
      </div>

      {activeTab === 'templates' && (
        <div>
          <button style={{ marginBottom: '15px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            + New Template
          </button>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{template.name}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ background: '#e3f2fd', padding: '4px 8px', borderRadius: '3px' }}>{template.type}</span>
                  </td>
                  <td style={{ padding: '10px' }}>{template.subject}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ background: template.isActive ? '#d4edda' : '#f8d7da', padding: '4px 8px', borderRadius: '3px' }}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                    <button style={{ padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'mappings' && (
        <div>
          <button style={{ marginBottom: '15px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            + New Event Mapping
          </button>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Event</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Templates</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventMappings.map((mapping) => (
                <tr key={mapping.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{mapping.event}</td>
                  <td style={{ padding: '10px' }}>{mapping.templates.join(', ')}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ background: mapping.active ? '#d4edda' : '#f8d7da', padding: '4px 8px', borderRadius: '3px' }}>
                      {mapping.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <strong>Sent:</strong>
              <p style={{ fontSize: '24px', color: '#28a745' }}>{stats.sent}</p>
            </div>
            <div>
              <strong>Failed:</strong>
              <p style={{ fontSize: '24px', color: '#dc3545' }}>{stats.failed}</p>
            </div>
            <div>
              <strong>Pending:</strong>
              <p style={{ fontSize: '24px', color: '#ffc107' }}>{stats.pending}</p>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{log.id}</td>
                  <td style={{ padding: '10px' }}>{log.type}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      background: log.status === 'sent' ? '#d4edda' : log.status === 'failed' ? '#f8d7da' : '#fff3cd',
                      padding: '4px 8px',
                      borderRadius: '3px',
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div>
          <button
            style={{ marginBottom: '15px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            onClick={() => onSuccess('Marketing rule creation is available in the next phase.')}
          >
            + New Marketing Rule
          </button>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Trigger</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Audience</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marketingRules.map((rule) => (
                <tr key={rule.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{rule.name}</td>
                  <td style={{ padding: '10px' }}>{rule.trigger}</td>
                  <td style={{ padding: '10px' }}>
                    {(rule.audience?.segments || []).join(', ') || (rule.audience?.countries || []).join(', ') || (rule.audience?.tags || []).join(', ') || 'All users'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ background: rule.active ? '#d4edda' : '#f8d7da', padding: '4px 8px', borderRadius: '3px' }}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                    <button style={{ padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {marketingRules.length === 0 && (
            <div style={{ padding: '15px', color: '#555' }}>No marketing rules are configured yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
