import React, { useEffect, useState } from 'react';
import { returnsApi, type Return } from '../services/returns';
import { refundsApi, type Refund } from '../services/refunds';

interface ReturnsRefundsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
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
      onError(`Failed to approve: ${err}`);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    try {
      await refundsApi.approveRefund(refundId);
      onSuccess('Refund approved');
      loadRefunds();
    } catch (err) {
      onError(`Failed to approve: ${err}`);
    }
  };

  useEffect(() => {
    if (tab === 'returns') loadReturns();
    else loadRefunds();
  }, [tab]);

  if (selectedReturn) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedReturn(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>Return Details</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Status:</strong> {selectedReturn.status}</p>
          <p><strong>Items:</strong> {selectedReturn.returnItems.length}</p>
          {selectedReturn.returnItems.map((item, i) => (
            <div key={i} style={{ marginTop: '10px' }}>
              <strong>{item.product}</strong> x{item.quantity} - {item.reason} ({item.condition})
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            {selectedReturn.status === 'initiated' && (
              <>
                <button onClick={() => handleApproveReturn(selectedReturn._id)} style={{ padding: '8px 16px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                  Approve
                </button>
                <button style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedRefund) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedRefund(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>Refund Details</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Status:</strong> {selectedRefund.status}</p>
          <p><strong>Amount:</strong> ${selectedRefund.refundAmount}</p>
          <p><strong>Type:</strong> {selectedRefund.refundType}</p>
          <p><strong>Reason:</strong> {selectedRefund.reason}</p>
          <h4>Breakdown</h4>
          <p>Product: ${selectedRefund.refundBreakdown.productAmount}</p>
          <p>Shipping: ${selectedRefund.refundBreakdown.shippingRefund}</p>
          <p>Tax: ${selectedRefund.refundBreakdown.taxRefund}</p>
          <p>Additional Credit: ${selectedRefund.refundBreakdown.additionalCredit}</p>
          <div style={{ marginTop: '20px' }}>
            {selectedRefund.status === 'initiated' && (
              <>
                <button onClick={() => handleApproveRefund(selectedRefund._id)} style={{ padding: '8px 16px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                  Approve
                </button>
                <button style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Returns & Refunds</h2>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setTab('returns')}
          style={{
            padding: '10px 20px',
            background: tab === 'returns' ? '#228be6' : 'transparent',
            color: tab === 'returns' ? 'white' : '#000',
            border: 'none',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Returns
        </button>
        <button
          onClick={() => setTab('refunds')}
          style={{
            padding: '10px 20px',
            background: tab === 'refunds' ? '#228be6' : 'transparent',
            color: tab === 'refunds' ? 'white' : '#000',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Refunds
        </button>
      </div>

      {tab === 'returns' ? (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Return ID</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Items</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r._id.slice(-8)}</td>
                  <td style={{ padding: '10px' }}>{r.returnItems.length}</td>
                  <td style={{ padding: '10px' }}>{r.status}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => setSelectedReturn(r)} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Refund ID</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((ref) => (
                <tr key={ref._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{ref._id.slice(-8)}</td>
                  <td style={{ padding: '10px' }}>${ref.refundAmount}</td>
                  <td style={{ padding: '10px' }}>{ref.refundType}</td>
                  <td style={{ padding: '10px' }}>{ref.status}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => setSelectedRefund(ref)} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
}
