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

  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Store Settings</h2>\n      <div style={{ marginBottom: '20px' }}>\n        <select\n          value={categoryFilter}\n          onChange={(e) => setCategoryFilter(e.target.value)}\n          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n        >\n          <option value=\"\">All Categories</option>\n          {categories.map((cat) => (\n            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>\n          ))}\n        </select>\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Key</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Value</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Editable</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {settings.map((setting) => (\n              <tr key={setting._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{setting.key}</td>\n                <td style={{ padding: '10px' }}>{setting.category}</td>\n                <td style={{ padding: '10px' }}>\n                  {editingKey === setting.key ? (\n                    <input\n                      type=\"text\"\n                      value={editValue}\n                      onChange={(e) => setEditValue(e.target.value)}\n                      style={{ padding: '4px', border: '1px solid #ddd', borderRadius: '3px', width: '100px' }}\n                    />\n                  ) : (\n                    <small>{JSON.stringify(setting.value).slice(0, 30)}...</small>\n                  )}\n                </td>\n                <td style={{ padding: '10px' }}>{setting.type}</td>\n                <td style={{ padding: '10px' }}>{setting.isEditable ? '✓' : '✗'}</td>\n                <td style={{ padding: '10px' }}>\n                  {editingKey === setting.key ? (\n                    <>\n                      <button onClick={() => handleUpdateSetting(setting.key)} style={{ padding: '4px 8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Save</button>\n                      <button onClick={() => setEditingKey(null)} style={{ padding: '4px 8px', background: '#999', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>\n                    </>\n                  ) : setting.isEditable ? (\n                    <button onClick={() => { setEditingKey(setting.key); setEditValue(String(setting.value)); }} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Edit</button>\n                  ) : (\n                    <span style={{ color: '#999' }}>Locked</span>\n                  )}\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
