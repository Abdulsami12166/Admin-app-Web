import React, { useEffect, useState } from 'react';
import { shipmentsApi, type Shipment, type TrackingEvent } from '../services/shipments';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

interface ShipmentsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function shipmentBadge(status: string) {
  const map: Record<string, string> = {
    delivered: 'badge-success',
    in_transit: 'badge-info',
    shipped: 'badge-info',
    out_for_delivery: 'badge-warning',
    failed: 'badge-danger',
    pending: 'badge-neutral',
    packed: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function ShipmentsSection({ onError, onSuccess }: ShipmentsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [trackingForm, setTrackingForm] = useState({ status: '', location: '', description: '' });

  const loadShipments = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.allSettled([
        shipmentsApi.getShipments(1, 50, statusFilter || undefined),
        shipmentsApi.getShipmentStats(),
      ]);
      if (res.status === 'fulfilled') {
        setShipments(res.value.data?.shipments || []);
      } else {
        onError(`Failed to load shipments: ${res.reason?.message || res.reason}`);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null);
      } else {
        onError(`Failed to load stats: ${statsRes.reason?.message || statsRes.reason}`);
      }
    } catch (err) {
      onError(`Failed to load shipments: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadShipmentDetail = async (shipmentId: string) => {
    setLoading(true);
    try {
      const [detail, history] = await Promise.all([
        shipmentsApi.getShipmentDetail(shipmentId),
        shipmentsApi.getTrackingHistory(shipmentId),
      ]);
      setSelectedShipment(detail.data?.shipment || null);
      setTrackingHistory(history.data?.trackingEvents || history.data?.events || history.data?.history || []);
    } catch (err) {
      onError(`Failed to load shipment detail: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (shipmentId: string) => {
    if (!trackingForm.status || !trackingForm.location) {
      onError('Status and location are required');
      return;
    }
    try {
      await shipmentsApi.updateTrackingStatus(shipmentId, trackingForm);
      onSuccess('Tracking updated successfully');
      setTrackingForm({ status: '', location: '', description: '' });
      loadShipmentDetail(shipmentId);
    } catch (err) {
      onError(`Failed to update tracking: ${err}`);
    }
  };

  useEffect(() => { loadShipments(); }, [statusFilter]);

  // Real-time socket subscriptions for shipments
  useEffect(() => {
    const unsubCreated = subscribeAdminSocketEvent(socketEvents.DOMAIN.SHIPMENT_CREATED, () => {
      loadShipments();
    });
    const unsubUpdated = subscribeAdminSocketEvent(socketEvents.DOMAIN.SHIPMENT_UPDATED, (payload: any) => {
      // If the updated shipment is currently selected, reload its detail
      if (selectedShipment && selectedShipment._id === payload?.shipmentId) {
        loadShipmentDetail(selectedShipment._id);
      }
      loadShipments();
    });
    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [selectedShipment]);

  if (selectedShipment) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedShipment(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>Shipment · {selectedShipment.trackingNumber}</h2>
          {shipmentBadge(selectedShipment.status)}
        </div>

        <div className="detail-grid">
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shipment Details</h3>
            <p><strong>Carrier</strong> {selectedShipment.carrier || '—'}</p>
            <p><strong>Status</strong> {shipmentBadge(selectedShipment.status)}</p>
            <p><strong>Weight</strong> {selectedShipment.weight ?? '—'} kg</p>
            <p><strong>Cost</strong> ₹{selectedShipment.cost ?? '—'}</p>
            <p><strong>Est. Delivery</strong> {(selectedShipment.estimatedDelivery || selectedShipment.estimatedDeliveryDate) ? new Date(selectedShipment.estimatedDelivery || selectedShipment.estimatedDeliveryDate || '').toLocaleDateString() : '—'}</p>
            {(selectedShipment.actualDelivery || selectedShipment.actualDeliveryDate) && <p><strong>Delivered</strong> {new Date(selectedShipment.actualDelivery || selectedShipment.actualDeliveryDate || '').toLocaleDateString()}</p>}
            {selectedShipment.shippingAddress && (
              <p><strong>Address</strong>{' '}
                {selectedShipment.shippingAddress.address || selectedShipment.shippingAddress.street}, {selectedShipment.shippingAddress.city},{' '}
                {selectedShipment.shippingAddress.state} {selectedShipment.shippingAddress.postalCode || selectedShipment.shippingAddress.zipCode}
              </p>
            )}
          </div>

          <div className="section-box">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Update Tracking</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Status (e.g., in_transit, delivered)"
                value={trackingForm.status}
                onChange={e => setTrackingForm({ ...trackingForm, status: e.target.value })}
              />
              <input
                type="text"
                placeholder="Location (e.g., Mumbai Hub)"
                value={trackingForm.location}
                onChange={e => setTrackingForm({ ...trackingForm, location: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={trackingForm.description}
                onChange={e => setTrackingForm({ ...trackingForm, description: e.target.value })}
              />
              <button onClick={() => handleUpdateTracking(selectedShipment._id)}>
                Update Tracking
              </button>
            </div>
          </div>

          {/* Shipment Items Section */}
          <div className="section-box" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items in Shipment</h3>
            {selectedShipment.order && typeof selectedShipment.order === 'object' && selectedShipment.order.items && selectedShipment.order.items.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {selectedShipment.order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#888' }}>No Img</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#eef4fb' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.82rem', color: '#9fb6cb' }}>Size: {item.selectedSize || 'N/A'} &nbsp;·&nbsp; Qty: {item.quantity}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: '800', color: '#43d17a' }}>₹{item.price * item.quantity}</span>
                      <span style={{ fontSize: '0.78rem', color: '#9fb6cb' }}>₹{item.price} each</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="state-empty" style={{ padding: '1.5rem 0' }}>No products found in this shipment's order.</div>
            )}
          </div>
        </div>

        <section className="panel">
          <h2>Tracking History</h2>
          {trackingHistory.length ? trackingHistory.map((event, idx) => (
            <div key={idx} className={`timeline-entry ${event.status === 'delivered' ? 'tl-success' : event.status === 'failed' ? 'tl-danger' : 'tl-info'}`}>
              <strong>{event.status.replace(/_/g, ' ')} — {event.location}</strong>
              {event.description && <small>{event.description}</small>}
              <small>{new Date(event.timestamp).toLocaleString()}</small>
            </div>
          )) : <div className="state-empty">No tracking events recorded yet.</div>}
          {loading && <div className="state-loading">Loading...</div>}
        </section>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Shipments & Tracking</h2>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', marginBottom: '1.25rem' }}>
          <article className="stat"><strong>{stats.total ?? shipments.length}</strong><span>Total</span></article>
          <article className="stat"><strong style={{ color: '#fcc419' }}>{stats.pending ?? 0}</strong><span>Pending</span></article>
          <article className="stat"><strong style={{ color: '#63d2ff' }}>{stats.inTransit ?? 0}</strong><span>In Transit</span></article>
          <article className="stat"><strong style={{ color: '#43d17a' }}>{stats.delivered ?? 0}</strong><span>Delivered</span></article>
          <article className="stat"><strong style={{ color: '#ff8b8b' }}>{stats.failed ?? 0}</strong><span>Failed</span></article>
        </div>
      )}

      <div className="section-filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 200 }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
        <button className="secondary" onClick={loadShipments}>Refresh</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Order / Products</th>
              <th>Carrier</th>
              <th>Status</th>
              <th>Est. Delivery</th>
              <th>Weight</th>
              <th>Cost</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map(s => (
              <tr key={s._id}>
                <td style={{ fontWeight: 700, color: '#63d2ff' }}>{s.trackingNumber}</td>
                <td>
                  {s.order && typeof s.order === 'object' ? (
                    <div>
                      <div style={{ color: '#eef4fb', fontWeight: 600 }}>
                        {s.order.razorpayOrderId || `Order #${s.order._id?.slice(-8).toUpperCase()}`}
                      </div>
                      {s.order.user?.name && (
                        <div style={{ color: '#63d2ff', fontSize: '0.82rem', fontWeight: 500, margin: '2px 0' }}>
                          Name: {s.order.user.name}
                        </div>
                      )}
                      <div style={{ color: '#9fb6cb', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {s.order.items && s.order.items.length > 0
                          ? s.order.items.map((item: any) => `${item.quantity || 0}x ${item.title || 'item'}`).join(', ')
                          : '—'}
                      </div>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{s.carrier || '—'}</td>
                <td>{shipmentBadge(s.status)}</td>
                <td><small>{(s.estimatedDelivery || s.estimatedDeliveryDate) ? new Date(s.estimatedDelivery || s.estimatedDeliveryDate || '').toLocaleDateString() : '—'}</small></td>
                <td><small>{s.weight ?? '—'} kg</small></td>
                <td><small>₹{s.cost ?? '—'}</small></td>
                <td>
                  <button className="secondary" onClick={() => loadShipmentDetail(s._id)}>Track</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !shipments.length && <div className="state-empty">No shipments found for the selected filter.</div>}
        {loading && <div className="state-loading">Loading shipments...</div>}
      </div>
    </div>
  );
}
