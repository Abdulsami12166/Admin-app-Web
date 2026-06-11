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
                  Approve\n                </button>\n                <button style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>\n                  Reject\n                </button>\n              </>\n            )}\n          </div>\n        </div>\n      </div>\n    );\n  }

  if (selectedRefund) {\n    return (\n      <div style={{ padding: '20px' }}>\n        <button onClick={() => setSelectedRefund(null)} style={{ marginBottom: '20px' }}>← Back</button>\n        <h2>Refund Details</h2>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n          <p><strong>Status:</strong> {selectedRefund.status}</p>\n          <p><strong>Amount:</strong> ${selectedRefund.refundAmount}</p>\n          <p><strong>Type:</strong> {selectedRefund.refundType}</p>\n          <p><strong>Reason:</strong> {selectedRefund.reason}</p>\n          <h4>Breakdown</h4>\n          <p>Product: ${selectedRefund.refundBreakdown.productAmount}</p>\n          <p>Shipping: ${selectedRefund.refundBreakdown.shippingRefund}</p>\n          <p>Tax: ${selectedRefund.refundBreakdown.taxRefund}</p>\n          <p>Additional Credit: ${selectedRefund.refundBreakdown.additionalCredit}</p>\n          <div style={{ marginTop: '20px' }}>\n            {selectedRefund.status === 'initiated' && (\n              <>\n                <button onClick={() => handleApproveRefund(selectedRefund._id)} style={{ padding: '8px 16px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>\n                  Approve\n                </button>\n                <button style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>\n                  Reject\n                </button>\n              </>\n            )}\n          </div>\n        </div>\n      </div>\n    );\n  }

  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Returns & Refunds</h2>\n      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>\n        <button\n          onClick={() => setTab('returns')}\n          style={{\n            padding: '10px 20px',\n            background: tab === 'returns' ? '#228be6' : 'transparent',\n            color: tab === 'returns' ? 'white' : '#000',\n            border: 'none',\n            cursor: 'pointer',\n            marginRight: '10px'\n          }}\n        >\n          Returns\n        </button>\n        <button\n          onClick={() => setTab('refunds')}\n          style={{\n            padding: '10px 20px',\n            background: tab === 'refunds' ? '#228be6' : 'transparent',\n            color: tab === 'refunds' ? 'white' : '#000',\n            border: 'none',\n            cursor: 'pointer'\n          }}\n        >\n          Refunds\n        </button>\n      </div>\n\n      {tab === 'returns' ? (\n        <div>\n          <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n            <thead>\n              <tr style={{ background: '#f5f5f5' }}>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Return ID</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Items</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n              </tr>\n            </thead>\n            <tbody>\n              {returns.map((r) => (\n                <tr key={r._id} style={{ borderBottom: '1px solid #eee' }}>\n                  <td style={{ padding: '10px' }}>{r._id.slice(-8)}</td>\n                  <td style={{ padding: '10px' }}>{r.returnItems.length}</td>\n                  <td style={{ padding: '10px' }}>{r.status}</td>\n                  <td style={{ padding: '10px' }}>\n                    <button onClick={() => setSelectedReturn(r)} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>\n                  </td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n      ) : (\n        <div>\n          <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n            <thead>\n              <tr style={{ background: '#f5f5f5' }}>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Refund ID</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Amount</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n              </tr>\n            </thead>\n            <tbody>\n              {refunds.map((ref) => (\n                <tr key={ref._id} style={{ borderBottom: '1px solid #eee' }}>\n                  <td style={{ padding: '10px' }}>{ref._id.slice(-8)}</td>\n                  <td style={{ padding: '10px' }}>${ref.refundAmount}</td>\n                  <td style={{ padding: '10px' }}>{ref.refundType}</td>\n                  <td style={{ padding: '10px' }}>{ref.status}</td>\n                  <td style={{ padding: '10px' }}>\n                    <button onClick={() => setSelectedRefund(ref)} style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>\n                  </td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n      )}\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
