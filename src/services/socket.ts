import {io, Socket} from 'socket.io-client';
import {ADMIN_TOKEN_KEY, getSocketBaseUrl} from './api';
import { socketEvents } from './events';

let socket: Socket | null = null;

export function connectAdminSocket(onEvent: (title: string, detail: string) => void) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: token ? {token} : undefined,
    query: token ? {token} : undefined,
  });

  socket.on('connect', () => {
    socket?.emit(socketEvents.ADMIN_SUBSCRIBE);
  });

  socket.on('connect_error', error => {
    if (String(error.message || '').toLowerCase().includes('token')) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
  });

  socket.on('disconnect', () => {
    console.debug('Admin socket disconnected');
  });

  socket.on(socketEvents.DOMAIN.USER_LOGGED_IN, payload =>
    onEvent('User login', `${payload?.name || payload?.email || 'A user'} signed in.`),
  );
  socket.on(socketEvents.DOMAIN.USER_LOGGED_OUT, payload =>
    onEvent('User logout', `${payload?.name || payload?.email || 'A user'} signed out.`),
  );
  socket.on(socketEvents.DOMAIN.ORDER_CREATED, payload =>
    onEvent('New order', `Order ${payload?.orderId || 'unknown'} was placed.`),
  );
  socket.on(socketEvents.DOMAIN.ORDER_UPDATED, payload =>
    onEvent('Order updated', `Order ${payload?.orderId || 'unknown'} is ${payload?.orderStatus || 'updated'}.`),
  );
  socket.on(socketEvents.DOMAIN.PRODUCT_CREATED, payload =>
    onEvent('Product published', `${payload?.title || payload?.name || 'A product'} is live.`),
  );
  socket.on(socketEvents.DOMAIN.ADMIN_ACTIVITY_CREATED, payload =>
    onEvent('Admin activity', `${payload?.details || 'An admin action occurred.'}`),
  );
  socket.on(socketEvents.DOMAIN.REFUND_CREATED, payload =>
    onEvent(
      'Refund created',
      payload?.refund?.refundAmount
        ? 'Refund requested'
        : payload?.refundId
        ? `Refund ${payload.refundId} created`
        : 'Refund created',
    ),
  );
  socket.on(socketEvents.DOMAIN.REFUND_UPDATED, payload =>
    onEvent(
      'Refund updated',
      `Refund ${payload?.refund?._id || payload?.refundId || 'updated'} status: ${payload?.refund?.status || payload?.refundStatus || payload?.status || 'updated'}`,
    ),
  );
  socket.on(socketEvents.DOMAIN.REFUND_LEDGER_UPDATED, payload =>
    onEvent(
      'Refund ledger',
      `Refund ledger ${payload?.ledgerId || payload?.refundId || ''} ${payload?.status ? `is ${payload.status}` : 'updated'}`,
    ),
  );
  socket.on(socketEvents.DOMAIN.TICKET_CREATED, payload =>
    onEvent('Ticket created', `Support ticket ${payload?.ticketId || 'unknown'} created.`),
  );
  socket.on(socketEvents.DOMAIN.TICKET_UPDATED, payload =>
    onEvent('Ticket updated', `Ticket ${payload?.ticketId || 'unknown'} updated: ${payload?.status || ''}`),
  );
  socket.on(socketEvents.DOMAIN.TICKET_MESSAGE_ADDED, payload =>
    onEvent(
      'Ticket message',
      `New message on ticket ${payload?.ticketId || 'unknown'}: ${payload?.message || 'message added'}`,
    ),
  );
  socket.on(socketEvents.DOMAIN.RETURN_CREATED, payload =>
    onEvent('Return created', `Return ${payload?.returnId || 'unknown'} created.`),
  );
  socket.on(socketEvents.DOMAIN.RETURN_UPDATED, payload =>
    onEvent('Return updated', `Return ${payload?.returnId || 'unknown'} status: ${payload?.status || 'updated'}`),
  );

  return () => {
    socket?.disconnect();
    socket = null;
  };
}

export function subscribeAdminSocketEvent(eventName: string, listener: (payload: unknown) => void) {
  if (!socket) return () => {};
  socket.on(eventName, listener);
  return () => {
    socket?.off(eventName, listener);
  };
}
