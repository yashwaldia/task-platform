import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket'],
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const s = getSocket();
  s.auth = { token }; // Backend taskGateway reads this for room joining
  s.connect();
};

export const disconnectSocket = () => {
  socket?.disconnect();
};
