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
      onError(`Failed to load features: ${String(err)}`);
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
      if (selectedFeature?.name === name) {
        setSelectedFeature(prev => prev ? { ...prev, isEnabled: !currentState } : null);
      }
    } catch (err) {
      onError(`Failed to toggle feature: ${String(err)}`);
    }
  };

  const handleUpdateRollout = async (name: string) => {
    try {
      await featureTogglesApi.updateRollout(name, rolloutPercentage);
      onSuccess('Rollout percentage updated');
      loadFeatures();
    } catch (err) {
      onError(`Failed to update rollout: ${String(err)}`);
    }
  };

  useEffect(() => { loadFeatures(); }, [categoryFilter]);

  if (selectedFeature) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedFeature(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>{selectedFeature.displayName || selectedFeature.name}</h2>
          <span className={`badge ${selectedFeature.isEnabled ? 'badge-success' : 'badge-neutral'}`}>
            {selectedFeature.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {selectedFeature.description && (
          <p style={{ color: '#9fb6cb', marginBottom: '1.25rem' }}>{selectedFeature.description}</p>
        )}

        <div className="detail-grid">
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature Info</h3>
            <p><strong>Status</strong> {selectedFeature.isEnabled ? '✓ Enabled' : '✗ Disabled'}</p>
            <p><strong>Rollout</strong> {selectedFeature.rolloutPercentage}%</p>
            <p><strong>Category</strong> {selectedFeature.category || '—'}</p>
            <p><strong>Visibility</strong> {selectedFeature.visibility || '—'}</p>
            {selectedFeature.performance && (
              <>
                <p><strong>Impact Level</strong> {selectedFeature.performance.impactLevel}</p>
                <p><strong>Est. Latency</strong> {selectedFeature.performance.estimatedLatency}ms</p>
              </>
            )}
          </div>

          <div className="section-box">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Controls</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <button
                onClick={() => handleToggleFeature(selectedFeature.name, selectedFeature.isEnabled)}
                style={{ background: selectedFeature.isEnabled ? '#3a1a1a' : undefined }}
                className={selectedFeature.isEnabled ? 'secondary danger-text' : ''}
              >
                {selectedFeature.isEnabled ? 'Disable Feature' : 'Enable Feature'}
              </button>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9fb6cb', fontWeight: 700, fontSize: '0.85rem' }}>
                  Rollout Percentage: <strong style={{ color: '#63d2ff' }}>{rolloutPercentage}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rolloutPercentage}
                  onChange={e => setRolloutPercentage(Number(e.target.value))}
                  style={{ width: '100%', padding: 0, border: 0, background: 'transparent' }}
                />
                <button className="secondary" onClick={() => handleUpdateRollout(selectedFeature.name)} style={{ marginTop: '0.75rem' }}>
                  Update Rollout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Feature Toggles</h2>

      <div className="section-filters">
        <input
          type="text"
          placeholder="Filter by category…"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <button className="secondary" onClick={loadFeatures} style={{ marginLeft: 'auto' }}>Refresh</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Status</th>
              <th>Rollout</th>
              <th>Category</th>
              <th>Visibility</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {features.map(feature => (
              <tr key={feature._id}>
                <td style={{ fontWeight: 700 }}>{feature.displayName || feature.name}</td>
                <td>
                  <span className={`badge ${feature.isEnabled ? 'badge-success' : 'badge-neutral'}`}>
                    {feature.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, background: '#0a1728', borderRadius: '999px', height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${feature.rolloutPercentage}%`, height: '100%', background: '#63d2ff' }} />
                    </div>
                    <small style={{ minWidth: 32 }}>{feature.rolloutPercentage}%</small>
                  </div>
                </td>
                <td><small>{feature.category || '—'}</small></td>
                <td><small>{feature.visibility || '—'}</small></td>
                <td>
                  <button className="secondary" onClick={() => { setSelectedFeature(feature); setRolloutPercentage(feature.rolloutPercentage); }}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !features.length && <div className="state-empty">No feature toggles found.</div>}
        {loading && <div className="state-loading">Loading features…</div>}
      </div>
    </div>
  );
}
