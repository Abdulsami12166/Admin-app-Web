import AsyncStorage from '@react-native-async-storage/async-storage';
import {io, Socket} from 'socket.io-client';

import {getSocketBaseUrl} from '../../config/env';
import {ADMIN_TOKEN_KEY} from '../api/client';

let socket: Socket | null = null;

export type RealtimeEvent =
  | 'user-login'
  | 'new-order'
  | 'order-status-changed'
  | 'user-force-logout'
  | 'auth.user.logged_in'
  | 'auth.user.logged_out'
  | 'order.created'
  | 'order.updated'
  | 'product.created';

export async function connectAdminSocket() {
  const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);

  if (socket?.connected) {
    return socket;
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: token ? {token} : undefined,
    query: token ? {token} : undefined,
  });

  socket.on('connect', () => {
    socket?.emit('subscribe-admin');
  });

  return socket;
}

export function subscribeToEvent(event: RealtimeEvent, listener: (payload: any) => void) {
  if (!socket) {
    return () => {};
  }

  socket.on(event, listener);
  return () => socket?.off(event, listener);
}

export function subscribeToConnectionStatus(listener: (connected: boolean) => void) {
  if (!socket) {
    return () => {};
  }

  const handleConnect = () => listener(true);
  const handleDisconnect = () => listener(false);

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);

  return () => {
    socket?.off('connect', handleConnect);
    socket?.off('disconnect', handleDisconnect);
  };
}

export function disconnectAdminSocket() {
  socket?.disconnect();
  socket = null;
}
