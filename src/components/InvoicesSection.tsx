import React, { useEffect, useState } from 'react';
import { invoicesApi, type Invoice } from '../services/invoices';

interface InvoicesProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function invoiceBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'badge-success',
    partial: 'badge-warning',
    overdue: 'badge-danger',
    sent: 'badge-info',
    viewed: 'badge-info',
    draft: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>;
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
      onError('Please fill amount and payment method');
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

  useEffect(() => { loadInvoices(); }, [statusFilter]);

  if (selectedInvoice) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className="secondary" onClick={() => setSelectedInvoice(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>Invoice · {selectedInvoice.invoiceNumber}</h2>
          {invoiceBadge(selectedInvoice.status)}
        </div>

        <div className="detail-grid">
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice Summary</h3>
            <p><strong>Status</strong> {invoiceBadge(selectedInvoice.status)}</p>
            <p><strong>Subtotal</strong> ₹{selectedInvoice.subtotal}</p>
            <p><strong>Tax</strong> ₹{selectedInvoice.tax}</p>
            <p><strong>Discount</strong> ₹{selectedInvoice.discount}</p>
            <p><strong>Total</strong> <span style={{ color: '#63d2ff', fontWeight: 800 }}>₹{selectedInvoice.total}</span></p>
            <p><strong>Amount Paid</strong> <span style={{ color: '#43d17a', fontWeight: 800 }}>₹{selectedInvoice.amountPaid}</span></p>
            <p><strong>Amount Due</strong> <span style={{ color: selectedInvoice.amountDue > 0 ? '#fcc419' : '#43d17a', fontWeight: 800 }}>₹{selectedInvoice.amountDue}</span></p>
          </div>

          <div className="section-box">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Record Payment</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={paymentForm.amount || ''}
                onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              />
              <input
                type="text"
                placeholder="Payment method (e.g. card, bank, UPI)"
                value={paymentForm.method}
                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
              />
              <button onClick={() => handleRecordPayment(selectedInvoice._id)}>Record Payment</button>
            </div>
          </div>
        </div>

        <section className="panel">
          <h2>Line Items</h2>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitPrice}</td>
                    <td>₹{item.tax}</td>
                    <td style={{ color: '#63d2ff', fontWeight: 700 }}>₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Payment History</h2>
          {selectedInvoice.payments.length ? selectedInvoice.payments.map((payment, idx) => (
            <div key={idx} className="timeline-entry tl-success">
              <strong>₹{payment.amount} via {payment.method}</strong>
              <small>{new Date(payment.date).toLocaleDateString()}</small>
            </div>
          )) : <div className="state-empty">No payments recorded yet.</div>}
        </section>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Invoices</h2>

      <div className="section-filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>
        <button className="secondary" onClick={loadInvoices} style={{ marginLeft: 'auto' }}>Refresh</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td style={{ fontWeight: 700, color: '#63d2ff' }}>{invoice.invoiceNumber}</td>
                <td><small>{invoice.order}</small></td>
                <td>₹{invoice.total}</td>
                <td style={{ color: '#43d17a' }}>₹{invoice.amountPaid}</td>
                <td style={{ color: invoice.amountDue > 0 ? '#fcc419' : '#43d17a' }}>₹{invoice.amountDue}</td>
                <td>{invoiceBadge(invoice.status)}</td>
                <td>
                  <button className="secondary" onClick={() => loadInvoiceDetail(invoice._id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !invoices.length && <div className="state-empty">No invoices found for the selected filter.</div>}
        {loading && <div className="state-loading">Loading invoices…</div>}
      </div>
    </div>
  );
}
