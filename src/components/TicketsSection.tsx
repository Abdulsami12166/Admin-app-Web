import React, { useEffect, useState } from 'react';
import { ticketsApi, type Ticket } from '../services/tickets';

interface TicketsProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
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
    if (!messageForm.message) {
      onError('Message cannot be empty');
      return;
    }
    try {
      await ticketsApi.addMessage(ticketId, { message: messageForm.message });
      onSuccess('Message added successfully');
      setMessageForm({ message: '' });
      loadTicketDetail(ticketId);
    } catch (err) {
      onError(`Failed to add message: ${err}`);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await ticketsApi.updateTicketStatus(ticketId, newStatus);
      onSuccess('Ticket status updated');
      loadTicketDetail(ticketId);
      loadTickets();
    } catch (err) {
      onError(`Failed to update status: ${err}`);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  if (selectedTicket) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setSelectedTicket(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <h2>{selectedTicket.ticketNumber}: {selectedTicket.subject}</h2>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <p><strong>Status:</strong> {selectedTicket.status}</p>
          <p><strong>Priority:</strong> {selectedTicket.priority}</p>
          <p><strong>Category:</strong> {selectedTicket.category}</p>
          <p><strong>Assigned To:</strong> {selectedTicket.assignedTo || 'Unassigned'}</p>
          {selectedTicket.satisfaction && (
            <p><strong>Rating:</strong> {selectedTicket.satisfaction.rating}/5 - {selectedTicket.satisfaction.feedback}</p>
          )}
          <div style={{ marginTop: '10px' }}>
            <select
              value={selectedTicket.status}
              onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value)}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
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
        </div>
        <h3>Messages</h3>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          {selectedTicket.messages.length > 0 ? (
            selectedTicket.messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '3px' }}>
                <strong>{msg.senderType}:</strong> {msg.message}
                <br />
                <small>{new Date(msg.createdAt).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No messages</p>
          )}
        </div>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h3>Add Message</h3>
          <textarea
            placeholder="Type your message..."
            value={messageForm.message}
            onChange={(e) => setMessageForm({ message: e.target.value })}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', fontFamily: 'monospace' }}
          />
          <button
            onClick={() => handleAddMessage(selectedTicket._id)}
            style={{ marginTop: '10px', padding: '8px 16px', background: '#51cf66', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Send Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Support Tickets</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Ticket #</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Priority</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{ticket.ticketNumber}</td>
                <td style={{ padding: '10px' }}>{ticket.subject}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '3px',
                    background: ticket.priority === 'critical' ? '#ffe0e0' : ticket.priority === 'high' ? '#fff3e0' : '#e7f5ff',
                    color: ticket.priority === 'critical' ? '#d00' : ticket.priority === 'high' ? '#e65100' : '#0c5aa0'
                  }}>
                    {ticket.priority}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{ticket.status}</td>
                <td style={{ padding: '10px' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px' }}>
                  <button
                    onClick={() => loadTicketDetail(ticket._id)}
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


