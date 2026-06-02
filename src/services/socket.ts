import {io, Socket} from 'socket.io-client';
import {ADMIN_TOKEN_KEY, ADMIN_USER_KEY, getSocketBaseUrl} from './api';

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
    socket?.emit('admin:subscribe');
    onEvent('Socket connected', 'Realtime admin channel is active.');
  });

  socket.on('connect_error', error => {
    if (String(error.message || '').toLowerCase().includes('token')) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
  });

  socket.on('disconnect', () => onEvent('Socket disconnected', 'Realtime admin channel paused.'));
  socket.on('auth.user.logged_in', payload =>
    onEvent('User login', `${payload?.name || payload?.email || 'A user'} signed in.`),
  );
  socket.on('auth.user.logged_out', payload =>
    onEvent('User logout', `${payload?.name || payload?.email || 'A user'} signed out.`),
  );
  socket.on('order.created', payload =>
    onEvent('New order', `Order ${payload?.orderId || 'unknown'} was placed.`),
  );
  socket.on('order.updated', payload =>
    onEvent('Order updated', `Order ${payload?.orderId || 'unknown'} is ${payload?.orderStatus || 'updated'}.`),
  );
  socket.on('product.created', payload =>
    onEvent('Product published', `${payload?.title || payload?.name || 'A product'} is live.`),
  );

  return () => {
    socket?.disconnect();
    socket = null;
  };
}
