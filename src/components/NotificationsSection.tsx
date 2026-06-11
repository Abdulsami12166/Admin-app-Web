import React, { useEffect, useState } from 'react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject: string;
  body: string;
  isActive: boolean;
}

interface EventMapping {
  id: string;
  event: string;
  templates: string[];
  active: boolean;
}

interface NotificationLog {
  id: string;
  templateId: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
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
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Mock data
      setTemplates([
        { id: '1', name: 'Order Confirmation', type: 'email', subject: 'Order Confirmed', body: 'Your order has been confirmed', isActive: true },
        { id: '2', name: 'Shipment Notification', type: 'sms', subject: '', body: 'Your package has been shipped', isActive: true },
      ]);
    } catch (err) {
      onError(`Failed to load templates: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEventMappings = async () => {
    setLoading(true);
    try {
      setEventMappings([
        { id: '1', event: 'order.created', templates: ['1'], active: true },
        { id: '2', event: 'order.shipped', templates: ['2'], active: true },
      ]);
    } catch (err) {
      onError(`Failed to load event mappings: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      setLogs([
        { id: '1', templateId: '1', type: 'email', status: 'sent', createdAt: new Date().toISOString() },
        { id: '2', templateId: '2', type: 'sms', status: 'pending', createdAt: new Date().toISOString() },
      ]);
      setStats({ sent: 150, failed: 5, pending: 8 });
    } catch (err) {
      onError(`Failed to load logs: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'templates') loadTemplates();
    else if (activeTab === 'mappings') loadEventMappings();
    else if (activeTab === 'logs') loadLogs();
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
          <button style={{ marginBottom: '15px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            + New Marketing Rule
          </button>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <p>Marketing rules allow you to send targeted notifications based on user behavior and preferences.</p>
            <p style={{ marginTop: '10px' }}>Supported triggers: signup, purchase, abandoned_cart, high_spender, inactive_user</p>
          </div>
        </div>
      )}
    </div>
  );
}
