import { io } from 'socket.io-client';

let socket = null;

const BACKEND_URL = import.meta.env.PROD
  ? 'https://testnova-a1un.onrender.com'
  : window.location.origin;

export const connectSocket = () => {
  const token = localStorage.getItem('testnova_token');
  if (!token || socket?.connected) return socket;

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
