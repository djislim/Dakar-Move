import { io } from 'socket.io-client';
import { API_URL } from '../../config';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(API_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connecté');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket déconnecté');
    });
  }
  return socket;
};

export const subscribeToLine = (lineId) => {
  if (socket) {
    socket.emit('subscribe:line', lineId);
  }
};

export const onBusPosition = (callback) => {
  if (socket) {
    socket.on('bus:position', callback);
  }
};

export const offBusPosition = (callback) => {
  if (socket) {
    socket.off('bus:position', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, subscribeToLine, onBusPosition, offBusPosition, disconnectSocket };