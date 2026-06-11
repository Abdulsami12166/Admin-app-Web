import React, { useEffect, useState } from 'react';
import { invoicesApi, type Invoice } from '../services/invoices';

interface InvoicesProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function InvoicesSection({ onError, onSuccess }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: '' });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await invoicesApi.getInvoices(1, 50, statusFilter || undefined);
      setInvoices(result.data?.invoices || []);
    } catch (err) {
      onError(`Failed to load invoices: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoiceDetail = async (invoiceId: string) => {
    setLoading(true);
    try {
      const result = await invoicesApi.getInvoiceDetail(invoiceId);
      setSelectedInvoice(result.data?.invoice || null);
    } catch (err) {
      onError(`Failed to load invoice: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (invoiceId: string) => {
    if (paymentForm.amount <= 0 || !paymentForm.method) {
      onError('Please fill all fields');
      return;
    }

    try {
      await invoicesApi.recordPayment(invoiceId, paymentForm);
      onSuccess('Payment recorded successfully');
      setPaymentForm({ amount: 0, method: '' });
      loadInvoiceDetail(invoiceId);
      loadInvoices();
    } catch (err) {
      onError(`Failed to record payment: ${err}`);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  if (selectedInvoice) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedInvoice(null)} style={{ marginBottom: '20px' }}>
          ← Back
        </button>

        <h2>Invoice: {selectedInvoice.invoiceNumber}</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Invoice Summary</h3>
            <p>
              <strong>Status:</strong> {selectedInvoice.status}
            </p>
            <p>
              <strong>Subtotal:</strong> ${selectedInvoice.subtotal}
            </p>
            <p>
              <strong>Tax:</strong> ${selectedInvoice.tax}
            </p>
            <p>
              <strong>Discount:</strong> ${selectedInvoice.discount}
            </p>
            <p>
              <strong>Total:</strong> ${selectedInvoice.total}
            </p>
            <p>
              <strong>Amount Paid:</strong> ${selectedInvoice.amountPaid}
            </p>
            <p>
              <strong>Amount Due:</strong> ${selectedInvoice.amountDue}
            </p>
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Record Payment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="number"
                placeholder="Amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <input
                type="text"
                placeholder="Payment Method (e.g., card, bank)"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button
                onClick={() => handleRecordPayment(selectedInvoice._id)}
                style={{
                  padding: '8px',
                  background: '#51cf66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>

        <h3>Line Items</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Qty</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tax</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{item.product}</td>
                  <td style={{ padding: '10px' }}>{item.quantity}</td>
                  <td style={{ padding: '10px' }}>${item.unitPrice}</td>
                  <td style={{ padding: '10px' }}>${item.tax}</td>
                  <td style={{ padding: '10px' }}>${item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Payment History</h3>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          {selectedInvoice.payments.length > 0 ? (
            selectedInvoice.payments.map((payment, idx) => (
              <div key={idx} style={{ marginBottom: '5px' }}>
                ${payment.amount} via {payment.method} on {new Date(payment.date).toLocaleDateString()}
              </div>
            ))
          ) : (
            <p>No payments recorded</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Invoices</h2>
      <div style={{ marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Invoice #</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Order</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Paid</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Due</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{invoice.invoiceNumber}</td>
                <td style={{ padding: '10px' }}>{invoice.order}</td>
                <td style={{ padding: '10px' }}>${invoice.total}</td>
                <td style={{ padding: '10px' }}>${invoice.amountPaid}</td>
                <td style={{ padding: '10px' }}>${invoice.amountDue}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '3px',
                      background: invoice.status === 'paid' ? '#e7f5ff' : '#fff3e0',
                      color: invoice.status === 'paid' ? '#0c5aa0' : '#e65100',
                    }}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => loadInvoiceDetail(invoice._id)}
                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    View
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
