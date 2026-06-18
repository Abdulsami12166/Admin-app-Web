import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../services/api';
import { connectAdminSocket } from '../services/socket';

function refundStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'badge-success',
    approved: 'badge-info',
    processing: 'badge-warning',
    initiated: 'badge-neutral',
    rejected: 'badge-danger',
    failed: 'badge-danger',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
}

export default function RefundsAdminSection() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  const fetchRefunds = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getRefunds(p, limit);
      // ponytail: Support flat response directly at root or wrapped data object for refunds
      setRefunds((res as any).refunds || res.data?.refunds || []);
    } catch (err) {
      console.error('Failed to load refunds', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds(1);
    const disconnect = connectAdminSocket((title, detail) => {
      if (/Refund/i.test(title) || /refund/i.test(detail)) {
        fetchRefunds(1);
      }
    });
    return () => { disconnect && disconnect(); };
  }, [fetchRefunds]);

  const handleApprove = async (id: string) => {
    try { await adminApi.approveRefund(id, {}); fetchRefunds(page); } catch (e) { console.error(e); }
  };

  const handleProcess = async (id: string) => {
    const gateway = prompt('Payment gateway (e.g., razorpay)');
    const transactionId = prompt('Transaction ID (optional)') || undefined;
    try { await adminApi.processRefund(id, { paymentGateway: gateway || undefined, transactionId }); fetchRefunds(page); } catch (e) { console.error(e); }
  };

  const handleComplete = async (id: string) => {
    try { await adminApi.completeRefund(id); fetchRefunds(page); } catch (e) { console.error(e); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason');
    if (!reason) return;
    try { await adminApi.rejectRefund(id, { reason }); fetchRefunds(page); } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Refund Processing</h2>
        <button className="secondary" onClick={() => fetchRefunds(page)} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Refund ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map(r => (
              <tr key={r._id}>
                <td><small style={{ fontFamily: 'monospace', color: '#9fb6cb' }}>#{r._id?.slice(-8)}</small></td>
                <td>{r.user?.email || r.user?.name || '—'}</td>
                <td style={{ color: '#fcc419', fontWeight: 700 }}>₹{r.refundAmount}</td>
                <td><small>{r.reason || '—'}</small></td>
                <td>{refundStatusBadge(r.status)}</td>
                <td>
                  {r.status === 'initiated' && (
                    <>
                      <button onClick={() => handleApprove(r._id)}>Approve</button>
                      <button className="secondary danger-text" onClick={() => handleReject(r._id)}>Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => handleProcess(r._id)}>Process</button>
                  )}
                  {r.status === 'processing' && (
                    <button onClick={() => handleComplete(r._id)}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !refunds.length && <div className="state-empty">No refunds found.</div>}
        {loading && <div className="state-loading">Loading refunds…</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchRefunds(p); }}
        >
          ← Prev
        </button>
        <span style={{ color: '#9fb6cb', fontWeight: 700 }}>Page {page}</span>
        <button
          className="secondary"
          disabled={refunds.length < limit}
          onClick={() => { const p = page + 1; setPage(p); fetchRefunds(p); }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
