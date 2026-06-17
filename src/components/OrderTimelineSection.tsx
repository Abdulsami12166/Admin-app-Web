import React, { useState } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  description: string;
  actor: string;
}

interface OrderTimelineSectionProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function OrderTimelineSection({ onError, onSuccess }: OrderTimelineSectionProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [inputId, setInputId] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ event: '', description: '', actor: '' });

  const loadTimeline = async (orderId: string) => {
    if (!orderId.trim()) return;
    setLoading(true);
    setSelectedOrderId(orderId.trim());
    try {
      const resp = await (await import('../services/orderTimeline')).orderTimelineApi.getOrderTimeline(orderId.trim());
      const data = resp?.data;
      const events = data?.events || data?.timeline?.events || [];
      setTimelineEvents(events);
    } catch (err) {
      onError(`Failed to load timeline: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!formData.event || !formData.description) {
      onError('Event type and description are required');
      return;
    }
    try {
      const { orderTimelineApi } = await import('../services/orderTimeline');
      await orderTimelineApi.addTimelineEvent(selectedOrderId, {
        event: formData.event,
        description: formData.description,
        actor: formData.actor || 'admin',
      });
      setFormData({ event: '', description: '', actor: '' });
      setShowForm(false);
      onSuccess('Event added successfully');
      await loadTimeline(selectedOrderId);
    } catch (err) {
      onError(`Failed to add event: ${String(err)}`);
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Order Timeline</h2>

      <div className="section-filters">
        <input
          type="text"
          placeholder="Enter Order ID…"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadTimeline(inputId)}
          style={{ flex: 1 }}
        />
        <button onClick={() => loadTimeline(inputId)} disabled={loading || !inputId.trim()}>
          {loading ? 'Loading…' : 'Load Timeline'}
        </button>
      </div>

      {selectedOrderId && (
        <>
          <div className="section-box" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#63d2ff' }}>Order ID:</strong>{' '}
              <span style={{ fontFamily: 'monospace', color: '#dbe8f5' }}>{selectedOrderId}</span>
              <small style={{ display: 'block', color: '#9fb6cb', marginTop: '0.3rem' }}>
                {timelineEvents.length} event(s) found
              </small>
            </div>
            <button className="secondary" onClick={() => { setShowForm(v => !v); }}>
              {showForm ? 'Cancel' : '+ Add Event'}
            </button>
          </div>

          {showForm && (
            <div className="section-box" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Add Timeline Event</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Event type (e.g. order_shipped)"
                  value={formData.event}
                  onChange={e => setFormData({ ...formData, event: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Actor (default: admin)"
                  value={formData.actor}
                  onChange={e => setFormData({ ...formData, actor: e.target.value })}
                />
                <div className="action-bar">
                  <button onClick={handleAddEvent}>Add Event</button>
                  <button className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <section className="panel">
            <h2>Timeline</h2>
            {timelineEvents.length ? (
              <div style={{ paddingLeft: '1rem' }}>
                {timelineEvents.map((event, index) => (
                  <div key={event.id || index} className="timeline-entry tl-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <strong style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                        {event.event.replace(/_/g, ' ')}
                      </strong>
                      <small style={{ color: '#9fb6cb', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </small>
                    </div>
                    <span style={{ color: '#dbe8f5', display: 'block', marginTop: '0.35rem' }}>{event.description}</span>
                    <small>Actor: {event.actor}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="state-empty">No timeline events found for this order.</div>
            )}
            {loading && <div className="state-loading">Loading timeline…</div>}
          </section>
        </>
      )}

      {!selectedOrderId && (
        <div className="state-empty" style={{ marginTop: '2rem' }}>
          Enter an Order ID above to view its timeline.
        </div>
      )}
    </div>
  );
}
