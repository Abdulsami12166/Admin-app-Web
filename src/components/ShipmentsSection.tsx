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
      <div style={{ padding: '20px' }}>\n        <button onClick={() => setSelectedShipment(null)} style={{ marginBottom: '20px' }}>← Back</button>\n        <h2>Shipment: {selectedShipment.trackingNumber}</h2>\n        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>\n          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n            <h3>Shipment Details</h3>\n            <p><strong>Carrier:</strong> {selectedShipment.carrier}</p>\n            <p><strong>Status:</strong> {selectedShipment.status}</p>\n            <p><strong>Weight:</strong> {selectedShipment.weight} kg</p>\n            <p><strong>Cost:</strong> ${selectedShipment.cost}</p>\n            <p><strong>Est. Delivery:</strong> {selectedShipment.estimatedDelivery ? new Date(selectedShipment.estimatedDelivery).toLocaleDateString() : 'N/A'}</p>\n            {selectedShipment.actualDelivery && <p><strong>Actual Delivery:</strong> {new Date(selectedShipment.actualDelivery).toLocaleDateString()}</p>}\n            <h4>Address</h4>\n            <p>{selectedShipment.shippingAddress.street}<br />{selectedShipment.shippingAddress.city}, {selectedShipment.shippingAddress.state} {selectedShipment.shippingAddress.zipCode}</p>\n          </div>\n          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n            <h3>Update Tracking</h3>\n            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>\n              <input\n                type=\"text\"\n                placeholder=\"Status (e.g., in_transit)\"\n                value={trackingForm.status}\n                onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <input\n                type=\"text\"\n                placeholder=\"Location\"\n                value={trackingForm.location}\n                onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <input\n                type=\"text\"\n                placeholder=\"Description\"\n                value={trackingForm.description}\n                onChange={(e) => setTrackingForm({ ...trackingForm, description: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <button\n                onClick={() => handleUpdateTracking(selectedShipment._id)}\n                style={{ padding: '8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}\n              >\n                Update Tracking\n              </button>\n            </div>\n          </div>\n        </div>\n        <h3>Tracking History</h3>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>\n          {trackingHistory.length > 0 ? (\n            trackingHistory.map((event, idx) => (\n              <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '3px' }}>\n                <strong>{event.status}</strong> @ {event.location}\n                <br />\n                <small>{event.description}</small>\n                <br />\n                <small>{new Date(event.timestamp).toLocaleString()}</small>\n              </div>\n            ))\n          ) : (\n            <p>No tracking events yet</p>\n          )}\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Shipments & Tracking</h2>\n      <div style={{ marginBottom: '20px' }}>\n        <select\n          value={statusFilter}\n          onChange={(e) => setStatusFilter(e.target.value)}\n          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n        >\n          <option value=\"\">All Statuses</option>\n          <option value=\"pending\">Pending</option>\n          <option value=\"packed\">Packed</option>\n          <option value=\"in_transit\">In Transit</option>\n          <option value=\"out_for_delivery\">Out for Delivery</option>\n          <option value=\"delivered\">Delivered</option>\n          <option value=\"failed\">Failed</option>\n        </select>\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tracking #</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Carrier</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Est. Delivery</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {shipments.map((shipment) => (\n              <tr key={shipment._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{shipment.trackingNumber}</td>\n                <td style={{ padding: '10px' }}>{shipment.carrier}</td>\n                <td style={{ padding: '10px' }}>\n                  <span style={{\n                    padding: '4px 8px',\n                    borderRadius: '3px',\n                    background: shipment.status === 'delivered' ? '#e7f5ff' : '#fff3e0',\n                    color: shipment.status === 'delivered' ? '#0c5aa0' : '#e65100'\n                  }}>\n                    {shipment.status}\n                  </span>\n                </td>\n                <td style={{ padding: '10px' }}>{shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A'}</td>\n                <td style={{ padding: '10px' }}>\n                  <button\n                    onClick={() => loadShipmentDetail(shipment._id)}\n                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n                  >\n                    Track\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
