import React, { useEffect, useState } from 'react';

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
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ event: '', description: '', actor: '' });

  const loadTimeline = async (orderId: string) => {
    if (!orderId) return;
    setLoading(true);
    try {
      // Mock data
      setTimelineEvents([
        {
          id: 'evt_1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          event: 'order_created',
          description: 'Order created',
          actor: 'customer',
        },
        {
          id: 'evt_2',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          event: 'payment_processed',
          description: 'Payment processed successfully',
          actor: 'system',
        },
        {
          id: 'evt_3',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          event: 'order_confirmed',
          description: 'Order confirmed',
          actor: 'admin',
        },
        {
          id: 'evt_4',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          event: 'order_shipped',
          description: 'Order shipped with tracking ID',
          actor: 'system',
        },
      ]);
    } catch (err) {
      onError(`Failed to load timeline: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!formData.event || !formData.description) {
      onError('Event and description are required');
      return;
    }

    try {
      const newEvent: TimelineEvent = {
        id: `evt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: formData.event,
        description: formData.description,
        actor: formData.actor || 'admin',
      };
      setTimelineEvents([...timelineEvents, newEvent]);
      setFormData({ event: '', description: '', actor: '' });
      setShowForm(false);
      onSuccess('Event added successfully');
    } catch (err) {
      onError(`Failed to add event: ${err}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Order Timeline</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Enter Order ID"
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          onClick={() => loadTimeline(selectedOrderId)}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          Load Timeline
        </button>
      </div>

      {selectedOrderId && (
        <div>
          <div style={{ marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <strong>Order ID:</strong> {selectedOrderId}
            <br />
            <strong>Total Events:</strong> {timelineEvents.length}
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              marginBottom: '15px',
              padding: '10px 15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            + Add Event
          </button>

          {showForm && (
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Event type (e.g., order_shipped)"
                value={formData.event}
                onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Actor (e.g., admin, system)"
                value={formData.actor}
                onChange={(e) => setFormData({ ...formData, actor: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button
                onClick={handleAddEvent}
                style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', marginRight: '5px' }}
              >
                Add
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              >
                Cancel
              </button>
            </div>
          )}

          <div style={{ position: 'relative', paddingLeft: '40px' }}>
            {timelineEvents.map((event, index) => (
              <div key={event.id} style={{ marginBottom: '20px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '10px',
                    width: '20px',
                    height: '20px',
                    background: '#007bff',
                    borderRadius: '50%',
                    border: '3px solid white',
                  }}
                />
                {index < timelineEvents.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-20px',
                      top: '30px',
                      width: '2px',
                      height: '40px',
                      background: '#ddd',
                    }}
                  />
                )}
                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '5px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{event.event}</strong>
                    <span style={{ color: '#999', fontSize: '12px' }}>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '10px 0 0 0', color: '#555' }}>{event.description}</p>
                  <small style={{ color: '#999' }}>Actor: {event.actor}</small>
                </div>
              </div>
            ))}
          </div>

          {timelineEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No timeline events found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
