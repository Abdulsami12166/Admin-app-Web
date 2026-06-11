import React, { useEffect, useState } from 'react';
import { shipmentsApi, type Shipment, type TrackingEvent } from '../services/shipments';

interface ShipmentsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function ShipmentsSection({ onError, onSuccess }: ShipmentsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [trackingForm, setTrackingForm] = useState({ status: '', location: '', description: '' });

  const loadShipments = async () => {
    setLoading(true);
    try {
      const result = await shipmentsApi.getShipments(1, 50, statusFilter || undefined);
      setShipments(result.data?.shipments || []);
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
      setTrackingHistory(history.data?.trackingEvents || []);
    } catch (err) {
      onError(`Failed to load shipment detail: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (shipmentId: string) => {
    if (!trackingForm.status || !trackingForm.location) {
      onError('Please fill status and location');
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

  useEffect(() => {
    loadShipments();
  }, [statusFilter]);

  if (selectedShipment) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedShipment(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>Shipment: {selectedShipment.trackingNumber}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Shipment Details</h3>
            <p><strong>Carrier:</strong> {selectedShipment.carrier}</p>
            <p><strong>Status:</strong> {selectedShipment.status}</p>
            <p><strong>Weight:</strong> {selectedShipment.weight} kg</p>
            <p><strong>Cost:</strong> ${selectedShipment.cost}</p>
            <p><strong>Est. Delivery:</strong> {selectedShipment.estimatedDelivery ? new Date(selectedShipment.estimatedDelivery).toLocaleDateString() : 'N/A'}</p>
            {selectedShipment.actualDelivery && <p><strong>Actual Delivery:</strong> {new Date(selectedShipment.actualDelivery).toLocaleDateString()}</p>}
            <h4>Address</h4>
            <p>{selectedShipment.shippingAddress.street}<br />{selectedShipment.shippingAddress.city}, {selectedShipment.shippingAddress.state} {selectedShipment.shippingAddress.zipCode}</p>
          </div>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Update Tracking</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type=\"text\"
                placeholder=\"Status (e.g., in_transit)\"
                value={trackingForm.status}
                onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type=\"text\"
                placeholder=\"Location\"
                value={trackingForm.location}
                onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type=\"text\"
                placeholder=\"Description\"
                value={trackingForm.description}
                onChange={(e) => setTrackingForm({ ...trackingForm, description: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button
                onClick={() => handleUpdateTracking(selectedShipment._id)}
                style={{ padding: '8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Update Tracking
              </button>
            </div>
          </div>
        </div>
        <h3>Tracking History</h3>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
          {trackingHistory.length > 0 ? (
            trackingHistory.map((event, idx) => (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '3px' }}>
                <strong>{event.status}</strong> @ {event.location}
                <br />
                <small>{event.description}</small>
                <br />
                <small>{new Date(event.timestamp).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No tracking events yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Shipments & Tracking</h2>
      <div style={{ marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value=\"\">All Statuses</option>
          <option value=\"pending\">Pending</option>
          <option value=\"packed\">Packed</option>
          <option value=\"in_transit\">In Transit</option>
          <option value=\"out_for_delivery\">Out for Delivery</option>
          <option value=\"delivered\">Delivered</option>
          <option value=\"failed\">Failed</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tracking #</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Carrier</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Est. Delivery</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{shipment.trackingNumber}</td>
                <td style={{ padding: '10px' }}>{shipment.carrier}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '3px',
                    background: shipment.status === 'delivered' ? '#e7f5ff' : '#fff3e0',
                    color: shipment.status === 'delivered' ? '#0c5aa0' : '#e65100'
                  }}>
                    {shipment.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A'}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => loadShipmentDetail(shipment._id)}
                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Track
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
