import { io } from 'socket.io-client';
import { getSocketBaseUrl } from '../config/apiConfig';

let socket = null;

export const connectStoreSocket = token => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketBaseUrl(), {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    query: token ? { token } : undefined,
  });

  return socket;
};

export const subscribeStoreEvent = (event, listener) => {
  if (!socket) {
    return () => {};
  }

  socket.on(event, listener);
  return () => socket?.off(event, listener);
};

export const disconnectStoreSocket = () => {
  socket?.disconnect();
  socket = null;
};
