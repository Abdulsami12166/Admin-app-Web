import React, { useEffect, useState } from 'react';
import { returnsApi, type Return } from '../services/returns';
import { refundsApi, type Refund } from '../services/refunds';
import { subscribeAdminSocketEvent } from '../services/socket';
import { socketEvents } from '../services/events';

interface ReturnsRefundsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function returnBadge(status: string) {
  const map: Record<string, string> = {
    approved: 'badge-success',
    rejected: 'badge-danger',
    initiated: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function ReturnsRefundsSection({ onError, onSuccess }: ReturnsRefundsProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'returns' | 'refunds'>('returns');

  const loadReturns = async () => {
    setLoading(true);
    try {
      const result = await returnsApi.getReturns(1, 50);
      setReturns(result.data?.returns || []);
    } catch (err) {
      onError(`Failed to load returns: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const result = await refundsApi.getRefunds(1, 50);
      setRefunds(result.data?.refunds || []);
    } catch (err) {
      onError(`Failed to load refunds: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = async (returnId: string) => {
    try {
      await returnsApi.approveReturn(returnId);
      onSuccess('Return approved');
      loadReturns();
    } catch (err) {
      onError(`Failed to approve return: ${err}`);
    }
  };

  const handleRejectReturn = async (returnId: string) => {
    const reason = window.prompt('Rejection reason (required)');
    if (!reason) return;
    try {
      await returnsApi.rejectReturn(returnId, reason);
      onSuccess('Return rejected');
      loadReturns();
      setSelectedReturn(null);
    } catch (err) {
      onError(`Failed to reject return: ${err}`);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    try {
      await refundsApi.approveRefund(refundId);
      onSuccess('Refund approved');
      loadRefunds();
    } catch (err) {
      onError(`Failed to approve refund: ${err}`);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    const reason = window.prompt('Rejection reason (required)');
    if (!reason) return;
    try {
      await refundsApi.rejectRefund(refundId, reason);
      onSuccess('Refund rejected');
      loadRefunds();
      setSelectedRefund(null);
    } catch (err) {
      onError(`Failed to reject refund: ${err}`);
    }
  };

  useEffect(() => {
    if (tab === 'returns') loadReturns();
    else loadRefunds();
  }, [tab]);

  // Socket subscriptions
  useEffect(() => {
    const unsub = subscribeAdminSocketEvent(socketEvents.DOMAIN?.RETURN_UPDATED || 'return_updated', () => {
      if (tab === 'returns') loadReturns();
    });
    return () => unsub?.();
  }, [tab]);

  if (selectedReturn) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedReturn(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>Return Details</h2>
          {returnBadge(selectedReturn.status)}
        </div>

        <div className="section-box kv-list" style={{ marginBottom: '1.25rem' }}>
          <p><strong>Status</strong> {returnBadge(selectedReturn.status)}</p>
          <p><strong>Items</strong> {selectedReturn.returnItems.length}</p>
        </div>

        <section className="panel">
          <h2>Return Items</h2>
          {selectedReturn.returnItems.map((item, i) => (
            <div key={i} className="timeline-entry tl-info">
              <strong>{item.product}</strong>
              <small>Qty: {item.quantity} · Reason: {item.reason} · Condition: {item.condition}</small>
            </div>
          ))}
        </section>

        {selectedReturn.status === 'initiated' && (
          <div className="action-bar">
            <button onClick={() => handleApproveReturn(selectedReturn._id)}>Approve Return</button>
            <button className="secondary danger-text" onClick={() => handleRejectReturn(selectedReturn._id)}>Reject Return</button>
          </div>
        )}
      </div>
    );
  }

  if (selectedRefund) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedRefund(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>Refund Details</h2>
          {returnBadge(selectedRefund.status)}
        </div>

        <div className="detail-grid">
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Refund Info</h3>
            <p><strong>Status</strong> {returnBadge(selectedRefund.status)}</p>
            <p><strong>Amount</strong> <span style={{ color: '#63d2ff', fontWeight: 800 }}>₹{selectedRefund.refundAmount}</span></p>
            <p><strong>Type</strong> {selectedRefund.refundType}</p>
            <p><strong>Reason</strong> {selectedRefund.reason}</p>
          </div>

          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Breakdown</h3>
            <p><strong>Product Amount</strong> ₹{selectedRefund.refundBreakdown.productAmount}</p>
            <p><strong>Shipping</strong> ₹{selectedRefund.refundBreakdown.shippingRefund}</p>
            <p><strong>Tax</strong> ₹{selectedRefund.refundBreakdown.taxRefund}</p>
            <p><strong>Additional Credit</strong> ₹{selectedRefund.refundBreakdown.additionalCredit}</p>
          </div>
        </div>

        {selectedRefund.status === 'initiated' && (
          <div className="action-bar">
            <button onClick={() => handleApproveRefund(selectedRefund._id)}>Approve Refund</button>
            <button className="secondary danger-text" onClick={() => handleRejectRefund(selectedRefund._id)}>Reject Refund</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Returns &amp; Refunds</h2>

      <div className="section-tabs">
        <button className={tab === 'returns' ? 'active' : ''} onClick={() => setTab('returns')}>
          Returns ({returns.length})
        </button>
        <button className={tab === 'refunds' ? 'active' : ''} onClick={() => setTab('refunds')}>
          Refunds ({refunds.length})
        </button>
        <button className="secondary" onClick={() => tab === 'returns' ? loadReturns() : loadRefunds()} style={{ marginLeft: 'auto' }}>
          Refresh
        </button>
      </div>

      {tab === 'returns' && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Items</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, color: '#63d2ff' }}>#{r._id.slice(-8)}</td>
                  <td>{r.returnItems.length} item(s)</td>
                  <td>{returnBadge(r.status)}</td>
                  <td>
                    <button className="secondary" onClick={() => setSelectedReturn(r)}>View</button>
                    {r.status === 'initiated' && (
                      <button onClick={() => handleApproveReturn(r._id)}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !returns.length && <div className="state-empty">No return requests found.</div>}
          {loading && <div className="state-loading">Loading returns…</div>}
        </div>
      )}

      {tab === 'refunds' && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(ref => (
                <tr key={ref._id}>
                  <td style={{ fontWeight: 700, color: '#63d2ff' }}>#{ref._id.slice(-8)}</td>
                  <td style={{ color: '#fcc419', fontWeight: 700 }}>₹{ref.refundAmount}</td>
                  <td>{ref.refundType}</td>
                  <td>{returnBadge(ref.status)}</td>
                  <td>
                    <button className="secondary" onClick={() => setSelectedRefund(ref)}>View</button>
                    {ref.status === 'initiated' && (
                      <button onClick={() => handleApproveRefund(ref._id)}>Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !refunds.length && <div className="state-empty">No refund requests found.</div>}
          {loading && <div className="state-loading">Loading refunds…</div>}
        </div>
      )}
    </div>
  );
}
