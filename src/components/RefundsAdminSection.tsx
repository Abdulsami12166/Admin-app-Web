import React, {useEffect, useState, useCallback} from 'react';
import {adminApi} from '../services/api';
import {connectAdminSocket} from '../services/socket';

export default function RefundsAdminSection() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchRefunds = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await adminApi.getRefunds(p, limit);
      setRefunds(res.data?.refunds || []);
    } catch (err) {
      console.error('Failed to load refunds', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchRefunds(1);
    const disconnect = connectAdminSocket((title, detail) => {
      // On relevant refund events, refresh list
      if (/Refund/.test(title) || /refund/i.test(detail)) {
        fetchRefunds(1);
      }
    });

    return () => {
      disconnect && disconnect();
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveRefund(id, {});
      fetchRefunds(1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcess = async (id: string) => {
    const gateway = prompt('Payment gateway (e.g., razorpay)');
    const transactionId = prompt('Transaction id / refund txn id (optional)');
    try {
      await adminApi.processRefund(id, {paymentGateway: gateway, transactionId});
      fetchRefunds(1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await adminApi.completeRefund(id);
      fetchRefunds(1);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2>Refunds</h2>
      {loading && <div>Loading...</div>}
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>ID</th>
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
              <td>{r._id}</td>
              <td>{r.user?.email || r.user?.name}</td>
              <td>{r.refundAmount}</td>
              <td>{r.reason}</td>
              <td>{r.status}</td>
              <td>
                {r.status === 'initiated' && <button onClick={() => handleApprove(r._id)}>Approve</button>}
                {r.status === 'approved' && <button onClick={() => handleProcess(r._id)}>Process</button>}
                {r.status === 'processing' && <button onClick={() => handleComplete(r._id)}>Complete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop: 8}}>
        <button onClick={() => { setPage(p => Math.max(1, p - 1)); fetchRefunds(page - 1); }} disabled={page <= 1}>Prev</button>
        <span style={{margin: '0 8px'}}>Page {page}</span>
        <button onClick={() => { setPage(p => p + 1); fetchRefunds(page + 1); }}>Next</button>
      </div>
    </div>
  );
}
