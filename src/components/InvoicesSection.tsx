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
        <button onClick={() => setSelectedInvoice(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>Invoice: {selectedInvoice.invoiceNumber}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
            <h3>Invoice Summary</h3>
            <p><strong>Status:</strong> {selectedInvoice.status}</p>
            <p><strong>Subtotal:</strong> ${selectedInvoice.subtotal}</p>\n            <p><strong>Tax:</strong> ${selectedInvoice.tax}</p>\n            <p><strong>Discount:</strong> ${selectedInvoice.discount}</p>\n            <p><strong>Total:</strong> ${selectedInvoice.total}</p>\n            <p><strong>Amount Paid:</strong> ${selectedInvoice.amountPaid}</p>\n            <p><strong>Amount Due:</strong> ${selectedInvoice.amountDue}</p>\n          </div>\n          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n            <h3>Record Payment</h3>\n            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>\n              <input\n                type=\"number\"\n                placeholder=\"Amount\"\n                value={paymentForm.amount}\n                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <input\n                type=\"text\"\n                placeholder=\"Payment Method (e.g., card, bank)\"\n                value={paymentForm.method}\n                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}\n                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n              />\n              <button\n                onClick={() => handleRecordPayment(selectedInvoice._id)}\n                style={{ padding: '8px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}\n              >\n                Record Payment\n              </button>\n            </div>\n          </div>\n        </div>\n        <h3>Line Items</h3>\n        <div style={{ overflowX: 'auto' }}>\n          <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n            <thead>\n              <tr style={{ background: '#f5f5f5' }}>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Qty</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Unit Price</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tax</th>\n                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>\n              </tr>\n            </thead>\n            <tbody>\n              {selectedInvoice.items.map((item, idx) => (\n                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>\n                  <td style={{ padding: '10px' }}>{item.product}</td>\n                  <td style={{ padding: '10px' }}>{item.quantity}</td>\n                  <td style={{ padding: '10px' }}>${item.unitPrice}</td>\n                  <td style={{ padding: '10px' }}>${item.tax}</td>\n                  <td style={{ padding: '10px' }}>${item.total}</td>\n                </tr>\n              ))}\n            </tbody>\n          </table>\n        </div>\n        <h3>Payment History</h3>\n        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>\n          {selectedInvoice.payments.length > 0 ? (\n            selectedInvoice.payments.map((payment, idx) => (\n              <div key={idx} style={{ marginBottom: '5px' }}>\n                ${payment.amount} via {payment.method} on {new Date(payment.date).toLocaleDateString()}\n              </div>\n            ))\n          ) : (\n            <p>No payments recorded</p>\n          )}\n        </div>\n      </div>\n    );\n  }

  return (\n    <div style={{ padding: '20px' }}>\n      <h2>Invoices</h2>\n      <div style={{ marginBottom: '20px' }}>\n        <select\n          value={statusFilter}\n          onChange={(e) => setStatusFilter(e.target.value)}\n          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}\n        >\n          <option value=\"\">All Statuses</option>\n          <option value=\"draft\">Draft</option>\n          <option value=\"sent\">Sent</option>\n          <option value=\"viewed\">Viewed</option>\n          <option value=\"paid\">Paid</option>\n          <option value=\"partial\">Partial</option>\n          <option value=\"overdue\">Overdue</option>\n        </select>\n      </div>\n      <div style={{ overflowX: 'auto' }}>\n        <table style={{ width: '100%', borderCollapse: 'collapse' }}>\n          <thead>\n            <tr style={{ background: '#f5f5f5' }}>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Invoice #</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Order</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Total</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Paid</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Due</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>\n              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>\n            </tr>\n          </thead>\n          <tbody>\n            {invoices.map((invoice) => (\n              <tr key={invoice._id} style={{ borderBottom: '1px solid #eee' }}>\n                <td style={{ padding: '10px' }}>{invoice.invoiceNumber}</td>\n                <td style={{ padding: '10px' }}>{invoice.order}</td>\n                <td style={{ padding: '10px' }}>${invoice.total}</td>\n                <td style={{ padding: '10px' }}>${invoice.amountPaid}</td>\n                <td style={{ padding: '10px' }}>${invoice.amountDue}</td>\n                <td style={{ padding: '10px' }}>\n                  <span style={{\n                    padding: '4px 8px',\n                    borderRadius: '3px',\n                    background: invoice.status === 'paid' ? '#e7f5ff' : '#fff3e0',\n                    color: invoice.status === 'paid' ? '#0c5aa0' : '#e65100'\n                  }}>\n                    {invoice.status}\n                  </span>\n                </td>\n                <td style={{ padding: '10px' }}>\n                  <button\n                    onClick={() => loadInvoiceDetail(invoice._id)}\n                    style={{ padding: '4px 8px', background: '#228be6', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}\n                  >\n                    View\n                  </button>\n                </td>\n              </tr>\n            ))}\n          </tbody>\n        </table>\n      </div>\n      {loading && <p>Loading...</p>}\n    </div>\n  );\n}
