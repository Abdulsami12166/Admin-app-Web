import React, { useEffect, useState } from 'react';
import { settingsApi, type StoreSetting } from '../services/settings';

interface SettingsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

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

  useEffect(() => {
    loadSettings();
  }, [categoryFilter]);

  const categories = ['general', 'shipping', 'payment', 'tax', 'notifications', 'security', 'performance'];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Store Settings</h2>
      <div style={{ marginBottom: '20px' }}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value=\"\">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Key</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Value</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Editable</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting) => (
              <tr key={setting._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{setting.key}</td>
                <td style={{ padding: '10px' }}>{setting.category}</td>
                <td style={{ padding: '10px' }}>
                  {editingKey === setting.key ? (
                    <input
                      type=\"text\"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ padding: '4px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}
                    />
                  ) : (
                    <small>{JSON.stringify(setting.value).slice(0, 30)}...</small>
                  )}
                </td>
                <td style={{ padding: '10px' }}>{setting.type}</td>
                <td style={{ padding: '10px' }}>{setting.isEditable ? '✓' : '✗'}</td>
                <td style={{ padding: '10px' }}>
                  {editingKey === setting.key ? (
                    <>
                      <button onClick={() => handleUpdateSetting(setting.key)} style={{ padding: '4px 8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Save</button>
                      <button onClick={() => setEditingKey(null)} style={{ padding: '4px 8px', background: '#999', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                    </>
                  ) : setting.isEditable ? (
                    <button onClick={() => { setEditingKey(setting.key); setEditValue(String(setting.value)); }} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Edit</button>
                  ) : (
                    <span style={{ color: '#999' }}>Locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p>Loading...</p>}
    </div>
  );
}
