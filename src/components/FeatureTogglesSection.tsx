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
      const result = await featureTogglesApi.getFeatureToggles(
        1,
        50,
        categoryFilter ? { category: categoryFilter } : undefined
      );
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

  useEffect(() => {
    loadFeatures();
  }, [categoryFilter]);

  if (selectedFeature) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setSelectedFeature(null)}
          style={{ marginBottom: '20px' }}
        >
          ← Back
        </button>

        <h2>{selectedFeature.displayName || selectedFeature.name}</h2>
        <p>{selectedFeature.description}</p>

        <div
          style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '20px',
          }}
        >
          <p>
            <strong>Status:</strong>{' '}
            {selectedFeature.isEnabled ? '✓ Enabled' : '✗ Disabled'}
          </p>
          <p>
            <strong>Rollout:</strong> {selectedFeature.rolloutPercentage}%
          </p>
          <p>
            <strong>Category:</strong> {selectedFeature.category}
          </p>
          <p>
            <strong>Visibility:</strong> {selectedFeature.visibility}
          </p>

          {selectedFeature.performance && (
            <>
              <p>
                <strong>Impact Level:</strong> {selectedFeature.performance.impactLevel}
              </p>
              <p>
                <strong>Est. Latency:</strong>{' '}
                {selectedFeature.performance.estimatedLatency}ms
              </p>
            </>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() =>
                handleToggleFeature(selectedFeature.name, selectedFeature.isEnabled)
              }
              style={{
                padding: '8px 16px',
                background: selectedFeature.isEnabled ? '#ff6b6b' : '#51cf66',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {selectedFeature.isEnabled ? 'Disable' : 'Enable'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={rolloutPercentage}
                onChange={(e) => setRolloutPercentage(Number(e.target.value))}
                style={{ width: '150px' }}
              />
              <span>{rolloutPercentage}%</span>

              <button
                onClick={() => handleUpdateRollout(selectedFeature.name)}
                style={{
                  padding: '4px 8px',
                  background: '#228be6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Feature Toggles</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '200px',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Feature Name
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Rollout
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Category
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Visibility
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '1px solid #ddd',
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {features.map((feature) => (
              <tr
                key={feature._id}
                style={{ borderBottom: '1px solid #eee' }}
              >
                <td style={{ padding: '10px' }}>
                  {feature.displayName || feature.name}
                </td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '3px',
                      background: feature.isEnabled ? '#d3f9d8' : '#ffe0e0',
                      color: feature.isEnabled ? '#2f7d32' : '#c00',
                    }}
                  >
                    {feature.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{feature.rolloutPercentage}%</td>
                <td style={{ padding: '10px' }}>{feature.category || 'N/A'}</td>
                <td style={{ padding: '10px' }}>{feature.visibility}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => setSelectedFeature(feature)}
                    style={{
                      padding: '4px 8px',
                      background: '#228be6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Manage
                  </button>
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

