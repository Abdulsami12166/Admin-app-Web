import React, { useEffect, useState } from 'react';
import { featureTogglesApi, type FeatureToggle } from '../services/featureToggles';

interface FeatureTogglesProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function FeatureTogglesSection({ onError, onSuccess }: FeatureTogglesProps) {
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureToggle | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rolloutPercentage, setRolloutPercentage] = useState(100);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const result = await featureTogglesApi.getFeatureToggles(1, 50, categoryFilter ? { category: categoryFilter } : undefined);
      setFeatures(result.data?.features || []);
    } catch (err) {
      onError(`Failed to load features: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (name: string, currentState: boolean) => {
    try {
      if (currentState) {
        await featureTogglesApi.disableFeature(name);
      } else {
        await featureTogglesApi.enableFeature(name, rolloutPercentage);
      }
      onSuccess(`Feature ${currentState ? 'disabled' : 'enabled'}`);
      loadFeatures();
    } catch (err) {
      onError(`Failed to toggle feature: ${err}`);
    }
  };

  const handleUpdateRollout = async (name: string) => {
    try {
      await featureTogglesApi.updateRollout(name, rolloutPercentage);
      onSuccess('Rollout percentage updated');
      loadFeatures();
    } catch (err) {
      onError(`Failed to update rollout: ${err}`);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, [categoryFilter]);

  if (selectedFeature) {
    return (\n      <div style={{ padding: '20px' }}>\n        <button onClick={() => setSelectedFeature(null)} style={{ marginBottom: '20px' }}>← Back</button>\n        <h2>{selectedFeature.displayName || selectedFeature.name}</h2>\n        <p>{selectedFeature.description}</p>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>\n          <p><strong>Status:</strong> {selectedFeature.isEnabled ? '✓ Enabled' : '✗ Disabled'}</p>\n          <p><strong>Rollout:</strong> {selectedFeature.rolloutPercentage}%</p>\n          <p><strong>Category:</strong> {selectedFeature.category}</p>\n          <p><strong>Visibility:</strong> {selectedFeature.visibility}</p>\n          {selectedFeature.performance && (\n            <>\n              <p><strong>Impact Level:</strong> {selectedFeature.performance.impactLevel}</p>\n              <p><strong>Est. Latency:</strong> {selectedFeature.performance.estimatedLatency}ms</p>\n            </>\n          )}\n          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>\n            <button\n              onClick={() => handleToggleFeature(selectedFeature.name, selectedFeature.isEnabled)}\n              style={{\n                padding: '8px 16px',\n                background: selectedFeature.isEnabled ? '#ff6b6b' : '#51cf66',\n                color: 'white',\n                border: 'none',\n                borderRadius: '4px',\n                cursor: 'pointer'\n              }}\n            >\n              {selectedFeature.isEnabled ? 'Disable' : 'Enable'}\n            </button>\n            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>\n              <input\n                type=\"range\"\n                min=\"0\"\n                max=\"100\"\n                value={rolloutPercentage}\n                onChange={(e) => setRolloutPercentage(Number(e.target.value))}\n                style={{ width: '150px' }}\n              />\n              <span>{rolloutPercentage}%</span>\n              <button\n                onClick={() => handleUpdateRollout(selectedFeature.name)}\n                style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n              >\n                Update\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n    );\n  }

  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Feature Toggles</h2>\n      <div style={{ marginBottom: '20px' }}>\n        <input\n          type=\"text\"\n          placeholder=\"Filter by category\"\n          value={categoryFilter}\n          onChange={(e) => setCategoryFilter(e.target.value)}\n          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}\n        />\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Feature Name</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rollout</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Visibility</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {features.map((feature) => (\n              <tr key={feature._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{feature.displayName || feature.name}</td>\n                <td style={{ padding: '10px' }}>\n                  <span style={{\n                    padding: '4px 8px',\n                    borderRadius: '3px',\n                    background: feature.isEnabled ? '#d3f9d8' : '#ffe0e0',\n                    color: feature.isEnabled ? '#2f7d32' : '#c00'\n                  }}>\n                    {feature.isEnabled ? 'Enabled' : 'Disabled'}\n                  </span>\n                </td>\n                <td style={{ padding: '10px' }}>{feature.rolloutPercentage}%</td>\n                <td style={{ padding: '10px' }}>{feature.category || 'N/A'}</td>\n                <td style={{ padding: '10px' }}>{feature.visibility}</td>\n                <td style={{ padding: '10px' }}>\n                  <button\n                    onClick={() => setSelectedFeature(feature)}\n                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n                  >\n                    Manage\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
