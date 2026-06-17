import React, { useEffect, useState } from 'react';
import { ticketsApi, type Ticket } from '../services/tickets';
import { socketEvents } from '../services/events';
import { subscribeAdminSocketEvent } from '../services/socket';

interface TicketsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    critical: 'badge-danger',
    high: 'badge-warning',
    medium: 'badge-info',
    low: 'badge-neutral',
  };
  return <span className={`badge ${map[priority] ?? 'badge-neutral'}`}>{priority}</span>;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'badge-warning',
    in_progress: 'badge-info',
    escalated: 'badge-danger',
    resolved: 'badge-success',
    closed: 'badge-neutral',
    waiting_customer: 'badge-neutral',
    waiting_admin: 'badge-neutral',
  };
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status.replace(/_/g, ' ')}</span>;
}

export function TicketsSection({ onError, onSuccess }: TicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [messageForm, setMessageForm] = useState({ message: '' });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = await ticketsApi.getTickets(1, 50, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(result.data?.tickets || []);
    } catch (err) {
      onError(`Failed to load tickets: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: string) => {
    setLoading(true);
    try {
      const result = await ticketsApi.getTicketDetail(ticketId);
      setSelectedTicket(result.data?.ticket || null);
    } catch (err) {
      onError(`Failed to load ticket: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (ticketId: string) => {
    if (!messageForm.message) { onError('Message cannot be empty'); return; }
    try {
      await ticketsApi.addMessage(ticketId, { message: messageForm.message });
      onSuccess('Message sent');
      setMessageForm({ message: '' });
      loadTicketDetail(ticketId);
    } catch (err) {
      onError(`Failed to send message: ${err}`);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await ticketsApi.updateTicketStatus(ticketId, newStatus);
      onSuccess('Status updated');
      loadTicketDetail(ticketId);
      loadTickets();
    } catch (err) {
      onError(`Failed to update status: ${err}`);
    }
  };

  useEffect(() => { loadTickets(); }, [statusFilter, priorityFilter]);

  useEffect(() => {
    const unsubCreated = subscribeAdminSocketEvent(socketEvents.DOMAIN.TICKET_CREATED, () => loadTickets());
    const unsubUpdated = subscribeAdminSocketEvent(socketEvents.DOMAIN.TICKET_UPDATED, (payload: any) => {
      loadTickets();
      if (selectedTicket && payload?.ticketId && selectedTicket._id === String(payload.ticketId)) {
        loadTicketDetail(String(payload.ticketId));
      }
    });
    const unsubMessage = subscribeAdminSocketEvent(socketEvents.DOMAIN.TICKET_MESSAGE_ADDED, (payload: any) => {
      if (selectedTicket && payload?.ticketId && selectedTicket._id === String(payload.ticketId)) {
        loadTicketDetail(String(payload.ticketId));
      }
    });
    return () => { unsubCreated(); unsubUpdated(); unsubMessage(); };
  }, [selectedTicket]);

  if (selectedTicket) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button className="secondary" onClick={() => setSelectedTicket(null)}>← Back</button>
          <h2 style={{ margin: 0 }}>{selectedTicket.ticketNumber}: {selectedTicket.subject}</h2>
          {statusBadge(selectedTicket.status)}
          {priorityBadge(selectedTicket.priority)}
        </div>

        <div className="detail-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="section-box kv-list">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ticket Details</h3>
            <p><strong>Category</strong> {selectedTicket.category}</p>
            <p><strong>Priority</strong> {priorityBadge(selectedTicket.priority)}</p>
            <p><strong>Assigned To</strong> {selectedTicket.assignedTo || 'Unassigned'}</p>
            {selectedTicket.satisfaction && (
              <p><strong>Rating</strong> {selectedTicket.satisfaction.rating}/5 — {selectedTicket.satisfaction.feedback}</p>
            )}
            <p style={{ marginTop: '1rem' }}><strong>Update Status</strong></p>
            <select
              value={selectedTicket.status}
              onChange={e => handleUpdateStatus(selectedTicket._id, e.target.value)}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="waiting_admin">Waiting Admin</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="section-box">
            <h3 style={{ margin: '0 0 1rem', color: '#63d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Send Reply</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <textarea
                placeholder="Type your admin reply…"
                value={messageForm.message}
                onChange={e => setMessageForm({ message: e.target.value })}
              />
              <button onClick={() => handleAddMessage(selectedTicket._id)}>Send Message</button>
            </div>
          </div>
        </div>

        <section className="panel">
          <h2>Conversation</h2>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {selectedTicket.messages.length ? selectedTicket.messages.map((msg, idx) => (
              <div key={idx} className={`timeline-entry ${msg.senderType === 'admin' ? 'tl-info' : 'tl-success'}`}>
                <strong style={{ textTransform: 'capitalize' }}>{msg.senderType}</strong>
                <span style={{ color: '#dbe8f5', marginTop: '0.3rem', display: 'block' }}>{msg.message}</span>
                <small>{new Date(msg.createdAt).toLocaleString()}</small>
              </div>
            )) : <div className="state-empty">No messages yet.</div>}
          </div>
          {loading && <div className="state-loading">Loading…</div>}
        </section>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ margin: '0 0 1.25rem' }}>Support Tickets</h2>

      <div className="section-filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: 150 }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button className="secondary" onClick={loadTickets} style={{ marginLeft: 'auto' }}>Refresh</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket._id}>
                <td style={{ fontWeight: 700, color: '#63d2ff' }}>{ticket.ticketNumber}</td>
                <td>{ticket.subject}</td>
                <td>{priorityBadge(ticket.priority)}</td>
                <td>{statusBadge(ticket.status)}</td>
                <td><small>{new Date(ticket.createdAt).toLocaleDateString()}</small></td>
                <td>
                  <button className="secondary" onClick={() => loadTicketDetail(ticket._id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !tickets.length && <div className="state-empty">No tickets found for the selected filters.</div>}
        {loading && <div className="state-loading">Loading tickets…</div>}
      </div>
    </div>
  );
}
