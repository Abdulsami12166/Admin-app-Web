import React, { useEffect, useState } from 'react';
import { settingsApi, type StoreSetting } from '../services/settings';

interface SettingsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const categories = ['general', 'shipping', 'payment', 'tax', 'notifications', 'security', 'performance'];

export function SettingsSection({ onError, onSuccess }: SettingsProps) {
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await settingsApi.getSettings(1, 100, categoryFilter || undefined);
      setSettings(result.data?.settings || []);
    } catch (err) {
      onError(`Failed to load settings: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string) => {
    try {
      await settingsApi.updateSetting(key, editValue);
      onSuccess('Setting updated');
      setEditingKey(null);
      loadSettings();
    } catch (err) {
      onError(`Failed to update setting: ${err}`);
    }
  };

  useEffect(() => { loadSettings(); }, [categoryFilter]);

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Store Settings</h2>

      <div className="section-filters">
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 200 }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        <button className="secondary" onClick={loadSettings} style={{ marginLeft: 'auto' }}>Refresh</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Category</th>
              <th>Value</th>
              <th>Type</th>
              <th>Editable</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {settings.map(setting => (
              <tr key={setting._id}>
                <td style={{ fontWeight: 700, color: '#63d2ff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{setting.key}</td>
                <td><span className="badge badge-neutral">{setting.category}</span></td>
                <td>
                  {editingKey === setting.key ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      style={{ width: 160 }}
                      autoFocus
                    />
                  ) : (
                    <small style={{ color: '#9fb6cb' }}>{JSON.stringify(setting.value).slice(0, 40)}</small>
                  )}
                </td>
                <td><small>{setting.type}</small></td>
                <td>
                  <span className={`badge ${setting.isEditable ? 'badge-success' : 'badge-neutral'}`}>
                    {setting.isEditable ? '✓ Yes' : '✗ Locked'}
                  </span>
                </td>
                <td>
                  {editingKey === setting.key ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => handleUpdateSetting(setting.key)}>Save</button>
                      <button className="secondary" onClick={() => setEditingKey(null)}>Cancel</button>
                    </div>
                  ) : setting.isEditable ? (
                    <button className="secondary" onClick={() => { setEditingKey(setting.key); setEditValue(String(setting.value)); }}>
                      Edit
                    </button>
                  ) : (
                    <small style={{ color: '#9fb6cb' }}>Locked</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !settings.length && <div className="state-empty">No settings found for the selected category.</div>}
        {loading && <div className="state-loading">Loading settings…</div>}
      </div>
    </div>
  );
}
